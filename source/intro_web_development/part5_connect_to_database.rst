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
  user> (jdbc/update! db-spec :member {:age 24} ["id = ?" 1])
  ;; => (1)
  user> (jdbc/query db-spec "select * from member")
  ;; => ({:id 1, :name "ayato_p", :age 24, :address nil} {:id 2, :name "foo", :age nil, :address nil})
  user> (jdbc/query db-spec ["select * from member where id = ?" 1])
  ;; => ({:id 1, :name "ayato_p", :age 24, :address nil})
  user> (jdbc/query db-spec ["select * from member where id = ?" 2])
  ;; => ({:id 2, :name "foo", :age nil, :address nil})
  user> (jdbc/db-do-commands db-spec (jdbc/drop-table-ddl :member))
  ;; => (0)
  user> (jdbc/query db-spec "select * from member")
  ;; => PSQLException ERROR: relation "member" does not exist

テーブルを作成、データの追加、更新、取得、テーブルの削除を行っていますが、そんなに難しくなさそうに見えますよね。少しずつ見て行きましょう。

.. sourcecode:: clojure

  user> (require '[clojure.java.jdbc :as jdbc])
  ;; => nil
  user> (def db-spec {:dbtype "postgresql" :dbname "todo_clj_dev" :host "localhost" :port 5433 :user "username" :password "password"})
  ;; => #'user/db-spec

まずは ``clojure.java.jdbc`` を ``require`` しないことには始まりませんのでいつものように ``require`` しておきます。次に ``db-spec`` ですが、これはコネクションを作成するのに必要な情報をマップ形式で渡します。
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

.. sourcecode:: clojure

  user> (jdbc/db-do-commands db-spec (jdbc/create-table-ddl :member [:id :serial] [:name "varchar(20)" "not null"] [:age :int] [:address :varchar]))
  ;; => (0)

これはふたつのフォームが重なっているので、まずは ``clojure.java.jdbc/create-table-ddl`` から確認していきます。

.. sourcecode:: clojure

  user> (jdbc/create-table-ddl :member [:id :serial] [:name "varchar(20)" "not null"] [:age :int] [:address :varchar])
  ;; => "CREATE TABLE member (id serial, name varchar(20) not null, age int, address varchar)"

このようにこの関数は幾つかの引数を取り、文字列(テーブルを作成する DDL )を吐き出します。第一引数にテーブルの名前を文字列またはキーワードで指定し、第二引数以降はカラムについてのベクター形式で書いていきます(カラムの後にオプションでテーブルについてのオプションを付けることが出来ますが今回は簡単のために無視します)。カラムの表現としては ``[column-name type & options]`` というように表現することができ、それぞれキーワードもしくは文字列での指定が可能ですが、 ``[:name "varchar(20)" "not null"]`` の例にあるように桁数を指定したいような場合、型の指定はキーワードではなく文字列で記述する必要があります。気をつけないといけないのはこの関数自体は指定された値を元に文字列を生成するだけなので、あり得ない値を指定したとしても正常に文字列を返してしまうことです。エラーに気付き難いので気をつけましょう。

.. sourcecode:: clojure

  user> (jdbc/create-table-ddl :foo [:id :invalid-type])
  ;; => "CREATE TABLE foo (id invalid-type)"

次に ``clojure.java.jdbc/db-do-commands`` についてです。主に更新を伴う SQL を複数実行したい場合に使用します。これは第一引数に ``db-spec`` を指定し、第二引数にはトランザクションを有効にするかを決める真偽値を受け取り、第三引数以降に文字列で実行したい SQL コマンドを指定します。

.. sourcecode:: clojure

  user> (jdbc/db-do-commands db-spec (jdbc/create-table-ddl :member [:id :serial] [:name "varchar(20)" "not null"] [:age :int] [:address :varchar]))
  ;; => (0)

  user> (jdbc/db-do-commands db-spec "create table foo(id serial)" "create table bar(id serial)") ;; 直接文字列で SQL を渡すことも勿論出来ます。複数の SQL も同時に実行出来ます。
  ;; => (0 0)

「第二引数にはトランザクションを有効にするかを決める真偽値を受け取り」と書きましたが、この例ではすぐに DDL の文字列を渡しているように見えますね。実は第二引数は指定しないということも選択出来ます。第二引数として真偽値を渡さない場合トランザクションは自動的に有効になります。

ここまででテーブルの作成が出来たので次はデータを追加についてです。 ``clojure.java.jdbc/insert!`` を使います。

.. Sourcecode:: clojure

  user> (jdbc/insert! db-spec :member {:name "ayato_p"})
  ;; => ({:id 1, :name "ayato_p", :age nil, :address nil})
  user> (jdbc/insert! db-spec :member {:name "foo"})
  ;; => ({:id 2, :name "foo", :age nil, :address nil})
  user> (jdbc/insert! db-spec :member {:name "alice" :address "wonderland"} {:name "cheshire"} {:name "mad hatter"}) ;; 複数データを一度に追加することも可能
  ;; => ({:id 3, :name "alice", :age nil, :address "wonderland"} {:id 4, :name "cheshire", :age nil, :address nil} {:id 5, :name "mad hatter", :age nil, :address nil})
  user> (jdbc/insert! db-spec :member {:name nil})
  ;; => PSQLException ERROR: null value in column "name" violates not-null constraint

``insert!`` 関数は先程までと同様に ``db-spec`` を第一引数に受け取り、第二引数にテーブル名をキーワードもしくは文字列で受け取り、第三引数以降は少々複雑になるのですが今回は簡単のためマップデータのみを渡しています。例のようにカラム名をキーにしたマップを渡すことでそのデータを追加することができ、また複数のマップデータを渡すことにより、複数行を一度に追加することも出来るようになっています。不正なデータを渡した場合は実行時のエラーとなりエラーが返されます。

また複数データを同時に追加したい場合は次のように記述することも可能です。

.. sourcecode:: clojure

  user> (jdbc/insert! db-spec :member [:name :address] ["alice" "wonderland"] ["cheshire" nil] ["mad hatter" nil])
  ;; => (1 1 1)

第三引数として追加したいデータのカラムを列挙したベクターを渡し、第四引数以降に列挙したカラムの順番と対応するように値のみを入れたベクターを渡せます。こうすることで毎回カラム名を書く手間はなくなりましたが、その代わり ``null`` にしておきたいカラムに対しては明示的に ``nil`` を渡す必要があるようになりました。そして、返り値も追加した結果ではなく、更新件数が返ってくるようになっている点も注意が必要です。

テーブル作成、データの追加ときたので次は更新についてです。更新は追加に比べるとちょっと複雑です。

.. sourcecode:: clojure

  user> (jdbc/update! db-spec :member {:age 24} ["id = ?" 1])
  ;; => (1)

第一引数はこれまでと同様 ``db-spec`` 、第二引数にはテーブル名、第三引数にアップデートするデータのマップ、第四引数には SQL の where 句相当のものを







.. sourcecode:: clojure

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



  ``db-do-commands`` は内部的には ``executeBatch`` を使っているので複数の SQL を実行したい場合に有効で、今回のようにテーブルを作成したりするのにはちょうど良い
