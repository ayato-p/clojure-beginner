=====================================
 Clojure で Web 開発をはじめてみよう
=====================================

Clojure の活用例は多岐に渡りますが、そのうちのひとつ Web 開発についてここでは触れたいと思います。

.. raw:: html

  <iframe src="https://ghbtns.com/github-btn.html?user=ayato-p&repo=clojure-beginner&type=star&count=true" frameborder="0" scrolling="0" width="170px" height="20px"></iframe>

まえがき
========

このドキュメントでは出来るだけ「 Ring/Compojure を使えば開発出来るんだよ!!」という軽いノリではなく、 Ring とは何か Compojure とは何なのかという話や、実開発におけるノウハウなどを丁寧に書いていこうと思います。また、私自身未熟なところもあり理解が甘かったりするところも多少はあるかと思いますが、出来るだけ丁寧に調べて書いていくのでよろしくお願いします。誤りに気付いた方は issue を立てて頂けると助かります。

* `issues <https://github.com/ayato-p/clojure-beginner/issues>`_

また、この中で書いていくコードは基本的に全て以下のリポジトリにコミットしていくので分からなければそちらも確認ください。

* `ayato-p/intro-web-clojure <https://github.com/ayato-p/intro-web-clojure>`_

中身について
============

最初の Part1 から PartXX までは TODO アプリを作ることを目標にして書いていきます。完成した Part より後ではもう少し実践的なより便利なライブラリを使って TODO アプリをよりよく改善していきます。

目次
====

.. toctree::
   part1_prepare
   part2_what_is_ring
   column_rdd_and_more_ring
   part3_what_is_compojure
   part3_5_middleware_for_dev
   column_about_web_frameworks
   part4_template_engine
   column_add_deps_to_running_repl
   part5_connect_to_database
   column_libraries_for_web
   part6_build_up_our_app
