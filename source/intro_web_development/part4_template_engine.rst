=================================
 Part4: テンプレートエンジンを使う
=================================

Clojure におけるテンプレートエンジン
====================================

今までのコードでは HTML を文字列で直接書いてきました。「まさか Clojure では文字列で直接 HTML を書くの?」と心配された方もいるかもしれませんが、そんなことはないので安心してください。他の言語でもあるようにテンプレートエンジンがちゃんとあるので、これからはそれを使っていきます。さて、テンプレートエンジンと一口に言っても色々なものが存在します。とは言えよく名前のあがるものはそんなに多くはないです。 Enlive, Selmer, Hiccup これら 3 つの存在は覚えておいていいかと思います。それぞれ簡単に特徴を説明すると Enlive はセレクタベースのテンプレートエンジンであまり他の言語でも見ない特殊な形のテンプレートエンジンですが、 HTML を読み込み CSS セレクタで特定の部分に Clojure で処理を加え HTML を吐き出すという面白いものです。 Selmar は Django のテンプレート機能と似たようなもので、 HTML ファイルに直接ロジックを書くタイプのものです。最後に Hiccup ですが、これは Clojure のベクタをそのまま HTML へと変換するものです。

さて、どれも一長一短なので一概にどれがいいというのを簡単に決めることは出来ないのですが、今回は学習コストが一番低く(私の勝手な印象ですが) Clojure そのものと親和性が高くて HTML を直接書く必要がない Hiccup を使っていきたいと思います。

Hiccup を導入する
=================

早速 Hiccup をプロジェクトの依存性へと追加しましょう。 ``project.clj`` へ次のように足します。

.. sourcecode:: clojure

  :dependencies [[org.clojure/clojure "1.7.0"]
                 [ring "1.4.0"]
                 [compojure "1.4.0"]
                 [hiccup "1.0.5"]
                 [environ "1.0.1"]]

* `commit: Hiccup を依存性へと追加 <https://github.com/ayato-p/intro-web-clojure/commit/314fe92ffc4eb9084cc27f6a23b14e12fe3508ee>`_

追加したら、早速いつも通り REPL を再起動しましょう。

.. sourcecode:: clojure

  user> (require '[hiccup.core :as hc])
  ;; => nil
  user> (hc/html [:div [:h1 "Hello"]])
  ;; => "<div><h1>Hello</h1></div>"

``hiccup.core`` の ``html`` マクロが主に使う機会が多いものになるとは思いますが、このようにベクターデータ(以下、タグベクター)を渡すことで HTML へと変換し吐き出してくれます。この Hiccup のタグベクターは次のような構造になっています。

.. sourcecode:: clojure

  [tag & body]
  [tag attributes & body]

タグベクターのひとつめは必ず HTML のタグ名がきますが、これはキーワード、シンボル、文字列のどれでも使うことが出来るようになっています。またタグの属性をマップデータとしてふたつめに渡すことが出来ますがこれは省略可能です。属性を除いたタグベクターの残りは全てタグのボディとして扱われますが、これは文字列や他のタグベクターを含めることが可能です。

.. sourcecode:: clojure

  user> (hc/html [:h1 {:class "black-bold"} "Hello"])
  ;; => "<h1 class=\"black-bold\">Hello</h1>"

.. sourcecode:: clojure

  user> (hc/html [:p#headline.red.bold "Welcome to Clojure"])
  ;; => "<p class=\"red bold\" id=\"headline\">Welcome to Clojure</p>"

.. sourcecode:: clojure

  user> (hc/html [:ul
                  (for [x (range 4)]
                    [:li x])])
  ;; => "<ul><li>0</li><li>1</li><li>2</li><li>3</li></ul>"
