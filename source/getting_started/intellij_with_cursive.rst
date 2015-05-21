===================================
 Intellij IDEA と Cursive で始める
===================================

Cursive は Clojure 開発で必要な機能、あるいはあると便利な機能を統合的に提供してくれます。

* :ref:`about_cursive`
* :ref:`feature_of_cursive`
* :ref:`userguide_for_cursive`

.. _about_cursive:

概要
====

日本ではあまり使用例を見かけませんが、海外では Emacs に次ぐ人気の高い開発環境となっています。

現在 Cursive は Intellij IDEA のプラグインとして提供されており、他の JetBrains 製品
と同様にバージョン管理システムやインスペクターなどといった機能を使うことができます。

Clojure エコシステムと親和性の高い機能を備えており、 nREPL や Leiningen などといったツールと併用して使うことができます。またそれらを Cursive 上から操作することも出来ます。

.. _feature_of_cursive:

機能
====

* シンタックスハイライト
* ナビゲーション(シンボル間ジャンプ、使い方の検索)
* シンボルのリネーム
* nREPL をベースにした REPL
* Leiningen のサポート
* Paredit スタイルの構造的編集機能
* コードフォーマット
* シンボリックデバッガ
* プロジェクト内で Java を一緒に使うことが容易
* 全ての Intellij の機能( VCS やプロジェクト管理など)

.. _userguide_for_cursive:

ユーザーガイド
==============

.. toctree::
   ./intellij_with_cursive/getting_started
