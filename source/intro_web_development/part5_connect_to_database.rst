===============================
 Part5: データベースへ接続する
===============================

データベースとこんにちわ
========================

Web アプリケーションを開発するときに、これがないと開発出来ないと言っても過言ではないデータベースですが、この Part では Clojure でどのようにしてデータベースへと接続してそれを扱うのかについて説明していきます。
Clojure には Java の JDBC をラップして Clojure から使いやすくした低レベルのライブラリがあるのでまずはそれを使っていきます。

.. sourcecode:: clojure

  :dependencies [[org.clojure/clojure "1.7.0"]
                 [ring "1.4.0"]
                 [compojure "1.4.0"]
                 [hiccup "1.0.5"]
                 [environ "1.0.1"]
                 [org.clojure/java.jdbc "0.4.2"]
                 [org.postgresql/postgresql "9.4-1205-jdbc42"]]

``clojure.java.jdbc`` と今回は PostgreSQL を使うのでそれを追加しています。 PostgreSQL で ``todo_clj_dev`` という名前のデータベースを作成したら、 REPL を再起動して以下のように REPL 上で評価してみましょう。

.. sourcecode:: clojure

  user> (require '[clojure.java.jdbc :as jdbc])
  ;; => nil
  user> (def db-spec {:dbtype "postgresql" :dbname "todo_clj_dev" :host "localhost" :port 5432 :user "username" :password "password"})
  ;; => #'user/db-spec
  user> (jdbc/db-do-commands db-spec (jdbc/create-table-ddl :member [:id :serial] [:name "varchar(20)" "not null"] [:age :int] [:address :varchar]))
  ;; => (0)
  user> (jdbc/insert! db-spec :member {:name "ayato_p"})
  ;; => ({:id 1, :name "ayato_p", :age nil, :address nil})
  user> (jdbc/insert! db-spec :member {:name "foo"})
  ;; => ({:id 2, :name "foo", :age nil, :address nil})
  user> (jdbc/query db-spec "select * from member")
  ;; => ({:id 1, :name "ayato_p", :age nil, :address nil} {:id 2, :name "foo", :age nil, :address nil})
  user> (jdbc/query db-spec ["select * from member where id = ?" 1])
  ;; => ({:id 1, :name "ayato_p", :age nil, :address nil})
  user> (jdbc/query db-spec ["select * from member where id = ?" 2])
  ;; => ({:id 2, :name "foo", :age nil, :address nil})
  user> (jdbc/db-do-commands db-spec (jdbc/drop-table-ddl :member))
  ;; => (0)
  user> (jdbc/query db-spec "select * from member")
  ;; => PSQLException ERROR: relation "member" does not exist

テーブルを作成、データのインサート、取得、テーブルの削除を行っていますが、そんなに難しくなさそうに見えますよね。少しずつ見て行きましょう。

.. sourcecode:: clojure

  user> (require '[clojure.java.jdbc :as jdbc])
  ;; => nil
  user> (def db-spec {:dbtype "postgresql" :dbname "todo_clj_dev" :host "localhost" :port 5433 :user "username" :password "password"})
  ;; => #'user/db-spec

まずは ``clojure.java.jdbc`` を require しないことには始まりませんのでいつものように require しておきます。次に ``db-spec`` ですが、これはコネクションを作成するのに必要な情報をマップ形式で渡します。
このマップは通常他のライブラリでも ``dbspec`` と呼ばれ、多くの場合次のフォーマットに従います。

.. sourcecode:: clojure

  (def db-spec {:subprotocol "postgresql"
                :subname "//localhost:5432/dbname"
                :user "username"          ;; オプション
                :password "password"})    ;; オプション

次の例のようにより読みやすいフォーマットで記述することも出来ます( REPL で試したのはこのフォーマットと同じです)。

.. sourcecode:: clojure

  (def db-spec {:dbtype "postgresql"
                :dbname "dbname"
                :host "localhost"      ;; オプション
                :port 5432             ;; オプション
                :user "username"       ;; オプション
                :password "password"}) ;; オプション

または文字列で URI フォーマットを使い記述することも出来ます。

.. sourcecode:: clojure

  (def db-spec "postgresql://username:password@localhost:5432/dbname")

他にも幾つかのフォーマットが使えますが、詳しくは ``clojure.java.jdbc/get-connection`` を参照してください。ほとんどの場合上記の 3 つを覚えておけば困ることはないと思います。

次はテーブルの作成についてです。



  user> (jdbc/db-do-commands db-spec (jdbc/create-table-ddl :member [:id :serial] [:name "varchar(20)" "not null"] [:age :int] [:address :varchar]))
  ;; => (0)
  user> (jdbc/insert! db-spec :member {:name "ayato_p"})
  ;; => ({:id 1, :name "ayato_p", :age nil, :address nil})
  user> (jdbc/insert! db-spec :member {:name "foo"})
  ;; => ({:id 2, :name "foo", :age nil, :address nil})
  user> (jdbc/query db-spec "select * from member")
  ;; => ({:id 1, :name "ayato_p", :age nil, :address nil} {:id 2, :name "foo", :age nil, :address nil})
  user> (jdbc/query db-spec ["select * from member where id = ?" 1])
  ;; => ({:id 1, :name "ayato_p", :age nil, :address nil})
  user> (jdbc/query db-spec ["select * from member where id = ?" 2])
  ;; => ({:id 2, :name "foo", :age nil, :address nil})
  user> (jdbc/db-do-commands db-spec (jdbc/drop-table-ddl :member))
  ;; => (0)
  user> (jdbc/query db-spec "select * from member")
  ;; => PSQLException ERROR: relation "member" does not exist
