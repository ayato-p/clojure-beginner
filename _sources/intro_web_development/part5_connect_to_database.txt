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

* `commit: jdbc を依存関係へと追加 <https://github.com/ayato-p/intro-web-clojure/commit/9137db1ae66238cc3cea7b455a4ac94bc9bbc84d>`_

``clojure.java.jdbc`` と今回は PostgreSQL を使うのでそのためのドライバを追加しています。 PostgreSQL で ``todo_clj_dev`` という名前のデータベースを作成したら、実際に clojure.java.jdbc の主な機能を見て行きましょう。

.. sourcecode:: clojure

  user> (require '[clojure.java.jdbc :as jdbc])
  ;; => nil
  user> (def db-spec {:dbtype "postgresql" :dbname "todo_clj_dev" :host "localhost" :port 5432 :user "username" :password "password"})
  ;; => #'user/db-spec

まずは ``clojure.java.jdbc`` を ``require`` しないことには始まりませんのでいつものように ``require`` しておきます。次に ``db-spec`` ですが、これはコネクションを作成するのに必要な情報をマップ形式で渡します。
このマップは通常他のライブラリでも `dbspec` と呼ばれ、多くの場合次のフォーマットに従います。

.. sourcecode:: clojure

  (def db-spec {:subprotocol "postgresql"
                :subname "//localhost:5432/dbname"
                :user "username"          ;; オプション
                :password "password"})    ;; オプション

次の例のようにより読みやすいフォーマットで記述することも出来ます。

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

テーブル作成、データの追加ときたので次は更新についてです。更新は ``clojure.java.jdbc/update!`` 関数を使いますが、追加に比べるとちょっと複雑です(最後の引数のところだけ)。

.. sourcecode:: clojure

  user> (jdbc/update! db-spec :member {:age 24} ["id = ?" 1])
  ;; => (1)

第一引数はこれまでと同様 ``db-spec`` 、第二引数にはテーブル名、第三引数にアップデートするデータのマップ、第四引数には SQL の where 句を Prepared Statement の書き方で書きます。 clojure.java.jdbc での Prepared Statement の書き方ですが、ベクタの先頭を文字列にしてクエリパラメーターを使って置換したい部分を ``?`` と表現し、ベクタの残りは置換文字 (``?``) を置き換えるクエリパラメータを書きます。この書き方はデータを取得する場合などにも使いますし、他のライブラリでもこの書き方と互換性をもたせていることが多いです。ちなみにこの書式は `sqlvec` フォーマットと呼ばれることが多いため、このドキュメントでもそれに倣います。

この例では member テーブルの id が 1 になっているカラムの age を 24 にするという風に読めますね。そして、 ``udpate!`` 関数は更新件数を返すのでここでは 1 が返ってきています。第三引数のマップは勿論複数のカラムを指定できるので例えば、 ``{:age 25 :address "Tokyo"}`` などと書くことも可能です。

次はデータの取得ですが、これは ``clojure.java.jdbc/query`` 関数を使います。他の ``insert!`` や ``update!`` にはエクスクラメーションマークが付いていましたが、 ``query`` は破壊的な操作ではないので付いていません。

.. sourcecode:: clojure

  user> (jdbc/query db-spec "select * from member")
  ;; => ({:id 2, :name "foo", :age nil, :address nil} {:id 3, :name "alice", :age nil, :address "wonderland"} {:id 4, :name "cheshire", :age nil, :address nil} {:id 5, :name "mad hatter", :age nil, :address nil} {:id 7, :name "alice", :age nil, :address "wonderland"} {:id 8, :name "cheshire", :age nil, :address nil} {:id 9, :name "mad hatter", :age nil, :address nil} {:id 1, :name "ayato_p", :age 24, :address nil})
  user> (jdbc/query db-spec ["select * from member where id = ?" 1])
  ;; => ({:id 1, :name "ayato_p", :age 24, :address nil})
  user> (jdbc/query db-spec ["select * from member where id = ?" 2])
  ;; => ({:id 2, :name "foo", :age nil, :address nil})

第一引数に ``db-spec`` 、第二引数に文字列または sqlvec フォーマットのベクタを指定します。 clojure.java.jdbc は自動的に取得したデータの各行をマップデータへと変換し、カラムの型に対応する Clojure の型へと自動的に変換されます。低レベルな API とはいえ、これだけでも充分使うことが出来そうですね。

最後にテーブルの削除を行ってみます。

.. sourcecode:: clojure

  user> (jdbc/db-do-commands db-spec (jdbc/drop-table-ddl :member))
  ;; => (0)
  user> (jdbc/query db-spec "select * from member")
  ;; => PSQLException ERROR: relation "member" does not exist

``create-table-ddl`` の対になる関数 ``drop-table-ddl`` を使ってテーブルを削除する SQL を生成します。あまり説明する必要がないとは思いますが、 ``drop-table-ddl`` は第一引数にテーブル名を受け取ります。
テーブルを削除した後にデータを取得しようとすると例外が投げられるのでちゃんとテーブルが削除されているのが確認できますね。

ここまでで clojure.java.jdbc についての簡単な使い方が大凡理解出来たと思います。他にもトランザクション制御など本格的なアプリケーションを作るときに必要になる機能はありますが、ここでは一旦忘れて次に進みましょう。

TODO をデータベースで管理する
=============================

ちょっと前置きが長くなりましたが、ここからは今までファイルにベタ書きされていた TODO リストをデータベースへ投入します。まずはテーブルを用意しないといけないので、簡単に作ります。

``todo-clj.db`` ネームスペースを作って ``db-spec`` と ``migrate`` 関数を用意しましょう。

.. sourcecode:: clojure

  ;; src/todo_clj/db.clj
  (ns todo-clj.db
    (:require [clojure.java.jdbc :as jdbc]))

  (def db-spec
    {:dbtype "postgresql" :dbname "todo_clj_dev" :host "localhost" :port 5432 :user "username" :password "password"})

  (defn migrate []
    (jdbc/db-do-commands
     db-spec
     (jdbc/create-table-ddl :todo [:id :serial] [:title :varchar])))

* `commit: ネームスペース todo-clj.db を新規作成 <https://github.com/ayato-p/intro-web-clojure/commit/f978e6c43ee4c8a5476d87a640be06648477080b>`_

ここまで用意出来たら、 REPL で次のように実行しましょう。

.. sourcecode:: clojure

  user> (in-ns 'todo-clj.db)
  ;; => #object[clojure.lang.Namespace 0x63a58525 "todo-clj.db"]
  todo-clj.db> (migrate)
  ;; => (0)

かなり雑な ``migrate`` 関数なのでロールバックや再マイグレートが出来ませんが、当面はこれで充分でしょう。これで TODO テーブルが作成出来たので次はデータを追加したり取得する関数を作成しましょう。

これも新たに ``todo-clj.db.todo`` ネームスペースを作成します。

.. sourcecode:: clojure

  ;; src/todo_clj/db/todo.clj
  (ns todo-clj.db.todo
    (:require [clojure.java.jdbc :as jdbc]
              [todo-clj.db :as db]))

  (defn save-todo [title]
    (jdbc/insert! db/db-spec :todo {:title title}))

  (defn find-todo-all []
    (jdbc/query db/db-spec "select * from todo"))

* `commit: TODO をデータベースで管理するためのネームスペースを追加 <https://github.com/ayato-p/intro-web-clojure/commit/f106b4a33a87ad3d586ed32df96adc48c5a7e881>`_

簡単に TODO 追加と全件取得用関数を用意しました。実際に REPL を使って試してみましょう。

.. sourcecode:: clojure

  user> (in-ns 'todo-clj.db.todo)
  ;; => #object[clojure.lang.Namespace 0xb6423de "todo-clj.db.todo"]
  todo-clj.db.todo> (save-todo "朝ごはんを作る")
  ;; => ({:id 1, :title "朝ごはんを作る"})
  todo-clj.db.todo> (find-todo-all)
  ;; => ({:id 1, :title "朝ごはんを作る"})

TODO を追加して、それを取得することも出来ました。更新や削除は後から必要になったときに足すとして、とりあえずこれで TODO をデータベースで管理することが出来そうです。

ハンドラーから呼び出して画面に TODO を表示する
==============================================

次はハンドラーから実際にこれらの関数を呼び出して画面から TODO を追加したり、表示出来るようにします。

``todo-clj.handler.todo`` ネームスペースを次のように編集します。

.. sourcecode:: clojure

  ;; src/todo_clj/handler/todo.clj
  (ns todo-clj.handler.todo
    (:require [compojure.core :refer [defroutes context GET POST]]
              [todo-clj.db.todo :as todo] ;; 作ったネームスペースを追加
              [todo-clj.util.response :as res]
              [todo-clj.view.todo :as view]))

  (defn todo-index [req]
    (let [todo-list (todo/find-todo-all)] ;; ベタ書きしてた `todo-list` をデータベースから取得するように変更
      (-> (view/todo-index-view req todo-list)
          res/response
          res/html)))

* `commit: TODO をデータベースから取得して画面に出力出来るよう変更 <https://github.com/ayato-p/intro-web-clojure/commit/e65fa22ad512ae28de8ab05d678caec44e60c52f>`_

今までこのネームスペースにベタ書きしていた ``todo-list`` を削除して、 ``todo-index`` 関数のなかで全ての TODO を取得するようにしました。データの形式は前から変わっていないのでこれだけの変更でデータベースの中身を画面へと出力することが出来るようになっています。実際にブラウザで ``http://localhost:3000/todo`` へとアクセスして確認してみると先ほど REPL から追加した TODO が表示されるようになっていると思います。 TODO を増やしたい場合は REPL から ``todo-clj.db.todo/save-todo`` を使えば増やすことが出来ます。

ここまでの Part でなんとなく Web アプリケーションぽいものが作れるようになりました。次の Part ではこれまでの内容を活かして TODO アプリを完成させていこうと思います。

ここまでで学んだこと
====================

* clojure.java.jdbc の使い方
* データベースから取得したデータを画面へ反映させる方法
