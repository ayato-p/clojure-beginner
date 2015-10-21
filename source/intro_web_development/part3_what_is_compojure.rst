=================================
 Part3: Compojure とはなんなのか
=================================

ルーティング機能を実装する
==========================

Web アプリケーションに必要なもののひとつにルーティング機能があります。前の Part までで ``Hello, world`` が出来るようになりましたが、このままでは ``/todo/new`` という URI にアクセスしたら TODO を新規作成する画面を表示するようにしたいという要望に対応出来ません。特定の URI に対して適切なコンテンツを返すことことをまずは特別なライブラリを使わずに実装してみます。

ひとまずホーム画面と TODO の一覧を表示する画面を表示するために以下のルーティングを定義しようと思います。

.. sourcecode:: clojure

  {"/"                home
   "/todo"            todo-index}

Compojure
===========================

`Compojure <https://github.com/weavejester/compojure>`_ はルーティング機能を提供するシンプルなライブラリであり、 Web フレームワークではありません。

Compojure は Sinatra を意識したスモール Web フレームワークだと言われることがあります [#]_ が、この認識はやめた方がいいでしょう。また、 Compojure のようにルーティング機能を提供するものは他にもある [#]_ ので機会があればそれらも確認してみるとよいでしょう。

ただ、今回は特にこだわりがないため、広く一般的に認知されている Compojure を使っていきたいと思います。

.. [#] `この記事 <http://www.infoq.com/news/2011/10/clojure-web-frameworks>`_ でも作者が "Compojure is a small web framework based on Ring" と言っていますが、既に Compojure の README からも web framework という表記が消されているので無視していいでしょう。
.. [#] 私が好きなのは JUXT の作っている `bidi <https://github.com/juxt/bidi>`_ というライブラリです。

Compojure の一番簡単な使い方
============================
