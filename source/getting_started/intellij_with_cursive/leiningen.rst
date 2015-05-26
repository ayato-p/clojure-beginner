==================
 Leiningen を使う
==================

Leiningen は Clojure のためのデファクトなプロジェクト管理ツールです。 Cursive は Leiningen を使ってプロジェクトのビルドと管理をサポートしてくれます。将来的には今よりも多くの機能が提供される予定です。

既存のプロジェクトをインポートする
==================================

Select File→Import Project… [#]_ and select the project you would like to import. You can select either the project.clj or the directory containing it.

.. image:: /image/cursive_with_leiningen/import-choose-project.png

If required, select “Import project from external model” and select Leiningen.

.. image:: /image/cursive_with_leiningen/import-choose-lein.png

The root directory of your project will be filled in for you. You can choose to search recursively within that directory for other projects (see Multi Module Projects, below), and you can also choose to put the project files in a directory other than the main project directory.

.. image:: /image/cursive_with_leiningen/import-project-details.png

You will then be presented with a list of the Leiningen projects found, and you can select which to import.

.. image:: /image/cursive_with_leiningen/import-project-list.png

Pick an SDK, then confirm your project name and file locations.

.. image:: /image/cursive_with_leiningen/import-confirm-name.png

Your project will then be opened and is ready to use.

.. image:: /image/cursive_with_leiningen/import-new-project.png

Coming Soon: We’ll be allowing more fine-grained use of profiles during this process.

Working with your Leiningen project
===================================

The Leiningen tool window shows the currently active Leiningen projects, and presents you with a list of the most common tasks to run.

.. image:: /image/cursive_with_leiningen/lein-toolwindow.png

Coming Soon: We’ll be reading the list of available tasks from the project which will include tasks provided by plugins.

You can select a task and run it using the  icon in the tool window toolbar.

.. image:: /image/cursive_with_leiningen/lein-run-task.png

The  and  icons allow you to add and remove Leiningen projects to and from your IntelliJ project (see Multi Module Projects below).

Refreshing Leiningen dependencies
=================================

When you have updated your project.clj file, you can press the  icon to re-read the project file and refresh the project dependencies. Note that this is not performed automatically when the project.clj is updated, unlike the Maven plugin. The project may also be refreshed before starting a REPL by adding “Synchronize Leiningen Projects” to the Before Launch section of its run configuration.

Sources and Javadocs for Leiningen dependencies
===============================================

Since 0.1.12, Cursive can download sources and javadocs for Leiningen dependencies. When you navigate to a Java class file that belongs to a library without sources attached, you will be prompted to download the sources - they will be downloaded and added to the library. Sources and Javadocs can also be automatically downloaded for Leiningen projects, but this option is not recommended because it can make project synchronisation extremely slow. This is because most Clojure libraries are distributed as source, and thus don’t have a separate source artifact. If you really need it, this functionality is controlled by the setting Settings→Leiningen→Automatically download sources/javadocs.

クイックプロジェクトインポート
==============================

シンプルなプロジェクトの場合、明示的にインポートする必要はありません。いつも通り ``File`` -> ``Open…`` と開き ``project.clj`` かそれを含んでいるディレクトリを選択すれば自動的にインポートされます。

Leiningen を使って新しいプロジェクトを作る
==========================================

近い将来実装予定。
現在はコマンドラインから ``lein`` コマンドを使ってプロジェクトを作り上で説明したようにインポートしてください。

マルチモジュールプロジェクトでの作業
====================================

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
