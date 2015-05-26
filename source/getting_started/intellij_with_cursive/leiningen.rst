.. |refresh| image:: /image/cursive_with_leiningen/refresh.png
.. |add| image:: /image/cursive_with_leiningen/add.png
.. |remove| image:: /image/cursive_with_leiningen/remove.png
.. |execute| image:: /image/cursive_with_leiningen/execute.png

==================
 Leiningen を使う
==================

Leiningen は Clojure のためのデファクトなプロジェクト管理ツールです。 Cursive は Leiningen を使ってプロジェクトのビルドと管理をサポートしてくれます。将来的には今よりも多くの機能が提供される予定です。

既存のプロジェクトをインポートする
==================================

``File`` -> ``Import Project…`` [#]_ を選択してインポートしたいプロジェクトを選択します。 ``project.clj`` かそれを含むディレクトリが選択できます。

.. image:: /image/cursive_with_leiningen/import-choose-project.png

もし要求されたら ``Import project from external model`` と Leiningen を選択します [#]_ 。

.. image:: /image/cursive_with_leiningen/import-choose-lein.png

プロジェクトのルートディレクトリは埋めてあります。このディレクトリを他のプロジェクトのために再帰的に検索するかを選ぶことができ [#]_ 、それからプロジェクトファイルをメインプロジェクトのディレクトリ以外に置くかも選ぶことができます。

.. image:: /image/cursive_with_leiningen/import-project-details.png

Leiningen プロジェクトの一覧が表示されるので、どれをインポートするかを選択できます。

.. image:: /image/cursive_with_leiningen/import-project-list.png

SDK をひとつ選び、プロジェクトの名前とファイルロケーションを確認します。

.. image:: /image/cursive_with_leiningen/import-confirm-name.png

プロジェクトを開いた画面になり、これで使う準備が出来ました。

.. image:: /image/cursive_with_leiningen/import-new-project.png

Leiningen プロジェクトを使う
============================

Leiningen ツールウィンドウでは現在アクティブになっている Leiningen プロジェクトを表示し、とても一般的なタスクの一覧を表示しています。

.. image:: /image/cursive_with_leiningen/lein-toolwindow.png

カミングスーン: プラグインから提供されるタスクをプロジェクトから読み取れるようにします。

タスクを選択し、ツールウィンドウのツールバーにある |execute| を押すことでタスクを実行できます。

.. image:: /image/cursive_with_leiningen/lein-run-task.png

|add| と |remove| アイコンを使うことで Leiningen プロジェクトを IntelliJ プロジェクトに追加したり削除することができます。

Leiningen の依存性を再読み込みする
==================================

``project.clj`` を更新したら |refresh| を押すことでプロジェクトファイルをリロードし、プロジェクトの依存性を再読み込みします。 Maven プラグインのように自動では行われないことに注意してください。実行設定 [#]_ の Before Launch セクションに ``Synchronize Leiningen Projects`` を追加して REPL 起動前にプロジェクトを再読み込みするようにしてもいいかもしれません。

Leiningen の依存性のためのソースと Javadoc
==========================================

Since 0.1.12, Cursive can download sources and javadocs for Leiningen dependencies. When you navigate to a Java class file that belongs to a library without sources attached, you will be prompted to download the sources - they will be downloaded and added to the library. Sources and Javadocs can also be automatically downloaded for Leiningen projects, but this option is not recommended because it can make project synchronisation extremely slow. This is because most Clojure libraries are distributed as source, and thus don’t have a separate source artifact. If you really need it, this functionality is controlled by the setting Settings→Leiningen→Automatically download sources/javadocs.

クイックプロジェクトインポート
==============================

シンプルなプロジェクトの場合、明示的にインポートする必要はありません。いつも通り ``File`` -> ``Open…`` と開き ``project.clj`` かそれを含んでいるディレクトリを選択すれば自動的にインポートされます。

Leiningen を使って新しいプロジェクトを作る
==========================================

近い将来実装予定。
現在はコマンドラインから ``lein`` コマンドを使ってプロジェクトを作り上で説明したようにインポートしてください。

.. _working_with_multimodule:

マルチモジュールプロジェクトを扱う
==================================

もしあなたがもっと複数のモジュールをもつ複雑なプロジェクトを持っている場合、 Cursive は自動的にそれを見つけすべて整えてくれます。インポートするときに ``Search for projects recursively`` にチェックしてください。

.. image:: /image/cursive_with_leiningen/import-recursive-search.png

Select the projects you would like to import from the list of discovered projects. Their location within the project is displayed along with the artifact details.

.. image:: /image/cursive_with_leiningen/import-select-projects.png

And your project will be set up. An IntelliJ Module will be created for each Leiningen module, and dependencies between them and the appropriate library dependencies will be set up as well.

.. image:: /image/cursive_with_leiningen/lein-multi-modules.png

You can then add new modules to the project using either the  button in the Leiningen tool window, or using the context menu in the project tool window. You can remove Leiningen modules from the project and optionally remove the corresponding IntelliJ module using the  in the Leiningen tool window.

Checkout Dependencies
=====================

Leiningen’s standard mechanism for managing multi-module projects is to use Checkout Dependencies. Cursive fully supports checkout dependencies and will add the appropriate modules and dependencies automatically.

.. [#] ``File`` メニューにない場合はアクションを検索して Import Project を探します。
.. [#] ``project.clj`` がないディレクトリをインポートするとき
.. [#] :ref:`working_with_multimodule` を参照
.. [#] ``Run`` -> ``Edit Cofigurations...`` から。詳細は REPL のセクションで扱います。
