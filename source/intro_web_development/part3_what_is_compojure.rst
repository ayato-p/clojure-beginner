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

* `commit: ルーティング機能を実装してみる <https://github.com/ayato-p/intro-web-clojure/commit/c40de77abd80a39011939fcca1193ad0a86f01aa>`_

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

前の方でルーティング機能を実装したので流れで分かるとは思いますが `Compojure <https://github.com/weavejester/compojure>`_ はルーティング機能を提供するシンプルなライブラリです。一般的に何故か Web フレームワークという風に認知されていますが、主にルーティングのためのみに使用するライブラリとなります [#]_ 。

Compojure を導入することで今まで無理やり書いていたルーティングがよりシンプルになります。具体的には次のように書くことが出来るようになります。

.. sourcecode:: clojure

  (defroutes handler
    (GET "/" [req] home)
    (GET "/todo" [req] todo-index))

比較的 Rails などに近い DSL なのでそちらを知っていれば馴染みやすいでしょう。

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

余談にはなりますが、ルーティングライブラリにはマクロで書かれた DSL を使って実現するものと、マップやベクタなどでデータを定義しておいて実現するものと主に 2 種類あります。前者の方法で実現しているのが Compojure で、後者の方法は今回ここまでで独自に定義したようなものですね(実用性の高いライブラリではもうちょっと綺麗に定義出来るんですが)。このように同じような機能を提供してくれるライブラリも沢山あるので好みに応じて好きなものを選んでいけるようになるのがいいでしょう。

また Compojure の提供するネームスペースについても簡単に説明しておきましょう。

* compojure.coercions:
  ルートパラメーター、つまり GET リクエストのパラメーターの型を String から強制するさいに使える関数を提供します。
* compojure.core:
  Compojure の基礎となる部分でルーティングに関する幾つかのマクロを提供します。
* compojure.handler:
  廃止予定。ここにあったものは現在では Ring-Defaults という別のライブラリになって提供されています。
* compojure.response:
  レスポンスマップの ``:body`` には通常 4 つの型しか使えませんが、このネームスペースで定義されている ``render`` 関数を通すことで他の型を通すことが出来るようになるのですが、基本的にこのネームスペースは使いません。
* compojure.route:
  幾つかのよく使うレスポンスを返す関数を提供します。

主に使うのは core と route ですが、 coercions なども使うことが出来ます。

.. [#] `この記事 <http://www.infoq.com/news/2011/10/clojure-web-frameworks>`_ で作者が "Compojure is a small web framework based on Ring" と言っていますが、既に Compojure の README からも web framework という表記が消されているので無視していいでしょう。
.. [#] 私が好きなのは JUXT の作っている `bidi <https://github.com/juxt/bidi>`_ というライブラリです。

Compojure を導入する
====================

まずは Compojure に依存性を追加する
-----------------------------------

Ring を追加したときのように ``project.clj`` へと依存性を追加します。

.. sourcecode:: clojure

  :dependencies [[org.clojure/clojure "1.7.0"]
                 [ring "1.4.0"]
                 [compojure "1.4.0"]]

* `commit: Compojure をプロジェクトの依存性へと追加する <https://github.com/ayato-p/intro-web-clojure/commit/9cac2f9bf45973c7545554b63d018591038154e5>`_

こんな感じで追加したら一度 REPL を再起動しましょう。そうすると自動的に Leiningen が REPL を起動する前に依存性を解決してくれます(丁寧にやるなら ``lein deps`` などのコマンドを使った後に REPL を起動します)。

Compojure でルーティングを書き換える
------------------------------------

次に Compojure を使って今のコードを書き換えてみます。

.. sourcecode:: clojure

  ;; src/todo_clj/core.clj
  (ns todo-clj.core
    (:require [compojure.core :refer [defroutes context GET]]
              [compojure.route :as route]
              [ring.adapter.jetty :as server]
              [ring.util.response :as res]))

まずは ``ns`` マクロの ``:require`` 部分に Compojure を追加します。 ``:refer`` と ``:as`` の使い分けを何処でしているのか分かりにくいかもしれませんが、 ``defroutes`` や ``GET`` のようなマクロはネームスペース内で衝突し難いですし、使うときにネームスペースの指定をせずに使えたほうが簡単でいいので ``:refer`` を使っています。勿論、 ``[compojure.core :as c]`` として ``(c/defroutes hoge ...)`` と書いても間違いではないです。ちなみに今回ついでに ``ring.util.response`` も加えています。これについては後述します。

次に ``handler`` 関数を再定義しましょう。

.. sourcecode:: clojure

  ;; src/todo_clj/core.clj
  (defroutes handler
    (GET "/" req home)
    (GET "/todo" req todo-index)
    (route/not-found "<h1>404 page not found</h1>"))

これを再評価して REPL からサーバーを起動して確認してみましょう。すると今まで通り、ホーム画面や TODO 一覧画面が表示されているのが確認出来ると思います。 ``defroutes`` は ``def`` や ``defn`` と似ていますが、第一引数にハンドラ名となるシンボルを受け取り、第二引数以降にルート定義を受け取ります。ルート定義は主に ``GET`` , ``POST`` などの ``compojure.core`` にあるマクロを使いますが、その他にも ``not-found`` のような ``compojure.route`` の関数なども使うことが出来ます。

それから ``ok``, ``not-found`` 関数を削除し、 ``html`` 関数も少々書き換えます。

.. sourcecode:: clojure

  ;; src/todo_clj/core.clj
  (defn html [res]
    (res/content-type res "text/html; charset=utf-8"))

``ring.util.response`` には幾つかのレスポンスマップを操作する便利な関数が定義されているためこれを利用することにしました。 ``ring.util.response/content-type`` 関数はレスポンスマップとヘッダーの Context-Type に設定するバリューを受け取り、レスポンスマップのヘッダーの ``"Context-Type"`` キーに受け取ったバリューを設定するという簡単なものです。前の ``html`` 関数のように自分でキーを設定してもいいのですが、このように既にある関数を利用できるのであれば使った方がいいでしょう。

また ``ok`` 関数を削除したので ``home``, ``todo-index`` 関数にも多少の修正が必要となります。

.. sourcecode:: clojure

  ;; src/todo_clj/core.clj
  (defn home [req]
    (-> (home-view req)
        res/response
        html))

  (defn todo-index [req]
    (-> (todo-index-view req)
        res/response
        html))

* `commit: Compojure を使って独自ルーティング機能を置き換える <https://github.com/ayato-p/intro-web-clojure/commit/def649deb34988c2ca00efe5c55ae28846f5ebe7>`_

``ok`` 関数の代わりに ``ring.util.response/response`` を使うことにしました。 ``ring.util.response/response`` は前に書いた ``ok`` 関数に似ているものですが、これは ``ok`` 関数と同じように ``body`` を受け取りレスポンスマップを生成するというシンプルなものですね。


Compojure についてもう少し詳しく知る
------------------------------------

ここまでで Compojure を使ってコードを書き換えてきましたが、もう少し Compojure が何を出来るのかを説明したいと思います。その後に今回作る TODO アプリの骨格となるルーティングの定義をもう少し行いましょう。

今まで見てきたように Compojure でのルート定義は以下のようになります。

.. sourcecode:: clojure

  (GET "/" req home)

このようなルート定義はリクエストマップを受け取りレスポンスマップを返す Ring ハンドラーを返します。この Ring ハンドラーを実行出来るかというのは HTTP メソッドとパスの定義によって決まります。この例では HTTP メソッドが GET でパスが ``"/"`` のときのみ実行されるということが分かります。また実行できない場合、ルート定義は ``nil`` を返します。

``compojure.core`` ネームスペースには ``GET`` や ``POST`` というマクロがあると書きましたが、これらは Ring が扱える HTTP メソッドと同名のマクロがあります。なので、実際に使えるものとしては ``GET``, ``POST``, ``PUT``, ``DELETE``, ``OPTIONS``, ``PATCH``, ``HEAD`` があり、どの HTTP メソッドでも良いという場合には ``ANY`` マクロを使うことができます。

``GET`` などのマクロは 2 つ以上の引数を受け取ります。第一引数はパスで、第二引数はバインディング、第三引数以降ではバインディングを利用して返却するレスポンスを作る部分になります。

パスは文字列で定義でき ``"/"`` や ``"/todo"`` などと定義するのですが、 ``"/todo/:id"`` などといったルートパラメーターを含めた特殊な指定も出来ます。このように指定することで次の ``"/"`` もしくは ``"."`` まで ``:id`` の部分にどのような文字列でもパスとして受け入れることができるようになります。ただ、これでは数字だけを使いたいなどというときに少々不便です。 Compojure ではその問題を解決するために指定できる文字を正規表現によって次のように制限することができます。

.. sourcecode:: clojure

  ;; todo-show はまだ未定義の架空の関数です
  (GET ["/todo/:id" :id #"[0-9]+"] req todo-show)

バインディングの機能については Clojure の ``let`` などで使える分配束縛と似たような機能が提供されていると考えてもらえるといいと思います。今回は分配束縛を使っていませんが使うことで多少楽にルート定義をすることが出来ます。例えば次のように ``:params`` を簡単にリクエストマップから取り出すことが出来ます。

.. sourcecode:: clojure

  (GET ["/todo/:id" :id #"[0-9]+"] {params :params} (todo-show params))

なれないと分かり難いかもしれませんが、 ``let`` の左辺を ``{params :params}`` として右辺にはリクエストマップがきていると思えば理解がしやすいと思います(実際にそういう風にマクロが展開されています)。
また次の例は Compojure の中でも特徴的なものですが、パスの中で ``:id`` などのルートパラメーターを定義している場合、それを簡単に取り出すことが出来るようになっています。

.. sourcecode:: clojure

  (GET ["/todo/:id" :id #"[0-9]+"] [id] (todo-show id))

このようにベクターの中でルートパラメーターを直接指定することで、それを簡単に抜き出し利用することが出来ます。これだけだと ``id`` はただの文字列ですが、これを数値に変換することも Compojure では出来ます。

.. sourcecode:: clojure

  (ns todo-clj.core
    (:require [compojure.coercions :refer [as-int]] ;; これを追加していると…
              [compojure.core :refer [defroutes context GET]]
              [compojure.route :as route]
              [ring.adapter.jetty :as server]
              [ring.util.response :as res]))

  (GET ["/todo/:id" :id #"[0-9]+"] [id :<< as-int] (todo-show id))

ちょっと複雑ですね。とはいえこのようにルートパラメーターを簡単に展開出来るのは便利なこともあるので使ってみてもいいかもしれません。

次に ``GET`` などのマクロの第三引数にあたる部分について説明しようと思います。ここまでの例では第三引数に対して ``home`` や ``todo-index`` というような関数だけを渡していました。実はここには関数以外にも文字列やマップなどを渡すことが出来ます。

.. sourcecode:: clojure

  (GET "/" req (home-view req))

これは ``home`` 関数の中で呼び出されていた ``home-view`` 関数をルート定義の中で呼び出して実行し、文字列を返すようにしています。このように書いても今までと同様にホーム画面を表示することが出来ます。これは Compojure が内部的に ``compojure.response`` ネームスペースで定義されている ``render`` 関数を呼び出していて、文字列型が渡されたときに自動的にレスポンスマップを生成し返すようになっているからです。この第三引数部分では第二引数部分で束縛しておいたパラメーターを利用することが出来るので分配束縛と組み合わせて何かをしたいときには便利です。ただし、関数を直接渡した場合は第二引数部分で束縛しておいたパラメーターは使うことが出来ず、その関数には元々のリクエストマップが直接渡されます。

.. sourcecode:: clojure

  ;; id を利用したい関数
  (defn todo-show [id]
    (prn-str id))

  (defroutes but?-handler
    (GET "/todo/:id" [id] todo-show)) ;; id を渡したいがリクエストマップが直接渡される

  (defroutes good-handler
    (GET "/todo/:id" [id] (todo-show id))) ;; このように関数を実行すれば分配束縛した id が利用出来る

そしてルート定義は ``routes`` 関数でまとめることが出来ます。 ``routes`` 関数はそれぞれのルート定義(ハンドラー)をひとつの Ring ハンドラーへとする役割を持っています。

.. sourcecode:: clojure

  (def handler
    (routes ;; compojure.core/routes
     (GET "/" req home)
     (GET "/todo" req todo-index)
     (GET "/todo/:id" [id] (todo-show id))))

それぞれのルート定義は上から順番に解決出来るかが試行され、 ``nil`` を返さないルート定義を探します。またルート定義をまとめるこのパターンは一般的なので ``defroutes`` マクロが提供されます(ここまでで既に使っていますが)。 ``routes`` 関数は ``routes`` 関数でまとめたハンドラーを含めることが可能なので次のような定義も可能です。

.. sourcecode:: clojure

  (defroutes main-routes
    (GET "/" req home)
    (route/not-found "<h1>404 page not found</h1>"))

  (defroutes todo-routes
    (context "/todo" req
      (GET "/" req todo-index)
      (GET "/new" req todo-new)
      (context "/:id" [id]
        (GET "/" req (todo-show id)))))

  (defroutes handler
    (routes
     todo-routes
     main-routes)) ;; main-routes には絶対に nil でない値を返す not-found が使われているので、順番を意識する必要がある

``context`` という関数が新しく登場していますが、 ``GET`` マクロなどのパスの共通部分をまとめるものです。これは ``GET`` などのマクロと同じように第一引数にパス、第二引数にバインディング、第三引数以降にはルート定義を並べます。

ここまでで Compojure の機能をひと通り紹介しましたが、今回紹介した中で今後使わない機能としては ``GET`` マクロなどの第二引数を使った分配束縛です。理由としてはこれを使うと少々煩雑になるのとシンプルにリクエストマップを渡す関数を第三引数に渡すようにしておくと後々ルーティングライブラリを変更する場合に楽だからです。今後第二引数は利用しないというのを明示するために ``_(アンダースコア)`` で潰していきますが、これを読んでいる方で使いたいという方はそこの部分を読み替えながら書いてみてください。

次はこれらを使って実際に Web アプリケーションの核となるルーティングを定義していきましょう。

ルーティング定義を行いアプリケーションの骨格をつくる
====================================================

TODO アプリに必要なものはなんでしょう。まずは TODO を作成、編集、表示、削除、一覧表示、検索など出来ればいいですよね。

.. sourcecode:: clojure

  (defroutes main-routes
    (GET "/" _ home)
    (route/not-found "<h1>Not found</h1>"))

  (defroutes todo-routes
    (context "/todo" _
      (GET "/" _ todo-index)
      (GET "/new" _ todo-new)
      (POST "/new" _ todo-new-post)
      (GET "/search" _ todo-search)
      (context "/:todo-id" _
        (GET "/" _ todo-show)
        (GET "/edit" _ todo-edit)
        (POST "/edit" _ todo-edit-post)
        (POST "/delete" _ todo-delete))))

  (def app
    (routes
     todo-routes
     main-routes))

こんな感じの定義が出来れば良さそうですね。ですが、これを ``src/todo_clj/core.clj`` に全て定義していくのはファイルが大きくなりすぎるのでそろそろファイルをわけていきましょう。 ``src/todo_clj/handler`` というディレクトリを作ってそこに ``main.clj`` と ``todo.clj`` を作ります。さらに ``html`` 関数をいろんなところで使いたくなるので ``src/todo_clj/util/response.clj`` を作りましょう( ``core.clj`` に ``html`` 関数を置いたままでも他のネームスペースから使えるんですが、循環参照が起きてコンパイルが出来なくなるので違うネームスペースを作ったほうがいいんです)。

.. sourcecode:: clojure

  ;; src/todo_clj/util/response.clj
  (ns todo-clj.util.response
    (:require [ring.util.response :as res]))

  (def response #'res/response)
  (alter-meta! #'response #(merge % (meta #'res/response)))

  (defn html [res]
    (res/content-type res "text/html; charset=utf-8"))


.. sourcecode:: clojure

  ;; src/todo_clj/handler/main.clj
  (ns todo-clj.handler.main
    (:require [compojure.core :refer [defroutes GET]]
              [compojure.route :as route]
              [todo-clj.util.response :as res]))

  (defn home-view [req]
    "<h1>ホーム画面</h1>
     <a href=\"/todo\">TODO 一覧</a>")

  (defn home [req]
    (-> (home-view req)
        res/response
        res/html))

  (defroutes main-routes
    (GET "/" _ home)
    (route/not-found "<h1>Not found</h1>"))


.. sourcecode:: clojure

  ;; src/todo_clj/handler/todo.clj
  (ns todo-clj.handler.todo
    (:require [compojure.core :refer [defroutes context GET POST]]
              [todo-clj.util.response :as res]))

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
        res/response
        res/html))

  (defn todo-new [req] "TODO new")
  (defn todo-new-post [req] "TODO new post")
  (defn todo-search [req] "TODO search")
  (defn todo-show [req] "TODO show")
  (defn todo-edit [req] "TODO edit")
  (defn todo-edit-post [req] "TODO edit post")
  (defn todo-delete [req] "TODO delete")

  (defroutes todo-routes
    (context "/todo" _
      (GET "/" _ todo-index)
      (GET "/new" _ todo-new)
      (POST "/new" _ todo-new-post)
      (GET "/search" _ todo-search)
      (context "/:todo-id" _
        (GET "/" _ todo-show)
        (GET "/edit" _ todo-edit)
        (POST "/edit" _ todo-edit-post)
        (POST "/delete" _ todo-delete))))


.. sourcecode:: clojure

  ;; src/todo_clj/core.clj
  (ns todo-clj.core
    (:require [compojure.core :refer [routes]]
              [ring.adapter.jetty :as server]
              [todo-clj.handler.main :refer [main-routes]]
              [todo-clj.handler.todo :refer [todo-routes]]))

  (defonce server (atom nil))

  (def app
    (routes
     todo-routes
     main-routes))

  (defn start-server []
    (when-not @server
      (reset! server (server/run-jetty #'app {:port 3000 :join? false}))))

  (defn stop-server []
    (when @server
      (.stop @server)
      (reset! server nil)))

  (defn restart-server []
    (when @server
      (stop-server)
      (start-server)))
