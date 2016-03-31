===================================
 Part4: テンプレートエンジンを使う
===================================

Clojure におけるテンプレートエンジン
====================================

今までのコードでは HTML を文字列で直接書いてきました。「まさか Clojure では文字列で直接 HTML を書くの?」と心配された方もいるかもしれませんが、そんなことはないので安心してください。他の言語でもあるようにテンプレートエンジンがちゃんとあるので、これからはそれを使っていきます。さて、テンプレートエンジンと一口に言っても色々なものが存在します。とは言えよく名前のあがるものはそんなに多くはないです。 Enlive, Selmer, Hiccup これら 3 つの存在は覚えておいていいかと思います。それぞれ簡単に特徴を説明すると Enlive はセレクタベースのテンプレートエンジンであまり他の言語でも見ない特殊な形のテンプレートエンジンですが、 HTML を読み込み CSS セレクタで特定の部分に Clojure で処理を加え HTML を吐き出すという面白いものです。 Selmar は Django のテンプレート機能と似たようなもので、 HTML ファイルに直接ロジックを書くタイプのものです。最後に Hiccup ですが、これは Clojure のベクタをそのまま HTML へと変換するものです。

さて、どれも一長一短なので一概にどれがいいというのを簡単に決めることは出来ないのですが、今回は学習コストが一番低く(私の勝手な印象ですが) Clojure そのものと親和性が高くて HTML を直接書く必要がない Hiccup を使っていきたいと思います。

Hiccup を導入する
=================

早速 Hiccup をプロジェクトの依存性へと追加しましょう。 ``project.clj`` へ次のように足します。

.. sourcecode:: clojure

  :dependencies [[org.clojure/clojure "1.7.0"]
                 [ring "1.4.0"]
                 [compojure "1.4.0"]
                 [hiccup "1.0.5"]
                 [environ "1.0.1"]]

* `commit: Hiccup を依存性へと追加 <https://github.com/ayato-p/intro-web-clojure/commit/75cf9b19846a69cb6db54592c483cdd749d6b579>`_

追加したら、早速いつも通り REPL を再起動して以下のフォームを評価してみましょう。

.. sourcecode:: clojure

  user> (require '[hiccup.core :as hc])
  ;; => nil
  user> (hc/html [:div [:h1 "Hello"]])
  ;; => "<div><h1>Hello</h1></div>"

``hiccup.core`` の ``html`` マクロが主に使う機会が多いものになるとは思いますが、このようにベクターデータ(以下、タグベクター)を渡すことで HTML へと変換し吐き出してくれます。この Hiccup のタグベクターは次のような構造になっています。

.. sourcecode:: clojure

  [tag & body]
  [tag attributes & body]

タグベクターのひとつめは必ず HTML のタグ名がきますが、これはキーワード、シンボル、文字列のどれでも使うことが出来るようになっています。またタグの属性をマップデータとしてふたつめに渡すことが出来ますがこれは省略可能です。属性を除いたタグベクターの残りは全てタグのボディとして扱われますが、これは文字列や他のタグベクターを含めることが可能です。

.. sourcecode:: clojure

  user> (hc/html [:h1 {:class "black-bold"} "Hello " [:em "world"]])
  ;; => "<h1 class=\"black-bold\">Hello <em>world</em></h1>"

また、 Hiccup は ``id`` と ``class`` 属性に対して CSS スタイルのシンタックスシュガーを用意しているため、マップデータを使わずに次のように表すことが出来ます。

.. sourcecode:: clojure

  user> (hc/html [:p#headline.red.bold "Welcome to Clojure"])
  ;; => "<p class=\"red bold\" id=\"headline\">Welcome to Clojure</p>"

CSS と同じように ``#`` の後が ID 、 各 ``.`` の後がクラスになります。ただし、 ``:div.foo.bar#baz`` のような ``#`` が後ろにくるような書き方は出来ないので、必ず ``#`` はひとつめに持ってくる必要があります。

さらに、タグベクターのボディではシーケンスが展開されるようになっているため次のようなコードが書けます。

.. sourcecode:: clojure

  user> (hc/html [:ul
                  (for [x (range 4)]
                    [:li x])])
  ;; => "<ul><li>0</li><li>1</li><li>2</li><li>3</li></ul>"

ただし、展開されるのはシーケンスだけでベクターやセットなどのデータ型は展開されないので注意が必要です。

ここまででなんとなく Hiccup の雰囲気が掴めたと思います。また他にも関数が幾つかありますが、出てきたタイミングでそれぞれ説明したいと思います。

文字列で書いていた HTML を Hiccup で書きなおしてみる
======================================================

今まで HTML を文字列で書いていたのは次のふたつの関数でした。

.. sourcecode:: clojure

  (defn home-view [req]
    "<h1>ホーム画面</h1>
     <a href=\"/todo\">TODO 一覧</a>")

  (defn todo-index-view [req]
    `("<h1>TODO 一覧</h1>"
      "<ul>"
      ~@(for [{:keys [title]} todo-list]
          (str "<li>" title "</li>"))
      "</ul>"))

これを Hiccup で書き直します。それから本格的に画面を作りこんでいくので、ネームスペースもついでに新しく作りましょう。 ``src/todo_clj/view/main.clj`` と ``src/todo_clj/view/todo.clj`` を作成します。まずは ``src/todo_clj/view/main.clj`` にホーム画面を表示する関数を書いていきます。

.. sourcecode:: clojure

  ;; src/todo_clj/view/main.clj
  (ns todo-clj.view.main
    (:require [hiccup.core :as hc]))

  (defn home-view [req]
    (-> (list
         [:h1 "ホーム画面"]
         [:a {:href "/todo"} "TODO 一覧"])
        hc/html))

何をしているか簡単に分かるようになったと思います。ちなみにここではリストを ``hiccup.core/html`` へと渡していますが、タグベクターのボディでなくても展開できるのでこのように書くことが可能です。

次は ``src/todo_clj/view/todo.clj`` を書いてみます。

.. sourcecode:: clojure

  ;; src/todo_clj/view/todo.clj
  (ns todo-clj.view.todo
    (:require [hiccup.core :as hc]))

  (defn todo-index-view [req todo-list]
    (-> `([:h1 "TODO 一覧"]
          [:ul
           ~@(for [{:keys [title]} todo-list]
               [:li title])])
        hc/html))

``todo-list`` はハンドラーから呼び出されるときに受け取るようにしました。こちらも前より読みやすくなったんじゃないんでしょうか。またふたつの関数のネームスペースを変える際に、これらを呼び出している方も少々書き換えています。

.. sourcecode:: clojure

  ;; src/todo_clj/handler/main.clj
  (ns todo-clj.handler.main
    (:require [compojure.core :refer [defroutes GET]]
              [compojure.route :as route]
              [todo-clj.util.response :as res]
              [todo-clj.view.main :as view]))

  (defn home [req]
    (-> (view/home-view req)
        res/response
        res/html))

.. sourcecode:: clojure

  ;; src/todo_clj/handler/todo.clj
  (ns todo-clj.handler.todo
    (:require [compojure.core :refer [defroutes context GET POST]]
              [todo-clj.util.response :as res]
              [todo-clj.view.todo :as view]))

  (defn todo-index [req]
    (-> (view/todo-index-view req todo-list)
        res/response
        res/html))

* `commit: ビュー用に新しいネームスペースを作って、文字列で書いていた HTML を Hiccup を 使って書きなおした <https://github.com/ayato-p/intro-web-clojure/commit/9093b1042213539226af93f3b024682914aa1206>`_

サーバーを起動して、画面をリロードしたら今までと変わらない画面が表示出来ているかを確認し、出来ていたらここまでは大丈夫です。

さらに Web アプリケーションらしくなるように装飾していく
=======================================================

今まで素っ気ない画面だったのでこの辺で少々手の込んだ画面を作っていくことにしましょう。まずは全体での統一感を出すためにページのレイアウトを作っていきます。 ``todo-clj.view.layout`` というネームスペースを新たに作成して、そこに全ての画面で共通して使えるレイアウトを定義します。

.. sourcecode:: clojure

  ;; src/todo_clj/view/layout.clj
  (ns todo-clj.view.layout
    (:require [hiccup.page :refer [html5 include-css include-js]]))

  (defn common [req & body]
    (html5
     [:head
      [:title "TODO-clj"]
      (include-css "/css/normalize.css"
                   "/css/papier-1.3.1.min.css"
                   "/css/style.css")
      (include-js "/js/main.js")]
     [:body
      [:header.top-bar.bg-green.depth-3 "TODO-clj"]
      [:main body]]))

* `commit: アプリケーションのレイアウトを作成 <https://github.com/ayato-p/intro-web-clojure/commit/2779822700443b1adb324f167e8126b44667b7ce>`_

``common`` という全ての画面で共通となるレイアウトを定義する関数を作りました。ひとつめにリクエストマップを受け取り、残りは全てボディとして受け取り HTML の内部でそのまま展開されます。ちなみに今まで特に説明もなくビューに関連する関数の第一引数にリクエストマップを指定して、今のところ使っていないので本当に必要なのか気になっている方もいるかもしれませんが、後々使う予定なので今はとりあえず書いてあると思ってもらえればいいです。

それから ``include-css``, ``include-js`` 関数で幾つか定義した覚えのないファイル名が出てきていますが、 ``normalize.css`` と ``papier-1.3.1.min.css`` は以下の URI からダウンロードして、 ``resources/public/css`` ディレクトリ以下に配置しておいてください。

* `alexanderGugel/papier <https://github.com/alexanderGugel/papier>`_
* `necolas/normalize.css <https://github.com/necolas/normalize.css>`_

また同様に ``resources/public/css/style.css`` を作成して以下の記述をします。

.. sourcecode:: css

  header.top-bar {
      padding: 5px;
  }

``resources/public/js/main.js`` は空のファイルを置いておくだけで今回はいいです。後々中身を書いていきます。

* `commit: 使用する CSS/JavaScript ファイルを resources ディレクトリ配下へ <https://github.com/ayato-p/intro-web-clojure/commit/2779822700443b1adb324f167e8126b44667b7ce>`_

さて ``hiccup.page`` というネームスペースが新たに出てきました。 ``hiccup.page`` ネームスペースは HTML のページを素早く構築するための関数を提供するネームスペースで、 ``html5`` 以外にも ``xhtml``, ``html4`` などというマクロがあり、それに加え CSS と JavaScript 用に link タグと script タグのヘルパー関数がそれぞれ用意されています( ``include-css``, ``include-js`` )。そして、このネームスペースが提供する ``html5`` マクロは内部で ``hiccup.core/html`` マクロを呼び出すため、明示的に ``hiccup.core/html`` を使用する必要がありません。

.. sourcecode:: clojure

  user> (require '[hiccup.page :as hp])
  ;; => nil
  user> (hp/html5 [:p "Hello"])
  ;; => "<!DOCTYPE html>\n<html><p>Hello</p></html>"

このように ``html5`` マクロは ``hiccup.core/html`` マクロと同じように使うことができます。今回は HTML5 で良いので ``html5`` マクロを使っています。

この定義したレイアウトを次のようにホーム画面へと適用してみます。

.. sourcecode:: clojure

  ;; src/todo_clj/view/main.clj
  (ns todo-clj.view.main
    (:require [todo-clj.view.layout :as layout]))

  (defn home-view [req]
    (->> [:section.card
          [:h2 "ホーム画面"] ;; ちょっと H1 タグだとうるさいので小さくしました
          [:a {:href "/todo"} "TODO 一覧"]]
         (layout/common req)))

ここで一度、画面をリロードしてみましょう。どうでしょう、今までと何か変わった気がしますか?レイアウトで追加したヘッダーが新しく表示されてますが、 CSS が適用されていない気がしますよね( ``[:header.top-bar.bg-green.depth-3 "TODO-clj"]`` と書いてあるのでヘッダーの ``TODO-clj`` が緑色の背景になって少々影が付くのを期待しています)。

この原因は ``resources`` 配下のファイルに対してリクエストを処理できていないためです。例えば画面を表示したときに ``http://localhost:3000/css/normalize.css`` というリクエストが投げられるんですが、それを解決する方法をサーバーが知らないので CSS ファイルを取得出来ずに読み込めないという状態になっています。これを解決するためにミドルウェアをひとつ追加しましょう。

Ring ライブラリの中に最初からあるミドルウェアを使います。この問題に対応できそうなものに ``ring.middleware.file`` と ``ring.middleware.resource`` というミドルウェアがあるんですが、 ``ring.middleware.resource`` を使うことにします。 ``ring.middleware.file`` は jar や war にしたときにその内部にあるファイルに対してアクセスすることが出来ないので、あまり利用する意味がありません。 ``ring.middleware.resource`` ミドルウェアを次のように追加してみます。

.. sourcecode:: clojure

  ;; src/todo_clj/core.clj
  (ns todo-clj.core
    (:require [compojure.core :refer [routes]]
              [environ.core :refer [env]]
              [ring.adapter.jetty :as server]
              [ring.middleware.resource :as resource]
              [todo-clj.handler.main :refer [main-routes]]
              [todo-clj.handler.todo :refer [todo-routes]]
              [todo-clj.middleware :refer [wrap-dev]]))

  (def app
    (-> (routes
         todo-routes
         main-routes)
        (wrap wrap-dev (:dev env))
        (wrap resource/wrap-resource "public"))) ;; 足しました

``ring.middleware.resource/wrap-resource`` ミドルウェアは他のミドルウェアと同様に第一引数としてハンドラーを受け取り、第二引数にリソースを解決する際のルートパスを受け取ります。ここでは第二引数として ``"public"`` を渡すことで ``resources/public`` がリソースを解決するときのルートになるようにしました。

.. note::

  ``resources`` ディレクトリはデフォルトで Leiningen プロジェクトのリソースディレクトリになっているため、 ``public`` を指定すると ``resources/public`` をルートパスにするということになるんですが、リソースディレクトリ自体をデフォルトから変えたい場合は ``project.clj`` に ``:resource-paths`` を指定すれば変更することが出来ます。

さて、ミドルウェアを足したらブラウザをリロードしてみましょう。緑色のヘッダーが見えるようになったと思います。レイアウトがちゃんと適用されるようになったところで TODO 一覧にも同じようにレイアウトを適用してみます。

.. sourcecode:: clojure

  ;; src/todo_clj/view/todo.clj
  (ns todo-clj.view.todo
    (:require [todo-clj.view.layout :as layout]))

  (defn todo-index-view [req todo-list]
    (->> `([:h1 "TODO 一覧"]
           [:ul
            ~@(for [{:keys [title]} todo-list]
                [:li title])])
         (layout/common req)))

* `commit: 画面レイアウトを既にある画面に適用する <https://github.com/ayato-p/intro-web-clojure/commit/02dbff965045ce5c1ca94b94292a1329d1a62f00>`_

TODO 一覧を表示するとホーム画面同様に緑色のヘッダーが表示されるようになりました。これでようやく Web アプリケーションらしさが出てきました。

次の Part では実際にデータベースを使って現実の Web アプリケーションにより近いものを作っていくことにしましょう。

ここまでで学んだこと
====================

* Clojure で使えるテンプレートエンジンは幾つかある
* Hiccup は Clojure のデータ構造をそのまま HTML へ変換できる
* Hiccup を使った共通的なレイアウトの適用方法
