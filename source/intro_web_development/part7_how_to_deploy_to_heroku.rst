===============================================
 Part7: どのようにして Heroku へデプロイするか
===============================================

一般的な Clojure アプリケーションのデプロイの方法について
=========================================================

これから Clojure で Web アプリケーションを作ろうとするひとにとって、 Clojure をどのようにデプロイし運用するかというのは興味があるひとつのポイントでしょう。 Clojure では大きく分けてふたつの方法を選ぶことができます。 (1) 組み込みサーバーを依存関係に入れて実行可能 Jar を作る、 (2) War にして Wildfly などのアプリケーションサーバーにデプロイする、というのが大凡一般的な方法になります。 Java で Web アプリケーションを作った経験があるなら恐らくどちらかでデプロイした経験があると思いますが、 Clojure でも同様にしてデプロイすることが出来ます [#]_ 。

2 の方法はアプリケーションサーバーを用意するのが面倒なので今回はやりませんが、一応やり方としては lein-ring プラグインを使うことで実現出来ます。詳しくは `README <https://github.com/weavejester/lein-ring#war-files>`_ を読んでください。また Immutant を使っていて、 Wildfly にデプロイする場合は次の記事が参考になると思います [#]_ 。

* `immutantを用いてclojureで開発してWildflyで動かす/Qiita <http://qiita.com/lambda-knight/items/16843ce82889a53308f3>`_

この Part では組み込みサーバーを依存関係に入れて実行可能 Jar を作るという方法を取ることにします。ちなみに今回は既に Jetty を開発用のアプリケーションサーバーとして使っているので、それをそのまま採用します。
なので、まずは実行可能 Jar を作り、最後にそれを Heroku へとデプロイしましょう。

.. [#] 本当はもうひとつ ``lein run with-profiles prod`` などとして動かす方法もありますがあまり一般的ではないと思うのでここでは紹介しません
.. [#] Immutant については後の Part で解説します

実行可能 Jar を作成するための準備
=================================

Web アプリケーションのエントリーポイントとなる新しいネームスペースを作成しましょう。 ``todo-clj.main`` としましょう。

.. sourcecode:: clojure

  ;; src/todo_clj/main.clj
  (ns todo-clj.main
    (:require [todo-clj.core :as core])
    (:gen-class))

  (defn -main [& {:as args}]
    (core/start-server))

このように ``todo-clj.core`` ネームスペースを読み込んで、 ``-main`` 関数の中で ``(core/start-server)`` を実行するようにします。またネームスペースに ``(:gen-class)`` を付けておきましょう。次は ``project.clj`` の ``:uberjar-name`` と uberjar プロファイルを設定します。

.. sourcecode:: clojure

  ;; project.clj
  :uberjar-name "todo-clj.jar"
  :profiles
  {:dev {:dependencies [[prone "0.8.2"]]
         :env {:dev true}}
   :uberjar {:aot :all
             :main todo-clj.main}}

``:uberjar-name`` を設定することで ``lein uberjar`` で出来上がった実行可能 Jar の名前を設定することが出来ます。 uberjar プロファイルを設定すると ``lein uberjar`` を実行するときだけの設定を追加できます。 ``:aot`` や ``:main`` などについての詳しい説明はここでは省きたいと思いますが、簡単に説明しておくと ``:aot`` を指定することでアプリケーションの起動が早くなったり、実行時にバイトコードを生成しなくなり、 ``:main`` はエントリーポイント( ``-main`` 関数)があるネームスペースを指定します。

ここまで出来たら実際に実行可能 Jar を作って実行してみたいと思います。

.. sourcecode:: shell

  $ lein uberjar
  $ java -jar target/todo-clj.jar

ここまで出来たらブラウザから今までと同じように ``http://localhost:3000`` にアクセスして起動出来ているか確認してみましょう。ちゃんと動いていれば成功です。

案外簡単に出来ましたよね。これを実際に Heroku で動かそうという話なんですが、実は幾つかの点で懸念が残っているのでそれを先に解消していきます。

プロダクション環境用の設定を行う
================================

今までコード中にベタ書きしてきたもので開発環境とプロダクション環境で切り替えたいものというのが幾つかあります。ひとつはデータベースの設定、もうひとつはサーバーのポート番号など。これらを外部の環境変数やアプリケーション起動時の引数などから指定できるようにしておくとデプロイする前にファイルを修正する、なんていうことをせずに済みます。

まずはデータベースの設定を環境変数から取れるように変更しましょう。 environ を使います。

.. sourcecode:: clojure

  ;; src/todo_clj/db.clj
  (ns todo-clj.db
    (:require [clojure.java.jdbc :as jdbc]
              [environ.core :refer [env]]))

  (def db-spec
    (:db env))

非常に簡素になりましたが、今までここにあった設定は ``project.clj`` へと移しました。

.. sourcecode:: clojure

  ;; project.clj
  {:dev {:dependencies [[prone "0.8.2"]]
         :env {:dev true
               :db {:dbtype "postgresql" :dbname "todo_clj_dev" :host "localhost" :port 5432 :user "username" :password "password"}}}
   :uberjar {:aot :all
             :main todo-clj.main}}

開発時は ``project.clj`` の設定値を読み込みますが、プロダクション環境では環境変数 ``db`` を設定することで問題なく稼働します。また、 ``db-spec`` は Part5 で触れたように URI 表記の文字列でも問題ないので環境変数を設定する際に Clojure のマップデータを設定出来ないのを悩む必要はないです。

次はサーバーのポート番号などをアプリケーション起動時に設定出来るようにします。

.. sourcecode:: clojure

  ;; src/todo_clj/core.clj
  (defn start-server [& {:keys [host port join?]
                         :or {host "localhost" port 3000 join? false}}]
    (let [port (if (string? port) (Integer/parseInt port) port)]
      (when-not @server
        (reset! server (server/run-jetty #'app {:host host :port port :join? join?})))))

このように ``todo-clj.core/start-server`` 関数を書き換えます。こうすると REPL の中から引数なしで起動しても今までと同じように動きます。そうしたらアプリケーションのエントリーポイントも書き換える必要がありますね。次のようになります。

.. sourcecode:: clojure

  ;; src/todo_clj/main.clj
  (defn -main [& {:as args}]
    (core/start-server
     :host (get args "host") :port (get args "port") :join? true))

``host``, ``port`` をアプリケーション起動時の引数として受け取るように修正しています。これでプロダクション環境に出してもうまく動かすことが出来るようになりました。

Heroku へデプロイする
=====================

ここまででプロダクション環境に出しても稼働させることのできる実行可能 Jar を作ることが出来るようになったのですが、 Heroku にデプロイするのにもう少しだけ修正をします。

まずは今回作ってきた TODO アプリはデータベースを使うので最初にマイグレーションする必要があります。本当はマイグレーション用のライブラリを使うなどして綺麗にやりたいところですが、ここで説明するにはちょっとやることが多いので簡単に実装出来る方法で逃げます。

``todo-clj.db`` ネームスペースを次のように修正します。

.. sourcecode:: clojure

  ;; src/todo_clj/db.clj
  (defn migrated? [] ;; public スキーマにテーブルがひとつでもあればマイグレーション済みであると見做す(テーブルが増えると対応出来ないので後で修正します)
    (pos? (count (jdbc/query db-spec "select tablename from pg_tables where schemaname = 'public'"))))

  (defn migrate []
    (when-not (migrated?)
      (jdbc/db-do-commands
       db-spec
       (jdbc/create-table-ddl :todo [:id :serial] [:title :varchar]))))

今回はテーブルがひとつでも作成されていたら ``migrate`` 関数を実行できないようにしました。そしてこの ``migrate`` 関数を Web アプリケーションの起動時に呼び出します。

.. sourcecode:: clojure

  ;; src/todo_clj/main.clj
  (ns todo-clj.main
    (:require [todo-clj.core :as core]
              [todo-clj.db :as db])
    (:gen-class))

  (defn -main [& {:as args}]
    (db/migrate) ;; サーバー起動前にマイグレーションを行う
    (core/start-server
     :host (get args "host") :port (get args "port") :join? true))

これでいいでしょう。次に Heroku 特有のデプロイ設定を行いましょう。まずは ``project.clj`` に次の記述を足します。

.. sourcecode:: clojure

  ;; project.clj
  :min-lein-version "2.5.3"

これは Heroku の Leiningen のデフォルトバージョンが 1.X 系なのでこうする必要があります。

そして、最後に ``Procfile`` を書きます。

.. sourcecode:: clojure

  ;; Procfile
  web: java $JVM_OPT -jar target/todo-clj.jar host 0.0.0.0 port $PORT

* `commit: Heroku へデプロイするための設定を記述 <https://github.com/ayato-p/intro-web-clojure/commit/3567218b62d6d9445c7ca8e5cc3ced5133a8166c>`_

Heroku に Leiningen プロジェクトを push すると自動的に ``lein uberjar`` を実行して Procfile に記述したようにコマンドを実行してくれます。ここまで出来たらターミナルから次のように実行します( Heroku のアカウントがあって `Heroku client <https://toolbelt.heroku.com/>`_ がインストールされている前提です)。

.. sourcecode:: shell

  $ heroku login
  $ heroku create your-name-todo-clj
  $ heroku git:remote -a your-name-todo-clj
  $ heroku addons:create heroku-postgresql:hobby-dev --app your-name-todo-clj
  $ heroku config:set db=`heroku config:get DATABASE_URL`
  $ git push heroku master

Heroku へ ``your-name-todo-clj`` としてデプロイしました(アプリケーション名は適宜自分で付けてください/誰かと重複するとデプロイ出来ないため)。全てターミナルで操作しましたが、勿論ブラウザからダッシュボードで設定しても構いません。ここまで問題なく実行出来たら、 ``heroku open`` とターミナルから実行しブラウザでアプリケーションを開いてみましょう。ブラウザから TODO の追加や削除が出来たら成功です。

これまでの Part を全部読んできた方はお疲れ様でした。これで 0 から作った TODO アプリをデプロイすることが出来ました。次の Part からはこれまで使ってきたライブラリをもっと便利なものに差し替えたり、ユーザー管理機能を付け加えたり、この Part でスキップしたデータベースマイグレーションについて触れていきます。

ここまでで学んだこと
====================

* Clojure で作った Web アプリケーションのデプロイ方法について
* Heroku へのデプロイ方法
