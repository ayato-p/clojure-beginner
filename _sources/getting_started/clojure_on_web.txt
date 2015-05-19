=============================
 Clojure を Web で試してみる
=============================

Clojure を触ってみたいけど、環境構築するのがめんどくさい…と戸惑っている人は Web 上で Clojure を触ってみましょう。

* :ref:`try_clojure`
* :ref:`clojure_instarepl`

.. _try_clojure:

Try Clojure で Clojure を試してみる
===================================

5 分程度で終わる簡単なチュートリアル付き Web 上の REPL です。以下のリンクから開くことができます [#]_ 。

* `Try Clojure <http://www.tryclj.com/>`_

開くと次のような画面が出てくるので、下のガイドに従って進めましょう。

|

.. image:: /image/try_clojure/open_try_clojure.png

|

`next` と REPL 中でタイプすればガイドが次に進み、 `back` とタイプすれば前のガイドに戻ります。 `restart` とタイプすると一番始めのガイドへと戻ります。

|

.. image:: /image/try_clojure/usage_try_clojure.png

.. [#] 2015/05: 現在 `defn` がうまく機能しておらず関数の定義が出来ないので、今後の修正に期待したいところ。

.. _clojure_instarepl:

Clojure  instaREPL で Clojure を試してみる
==========================================

Try Clojure より後発でチュートリアルこそないですが、 LightTable のように Clojure のフォームをインタラクティブに評価して結果を表示してくれるのでとても分かりやすいと思います。以下のリンクから開くことが出来ます。

* `Clojure instaREPL <http://web.clojurerepl.com/>`_

開くと次のような画面が出てくると思います。

|

.. image:: /image/clojure_instarepl/open_clojurerepl.png

|

試しに画面上部にある `qsort` というリンクをクリックしてみると、下の画面のようなサンプルが表示されます。

|

.. image:: /image/clojure_instarepl/qsort_clojurerepl.png
