==========================
 Part2: Ring について知る
==========================

Ring ってなんですか?
====================

Web アプリケーションを作成したい場合、必ず必要となるのが Web サーバーです。その Web サーバーと Web アプリケーションやフレームワーク間の標準的なインターフェイスを定めたものが `Ring <https://github.com/ring-clojure/ring>`_ です。 Ruby でいう Rack 、 Python でいう WSGI とはよく言われますが、 Clojure におけるそれらが Ring ということですね。

もしかするとあなたは Rack や WSGI というものをそれほど意識せずに Web アプリケーションを開発してきたかもしれませんが、 Clojure で Web アプリケーションを開発するのであれば遅かれ早かれこれを理解しておいたほうがいいです。何故なら、 Clojure では Rails のように Rack を隠してしまうフレームワークがないので、度々 Ring を意識する必要が出てくるからです。 Ring を理解せずに Web アプリケーションを開発しようとすると独自のミドルウェアを書くことが出来ませんし、 Web アプリケーションのデバッグが難しくなるでしょう。とはいっても Ring の考え方はとても簡単なので理解してしまえば、自分でミドルウェアなどを書いて簡単に拡張していくことが出来ます。

この Part では Ring についての基本的な説明と実際に Ring を実装したサーバーを起動/停止するところまでを説明します。

Ring の 4 つのコンポーネント
============================

Ring アプリケーションを作成する際に、意識しなければいけないものは以下の 4 つのコンポーネントです。

* ハンドラー
* ミドルウェア
* リクエストマップ
* レスポンスマップ

Ring の仕様上ではこれともうひとつアダプタが存在しますが、基本的にユーザーが意識するものではないのでここでは省略します。簡単にこれらについて見て行きましょう。

リクエストをハンドリングする
----------------------------

Ring はクライアントからのリクエストとサーバーからのレスポンスを表現するのに Clojure のマップ(関数ではなくてデータ構造)を使います。ハンドラーはリクエストマップを受け取りレスポンスマップを返す関数です。例えば一番シンプルなハンドラーは次のようになります。

.. sourcecode:: clojure

  (defn handler [req]
    {:status 200
     :headers {"Content-Type" "text/plain"}
     :body (:remote-addr req)})

このように Ring のハンドラーは単純な関数として実装出来るためテストが書きやすいというのも特筆すべきところでしょう。

リクエストマップとレスポンスマップ
----------------------------------

先に記述した通りリクエストマップとレスポンスマップは単純な Clojure のマップです。

リクエストマップ
~~~~~~~~~~~~~~~~

Clojure のマップとして表現された HTTP リクエストです。リクエストマップは幾つかのスタンダードなキーが常に存在しますが、これら以外にもユーザーがミドルウェアを介して自由にキーを足すことが出来ます。

スタンダードなキーは以下の通りです。

* ``:server-port``
  リクエストをハンドルしたポート番号
* ``:server-name``
  解決されたサーバー名もしくは IP アドレス
* ``:remote-addr``
  クライアントか最後にリクエストを投げたプロキシの IP アドレス
* ``:uri``
  リクエスト URI (ドメイン名以下のフルパス)
* ``:query-string``
  もしあればクエリ文字列
* ``:scheme``
  トランスポートプロトコル ``:http`` または ``:https``
* ``:request-method``
  HTTP リクエストメソッド ``:get``, ``:head``, ``:options``, ``:put``, ``:post``, ``:delete`` のいずれか
* ``:headers``
  ヘッダーの文字列を小文字化したキーを持つマップ
* ``:body``
  もしあればリクエストボディのための InputStream

以下のキーは既に廃止予定となっているため使わない方がいいでしょう(まだ存在しますが)。

* ``:content-type``
* ``:content-length``
* ``:character-encoding``

もし、既に Clojure で Web アプリケーションを開発したことがあればおそらくこれ以外のキーを見たことがあるでしょう(例えば ``:params`` や ``:session`` など)。
それらはミドルウェアによって差し込まれたものですが、同様にそのようなミドルウェアを自分で作成して適用することも出来ます。ミドルウェアの作り方は後述します。

レスポンスマップ
~~~~~~~~~~~~~~~~

ハンドラーが作成するレスポンスマップで、以下の 3 つのキーを持ちます。

* ``:status``
  HTTP ステータス
* ``:headers``
  クライアントへと返す HTTP ヘッダー
* ``:body``
  レスポンスボディ

ステータスは HTTP RFC で定義されているものと同じで 200 や 404 などというものです。

ヘッダーは HTTP ヘッダーと同じ名前を使ったマップです。それぞれのバリューについて文字列か文字列のシーケンスを使うことが出来ますが、文字列の場合はそのまま HTTP レスポンスとして送信し、文字列のシーケンスの場合はそれぞれの値を送信します。

ボディは文字列、シーケンス、ファイル、ストリームのいずれかの型を使うことができます。

またレスポンスマップとしては上記の 3 つのキーだけで充分ですが、リクエストマップと同様にミドルウェアにてキーを追加したりレスポンスボディに変更を加えたりすることが出来ます(少々複雑にはなりますが)。

機能をミドルウェアを使って足す
------------------------------

ミドルウェアはハンドラーのための高階関数として定義されます。ミドルウェア関数は第一引数としてハンドラーを受け取り、新しいハンドラー関数を返さなければなりません。

シンプルな例は次のようになります。

.. sourcecode:: clojure

  (defn wrap-exclamation-mark [handler]
    (fn [request]
      (let [response (handler request)]
        (update response :body #(str % "!!")))))

このミドルウェア関数はハンドラーが作る全てのレスポンスのボディに対してビックリマークを最後に足すものです(実用性は皆無ですが)。

パッと見ると複雑そうに見えますが、冷静に見るととてもシンプルです。またこの例では古いハンドラーを評価して得たレスポンスマップに対して変更を加えていますが、リクエストマップに対して変更を加えるようなミドルウェアは次のように定義できます。

.. sourcecode:: clojure

  (defn wrap-parse-query-string [handler]
    (fn [request]
      (let [params (parse-query-string (:query-string request))
            updated-request (assoc request :params params)]
        (handler updated-request))))

``parse-query-string`` という関数はここでは存在するものとして扱いますが、名前の通り ``query-string`` をパースしてマップに変換するものだと思ってください。
ハンドラーを受け取ったミドルウェアは新しいハンドラーを返しますが、その新しいハンドラーの中でリクエストマップを編集し更新したリクエストマップを古いハンドラーに渡すということをしています。

このようなミドルウェアは次のようにハンドラーへと適用します。

.. sourcecode:: clojure

  (def app
    (wrap-parse-query-string (wrap-exclamation-mark handler)))

これは新しいハンドラー ``app`` を ``handler`` に ``wrap-exclamation-mark`` を適用したものとして定義しています。

またスレッディングマクロ( ``->`` )を用いることで読みやすく出来ます。

.. sourcecode:: clojure

  (def app
    (-> handler
        wrap-exclamation-mark
        wrap-parse-query-string))

Ring では標準のミドルウェアを幾つか提供しているので一般的なものであれば自分で定義する必要はありません。また標準以外にも沢山のライブラリがあるので自分の用途にあったものを探し適用することも可能です。

.. note::

   実開発において Ring のミドルウェアを沢山使うことになるのですが、その際に順番を気にしないといけないケースがあるので気をつけてください。
   例えば wrap-a ミドルウェアでリクエストマップに追加するはずの値を wrap-b で参照するような場合 ``(-> handler wrap-b wrap-a)`` のように順番を気にして書く必要があったりします。

サーバーを起動して "Hello, world" してみる
==========================================

長々と Ring の基本的なことについて説明したところで実際に Ring を使ってみることにします。

準備編で作成したプロジェクトの依存性に Ring を追加します。

.. sourcecode:: clojure

   :dependencies [[org.clojure/clojure "1.7.0"]
                  [ring "1.4.0"]]

* `commit: Ring をプロジェクトの依存性へと追加 <https://github.com/ayato-p/intro-web-clojure/commit/27762a4da2ee27016ee90304650818bd63d2dd67>`_

Ring ライブラリは全てで 4 つのライブラリ( ring-core, ring-devel, ring-jetty-adapter, ring-servlet )から出来ています。 Ring を上記のように追加すると 4 つのライブラリを全て使うことができるようなります。
それぞれのライブラリは以下のような役割を持っています。

* ring-core: 有用なミドルウェア関数が定義されていて、セッションやパラメーター、 Cookie などをハンドリングするものなどです
* ring-devel: 開発やデバッグなどで便利なミドルウェアなどが定義されています
* ring-jetty-adapter: Ring アダプタを Jetty へと適用したものが定義されています(最初はこれを使うことにします)
* ring-servlet: Ring ハンドラーを Servlet へと変換するユーティリティですが基本的に気にする必要はないです

主に使うことになるのは ring-core, ring-devel ですが、今回は Ring アダプターのリファレンス実装でもある ring-jetty-adapter も使います。

次に REPL を起動して次のようなコードを REPL 上で評価してみましょう。

.. sourcecode:: clojure

  user> (require '[ring.adapter.jetty :as s])
  ;; => nil
  user> (def server (atom nil))
  ;; => #'user/server
  user> (reset! server (s/run-jetty (fn [req] {:body "Hello, world"}) {:port 3000 :join? false}))
  ;; => #object[org.eclipse.jetty.server.Server 0x25a13368 "org.eclipse.jetty.server.Server@25a13368"]

ここまで評価したら ``http://localhost:3000/`` をブラウザで見てみましょう。すると ``Hello, world`` と出力されているのが確認出来たと思います。これが Ring アプリケーションのはじめの一歩です。あ、 REPL は落とさないでくださいね。

さて、少しずつ説明していきましょう。

.. sourcecode:: clojure

  (require '[ring.adapter.jetty :as s])

これは先ほど書いた Jetty と Ring アプリケーションの世界を繋ぐ Ring アダプタのリファレンス実装なんですが、それを ``s`` という別名をつけて ``require`` しているだけです。

.. sourcecode:: clojure

  (def server (atom nil))

サーバーを起動したあとに返ってくるサーバーのインスタンスを捨ててしまうと REPL を止めるまでサーバーを止めることができなくなるのでその受け皿です。

.. sourcecode:: clojure

  (reset! server (s/run-jetty (fn [req] {:body "Hello, world"}) {:port 3000 :join? false}))

ちょっと長いですね。 ``reset!`` で ``s/run-jetty`` が返すインスタンスを ``server`` へとセットしています。 ``s/run-jetty`` はふたつの引数を受け取るのですが、ひとつめがリクエストマップを受け取りレスポンスマップを返す Ring ハンドラー、次がサーバーのオプションです。 ``(fn [req] {:body "Hello, world"})`` は簡単ですが Ring ハンドラーです(本当は ``:status`` , ``:headers`` もあったほうがいいのですが、 ``Hello, world`` するだけなら少々足りなくても問題ありません)。 ``{:port 3000 :join? false}`` はオプションで ``:port`` はポートなので良いと思いますが、 ``:join?`` は ``true`` (デフォルト値です)だとスレッドをサーバーが止まるまでブロックしてしまう、つまり REPL が返ってこなくなってしまうので ``false`` を指定しています。

さて、起動したサーバーはちゃんと止めましょう、ということで次のコードを REPL 上で評価します。

.. sourcecode:: clojure

  user> (.stop @server)
  ;; => nil
  user> (reset! server nil)
  ;; => nil

サーバーのインスタンスから ``stop`` メソッドを実行して、 ``server`` 変数を ``nil`` にしてサーバーのインスタンスを捨てています。

今 REPL 上でやったことをちょっと手を入れてファイル(src/todo_clj/core.clj)に書いていきましょう。

.. sourcecode:: clojure

  ;; src/todo_clj/core.clj
  (ns todo-clj.core
    (:require [ring.adapter.jetty :as server]))

  (defonce server (atom nil))

  (defn handler [req]
    {:status 200
     :headers {"Content-Type" "text/plain"}
     :body "Hello, world"})

  (defn start-server []
    (when-not @server
      (reset! server (server/run-jetty handler {:port 3000 :join? false}))))

  (defn stop-server []
    (when @server
      (.stop @server)
      (reset! server nil)))

  (defn restart-server []
    (when @server
      (stop-server)
      (start-server)))

* `commit: Ring を使った Hello, world <https://github.com/ayato-p/intro-web-clojure/commit/561c6ba9eb5677c793938765f3511465321708aa>`_
* `commit: サーバーの停止/再起動関数の実装 <https://github.com/ayato-p/intro-web-clojure/commit/49a37cc901efa7e75b3b72c12ef7ed87842bb5fc>`_

こんな感じになりました。さっきは ``run-jetty`` に匿名関数として渡していた Ring ハンドラーを ``handler`` として定義して、返り値のレスポンスマップを綺麗にしました。あとはそれぞれサーバーを起動/停止/再起動する関数を定義しました。
それと ``server`` 変数が ``defonce`` で定義されているのはファイルをリロードした際に再定義されるのを防ぐためです(再定義されてしまうと起動中のサーバーインスタンスを止めることが出来なくなるので)。

ファイルにここまで書いたら REPL 上にファイルをロードしましょう [#]_ 。そして REPL 上で次のフォームを評価します。

.. sourcecode:: clojure

  user> (require '[todo-clj.core :as c])
  ;; => nil
  user> (c/start-server)
  ;; => #object[org.eclipse.jetty.server.Server 0x55b1143a "org.eclipse.jetty.server.Server@55b1143a"]

改めて ``http://localhost:3000/`` を見るとちゃんと出力されていますね。このように Clojure を使ったアプリケーション開発では REPL を上手く使いながら開発をインタラクティブに行っていくので頭の片隅に置いておいてください。

さて、ここまででこの Part で説明すべきことは説明し終えました。次の Part ではルーティングについて学んでいきます。

.. [#] Emacs と Cider を使っていなら ``C-c C-l`` or ``M-x cider-load-file`` をファイルバッファ上で実行します。 IntelliJ IDEA で Cursive を使っているなら ``Load file in REPL`` を実行します。

ここまでで学んだこと
====================

* Ring には 4 つのコンポーネントがあること
* Ring アプリケーションでの ``Hello, world`` の書き方 (サーバーの起動と停止方法)
