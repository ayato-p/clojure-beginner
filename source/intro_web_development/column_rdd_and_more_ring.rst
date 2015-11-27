=============================================================
 Column: REPL 駆動開発を取り入れて Ring でもう少し遊んでみる
=============================================================

REPL 駆動開発
=============

Part2 の最後の方で REPL を上手く使いながら開発をすると書きましたが、とは言っても Clojure が初めての Lisp 系の言語という人にとっては何のことだかよく分からないかもしれませんし、なんだか面倒くさいように感じるかもしれません(いちいち REPL 上でサーバーを再起動したりしないと変更が反映されないんだとしたら面倒くさいですよね)。

REPL 駆動開発という言葉は書籍でもページを割いて紹介されるくらいには Clojure 界隈では一般的な言葉なんですが、言葉通りなので深くは説明せずに [#]_ ここでは Part1 までで作った部分を使って REPL 駆動開発らしさを取り入れて遊んでみます。

.. [#] 矢野勉さんの書かれている記事がとても参考になるので興味があれば読んでみてください `REPL Driven Programming/tyano's Tech Log <http://tyano.shelfinc.com/post/48110396231/repl-driven-programming>`_

Ring で遊びながら REPL 駆動開発を体験する
=========================================

遊ぶ前にちょっとだけ脱線してこれだけは覚えて欲しいという操作を書いておきます。

* エディタから REPL を起動する/あるいは REPL へと接続する
* ファイルを REPL 上でロードする
* カーソル位置のフォームを REPL に送って評価する

この 3 つだけ各々が使っているエディタ (IDE 含む) でどうやって行うか確認しておいてください [#]_ 。だいたいのエディタではこれら 3 つの操作が最低限実行出来るようになっていると思います。

.. [#] Cider と Cursive についてはこの Column の最後の方に書いておきます。

``src/todo_clj/core.clj`` を開き、 REPL を起動してやっていきましょう。 ``core.clj`` には Part2 までの内容が書いてあると思いますが、 Part2 の最後と同じようにサーバーをまず起動します。

.. sourcecode:: clojure

  user> (require '[todo-clj.core :as c])
  ;; => nil
  user> (c/start-server)
  ;; => #object[org.eclipse.jetty.server.Server 0x55b1143a "org.eclipse.jetty.server.Server@55b1143a"]

何の変哲もない ``Hello, world`` が表示されたと思います。次にファイル上の ``handler`` 関数を書き換えてみます。

.. sourcecode:: clojure

  (defn handler [req]
    {:status 200
     :headers {"Content-Type" "text/plain"}
     :body "Hello, world!!"})

何の変哲もない ``Hello, world`` にエクスクラメーションマークをふたつ付けてみました。試しにこの関数をカーソル位置のフォームを REPL に送って評価(これ以降、単に "評価する" と書いているときはこの機能を使っていると思ってください)する機能を使ってみます。
そしてブラウザを更新してみると前と何も変わっていません。仕方ないので REPL 上で ``(c/restart-server)`` を評価してみましょう。その後、ブラウザを更新すると出力結果が変わっていると思います。

ですが、これではあまり嬉しくないのでもうちょっと変更を加えてどうにかしてみましょう。

.. sourcecode:: clojure

  (defn start-server []
    (when-not @server
      (reset! server (server/run-jetty #'handler {:port 3000 :join? false}))))

``run-jetty`` に渡す ``handler`` を ``#'handler`` としました。一度 ``(c/restart-server)`` を REPL 上で評価してサーバーを再起動します。その後、 ``handler`` 関数を適当に書き換えて評価して、ブラウザを更新してみてください。どうでしょう?今度はサーバーを再起動することなく出力が変わったことを確認出来たと思います。

これはサーバーを起動する際に渡している ``handler`` 関数のシンボルを、 ``Var`` オブジェクトに変更したんですね。シンボルを直接渡してしまうと ``handler`` を束縛していたオブジェクト(関数)が直接 ``run-server`` に渡ってしまい、それを後から変更することは出来なくなるのですが、 ``Var`` オブジェクトを渡しておけば ``handler`` を束縛するオブジェクトが変わっても ``run-server`` 関数は ``Var`` に格納されたオブジェクトをその都度参照出来るようになるので、サーバーを再起動せずに ``handler`` 関数の再評価だけで出力結果を変更することができるようになります。

``Var`` の話は少し難しいので分からなければ、とりあえず ``run-jetty`` には ``Var`` を渡したら良いらしいということを覚えておいてもらえればいいです。

さて、 ``handler`` 関数を次のように書き換えると HTML が出力出来ます。

.. sourcecode:: clojure

  (defn handler [req]
    {:status 200
     :headers {"Content-Type" "text/html"}
     :body "<h1>Hello, world</h1>"})

Part2 でも書いたようにレスポンスマップは通常文字列、シーケンス、ファイル、ストリームのいずれかなのでこのように直接 HTML を文字列で記述しても問題なく出力されます。

今回のプロジェクトへの変更は一点 ``Var`` オブジェクトを使うようにするだけです( Column で大きな変更はしたくないので)。

* `commit: run-jetty 関数へ渡す handler を Var へと変更 <https://github.com/ayato-p/intro-web-clojure/commit/9218661197405d7d350c5763f3ca7de736fa2daf>`_

全ては REPL の上にある
======================

さらっと説明してしまいましたが、大事なことなのでもう少し説明を重ねます。ここまででフォームを評価する方法が幾つかあることが分かりました。 (1) フォームを REPL に送って評価する、 (2) REPL 上で評価する、 (3) ファイルをロードしてファイル全体を評価する、このみっつの評価方法が主な評価方法になるわけですが、これらの違いはなんでしょうか。

実は違いはなく全て同じように REPL 上でフォームを評価します。具体的な使い分け方としては以下のようになります。

* (1) フォームを REPL に送って評価する

  主にファイル上で ``def`` や ``defn`` のような関数を使って関数などを定義したり、書き換えた後にそこだけを評価するときに使います。つまり何度も書き換えるけど、ファイル上に残しておきたいものを書くときに使うことが多いということですね。
  また、私はよくやるのですが、何度も試行錯誤して関数を試したり書いたりするときなどにはこちらを使うことが多いです。

* (2) REPL 上で評価する

  こっちは (1) と真逆で消えてもいいようなものを試すのによく使います。またサーバーを起動したり停止したり開発用のコマンドのような関数を使うときには主にこちらを使います。

* (3) ファイルをロードしてファイル全体を評価する

  ファイルを大きく変更してしまってそのファイル全てを評価し直したいときによく使います。

このような使い分けをするものの、例えば REPL 上で次のようなフォームを評価すると、さっきまでのコードを上書き出来ます。

.. sourcecode:: clojure

  user> (require '[todo-clj.core])
  ;; => nil
  user> (in-ns 'todo-clj.core)
  ;; => #object[clojure.lang.Namespace 0x25ea002f "todo-clj.core"]
  todo-clj.core> (defn handler [req] {:body "Good bye"})
  ;; => #'todo-clj.core/handler
  todo-clj.core> (start-server) ;; もしサーバーが既に起動しているならここを省略してもブラウザ上で変更が確認できます
  ;; => #object[org.eclipse.jetty.server.Server 0x41a5497e "org.eclipse.jetty.server.Server@41a5497e"]

ネームスペースに入り込んで、 ``handler`` 関数を上書きしています。ファイルのトップに ``ns`` マクロを書くのは慣習ですが、あれはネームスペースが存在しないなら新しいネームスペースを作りネームスペースに入るという意味です。つまり、その後に書いていく ``def`` や ``defn`` などはそのネームスペース( ``*ns*`` )に対して関数などを定義しているのですね。ということは REPL の上で既に作られたネームスペースに入ってそこで新しい関数を定義したり、既存の関数を上書きすることが出来るのです。

ここまでで分かるように Clojure は他の言語とは違ってファイルをベースに開発しません。基本的に REPL の上に全てあるので、それを最大限に活かして開発出来るのが Clojure の利点であり他の言語に対するひとつの優位性でしょう。

他にも開発を促進するための Tips はありますがそれは徐々に出していきますので楽しみにしておいてください。

おまけ
======

上述した操作方法について、 Emacs と Cider-mode それから IntelliJ IDEA と Cursive について書いておきます。

Emacs と Cider-mode
-------------------

* エディタから REPL を起動する/あるいは REPL へと接続する

  ``M-x cider-jack-in``

* ファイルを REPL 上でロードする

  ``M-x cider-load-file``

* カーソル位置のフォームを REPL に送って評価する

  ``M-x cider-eval-last-sexp`` など

IntelliJ IDEA と Cursive
------------------------

* エディタから REPL を起動する/あるいは REPL へと接続する


  このあたりを参照してください。
  `ローカル REPL/IntelliJ IDEA と Cursive で始める <../getting_started/intellij_with_cursive/repl.html#id1>`_

* ファイルを REPL 上でロードする

  ``Load file in REPL`` or ``Sync files in REPL``

* カーソル位置のフォームを REPL に送って評価する

  ``Switch REPL NS to current file`` を実行して REPL のネームスペースを切り替えてから ``Run form before cursor`` or ``Run top form``
