====================
 Cursive を入手する
====================

.. warning::
   Cursive は現在も開発中のため安定はしていません。とはいえ、 Cursive の開発者とたくさんの Cursive ユーザーが既に日々の仕事で使用しています。

.. contents:: ページ内目次
   :local:

IntelliJ をダウンロード
=======================

まず初めに `ココ <https://www.jetbrains.com/idea/download/index.html>`_ から IntelliJ をダウンロードしましょう。もし Ultimate Edition を持っていないなら Community Edition でも大丈夫です。 IntelliJ は Windows, Mac OS X それと Linux で使用可能です。 Cursive は IntelliJ のバージョン 12.1, 13.1 14 と 14.1 EAP で動作します。

La Clojure を削除
=================

もしあなたが既に JetBrains の La Clojure もしくは Jan Thomä の Leiningen プラグインをインストールしている場合は Cursive と Leiningen の統合で競合するのでアンインストールする必要があります。 IntelliJ の ``Settings`` -> ``Plugins`` を開き、それらのプラグインを選択して uninstall ボタンを押して Ok を押しましょう。その後、 IntelliJ を再起動すれば終わりです。

.. note::
   Disable にするだけでは十分ではないので、しっかりアンインストールしましょう。

Cursive をインストール
======================

プラグインをインストールします。 IntelliJ の ``Settings`` を開き、それから ``Plugins``, ``Browse Repositories``, ``Manage Repositories`` と順番に開いていきます。リポジトリの URL をあなたの IntelliJ のバージョンと一致するものを以下から選んで入力します。

* ``https://cursiveclojure.com/plugins.xml`` for IntelliJ 12.1
* ``https://cursiveclojure.com/plugins-13.1.xml`` for IntelliJ 13.1
* ``https://cursiveclojure.com/plugins-14.xml`` for IntelliJ 14
* ``https://cursiveclojure.com/plugins-14.1.xml`` for IntelliJ 14.1

``Browse Repositories`` に戻ると、リポジトリリストの中に ``cursive-14.1.0.1.xx`` というような新しいプラグインが見えると思います。 install ボタンを押してインストールをしたら ``Browse Repositories`` ウィンドウと ``Settings`` ウィンドウを閉じて IntelliJ を再起動しましょう。

IntelliJ の設定
===============
