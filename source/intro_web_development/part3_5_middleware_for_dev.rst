=========================================
 Part3.5: 開発用のミドルウェアを追加する
=========================================

リロード、スタックトレース
==========================

… HTML の説明に行く前にちょっと小休止して開発用のミドルウェアについて説明します。

Part3 で一気にファイルが増えてしまい編集する度にファイルをロードしたりするのがそろそろ大変になってきました。どんなに REPL 駆動開発が出来て便利だとは言えどもファイルを編集して保存したらロードする必要があるというのは少々面倒ですよね。なのでこの問題を Ring ミドルウェアを追加することで解決したいと思います。またエラーが起きたときに分かり難いのでもうちょっと親切なエラー画面を出すようにします。

ファイルを編集して保存した際に自動的にロードしてくれるミドルウェアは ring-devel に入っていて、それは既に ring 自体の依存性に入っているため既に使える状態となっています。親切なエラー画面を出すためのミドルウェアは新しいライブラリを追加して対応しましょう。 `prone <https://github.com/magnars/prone>`_ を使います。 prone は Rails の better_errors に似たような画面を出力してくれます。

``project.clj`` に次の依存性を dev プロファイルへと追加します。

.. sourcecode:: clojure

  (defproject todo-clj "0.1.0-SNAPSHOT"

    ;; 中略

    :profiles
    {:dev {:dependencies [[prone "0.8.2"]]}})

次に ``todo-clj.middleware`` ネームスペースを作成して、そこに今回足す開発用ミドルウェアを ``wrap-dev`` という関数にまとめたいと思います。

.. sourcecode:: clojure

  ;; src/todo_clj/middleware.clj
  (ns todo-clj.middleware)

  (defn- try-resolve [sym]
    (try
      (require (symbol (namespace sym)))
      (resolve sym)
      (catch java.io.FileNotFoundException _)
      (catch RuntimeException _)))

  (defn wrap-dev [handler]
    {:pre [(or (fn? handler) (and (var? handler) (fn? (deref handler))))]}
    (let [wrap-exceptions (try-resolve 'prone.middleware/wrap-exceptions)
          wrap-reload (try-resolve 'ring.middleware.reload/wrap-reload)]
      (if (and wrap-reload wrap-exceptions)
        (-> handler
            wrap-exceptions
            wrap-reload)
        (throw (RuntimeException. "Middleware requires ring/ring-devel and prone;")))))

いつもと様子が違いますね。 ``ns`` マクロの中では特定のネームスペースを ``require`` していません。これはこのミドルウェア (``wrap-dev``) が使われるときだけ、開発用のミドルウェアを動的に ``require`` したいからです。動的に ``require`` するための関数は ``try-resolve`` として定義してあります。このようにしておけば dev プロファイルの依存性へ追加する prone のようなものを扱いやすくなります。

.. note::

   dev プロファイルに追加している依存性は ``lein uberjar`` などするときには参照されなくなるので注意が必要。


次に ``todo-clj.core/app`` にこのミドルウェアを適用しましょう。

.. sourcecode:: clojure

  ;; src/todo_clj/core.clj
  (ns todo-clj.core
    (:require [compojure.core :refer [routes]]
              [ring.adapter.jetty :as server]
              [todo-clj.handler.main :refer [main-routes]]
              [todo-clj.handler.todo :refer [todo-routes]]
              [todo-clj.middleware :refer [wrap-dev]])) ;; 追加

  (def app
    (-> (routes
         todo-routes
         main-routes)
        wrap-dev))

Part3 で説明したように ``routes`` 関数はハンドラーを返すので、このようにミドルウェアを適用することが出来ます。しかし、これでは開発環境とプロダクション環境の切り分けが出来ていないため、折角 ``wrap-dev`` が動的に ``require`` するようになっているのにいつでも読み込まれるようになってしまい意味がありません。なのでここでまたもうひとつライブラリを追加します。

`environ <https://github.com/weavejester/environ>`_ というライブラリを追加しましょう。これは環境変数や Java のシステムプロパティを同じようにアクセス出来るようにまとめてくれる便利なものです。

.. sourcecode:: clojure

  (defproject todo-clj "0.1.0-SNAPSHOT"
    :description "FIXME: write description"
    :url "http://example.com/FIXME"
    :license {:name "Eclipse Public License"
              :url "http://www.eclipse.org/legal/epl-v10.html"}
    :dependencies [[org.clojure/clojure "1.7.0"]
                   [ring "1.4.0"]
                   [compojure "1.4.0"]
                   [environ "1.0.1"]]
    :plugins [[lein-environ "1.0.1"]]
    :profiles
    {:dev {:dependencies [[prone "0.8.2"]]
           :env {:dev true}}})

``project.clj`` はこのようになりました。 environ を使って ``project.clj`` の dev プロファイルを参照したい場合は、依存性だけでなく Leiningen プラグインを追加する必要があります。さらに dev プロファイルの ``:env`` に対してマップを与えておくとプログラム中からこの値を参照することが出来ます。実際にここまで書いたら一度 REPL を再起動して、 REPL 上で次のようなフォームを評価してみましょう。

.. sourcecode:: clojure

  user> (require '[environ.core :refer [env]])
  nil
  user> (env :dev)
  true
  user> (env :java-home)
  "/usr/lib/jvm/java-8-oracle/jre"

このように ``environ.core`` ネームスペースにある ``env`` は環境変数などが詰まったマップデータなので通常のマップと同じように扱うことが出来ます。これを実際に使って先ほどのミドルウェア適用部分を書き換えると次のようになります。

.. sourcecode:: clojure

  ;; src/todo_clj/core.clj
  (ns todo-clj.core
    (:require [compojure.core :refer [routes]]
              [ring.adapter.jetty :as server]
              [todo-clj.handler.main :refer [main-routes]]
              [todo-clj.handler.todo :refer [todo-routes]]
              [todo-clj.middleware :refer [wrap-dev]]
              [environ.core :refer [env]]))

  (defn- wrap [handler middleware opt]
    (if (true? opt)
      (middleware handler)
      (if opt
        (middleware handler opt)
        handler)))

  (def app
    (-> (routes
         todo-routes
         main-routes)
        (wrap wrap-dev (:dev env))))

``wrap`` というヘルパー関数を追加しました。第一引数にハンドラー、第二引数にミドルウェア、第三引数にオプションを受け取ります。第三引数によってこの関数の挙動は変わりますが、 ``truthy`` ではなく厳密に ``true`` であるならミドルウェアを単純にハンドラーへと適用し、 ``true`` ではないがオプションがある場合はミドルウェアの第二引数としてオプションを渡しそれ以外の場合 ``falsy`` な値ならハンドラーをそのまま返します。このように書くことによって、設定をベースとしてどのミドルウェアを使うかというのが簡単に切り替えることが出来るので、開発時は使いたいけどプロダクションでは外したいという要望にも答えることができます。ちなみに prone は開発時のみに適用されるようしないといけないので、このように書くべきですね。

* `commit: 開発用のミドルウェアを追加し、それに伴って prone と environ を追加 <https://github.com/ayato-p/intro-web-clojure/commit/d75ff66a44a708e4b63e48643fbb371dd91a5fc5>`_

ここまで出来たらサーバーを起動して、次のことを確認してみます。

1. コードを書き換えたら自動的に変更がリロードされているか
2. 例外を投げたら prone の画面が出てくるか

ひとつめは ``todo-clj.handler.main/home-view`` 関数や ``todo-clj.handler.todo/todo-list`` を書き換えて変更を保存した後に、ブラウザをリロードして確かめると分かりやすいでしょう。ふたつめは ``todo-clj.handler.main/home`` 関数を次のように書き換えると簡単に確かめることが出来ます。

.. sourcecode:: clojure

  ;; src/todo_clj/handler/main.clj
  (defn home [req]
    (throw (Exception. "Test Exception!!"))
    #_(-> (home-view req)
          res/response
          res/html))

こうしてホーム画面を見るとエラー画面が綺麗に表示されていると思います。いい感じですね。この prone を確認する変更等はコミットしないようにして元に戻しておきましょう。

このようにミドルウェアを足すことで任意の機能を追加することができることが分かりました。とは言え今回紹介したのは開発用のミドルウェアで、実際にプロジェクト内で使うミドルウェアは多岐に渡りますが、それはまた後で必要になったら登場してきます。改めて次は HTML の話に移りたいと思います。

ここまでで学んだこと
====================

* 開発用 Ring ミドルウェアの足し方
