.. |start-debug| image:: /image/cursive_repl/startDebugger.png

======
 REPL
======

REPL は Clojure の開発環境になくてはならないものであり Cursive も例外ではありません。 Cursive は nREPL を使っています。それは Clojure のためのデファクトスタンダードな REPL の基盤です。

ローカル REPL
=============

REPL は Run Configurations から起動出来ます。もしあなたが Leiningen をプロジェクトで使っているなら直接 Leiningen プラグイン( lein-immutant など)を用いて REPL を起動することが出来ます。他には IntelliJ モジュール設定基盤の上でも REPL を起動出来ます。

新しい設定を作成します、 ``Run`` -> ``Edit Configurations…`` と開き + で新しい設定を作成します。 Clojure REPL の Local を選択します。

.. image:: /image/cursive_repl/create-local-config.png

それから設定に名前を付けることができます。また REPL を実行するのに Leiningen を使うから直接起動するかを選択できます。もしあなたが Leiningen を使ってプロジェクトを管理しているのならほぼ間違いなく Leiningen で REPL を起動させたいと思います。場合によって、あなたはどのモジュールを使うのか、どこから Leiningen プロジェクトを実行するのか、特別な JVM の引数、環境変数、それとワーキングディレクトリを選択することができます。

.. image:: /image/cursive_repl/local-repl-options.png

REPL を Leiningen を使って実行する場合、 Cursive は内部的に ``lein trampoline`` と同様のメカニズムを使っています。もし何かしらの理由であなたの REPL が ``trampoline`` を使って正しく動かない場合は、代わりに下で述べるリモート REPL の項を見てください。

設定編集ウィンドウの下部から、あなたの設定を走らせる前に実行するタスクを修正できます。特に興味深い設定は ``Synchronize Leiningen projects`` と ``Make`` でしょう。これらは Leiningen プロジェクトと Cursive プロジェクトの依存性を同期し、プロジェクトをビルドします。 ``Synchronize Leiningen projects`` は Leiningen の実行構成を動作させるためには必要ありません。 Leiningen は REPL を起動する前にプロジェクトファイルを再読み込みするので、このオプションを付けても REPL の起動が遅くなるだけでしょう。

.. image:: /image/cursive_repl/before-launch-tasks.png

もし特定の実行構成タイプの初期設定を変更したければ、左側 Defaults セクションから変更出来ます。新しい設定を作成する場合にその設定が使用されます。

それらには同様の実行構成を作成するためのショートカットがあります。もし、プロジェクトウィンドウのソースルート以外の適当なところで右クリックをしたら、直接実行構成を作成するための選択肢が表示されます。

.. image:: /image/cursive_repl/repl-context-menu.png

デバッグ REPL を開始する
========================

非常に有用なひとつの特徴は REPL セッションをデバッグできることです。これは今とても単純です。あなたのローカル設定をデバッグモードで実行するとデバッガーは自動的に接続します。

.. image:: /image/cursive_repl/local-debug-config.png

Clojure でデバッグすることで非常に困難なことのひとつはローカルクリアリング(locals clearing) [#]_ です。それは Clojure コンパイラがメモリ参照へとコードを挿入するという意味であり、二度と ``nil`` にならないということです。これはデバッグ時に問題になります。
you will see many of your local variables set to null when the code you are looking at could never have caused them to take that value. 常に遅延シーケンスをメモリに確保することで常に値と順序の変わらない同じシーケンスを返し、こうすることで遅延シーケンス起因のメモリリークを防ぐことができます。それは新しくやってきた人には混乱をもたらし、全ての人がデバッグ時にフラストレーションを感じることでしょう。

Cursvie は全てのデバッグ REPL でローカルクリアリングを無効にして開始し、全ての REPL はツールウィンドウの |start-debug| ボタンから REPL サーバーのデバッグモードをトグル出来ます。注目するのはこれがコンパイラの機能であるということで、つまりコンパイル時のみに影響があるということであり、それはランタイムフラグではありません。

これはそれをトグルした場合にあなたがデバッグするコードを再コンパイルする必要があるということです。一般的にはトグルをオンにしたあとにそれを REPL をリロードするということです。それからロングランニングプロセス(例えばプロダクションサーバープロセス)の中でローカルクリアリングを無効にするのはとても注意が必要です。それはメモリリークの原因となります。

REPL 起動時のタイムアウト
=========================

Cursive は REPL 起動時のタイムアウトを設定出来ます。これは REPL を起動させるまでに Cursive が待つ時間だと考えるのは誤りです [#]_ 。デフォルトでは 60 秒に設定されています。 ``Settings`` -> ``Clojure`` -> ``REPL startup timeout`` から変更できます。

リモート REPL
=============

もうひとつの方法として、もしあなたが既に走っている nREPL サーバーを持っている場合、それを Remote 設定を使えば nREPL サーバーに接続出来ます。
There are two options here - either you can configure it to connect to a host and port, or you can configure it to connect to 127.0.0.1 and get the port from the port file written by Leiningen. You can use this option if you want to start a REPL with Leiningen from the command line for some reason (for example, your REPL doesn’t work with the trampoline option used by Cursive).

.. image:: /image/cursive_repl/remote-repl-config.png

You can start as many REPLs as you like of whatever type, and they’ll appear in tabs in the REPL tool window.

Using the REPL
==============

Now that you have your REPL running, you can type code into the editor window below, the results appear above. The current namespace is shown in the tab title at the top of the tool window. You can execute code by pressing Enter if the cursor is at the end of a valid form, or you can execute at any time by pressing Ctrl Enter (Cmd Enter on the Mac). The editor is fully multi-line, and supports all functionality available in the main Clojure editor. You can move through your command history by using the up/down arrow keys, or jump between multi line items using Ctrl and arrow keys (Cmd arrows on Mac). If you don’t want the editor to move between history items using the normal arrow keys, you can disable this with Settings→Clojure→Up/Down arrow keys move between history items.

..
   rpel gif here

Using the buttons above the output window, you can interrupt the current execution, toggle soft wrapping of the output, clear the output, stop the REPL and reconnect (for remote REPLs).

Interaction with the editor
===========================

Often you’ll be editing code in the main project windows, and you’ll want to send code from your project to the running REPL. The commands to do this are under Tools→REPL. “Load file in REPL” will send the contents of the current editor window to the REPL, execute its contents and switch to the first namespace in the file, if any. A message will be printed out so you can see what happened.

“Load file in REPL” will calculate all the namespace dependencies of the file you’re loading, and will also load those dependencies in the correct order if any of them are out of date. This is very useful when editing multi-namespace projects as it’s often easy to forget when you’ve updated a file containing a function used by the main code you’re working on. It’s also very useful when working on code that’s require’d by its tests.

“Sync files in REPL” will load all out-of-date files from the editor to the REPL in the correct order, using the same transitive dependency calculation as “Load file in REPL”. It will not change the active namespace in the REPL.

This loading of dependent namespaces can have unexpected side effects, especially if one of the dependent namespaces creates data that would be overwritten by reloading it. If this bothers you, you can turn off this dependency functionality with Settings→Clojure→Load out-of-date file dependencies transitively.

.. image:: /image/cursive_repl/repl-load-file.png

You can also switch the REPL namespace to that of the current file using “Switch REPL NS to current file”, and execute individual forms from the editor using the “Run form before cursor” and “Run top form” commands.

..
   repl gif here

.. [#] 訳しててよくわからないのであとで修正するかもしれない。 http://clojure.org/lazy 現段階での私の理解としては、遅延シーケンスにおいてスタックオーバーフローが起こらないように、スタックをクリアにすることを local clearing(or local-variables clearing) と Clojure では言うということ。そして Cursive はそれを無効にすることが出来る(らしい)。
.. [#] 日本語が難しいですが、タイムアウトまでの時間という解釈で問題ないと思います。
