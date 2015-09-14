===================================
 IntelliJ IDEA と Cursive で始める
===================================

Cursive は Clojure 開発で必要な機能、あるいはあると便利な機能を統合的に提供してくれます。

.. contents:: ページ内目次
   :local:

概要
====

IntelliJ IDEA という日本でも人気の IDE の上で動くプラグインです。日本ではあまり使用例を見かけませんが、海外では Emacs に次ぐ人気の高い開発環境となっています。

現在 Cursive は IntelliJ IDEA のプラグインとして提供されており、他の JetBrains 製品と同様にバージョン管理システムやインスペクターなどといった機能を使うことができます。

Cursive はそのほぼ全てを Clojure で書かれており、 Clojure エコシステムとの統合も非常にうまく出来ています。そして、 Cursive の開発は Cursive を使って行われているため、 Cursive は Clojure 開発の最高の環境となるはずです。

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
* 全ての IntelliJ の機能( VCS やプロジェクト管理など)

ユーザーガイド
==============

.. toctree::
   ./intellij_with_cursive/getting_started
   ./intellij_with_cursive/ui
   ./intellij_with_cursive/keybindings
   ./intellij_with_cursive/leiningen
   ./intellij_with_cursive/repl
   ./intellij_with_cursive/general_editing
   ./intellij_with_cursive/structural_editing
