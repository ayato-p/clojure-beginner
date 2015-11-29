================================
 Part6: TODO アプリを組み上げる
================================

TODO アプリとして足りない機能を作る
===================================

これまでのところでは基本的に「 TODO の表示」部分だけに絞って実装してきましたが、これを TODO アプリと呼ぶのは少々厳しいでしょう。なので、この Part では TODO アプリとして必要そうな機能を追加していきましょう。足りない機能は次のようになると思います。

* TODO の追加
* TODO の更新
* TODO の削除
* TODO の詳細表示

このくらいは最低でも欲しいところですよね。他にもユーザー管理などという機能も追加したいところですが、それらは後の Part に譲るとして今回は上述した機能を作りこんでいきたいと思います。

TODO の追加画面を作る
---------------------

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
---------------------

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
---------------------

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
---------------------

さて、追加、表示、編集ときたので最後の削除画面を作りましょう。これも難しくないので編集画面と同様さっくりやってしまいましょう。まずは ``http://localhost:3000/todo/1/delete`` でアクセスされたら削除するのか確認するような画面を作りましょう。

.. sourcecode:: clojure

  ;; src/todo_clj/handler/todo.clj
  (defn todo-delete [{:as req :keys [params]}]
    (if-let [todo (todo/find-first-todo (Long/parseLong (:todo-id params)))]
      (-> (view/todo-delete-view req todo)
          res/response
          res/html)))

.. sourcecode:: clojure

  ;; src/todo_clj/view/todo.clj
  (defn todo-delete-view [req todo]
    (let [todo-id (get-in req [:params :todo-id])]
      (->> [:section.card
            [:h2 "TODO 削除"]
            (hf/form-to
             [:post (str "/todo/" todo-id "/delete")]
             [:p "次の TODO を本当に削除しますか?"]
             [:p "*" (:title todo)]
             [:button.bg-red "削除する"])]
           (layout/common req))))

ここまでも大凡同じですね。次はデータベースから TODO を削除する処理を書きます。

.. sourcecode:: clojure

  ;; src/todo_clj/db/todo.clj
  (defn delete-todo [id]
    (jdbc/delete! db/db-spec :todo ["id = ?" id]))

これを REPL で試すとこうなります。

.. sourcecode:: clojure

  todo-clj.db.todo> (delete-todo 2)
  ;; => (1)
  todo-clj.db.todo> (delete-todo 2)
  ;; => (0)

これも更新関数と同様に更新件数を返します。なので、削除対象が 0 件の場合は 0 が返ってきます。最後に POST を処理する関数を書いたら完成です。

.. sourcecode:: clojure

  ;; src/todo_clj/db/todo.clj
  (defn todo-delete-post [{:as req :keys [params]}]
    (let [todo-id (Long/parseLong (:todo-id params))]
      (if (pos? (first (todo/delete-todo todo-id)))
        (-> (res/redirect "/todo")
            (assoc :flash {:msg "TODO を正常に削除しました"})
            res/html))))

削除したあとのリダイレクト先に TODO の一覧画面にします。一覧画面上にアラートを出したいので、一覧画面の方にも修正を加えます。

.. sourcecode:: clojure

  ;; src/todo_clj/handler/todo.clj
  (defn todo-index-view [req todo-list]
    (->> [:section.card
          (when-let [{:keys [msg]} (:flash req)]
            [:div.alert.alert-success [:strong msg]])
          [:h2 "TODO 一覧"]
          [:ul
           (for [{:keys [title]} todo-list]
             [:li title])]]
         (layout/common req)))

* `commit: TODO の削除画面を作成した <https://github.com/ayato-p/intro-web-clojure/commit/4686b0d8ac88a8ebda7669ae6c8384ae58aaf89b>`_

書けたら実際に ``http://localhost:3000/todo/1/delete`` から削除してみましょう。削除が成功していればここまでは大丈夫でしょう。

仕上げ
======

簡単に幾つかの画面を作ってきましたが、気付いていると思いますが各画面を行き来するためのリンクが欠けていたり、エラーハンドリングが出来ていなかったりとちょっと杜撰です。ということでアプリを仕上げていきましょう。

各画面をリンクさせる
--------------------

まずは今まで作った画面をリンクさせましょう。

.. sourcecode:: clojure

  ;; src/todo_clj/view/todo.clj
  (defn todo-index-view [req todo-list]
    (->> [:section.card
          (when-let [{:keys [msg]} (:flash req)]
            [:div.alert.alert-success [:strong msg]])
          [:h2 "TODO 一覧"]
          [:ul
           (for [{:keys [id title]} todo-list]
             [:li [:a {:href (str "/todo/" id)} title]])]]
         (layout/common req)))

TODO 一覧はそれぞれの TODO に詳細画面へといけるリンクを付けました。

.. sourcecode:: clojure

  ;; src/todo_clj/view/todo.clj
  (defn todo-show-view [req todo]
    (let [todo-id (:id todo)]
      (->> [:section.card
            (when-let [{:keys [msg]} (:flash req)]
              [:div.alert.alert-success [:strong msg]])
            [:h2 (:title todo)]
            [:a.wide-link {:href (str "/todo/" todo-id "/edit")} "修正する"]
            [:a.wide-link {:href (str "/todo/" todo-id "/delete")} "削除する"]]
           (layout/common req))))

詳細画面には編集と削除画面のそれぞれにいけるリンクを付けました。これでとりあえず URI 直接入力しないと各画面にいけないという問題は解消できました。それと CSS に少し書き足しています。

.. sourcecode:: css

  ;; resources/public/css/style.css
  a.wide-link {
      margin: 0 5px;
  }

* `commit: 画面間のリンクを作成 <https://github.com/ayato-p/intro-web-clojure/commit/e9d3aedbacb0563719d82d3bf7c4eec0535ba44c>`_

バリデーションを作る
--------------------

今までの状態では何も入力しないでも TODO を追加したり更新することができていました。出来ればちゃんとしたデータを入力してもらいたいので、入力がない場合入力画面へと再度誘導したいと思います。

これを実現するためにまずはバリデーションを簡単に行えるライブラリを導入しましょう。今回は bouncer というバリデーション用ライブラリを使うことにします。

.. sourcecode:: clojure

  ;; project.clj
  :dependencies [[org.clojure/clojure "1.7.0"]
                 [ring "1.4.0"]
                 [compojure "1.4.0"]
                 [hiccup "1.0.5"]
                 [environ "1.0.1"]
                 [org.clojure/java.jdbc "0.4.2"]
                 [org.postgresql/postgresql "9.4-1205-jdbc42"]
                 [bouncer "0.3.3"]] ;; new

いつものように依存関係に追加したら REPL を再起動して軽く試してみましょう。

.. sourcecode:: clojure

  user> (require '[bouncer.core :as b]
                 '[bouncer.validators :as v])
  ;; => nil
  user> (b/validate {:title ""}
                    :title v/required)
  ;; => [{:title ("title must be present")} {:title "", :bouncer.core/errors {:title ("title must be present")}}]
  user> (b/validate {:title "朝ごはんを作る"}
                    :title v/required)
  ;; => [nil {:title "朝ごはんを作る"}]
  user> (def todo-varidator {:title v/required})
  ;; => #'user/todo-varidator
  user> (b/validate {:title ""} todo-varidator)
  ;; => [{:title ("title must be present")} {:title "", :bouncer.core/errors {:title ("title must be present")}}]
  user> (b/valid? {:title "朝ごはんを作る"} todo-varidator)
  ;; => true

主に使うことになるのは ``bouncer.core/validate`` と ``bouncer.core/valid?`` だと思います。 ``bouncer.validators`` ネームスペースは幾つかの組み込みバリデーターを提供してくれます。使い方はなんとなくわかったと思うので早速これを私たちの TODO アプリに組み込んでみます。

まずは次のようなコードを考えてみます。

.. sourcecode:: clojure

  (def validator {:foo required})

  (defn new-handler [req]
    (do-something req))

  (defn new-post-handler [req]
    (with-fallback #(new-handler (assoc req :errors %))
      (let [params (validate (:params req) validator)]
        (do-something params))))

``new-post-handler`` で ``validate`` 関数を呼び出して、バリデーションエラーが発生したら予め登録しておいた匿名関数 ``#(new-handler (assoc :errors %))`` を呼び出し、再度 ``new-handler`` を実行する…こういう形でコードを書けたらいちいちバリデーションエラーのために ``if`` で条件分岐するとか冗長な処理を色んなところに書かなくて良くなりそうです。

早速上記のような処理が書くためにふたつのヘルパーを新しいネームスペースに定義してみます。

.. sourcecode:: clojure

  ;; src/todo_clj/util/validation.clj
  (ns todo-clj.util.validation
    (:require [bouncer.core :as b]))

  (defn validate [& args]
    (let [[errors org+errors] (apply b/validate args)]
      (if (nil? errors)
        org+errors
        (throw (ex-info "Validation error" errors)))))

  (defmacro with-fallback [fallback & body]
    `(try
       ~@body
       (catch clojure.lang.ExceptionInfo e#
         (~fallback (ex-data e#)))))

``todo-clj.util.validation`` ネームスペースを作ってそこに ``validate`` 関数と ``with-fallback`` マクロを定義しました。 ``validate`` 関数は ``bouncer.core/validate`` 関数をラップしたものですが、エラーがある場合にはバリデーションエラーの情報を含めた実行時例外を投げるようにしていて、エラーがない場合には ``validate`` 関数に渡されたマップ情報をそのまま返却するようにしています。 ``with-fallback`` は先に定義した ``validate`` 関数と対になるもので、第一引数として実行時例外が起こった場合に呼び出す関数を受け取り、あとは例外を起こしうるコードを渡すだけです。

.. sourcecode:: clojure

  todo-clj.util.validation> (def a-validator {:foo bouncer.validators/required})
  ;; => #'todo-clj.util.validation/a-validator
  todo-clj.util.validation> (with-fallback println (validate {:bar :baz} a-validator))
  ;; {:foo (foo must be present)}
  ;; => nil
  todo-clj.util.validation> (with-fallback println (validate {:foo :any} a-validator))
  ;; => {:foo :any}

こんな感じで使えるのでこれを踏まえて、ハンドラーにこれらを適用してみましょう。

.. sourcecode:: clojure

  ;; src/todo_clj/handler/todo.clj
  (ns todo-clj.handler.todo
    (:require [bouncer.validators :as v] ;; 追加
              [compojure.core :refer [defroutes context GET POST]]
              [todo-clj.db.todo :as todo]
              [todo-clj.util.response :as res]
              [todo-clj.util.validation :as uv] ;; 追加
              [todo-clj.view.todo :as view]))

  (def todo-validator {:title [[v/required :message "TODO を入力してください"]]}) ;; 必須入力という制限を設ける + 標準メッセージだと英語なので日本語に

  (defn todo-new-post [{:as req :keys [params]}]
    (uv/with-fallback #(todo-new (assoc req :errors %)) ;; エラーなら ``todo-new`` を呼び出す
      (let [params (uv/validate params todo-validator)]
        (if-let [todo (first (todo/save-todo (:title params)))]
          (-> (res/redirect (str "/todo/" (:id todo)))
              (assoc :flash {:msg "TODO を正常に追加しました。"})
              res/html)))))

  (defn todo-edit-post [{:as req :keys [params]}]
    (uv/with-fallback #(todo-edit (assoc req :errors %))
      (let [params (uv/validate params todo-validator)
            todo-id (Long/parseLong (:todo-id params))]
        (if (pos? (first (todo/update-todo todo-id (:title params))))
          (-> (res/redirect (str "/todo/" todo-id))
              (assoc :flash {:msg "TODO を正常に更新しました"})
              res/html)))))

ハンドラーに適用するとこのようになりました。そして `fallback` として設定した匿名関数の引数にはリクエストマップに ``:errors`` キーを追加してバリデーションエラーの結果を挿入します。追加された ``:errors`` キーの値をビュー側で呼び出して、エラーメッセージを表示させます。

.. sourcecode:: clojure

  ;; src/todo_clj/view/todo.clj
  (defn error-messages [req]
    (when-let [errors (:errors req)]
      [:ul
       (for [[k v] errors
             msg v]
         [:li.error-message msg])]))

  (defn todo-new-view [req]
    (->> [:section.card
          [:h2 "TODO 追加"]
          (hf/form-to
           [:post "/todo/new"]
           (error-messages req) ;; 追加
           [:input {:name :title :placeholder "TODO を入力してください"}]
           [:button.bg-blue "追加する"])]
         (layout/common req)))

  (defn todo-edit-view [req todo]
    (let [todo-id (get-in req [:params :todo-id])]
      (->> [:section.card
            [:h2 "TODO 編集"]
            (hf/form-to
             [:post (str "/todo/" todo-id "/edit")]
             (error-messages req) ;; 追加
             [:input {:name :title :value (:title todo)
                      :placeholder "TODO を入力してください"}]
             [:button.bg-blue "更新する"])]
           (layout/common req))))

* `commit: バリデーション機能の実装 <https://github.com/ayato-p/intro-web-clojure/commit/87548021f3a926da4dd23f049aa7f9c9e386e902>`_

``:errors`` がリクエストマップにある場合、それを展開してエラーメッセージのリストを表示するようにしました。ここまで出来たら追加か編集画面で何も入力せずにボタンを押してみましょう。また入力画面になってエラーメッセージが表示されたら成功です。

CSRF 対策する
-------------

バリデーション機能を実装したところで次は CSRF 対策もしましょう。 CSRF 対策とはなにかという話はしませんが、 CSRF 対策を怠るとどうなるか詳しく知らない人は「ぼくはまちちゃん騒動」など調べると良いと思います。

さて、この問題も ``ring-anti-forgery`` という Ring ミドルウェアを追加するだけで解決出来てしまうんですが、ここでちょっと ``todo-clj.core`` ネームスペースの ``app`` を確認してみます。

.. sourcecode:: clojure

  ;; src/todo_clj/core.clj
  (def app
    (-> (routes
         todo-routes
         main-routes)
        (wrap wrap-dev (:dev env))
        (wrap resource/wrap-resource "public")
        (wrap keyword-params/wrap-keyword-params true)
        (wrap params/wrap-params true)
        (wrap flash/wrap-flash true)
        (wrap session/wrap-session true)))

ミドルウェアがかなり増えてきてちょっと複雑になってきた気がするのでこれをまずはスマートにしましょう。独自で ``todo-clj.middleware/wrap-dev`` のような関数を作ってしまっても良いのですが、実は広く一般に使われているライブラリでこれらを統合しているものがあるのでそれを使いたいと思います。ライブラリの名前は `Ring-Defaults` です。依存関係へと追加します。

.. sourcecode:: clojure

  ;; project.clj
  :dependencies [[org.clojure/clojure "1.7.0"]
                 [ring "1.4.0"]
                 [compojure "1.4.0"]
                 [hiccup "1.0.5"]
                 [environ "1.0.1"]
                 [org.clojure/java.jdbc "0.4.2"]
                 [org.postgresql/postgresql "9.4-1205-jdbc42"]
                 [bouncer "0.3.3"]
                 [ring/ring-defaults "0.1.5"]] ;; <- New

REPL を再起動して早速導入しましょう、と言いたいところですがどんなライブラリがこれで使えるようになるのか理解していないと「とりあえずこれ追加すれば OK 」という風になってしまうので少しばかり遠回りして解説しましょう。

私たちがこれから使おうとしているミドルウェアは ``ring.middleware.defaults/wrap-defaults`` というもので、その全貌は以下のようになっています。

.. sourcecode:: clojure

  ;; in ring.middleware.defaults ns
  (defn wrap-defaults
    "Wraps a handler in default Ring middleware, as specified by the supplied
    configuration map.
    See: api-defaults
         site-defaults
         secure-api-defaults
         secure-site-defaults"
    [handler config]
    (-> handler
        (wrap wrap-anti-forgery     (get-in config [:security :anti-forgery] false))
        (wrap wrap-flash            (get-in config [:session :flash] false))
        (wrap wrap-session          (:session config false))
        (wrap wrap-keyword-params   (get-in config [:params :keywordize] false))
        (wrap wrap-nested-params    (get-in config [:params :nested] false))
        (wrap wrap-multipart-params (get-in config [:params :multipart] false))
        (wrap wrap-params           (get-in config [:params :urlencoded] false))
        (wrap wrap-cookies          (get-in config [:cookies] false))
        (wrap wrap-absolute-redirects (get-in config [:responses :absolute-redirects] false))
        (wrap wrap-resource         (get-in config [:static :resources] false))
        (wrap wrap-file             (get-in config [:static :files] false))
        (wrap wrap-content-type     (get-in config [:responses :content-types] false))
        (wrap wrap-default-charset  (get-in config [:responses :default-charset] false))
        (wrap wrap-not-modified     (get-in config [:responses :not-modified-responses] false))
        (wrap wrap-x-headers        (:security config))
        (wrap wrap-hsts             (get-in config [:security :hsts] false))
        (wrap wrap-ssl-redirect     (get-in config [:security :ssl-redirect] false))
        (wrap wrap-forwarded-scheme      (boolean (:proxy config)))
        (wrap wrap-forwarded-remote-addr (boolean (:proxy config)))))

`ring-defaults <https://github.com/ring-clojure/ring-defaults/blob/e86b1c033d52d460cd622064c29a943b5569dffe/src/ring/middleware/defaults.clj#L81>`_ より引用しましたが、今まで書いてきたコードと似たようなコードがあることに気付いたでしょうか。 `flash`, `session`, `params` などなど今まで必要に迫られて追加してきたものですが、今回欲しい `anti-forgery` ミドルウェアが入っているのも確認出来ます。さて、このミドルウェアですが第一引数にハンドラーを受け取るのは他と同様ですが、第二引数に設定をマップデータとして受け取るようです。ではその設定はいちいち自分で書かないといけないのかというとそうではなく、これも同じネームスペースにあるのでそれを使います。 ``secure-api-defaults``, ``api-defaults``, ``secure-site-defaults``, ``site-defaults`` とありますが、今回は ``side-defaults`` を使うことにしましょう。実際に使う場合は次のようになると思います。

.. sourcecode:: clojure

  (ns example.core
    (:require [ring.middleware.defaults :as defaults]))

  (defn handler [req]
    (do-something))

  (def app
    (defaults/wrap-defaults handler defaults/site-defaults))

またこの初期設定( ``site-defaults`` など)がこのまま使いたくない、気に入らないという場合はそれぞれただのマップデータなので書き換え可能です。例えばこんな風に。

.. sourcecode:: clojure

  (def my-defaults
    (assoc-in defaults/site-defaults [:security :anti-forgery] false))

  (def app
    (defaults/wrap-defaults handler my-defaults))

このように自分で何が必要かを選んで適用することが出来るのでテストのときは適用するミドルウェアを変更したいなどという要望に対応することが出来ます。実際にこの ``wrap-defaults`` ミドルウェアを私たちの TODO アプリへと適用します。

``todo-clj.middleware`` ネームスペースへ次のような ``middleware-set`` 関数を足します。

.. sourcecode:: clojure

  ;; src/todo_clj/middleware.clj
  (ns todo-clj.middleware
    (:require [environ.core :refer [env]]
              [ring.middleware.defaults :as defaults]))

  (def ^:private wrap #'defaults/wrap)

  (defn middleware-set [handler]
    (-> handler
        (wrap wrap-dev (:dev env))
        (defaults/wrap-defaults defaults/site-defaults)))

元々、 ``todo-clj.core`` で ``require`` していた environ もこちらに持ってきています。 ``wrap`` 関数は ``todo-clj.core`` で実装していたのを ``ring.middleware.defaults`` のものを使うようにしました。今まで ``todo-clj.core/app`` に対して色々なミドルウェアを ``middleware-set`` 関数で一旦受けてそれをあとで ``todo-clj.core/app`` に適用するということですね。それでは ``todo-clj.core`` も修正しましょう。

.. sourcecode:: clojure

  ;; src/todo_clj/core.clj
  (ns todo-clj.core
    (:require [compojure.core :refer [routes]]
              [ring.adapter.jetty :as server]
              [todo-clj.handler.main :refer [main-routes]]
              [todo-clj.handler.todo :refer [todo-routes]]
              [todo-clj.middleware :refer [middleware-set]]))

  (def app
    (middleware-set
     (routes
      todo-routes
      main-routes)))


色々と ``require`` していたものがなくなったので ``ns`` マクロがスッキリしました。また沢山のミドルウェアをスレッディングマクロで適用していた ``app`` もスッキリとしています。ここまで書き換えたらサーバーを再起動します。ミドルウェアを追加したりした場合は `reload` ミドルウェアでは解決出来ないことがあるのでサーバーを再起動する必要があります。

試しに TODO を追加してみましょう。

…ちゃんと "Invalid anti-forgery token" というメッセージを見ることが出来たでしょうか? `anti-forgery` ミドルウェアを追加したのでビューに `anti-forgery` ミドルウェアが提供するトークンを埋め込む必要があります。早速やってみましょう。

.. sourcecode:: clojure

  (ns todo-clj.view.todo
    (:require [hiccup.form :as hf]
              [ring.util.anti-forgery :refer [anti-forgery-field]] ;; `anti-forgery` ミドルウェアと一緒に提供されるユーティリティ
              [todo-clj.view.layout :as layout]))

  (defn todo-new-view [req]
    (->> [:section.card
          [:h2 "TODO 追加"]
          (hf/form-to
           [:post "/todo/new"]
           (anti-forgery-field) ;; 他の POST するフォームにも同じように追加
           (error-messages req)
           [:input {:name :title :placeholder "TODO を入力してください"}]
           [:button.bg-blue "追加する"])]
         (layout/common req)))

* `commit: Ring-Defaults ミドルウェアを追加 <https://github.com/ayato-p/intro-web-clojure/commit/23a10949232b2acceaca3171094333d01a68c9fd>`_

`Ring-Anti-Forgery` は ``ring.util.anti-forgery/anti-forgery-field`` という関数を提供しているので、基本的にこれを使えば問題なく POST 処理が出来るようになります。また、どうしても生のトークンが欲しい場合は ``ring.middleware.anti-forgery/*anti-forgery-token*`` を参照することで手に入れることが出来ます。

改めて TODO を追加しようとすると今度は成功するようになっていると思います。これで CSRF 対策が出来ました。とはいっても簡単にこれを確かめることが出来ないので効果が分かり難いですが、例えば Ajax で TODO を追加しようとすると弾かれます(もし、時間があって気になる方はミドルウェア適用前後で効果を確認してみましょう)。

エラーをうまく処理する
----------------------

これまでのプログラムではエラーに対する処理が欠けていました。例えば、更新処理のリクエストを投げたときに更新対象が削除されていたらどうするのかとか、編集しようと思って編集画面を開こうとしたときに更新対象が削除されていたらどうするのかとか、そういうケースに対して現在は何も対策をしていません。

試しに ``http://localhost:3000/todo/1/edit`` を開いたまま、別のタブで ``http://localhost:3000/todo/1`` を削除してみます。削除出来たら編集画面を開いているタブから適当な値を入力して更新ボタンを押してみます。すると ``"Not found"`` が表示されたと思います。本当は ``"Not found"`` ではなくて、 ``"Conflict"`` とか表示させたいような気がします。適切な HTTP ステータスコードの選び方はここで説明しませんが、ここでは適切なエラー処理の仕方を説明したいと思います。

まずは新しくライブラリをみっつ追加します。 ring-http-response と slingshot 、それから potemkin です。実際に使いたいのは ring-http-response だけなんですが、これを追加するときに細かいことを色々としたいので他のふたつも一緒に追加しています。簡単に説明するなら ring-http-response は ``ring.util.response`` ネームスペースを置き換える便利な HTTP レスポンスに関するライブラリで、 slingshot は Clojure の ``try`` と ``throw`` のそれぞれと互換がある ``try+``, ``throw+`` というマクロを提供するライブラリ、 potemkin は特化した機能はありませんが幾つかの便利な関数/マクロを提供してくれるライブラリです。

.. sourcecode:: clojure

  ;; project.clj
  :dependencies [[org.clojure/clojure "1.7.0"]
                 [ring "1.4.0"]
                 [compojure "1.4.0"]
                 [hiccup "1.0.5"]
                 [environ "1.0.1"]
                 [org.clojure/java.jdbc "0.4.2"]
                 [org.postgresql/postgresql "9.4-1205-jdbc42"]
                 [bouncer "0.3.3"]
                 [ring/ring-defaults "0.1.5"]
                 [metosin/ring-http-response "0.6.5"] ;; new
                 [slingshot "0.12.2"] ;; new
                 [potemkin "0.4.1"]] ;; new

プロジェクトの依存関係へ追加したら REPL を再起動して、私たちの ``todo-clj.util.response`` を強力にしたいと思います。

.. sourcecode:: clojure

  ;; src/todo_clj/util/response.clj
  (ns todo-clj.util.response
    (:require [potemkin :as p]
              [ring.util.http-response :as res]))

  (defmacro import-ns [ns-sym]
    (do
      `(p/import-vars
        [~ns-sym
         ~@(map first (ns-publics ns-sym))])))

  (import-ns ring.util.http-response)

  (defn html [res]
    (res/content-type res "text/html; charset=utf-8"))

potemkin のマクロのひとつ ``potemkin/import-vars`` を拡張して、特定のネームスペースにある全ての公開された ``Var`` を ``*ns*`` に追加します。そして ``import-ns`` マクロを使って ``ring.util.http-response`` から全ての ``Var`` を ``todo-clj.util.response`` へと追加しています。 ``potemkin/import-vars`` は以前 ``todo-clj.util.response`` で ``response`` 関数を定義したようなことをマクロで機械的にやってくれています。ちなみに今まで定義していた ``response`` 関数や ``redirect`` 関数は機能が重複するものが ``ring.util.http-response`` から提供されるので削除しました。

``ring.util.http-response`` と ``ring.util.response`` は似ているので基本的には同じように使えるのですが、 ``response`` は ``ok`` に ``redirect`` は ``found`` という名前なのでそれにあわせてハンドラーの方も修正します。

.. sourcecode:: clojure

  ;; src/todo_clj/handler/todo.clj
  (defn todo-new [req]
    (-> (view/todo-new-view req)
        res/ok ;; response -> ok
        res/html))

  (defn todo-new-post [{:as req :keys [params]}]
    (uv/with-fallback #(todo-new (assoc req :errors %))
      (let [params (uv/validate params todo-validator)]
        (if-let [todo (first (todo/save-todo (:title params)))]
          (-> (res/found (str "/todo/" (:id todo))) ;; redirect -> found
              (assoc :flash {:msg "TODO を正常に追加しました。"})
              res/html)))))

これで一旦、 ``todo-clj.util.response`` に対する修正は終わりました。次はエラー処理を追加していきます。どう実装するかは好みの問題ですが、ここでは簡単さを取って各ハンドラーは 404 や 500 という状態のときになったらその情報を持たせた例外を投げることにして、レスポンスに対するミドルウェアでその例外をキャッチをしそれぞれの画面を表示するという風にしましょう。 ``ring.util.http-response`` ネームスペースはエラー用の関数を幾つか提供してくれるのでそれを使いましょう。

.. sourcecode:: clojure

  ;; src/todo_clj/handler/todo.clj
  (defn todo-show [{:as req :keys [params]}]
    (if-let [todo (todo/find-first-todo (Long/parseLong (:todo-id params)))]
      (-> (view/todo-show-view req todo)
          res/ok
          res/html)
      (res/not-found!))) ;; ``todo-clj.util.response`` は ``ring.util.http-response`` の関数を全てインポートしているのでこのように使える

このように今まで実装していなかったところに対して例外を投げる関数を置いてみました。 ``ring.util.http-response`` ネームスペースの関数でエクスクラメーションマークが付いているものは例外を投げ、エクスクラメーションマークがない同名の関数は例外を投げずにエラーのレスポンスマップを返却します。 ``not-found!`` に対応する ``not-found`` という関数があるので REPL で確認してみると良いでしょう。今回は例外を投げる方法で実装していきますが、例外を使わずにエラー用のページを用意してそれを表示するというのでも良いと思います。

さて、もしかしたら気付いている方もいると思いますが、 ``not-found!`` を ``todo-show`` 関数の中で実行しないでも実はちゃんと ``"Not found"`` と表示されるようになってました。何故今まで何も実装していないのにこうなっていたのでしょう。理由は Compojure にあります。 Compojure はマッチするルーティングを探して定義順にマッチするものを探していくのですが、マッチしたハンドラーが ``nil`` を返却してくる場合は再度そこからルーティングを探し直します。

分かりやすいように次のようなルーティングを考えます。

.. sourcecode:: clojure

  (defroutes app
    (GET "/" req home)
    (GET "/a" req a-index)
    (GET ["/a/:id" :id #"\d+"] req a-show)
    (GET "/a/:command" req req a-command)
    (route/not-found "<h1>Not found</h1>"))

これに対して ``/a/99`` というパスからアクセスがきた場合、まずはマッチするルーティングが ``a-show`` になるのでそれを実行します。しかし、何かしらの問題があってこのハンドラー関数が ``nil`` を返してきた場合、 Compojure は更に下って ``a-command`` ハンドラーを実行します。もし、 ``a-command`` が ``nil`` を返却した場合は最後に ``route/not-found`` が実行されて画面には ``"Not found"`` と表示されるわけですね。

じゃあ、 ``todo-show`` の中で ``not-found!`` 実行しなくてもいいんじゃない?と思うかもしれませんが、それは違います。理由はふたつあって (1) Compojure の実装に依存してしまっている、 (2) 先の例にあったようにもしその後にマッチしてしまうルーティングが存在するならそちらが実行されてしまうので、ここでちゃんとエラーを処理しておく必要があります。

さて、 Compojure の話になってしまいましたが、 ``not-found!`` を ``todo-show`` の中においただけでは例外を投げっぱなしになっているのでこれを受けてやるミドルウェアを実装していきます。今、 ``not-found!`` 関数がどんな例外を投げているのかは REPL で確かめてみましょう。

.. sourcecode:: clojure

  user> (require '[todo-clj.util.response :as res]) ;; 重ねて説明しておくと ``ring.util.http-response`` の関数が全てインポートされている
  ;; => nil
  user> (res/not-found!)
  ;; => ExceptionInfo throw+: {:type :ring.util.http-response/response, :response {:status 404, :headers {}, :body nil}}  ring.util.http-response/throw! (http_response.clj:10)

``ExceptionInfo`` を投げているので Clojure のマップデータも一緒に投げています。そして、 ``ring.util.http-response`` にある例外を投げる関数(エクスクラメーションマーク付き)は slingshot の ``throw+`` を使っているので、同じく slingshot が提供する ``try+`` を使うことで簡単にそのデータを取得したりハンドルする例外を定めることが出来ます。

.. sourcecode:: clojure

  user> (require '[slingshot.slingshot :refer [try+ throw+]])
  ;; => nil
  user> (try+ (throw+ {:type :bar :msg "this is bar"})
              (catch [:type :foo] {:keys [msg]}
                (println "Exception type is foo: " msg))
              (catch [:type :bar] {:keys [msg]}
                (println "Exception type is bar: " msg)))
  ;; Exception type is bar:  this is bar
  ;; => nil

こんな感じで ``ExceptionInfo`` の例外に付随するマップ情報でマッチした場合に、それを処理するということが簡単に出来ます。ここまで分かったところで前置きが長くなりましたがミドルウェアを実装します。あらたに ``todo-clj.middleware.http-response`` ネームスペースを作りましょう。実装は以下のようになります。

.. sourcecode:: clojure

  ;; src/todo_clj/middleware/http_response.clj
  (ns todo-clj.middleware.http-response
    (:require [hiccup.core :as h]
              [ring.util.http-status :as status]
              [slingshot.slingshot :refer [try+]]
              [todo-clj.util.response :as res]))

  (defn- error-view [{:as response :keys [status]}]
    (let [{:keys [name description]} (status/status status)]
      (-> `([:h1 ~name]
            [:h2 ~description])
          h/html
          res/ok
          res/html)))

  (defn wrap-http-response [handler]
    (fn [req]
      (try+
       (handler req)
       (catch [:type :ring.util.http-response/response] {:keys [response]}
         (error-view response)))))

``wrap-http-response`` 関数は簡単ですね。ハンドラーの実行を ``try+`` マクロで囲んで、 ``ExceptionInfo`` のマップデータにある ``:type`` が ``:ring.util.http-response/response`` のときのみ例外を処理します。 ``error-view`` 関数はエラーの名前の説明を表示するだけです。ミドルウェアを作ったら適用しましょう。 ``todo-clj.middleware/middleware-set`` の中に入れてみます。

.. sourcecode:: clojure

  ;; src/todo_clj/middleware.clj
  (ns todo-clj.middleware
    (:require [environ.core :refer [env]]
              [ring.middleware.defaults :as defaults]
              [todo-clj.middleware.http-response :as http-response]))

  (defn middleware-set [handler]
    (-> handler
        http-response/wrap-http-response ;; ここに追加
        (wrap wrap-dev (:dev env))
        (defaults/wrap-defaults defaults/site-defaults)))

レスポンスに対するミドルウェアなので ``wrap-dev`` より内側にある必要があります( ``prone.middleware/wrap-exceptions`` が全ての例外を掴んじゃうのでそれより先に例外を掴む必要がある)。ここまで出来たら一旦サーバーを再起動してみて、 ``http://localhost:3000/todo/1`` とか削除した TODO にアクセスしてみましょう。綺麗に ``"Not Found"`` とその下に説明が表示されたら成功です。あとは他のハンドラーにも適当なエラー処理を追加してあげれば良さそうです。

.. sourcecode:: clojure

  ;; src/todo_clj/handler/main.clj
  (defroutes main-routes
    (GET "/" _ home)
    (route/not-found res/not-found!)) ;; ここも修正

.. sourcecode:: clojure

  ;; src/todo_clj/handler/todo.clj
  (defn todo-new-post [{:as req :keys [params]}]
    (uv/with-fallback #(todo-new (assoc req :errors %))
      (let [params (uv/validate params todo-validator)]
        (if-let [todo (first (todo/save-todo (:title params)))]
          (-> (res/found (str "/todo/" (:id todo)))
              (assoc :flash {:msg "TODO を正常に追加しました。"})
              res/html)
          (res/internal-server-error!))))) ;; 追加

  (defn todo-edit [{:as req :keys [params]}]
    (if-let [todo (todo/find-first-todo (Long/parseLong (:todo-id params)))]
      (-> (view/todo-edit-view req todo)
          res/ok
          res/html)
      (res/not-found!))) ;; 追加

  (defn todo-edit-post [{:as req :keys [params]}]
    (uv/with-fallback #(todo-edit (assoc req :errors %))
      (let [params (uv/validate params todo-validator)
            todo-id (Long/parseLong (:todo-id params))]
        (if (pos? (first (todo/update-todo todo-id (:title params))))
          (-> (res/found (str "/todo/" todo-id))
              (assoc :flash {:msg "TODO を正常に更新しました"})
              res/html)
          (res/conflict!))))) ;; 追加

  (defn todo-delete [{:as req :keys [params]}]
    (if-let [todo (todo/find-first-todo (Long/parseLong (:todo-id params)))]
      (-> (view/todo-delete-view req todo)
          res/ok
          res/html)
      (res/not-found!))) ;; 追加

  (defn todo-delete-post [{:as req :keys [params]}]
    (let [todo-id (Long/parseLong (:todo-id params))]
      (if (pos? (first (todo/delete-todo todo-id)))
        (-> (res/found "/todo")
            (assoc :flash {:msg "TODO を正常に削除しました"})
            res/html)
        (res/conflict!)))) ;; 追加

さて、これで正しくエラー処理が出来たような気がするので、試しに REPL 上で以下のように試してみます。

.. sourcecode:: clojure

  user> (require '[todo-clj.handler.todo :as ht])
  ;; => nil
  user> (ht/todo-edit-post {:params {:todo-id "1" :title "食器を片付ける"}})
  ;; => ExceptionInfo throw+: {:type :ring.util.http-response/response, :response {:status 404, :headers {}, :body nil}}  ring.util.http-response/throw! (http_response.clj:10)

既に削除されている TODO に対して更新処理をかけようとしました。ですが、どうやら投げられている例外が期待しているものと違うようです( 404 ではなくて 409 のはず)。どういうことでしょう。例外を読んでみるとなんとなく原因が分かります。

.. sourcecode:: java

  http_response.clj:  283  ring.util.http-response/not-found!
  http_response.clj:  281  ring.util.http-response/not-found!
           todo.clj:   45  todo-clj.handler.todo/todo-edit
           todo.clj:   48  todo-clj.handler.todo/todo-edit-post/fn
           todo.clj:   48  todo-clj.handler.todo/todo-edit-post
               REPL:   60  user/eval29218

どうやら ``not-found!`` を ``todo-edit`` が実行しているようです。 ``todo-edit-post`` から呼び出されているようですが、これはつまり ``todo-clj.util.validation/with-fallback`` が機能しているということです。

.. sourcecode:: clojure

  ;; src/todo_clj/util/validation.clj
  (defmacro with-fallback [fallback & body]
    `(try
       ~@body
       (catch clojure.lang.ExceptionInfo e#
         (~fallback (ex-data e#)))))

ありました。 ``ExceptionInfo`` を全てキャッチするので、 ``slingshot.slingshot/throw+`` で投げる例外は全てココで捕まっていたようです。なので、ここも修正して slingshot を使うことにしましょう。

.. sourcecode:: clojure

  ;; src/todo_clj/util/validation.clj
  (ns todo-clj.util.validation
    (:require [bouncer.core :as b]
              [slingshot.slingshot :refer [try+ throw+]]))

  (defn validate [& args]
    (let [[errors org+errors] (apply b/validate args)]
      (if (nil? errors)
        org+errors
        (throw+ {:type ::validation-error :errors errors})))) ;; ``throw+`` を使って ``:type`` を指定しておく

  (defmacro with-fallback [fallback & body]
    `(try+
      ~@body
      (catch [:type ::validation-error] {:keys [errors#]} ;; ``type`` が ``::validation-error`` のときだけ例外を処理するように変更
        (~fallback errors#))))

* `commit: エラー処理の追加( slingshot なども追加) <https://github.com/ayato-p/intro-web-clojure/commit/1218bf455b76613088431ac43c6155afb9db7be7>`_

これで良いでしょう。再度 REPL 上で確認してみましょう。

.. sourcecode:: clojure

  user> (ht/todo-edit-post {:params {:todo-id "1" :title "食器を片付ける"}})
  ;; => ExceptionInfo throw+: {:type :ring.util.http-response/response, :response {:status 409, :headers {}, :body nil}}  ring.util.http-response/throw! (http_response.clj:10)

ちゃんと期待通りのステータスを持った例外を投げることが出来ました。実際に画面上でも削除済みの TODO に対して更新処理を行おうとすると ``"Conflict"`` と表示されるようになりました。
これでようやく TODO アプリとしてそれなりに使えるようになりました。次の Part では実際に Heroku へデプロイをしてみます。

ここまでで学んだこと
====================

* ring-anti-forgery ミドルウェアや ring-defaults ミドルウェアの関係
* バリデーション処理の書き方
* エラー処理の書き方
