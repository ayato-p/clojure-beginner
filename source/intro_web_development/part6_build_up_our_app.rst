================================
 Part6: TODO アプリを組み上げる
================================

TODO アプリとして足りない機能
=============================

これまでのところでは基本的に「 TODO の表示」部分だけに絞って実装してきましたが、これを TODO アプリと呼ぶのは少々厳しいでしょう。なので、この Part では TODO アプリとして必要そうな機能を追加していきましょう。足りない機能は次のようになると思います。

* TODO の追加
* TODO の更新
* TODO の削除
* TODO の詳細表示

このくらいは最低でも欲しいところですよね。他にもユーザー管理などという機能も追加したいところですが、それらは後の Part に譲るとして今回は上述した機能を作りこんでいきたいと思います。

TODO の追加画面を作る
===================

今までも TODO の追加は REPL を使えば TODO の追加は出来ました。ですが、 REPL だけからしか追加出来ないというのは少々不便なのでそれようの画面を作りましょう。ここで実装するのはハンドラーとビューの部分になりますが、先にビューを作ります。

.. sourcecode:: clojure

  ;; src/todo_clj/view/todo.clj
  (ns todo-clj.view.todo
    (:require [hiccup.form :as hf] ;; hiccup.form を追加
              [todo-clj.view.layout :as layout]))

  (defn todo-new-view [req]
    (->> [:section.card
          [:h2 "TODO 追加"]
          (hf/form-to
           [:post "/todo/new"]
           [:input {:name :title :placeholder "TODO を入力してください"}]
           [:button.bg-blue "追加する"])]
         (layout/common req)))

新しく ``hiccup.form`` ネームスペースを ``todo-clj.view.todo`` に ``require`` しました。今回は ``hiccup.form/form-to`` のみを使用することにします。この関数はフォームを簡単に定義できるようになっていて、第一引数として渡している ``[:post "/todo/new"]`` のひとつめの要素がメソッド、ふたつめの要素がアクションとなっていて、残りは通常通り Hiccup の記法で書かれたデータを受け取ります。第一引数の手前にマップを指定することでフォームの属性を追加していすることが出来ますが、ここでは必要無いので省略します。

次にこの画面を表示するためにハンドラー ``todo-clj.handler.todo/todo-new`` を修正しましょう。 Part3 でルーティングの定義をしていたのでそこに肉付けしていく形をとります。

.. sourcecode:: clojure

  ;; src/todo_clj/handler/todo.clj
  (defn todo-new [req]
    (-> (view/todo-new-view req)
        res/response
        res/html))

ほとんど ``todo-index`` と同じですね。早速 ``http://localhost:3000/todo/new`` をブラウザで確認してみましょう。 TODO 追加画面が確認できましたね。これで適当な値を入力してボタンを押すと ``"TODO new post"`` と書かれた画面に飛んでしまいますが、これはまだ POST の処理を扱うハンドラー ``todo-clj.handler.todo/todo-new-post`` の中身を書いていないからですね。早速書いてみます。

ひとつ忘れてました。これは POST を扱うハンドラーでここまでで一度も取り扱ってないので、どうやって値が飛んでくるのか分からないですよね。ちょっと確認してみましょう。まずは次のように ``todo-new-post`` を実装してみます。

.. sourcecode:: clojure

  ;; src/todo_clj/handler/todo.clj
  (defn todo-new-post [req]
    (-> (pr-str req)
        res/response
        res/html))

``pr-str`` 関数でリクエストマップを文字列化して、画面に出すようにしました。このまま先ほどと同じように画面から POST 処理を行ってみます。すると以下のような出力を得ることが出来ます。

.. sourcecode:: clojure

  {:ssl-client-cert nil, :protocol "HTTP/1.1", :remote-addr "127.0.0.1", :params {}, :route-params {}, :headers {"accept" "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8", "user-agent" "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:41.0) Gecko/20100101 Firefox/41.0", "referer" "http://localhost:3000/todo/new", "connection" "keep-alive", "host" "localhost:3000", "accept-language" "en-US,en;q=0.5", "accept-encoding" "gzip, deflate", "content-length" "10", "content-type" "application/x-www-form-urlencoded"}, :server-port 3000, :content-length 10, :compojure/route [:post "/new"], :content-type "application/x-www-form-urlencoded", :path-info "/new", :character-encoding nil, :context "/todo", :uri "/todo/new", :server-name "localhost", :query-string nil, :body #object[org.eclipse.jetty.server.HttpInputOverHTTP 0x56833ace "HttpInputOverHTTP@56833ace"], :scheme :http, :request-method :post}

``test`` という TODO を追加したのですが、どうやらパッと見で人が読める文字列にはなっていなさそうです。ここで Ring のリクエストマップのおさらいですが、リクエストマップの中には ``:body`` キーがあってこれはリクエストボディがある場合に ``InputStream`` が送られてくるようになっています。今回のマップの中にもどうやら ``:body`` キーがあるのでこれを読み込んで文字列にしてみましょう。 ``todo-new-post`` を次のように編集します。

.. sourcecode:: clojure

  ;; src/todo_clj/handler/todo.clj
  (defn todo-new-post [req]
    (-> (pr-str (slurp (:body req) :encoding "utf-8"))
        res/response
        res/html))

こう修正した後に再度実行すると次のような出力を得ることが出来ました。

.. sourcecode:: clojure

  "title=test"

``test`` と入力したのでこれで良さそうですね。これをパースしたりするのは少々大変なので Ring のユーティリティを使ってみましょう。

.. sourcecode:: clojure

  ;; src/todo_clj/handler/todo.clj
  (defn todo-new-post [req]
    (let [body (slurp (:body req) :encoding "utf-8")
          params (ring.util.codec/form-decode body "utf-8")]
      (-> (pr-str (get params "title"))
          res/response
          res/html)))

これを実行すると以下のような出力が得られることが出来たと思います。

.. sourcecode:: clojure

  "test"

このように目的の値を取得出来たのはいいですが、これを毎回書かないといけないのは少々手間なので既に用意されているミドルウェアを使ってこの問題を解決しましょう。 ``todo-clj.core`` ネームスペースを修正して ``ring.middleware.params`` ネームスペースを追加します。

.. sourcecode:: clojure

  ;; src/todo_clj/core.clj
  (ns todo-clj.core
    (:require [compojure.core :refer [routes]]
              [environ.core :refer [env]]
              [ring.adapter.jetty :as server]
              [ring.middleware.keyword-params :as keyword-params] ;; 追加
              [ring.middleware.params :as params] ;; 追加
              [ring.middleware.resource :as resource]
              [todo-clj.handler.main :refer [main-routes]]
              [todo-clj.handler.todo :refer [todo-routes]]
              [todo-clj.middleware :refer [wrap-dev]]))

  (def app
    (-> (routes
         todo-routes
         main-routes)
        (wrap wrap-dev (:dev env))
        (wrap resource/wrap-resource "public")
        (wrap keyword-params/wrap-keyword-params true) ;; 追加
        (wrap params/wrap-params true))) ;; 追加

``ring.middleware.params/wrap-params`` はさっきまでのコードと同様にリクエストマップからフォームのデータをパースしてリクエストマップの ``:params`` にマップしてくれるものです。フォームのデータ以外にも URI のクエリ文字列からもデータを取得してマップしてくれるので今後の開発においても期待できる機能です。

それから気付いているとおもいますが ``ring.middleware.params`` 以外にも追加しているミドルウェアがあります。リクエストマップの ``:params`` のキーにマップされているマップデータはキーが文字列なのでそれをキーワードに変換するためのミドルウェアですね。このミドルウェアはリクエストマップの ``:params`` キーに対してのみ働くため、 ``ring.middleware.params/wrap-params`` より前に実行してしまっては意味がないため適用する順番には気をつける必要があります。

ここまで出来たら ``todo-new-post`` を以下のように修正して改めて確認してみます。

.. sourcecode:: clojure

  ;; src/todo_clj/handler/todo.clj
  (defn todo-new-post [{:as req :keys [params]}] ;; 分配束縛で ``:params`` を取り出してしまうと操作が楽です
    (-> (pr-str (:title params))
        res/response
        res/html))

``"test"`` (もしくはあなたが入力した値)と画面に出たなら成功です。これを元にデータベースに TODO を追加する処理を足しましょう。

.. sourcecode:: clojure

  ;; src/todo_clj/handler/todo.clj
  (defn todo-new-post [{:as req :keys [params]}]
    (when (todo/save-todo (:title params))
      (-> (view/todo-complete-view req)
          res/response
          res/html)))

``todo-clj.db.todo/save-todo`` を実行して正常に実行できた場合には完了画面を出力するようにしました。完了画面については以下のような定義にしました。

.. sourcecode:: clojure

  ;; src/todo_clj/view/todo.clj
  (defn todo-complete-view [req]
    (->> [:section.card
          [:h2 "TODO を追加しました!!"]]
         (layout/common req)))

* `commit: TODO の追加画面作成 + 少しだけビューいじりました <https://github.com/ayato-p/intro-web-clojure/commit/a7be051ef75783a2547714bebb431dbbbcc73846>`_

ここまでで追加画面が出来ました。しかし、気付いているかもしれませんが、これは不完全です。 CSRF 対策や入力のバリデーションができていませんし、もし DB への保存が失敗した場合なども考慮されていません。これらについては他の画面の実装が終わったところで触れていきたいと思います。

TODO の詳細画面を作る
=========================

TODO を新規作成出来るようになったわけですが、出来れば TODO 詳細画面を表示したい気がしますね。なので新規作成した後は追加した TODO の詳細画面を表示するようにしましょう。

まずは TODO を 1 件だけ取得する関数を作ります。

.. sourcecode:: clojure

  ;; src/todo_clj/db/todo.clj
  (defn find-first-todo [id]
    (first (jdbc/query db/db-spec ["select * from todo where id = ?" id])))

``clojure.java.jdbc/query`` 関数は必ずシーケンスを返すのでこのように 1 件だけしか結果を返さないクエリでも ``first`` 関数などを使って先頭要素を取り出してあげる必要があります。実際にこの関数は以下のように動作します。

.. sourcecode:: clojure

  todo-clj.db.todo> (find-first-todo 1)
  ;; => {:id 1, :title "朝ごはんを作る"}
  todo-clj.db.todo> (find-first-todo 2)
  ;; => {:id 2, :title "燃えるゴミを出す"}
  todo-clj.db.todo> (find-first-todo 999)
  ;; => nil

存在しない ID を指定した場合(検索結果が 0 件)、 ``nil`` を返却します。

さて、データベースから TODO を取得する処理は出来たので今度は表示をなんとかしましょう。

.. sourcecode:: clojure

  ;; src/todo_clj/handler/todo.clj
  (defn todo-show [{:as req :keys [params]}]
    (if-let [todo (todo/find-first-todo (Long/parseLong (:todo-id params)))]
      (-> (view/todo-show-view req todo)
          res/response
          res/html)))

``params`` から ``:todo-id`` キーの値を取得していますが、これは Compojure のルーティング定義部分で指定していたルートパラメーターですね。 Compojure のルートをリクエストマップが通るときに、自動的にルートパラメーターが ``:params`` にマップされているマップデータへと追加されます。そして、これは文字列の値なので数値へと変換する必要があります。

指定されたルートパラメーターを取得して TODO を検索するわけですが、 URI を手動で入力されたりする場合は該当する TODO が存在しない可能性があるので ``if-let`` を使って分岐しますが、エラー処理については後述するのでここではその部分について言及を避けます。

ビュー部分に関しては TODO のタイトルを表示するだけにしたいので次のようにします。

.. sourcecode:: clojure

  ;; src/todo_clj/view/todo.clj
  (defn todo-show-view [req todo]
    (->> [:section.card
          [:h2 (:title todo)]]
         (layout/common req)))

ここまで実装出来たら ``http://localhost:3000/todo/1`` と入力して、 TODO の 1 件目が表示されているのが確認出来たら最後に TODO 作成後にこの画面にリダイレクトするように変更しましょう。まずはリダイレクト用のユーティリティ関数を ``todo-clj.util.response`` ネームスペースに追加します。

.. sourcecode:: clojure

  ;; src/todo_clj/util/response.clj
  (def redirect #'res/redirect)
  (alter-meta! #'redirect #(merge % (meta #'res/redirect)))

``response`` 関数と同じように ``redirect`` 関数を持ってきます。 ``todo-clj.handler.todo/todo-new-post`` を修正して次のようにします。

.. sourcecode:: clojure

  ;; src/todo_clj/handler/todo.clj
  (defn todo-new-post [{:as req :keys [params]}]
    (if-let [todo (first (todo/save-todo (:title params)))]
      (-> (res/redirect (str "/todo/" (:id todo)))
          res/html)))

これで TODO を追加したら自動的に詳細画面へとリダイレクトされるようになりました。ただ、いきなり詳細画面が出されても嬉しくないのでちょっとしたアラートが TODO を追加した直後の詳細画面でのみ表示されるようにしましょう。 Rails や他のフレームワークでいう flash 機能を使いたいので、例によってこれをミドルウェアで実現します。まずはいつも通り ``todo-clj.core`` ネームスペースを修正して、ミドルウェアを追加します。

.. sourcecode:: clojure

  ;; src/todo_clj/core.clj
  (ns todo-clj.core
    (:require [compojure.core :refer [routes]]
              [environ.core :refer [env]]
              [ring.adapter.jetty :as server]
              [ring.middleware.flash :as flash] ;; 追加
              [ring.middleware.keyword-params :as keyword-params]
              [ring.middleware.params :as params]
              [ring.middleware.resource :as resource]
              [ring.middleware.session :as session] ;; 追加
              [todo-clj.handler.main :refer [main-routes]]
              [todo-clj.handler.todo :refer [todo-routes]]
              [todo-clj.middleware :refer [wrap-dev]]))

  (def app
    (-> (routes
         todo-routes
         main-routes)
        (wrap wrap-dev (:dev env))
        (wrap resource/wrap-resource "public")
        (wrap keyword-params/wrap-keyword-params true)
        (wrap params/wrap-params true)
        (wrap flash/wrap-flash true) ;; 追加
        (wrap session/wrap-session true))) ;; 追加

``ring.middleware.flash`` と ``ring.middleware.session`` を足しました。これらはレスポンスマップに対して修正を加えるミドルウェアですが、それぞれ flash ミドルウェアはレスポンスマップに ``:flash`` というキーがある場合に、次のリクエストマップに対して ``:flash`` キーでコンテンツを追加します。 session ミドルウェアは flash ミドルウェアと同様に ``:session`` というキーで同じ動作をします。また ``ring.middleware.flash`` は ``ring.middleware.session`` に依存しているので、適用する順番には気をつける必要があります。

次に ``todo-new-post`` 関数を少し修正します。

.. sourcecode:: clojure

  ;; src/todo_clj/handler/todo.clj
  (defn todo-new-post [{:as req :keys [params]}]
    (if-let [todo (first (todo/save-todo (:title params)))]
      (-> (res/redirect (str "/todo/" (:id todo)))
          (assoc :flash {:msg "TODO を正常に追加しました。"}) ;; 追加
          res/html)))

レスポンスマップ( ``redirect`` 関数はレスポンスマップを返却する)の ``:flash`` キーにマップデータを追加します。このようにして追加された flash データはビューで次のように利用します。

.. sourcecode:: clojure

  ;; src/todo_clj/view/todo.clj
  (defn todo-show-view [req todo]
    (->> [:section.card
          (when-let [{:keys [msg]} (:flash req)] ;; リクエストマップに ``:flash`` があればそれをアラートとして表示される
            [:div.alert.alert-success [:strong msg]])
          [:h2 (:title todo)]]
         (layout/common req)))

* `commit: TODO 詳細画面の作成とミドルウェアを幾つか追加 <https://github.com/ayato-p/intro-web-clojure/commit/16c832d21b8753d95ad3bb605a337aadfb338695>`_

早速、 ``http://localhost:3000/todo/new`` から新しい TODO を追加してみて、アラートが正常に表示されることを確認します。出来たら次に進みましょう。あ、 ``todo-complete-view`` 関数は使わなくなったので削除してしまっても問題ありません。

TODO の編集画面を作る
=====================

追加して、詳細画面を表示出来るようになったら今度は既にある TODO を更新出来るようにしたいですよね(今のところ TODO のタイトルしか作成出来ないのでそうでもない?)。早速書いていきます。

ブラウザで ``http://localhost:3000/todo/1/edit`` にアクセスすると素っ気ない文字列が出てくる状態だと思うので、さっとハンドラーを修正してビューも作成してしまいましょう。

.. sourcecode:: clojure

  ;; src/todo_clj/handler/todo.clj
  (defn todo-edit [{:as req :keys [params]}]
    (if-let [todo (todo/find-first-todo (Long/parseLong (:todo-id params)))]
      (-> (view/todo-edit-view req todo)
          res/response
          res/html)))

.. sourcecode:: clojure

  ;; src/todo_clj/view/todo.clj
  (defn todo-edit-view [req todo]
    (let [todo-id (get-in req [:params :todo-id])]
      (->> [:section.card
            [:h2 "TODO 編集"]
            (hf/form-to
             [:post (str "/todo/" todo-id "/edit")]
             [:input {:name :title :value (:title todo)
                      :placeholder "TODO を入力してください"}]
             [:button.bg-blue "更新する"])]
           (layout/common req))))

こんな感じで編集画面を作りました。ほとんど、 ``todo-new`` や ``todo-show`` で書いたようなコードなので改めて説明する必要はあまりないと思います。これで ``http://localhost:3000/todo/1/edit`` にアクセスすると追加画面と似たような(というかほぼ同じ)画面が見えるようになっていますが、ここに何か入力して「更新する」ボタンお押してもまた素っ気ない文字列が出てくるだけです。次は POST 処理を書いてあげる必要がありますね。先にデータベースへ更新をかける関数を書きます。

.. sourcecode:: clojure

  ;; src/todo_clj/db/todo.clj
  (defn update-todo [id title]
    (jdbc/update! db/db-spec :todo {:title title} ["id = ?" id]))

実際に更新出来るか REPL でこれを試してみましょう。

.. sourcecode:: clojure

  todo-clj.db.todo> (update-todo 1 "夜ご飯を食べる")
  ;; => (1)
  todo-clj.db.todo> (update-todo 9999 "ラザニアを作る")
  ;; => (0)

前の Part で説明したように ``clojure.java.jdbc/update!`` 関数は更新件数を返すので、更新件数が 0 だったら更新する対象がなかったみなすことが出来そうです。これを使って実際の POST 処理を書くと次のようになります。

.. sourcecode:: clojure

  ;; src/todo_clj/handler/todo.clj
  (defn todo-edit-post [{:as req :keys [params]}]
    (let [todo-id (Long/parseLong (:todo-id params))]
      (if (pos? (first (todo/update-todo todo-id (:title params))))
        (-> (res/redirect (str "/todo/" todo-id))
            (assoc :flash {:msg "TODO を正常に更新しました"})
            res/html))))

* `commit: TODO の更新画面を作成した <https://github.com/ayato-p/intro-web-clojure/commit/95f9fa5e193784cc30bc44ea2674e8b78611c247>`_

``pos?`` で更新件数が 1 件以上であることを確かめています。もし更新件数が 1 件以上であれば(期待値としては 1 件しかないはずですが)正常に更新処理を出来たということなので追加処理のとき同様リダイレクトして詳細画面を表示させましょう。ここまで書いたら ``http://localhost:3000/todo/1/edit`` から更新して詳細画面が出ることを確認しましょう。

TODO の削除画面を作る
=====================

さて、追加、表示、更新ときたので最後の削除画面を作りましょう。
