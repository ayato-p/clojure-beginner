======================================================
 Column: 起動している REPL に新しい依存関係を追加する
======================================================

alembic を使って起動している REPL に依存関係を追加する
======================================================

これまでの Part では基本的に新しいライブラリを追加する度に REPL を再起動していましたが、実は再起動しなくてもライブラリを依存関係に追加することが出来ます。それには `alembic <https://github.com/pallet/alembic>`_ というライブラリを使います。

まずは準備として ``~/.lein/profiles.clj`` を修正します。

.. sourcecode:: clojure

  {:repl {:plugins [[cider/cider-nrepl "0.10.0-SNAPSHOT"]
                    [refactor-nrepl "2.0.0-SNAPSHOT"]
                    [lein-try "0.4.3"]]
          :dependencies [[org.clojure/tools.nrepl "0.2.12"]
                         [alembic "0.3.2"]]}} ;; 追加しました

これは私の ``profiles.clj`` なので完全に一致させる必要はありませんが、 alembic は REPL を起動しているときくらいにしか使わないので、 repl プロファイルの ``:dependencies`` に追加すればいいでしょう。

* ref: `CIDER slows down Leiningen startup. Here is how to fix that. <http://blog.maio.cz/2015/11/cider-slows-down-leiningen-startup-here.html>`_

そして、実際に使う場合は次のように起動中の REPL で実行すれば動きます。

.. sourcecode:: clojure

  ;; project.clj を編集した後で…
  user> (require '[alembic.still])
  ;; => nil
  user> (alembic.still/load-project)
  ;; Loaded dependencies:
  ;; ~~~~~~~~~
  ;; ~~~~~~~~~
  ;; ~~~~~~~~~
  ;; => nil

これで特定のライブラリが読み込まれるはずです。一度 ``require`` すればそのあとは毎回 ``(alembic.still/load-project)`` とすれば良いだけなので簡単ですね。

この後の Part でも基本的に依存関係を修正したら REPL を再起動するよう促している場合がありますが、このライブラリを使って REPL を再起動せずに依存関係を読み込んでも問題ありません。
