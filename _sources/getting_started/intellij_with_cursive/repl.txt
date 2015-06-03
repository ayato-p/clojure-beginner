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
