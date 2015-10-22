=================================
 Part3: Compojure とはなんなのか
=================================

まずは簡単なルーティング機能を実装する
======================================

Web アプリケーションに必要なもののひとつにルーティング機能があります。前の Part までで ``Hello, world`` が出来るようになりましたが、このままでは ``/todo/new`` という URI にアクセスしたら TODO を新規作成する画面を表示するようにしたいという要望に対応出来ません。そこでまずは特定の URI に対して適切なコンテンツを返すことことをまずは特別なライブラリを使わずに実装してみます。

最初にホーム画面と TODO の一覧画面を表示するために以下のルーティングを定義しようと思います。

.. sourcecode:: clojure

  {"/"     home
   "/todo" todo-index}

``http://localhost:3000/`` でホーム画面を表示して、 ``http://localhost:3000/todo`` で TODO の一覧を表示するだけの簡単なものです。

早速上記のマップを定義してみましょう。ファイルは ``src/todo_clj/core.clj`` です。

.. sourcecode:: clojure

  ;; src/todo_clj/core.clj
  (def routes
    {"/" home
     "/todo" todo-index})

これを評価すると当然エラーが出るので ``home`` 関数と ``todo-index`` 関数を実装しましょう。

.. sourcecode:: clojure

  ;; src/todo_clj/core.clj
  (defn ok [body]
    {:status 200
     :body body})

  (defn html [res]
    (assoc res :headers {"Content-Type" "text/html; charset=utf-8"}))

  (defn not-found []
    {:status 404
     :body "<h1>404 page not found</1>"})

  (defn home-view [req]
    "<h1>ホーム画面</h1>
     <a href=\"/todo\">TODO 一覧</a>")

  (defn home [req]
    (-> (home-view req)
        ok
        html))

  (def todo-list
    [{:title "朝ごはんを作る"}
     {:title "燃えるゴミを出す"}
     {:title "卵を買って帰る"}
     {:title "お風呂を洗う"}])

  (defn todo-index-view [req]
    `("<h1>TODO 一覧</h1>"
      "<ul>"
      ~@(for [{:keys [title]} todo-list]
          (str "<li>" title "</li>"))
      "</ul>"))

  (defn todo-index [req]
    (-> (todo-index-view req)
        ok
        html))

一気に色んな関数が増えましたが、よくよく見ると共通的な処理をまとめているだけなのが分かると思います。そして、 ``routes`` をエラーなく評価することが出来るようになりました。まだデータベースを使うことが出来ないので、ここでは単純なマップのベクタを ``todo-list`` という名前で定義しておきます。

これらの関数は独立しているのでテストするのが容易です。ファイルを保存してロードした後に(もしくは全ての関数を評価した後に) REPL 上で次のようなコードを試してみましょう。

.. sourcecode:: clojure

  user> (in-ns 'todo-clj.core)
  #object[clojure.lang.Namespace 0x121aaddc "todo-clj.core"]
  todo-clj.core> (home {})
  {:status 200, :body "<h1>ホーム画面</h1>\n   <a href=\"/todo\">TODO 一覧</a>", :headers {"Content-Type" "text/html; charset=utf-8"}}

ネームスペースを切り替えた後 [#]_ [#]_ に ``(home {})`` を評価することでレスポンスマップを手に入れることが出来ました。 ``home`` 関数へと渡している空のマップはリクエストマップですが、これは ``home`` 関数が今回は内部で他のパラメーターを使わないためこのように空を渡しています。

あとはこれを ``handler`` 関数から呼び出せるようにするだけです。残りの関数を書いてみましょう。

.. sourcecode:: clojure

  ;; src/todo_clj/core.clj
  (defn match-route [uri]
    (get routes uri))

  (defn handler [req]
    (let [uri (:uri req)
          maybe-fn (match-route uri)]
      (if maybe-fn
        (maybe-fn req)
        (not-found))))

TODO->> ここまでのコミット

最終的にこんな感じになりました。 ``match-route`` 関数を新しく作り、 ``handler`` 関数を修正しました。これも先ほどと同様に以下のように REPL 上でテスト出来ます。

.. sourcecode:: clojure

  todo-clj.core> (handler {})
  {:status 404, :body "<h1>404 page not found</1>"}
  todo-clj.core> (handler {:uri "/"})
  {:status 200, :body "<h1>ホーム画面</h1>\n   <a href=\"/todo\">TODO 一覧</a>", :headers {"Content-Type" "text/html; charset=utf-8"}}
  todo-clj.core> (handler {:uri "/todo"})
  {:status 200, :body ("<h1>TODO 一覧</h1>" "<ul>" "<li>朝ごはんを作る</li>" "<li>燃えるゴミを出す</li>" "<li>卵を買って帰る</li>" "<li>お風呂を洗う</li>" "</ul>"), :headers {"Content-Type" "text/html; charset=utf-8"}}

Part2 までで作成しているサーバーを起動して実際に ``http://localhost:3000/todo`` へとアクセスすることでも結果が確認出来ます。こんな感じでここまででルーティング機能を独自で実装してきたわけですが、このままアプリケーションを作り続けていくにはちょっと機能が色々と足りませんし、それらを実装してしまうのは骨が折れます。具体的にはここまでで実装したものだけでは POST メソッドに対応出来ませんし、 ``/user/:id`` というようなマッチングを行うことが出来ません。

なのでもっと便利なものを使いたいと思います。それが後述する Compojure になります。

.. [#] 余談ですがネームスペースの切り替えは各エディタのプラグインなどで実装されているため ``in-ns`` を使わなくても簡単に出来ます。 Cider では ``M-x cider-repl-set-ns`` 、 Cursive では ``Switch REPL NS to current file`` で実行出来ます。
.. [#] もうひとつ大事なことですが、ファイルに書いたものをロードすることと REPL 上で関数を定義するのは同じ意味なので、ファイル (``src/todo_clj/core.clj``) 上で ``(home {})`` を評価するのは同じ意味になります(エディタのプラグインによってネームスペースを切り替える必要があったりなかったりするのでそこは注意が必要です)。

Compojure ってなんでしょう
===========================

前の方でルーティング機能を実装したので分かるとは思いますが `Compojure <https://github.com/weavejester/compojure>`_ はルーティング機能を提供するシンプルなライブラリです。一般的に何故か Web フレームワークという風に認知されていますが、主にルーティングのためのみに使用するライブラリとなります [#]_ 。

Compojure を導入することで今まで無理やり書いていたルーティングがよりシンプルになります。具体的には次のように書くことが出来るようになります。

.. sourcecode:: clojure

  (defroutes handler
    (GET "/" [req] home)
    (GET "/todo" [req] todo-index))

比較的 Rails などに近い DSL なのでそちらを知っていれば比較的馴染みやすいでしょう。

この他にも Clojure のルーティングライブラリは以下のように沢山あるのですが (2015 年時点)、今回は特にこだわりがないので広く一般的に認知されている Compojure を使っていきたいと思います [#]_ 。

* Compojure
* Moustache
* RouteOne
* Pedestal
* gudu
* secretary
* silk
* fnhouse
* bidi

.. [#] `この記事 <http://www.infoq.com/news/2011/10/clojure-web-frameworks>`_ で作者が "Compojure is a small web framework based on Ring" と言っていますが、既に Compojure の README からも web framework という表記が消されているので無視していいでしょう。
.. [#] 私が好きなのは JUXT の作っている `bidi <https://github.com/juxt/bidi>`_ というライブラリです。

Compojure の一番簡単な使い方
============================
