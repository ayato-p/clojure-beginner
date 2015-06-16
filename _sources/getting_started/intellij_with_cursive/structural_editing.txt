=============================
 構造的編集 (a.k.a. Paredit)
=============================

構造的編集( Emacs の Paredit モードとして知られている)は他の機能同様に Clojure デベロッパーをそれを好きな人と嫌いな人、好きから嫌いになった人に分けます。 Cursive は構造的編集を降るで提供し、ふたつの簡単でフラストレーションの少ないオンオフするための方法を提供します。構造的編集はタッチタイピングのように習得するまでは苦痛で練習も必要ですが、一度それに慣れてしまうともう二度とない生活に戻れないでしょう。

構造的編集の有効化と無効化
==========================

Clojure のコードに対して構造的編集はデフォルトで有効になっています。もしそれが好きでないなら、 ``Settings`` -> ``Clojure`` -> ``use structural editings`` から無効にできます。もし素早くオンとオフを切り替えたいなら、スクリーン下のステータスバーにあるウィジェットか、 ``Edit`` -> ``Structural Editing`` -> ``Toggle Structural Editing`` アクションが使えます。もし、これを行うのに手数が多いと思ったなら、これまでと同じようにショートカットキーをアクションにアサイン出来る。

選択に関して
============

IntelliJ の素晴らしい機能のひとつに構造的選択があります。 Ctrl + W (Mac なら Alt + 上カーソルキー) を押すことで意味単位で選択範囲を広げていきます。選択範囲を狭めるには Ctrl + Shift + W (Mac なら Alt + 下カーソルキー) を使います。これは幾つかある機能のひとつで取るに足らない機能のように見えますが、すぐにこれなしでは生きていけなくなるでしょう。

..
   TODO: gif here

作成に関して
============

基本的な構造的編集の目的は括弧のバランスを常に間違いなくとることです。これから括弧について話しますが、全ての機能はブレース、ブラケット、文字列のフォームにおいて同等の動きをします。あなたが括弧を開くと常に閉じ括弧が作られ、あなたが閉じ括弧のキーを押すとカーソルは一番近い一致する閉じ括弧の終わりにジャンプし、間にあるホワイトスペースを綺麗にします。全てのバランスを取るために、文字列の間にクォートを挿入すると自動的にバックスラッシュを付けてエスケープし、コメントを入れると必要に応じてフォームを次の行へと送ります。

..
   TODO: gif here

テキストを選択した状態でフォームを開いたときの Cursive の動作は、 ``Settings`` -> ``Editor`` -> ``Smart Keys`` -> ``Surround selection on typing quote or brace`` で決まります。もし、このオプションを選択していたら、選択部分をバランスされたフォームでラップし、そうでなければ削除して空のフォームに置き換えます。

The Wrap with… commands will also wrap the following form in brackets or quotes. The Close … and newline functions will jump to the current closing delimiter, insert a newline and indent correctly.

..
   TODO: gif here


Deleting things
===============
Deletion also works to maintain everything balanced. Backspace will jump over a closing delimiter and delete the contents - only empty delimiter pairs are actually deleted. Delete does the same but forwards instead of backwards. Kill will cut from the cursor to the end of the current list or to the end of the line. If the last element on the line extends past the end of the line, the entire list will be deleted.

..
   TODO: gif here

Getting around
==============
There are also some structural navigation commands under Navigate→Structural Movement. Move Forward/Backward move over forms or parentheses, and Move Into/Out Of Forward/Backward move into the next list or out of the current one.

..
   TODO: gif here

Editing commands
================
The amusingly named slurp and barf commands are some of the most commonly used. Slurp will find the form following your current list and pull it inside the list. Barf does the opposite - it finds the last form inside your current list and pushes it out. Raise will take your current list and remove its parent, moving it up the hierarchy.

..
   TODO: gif here

Splice inserts the contents of your current list directly into the parent. Split will split the current list or string at the current cursor position, and join will join them back up.

..
   TODO: gif here
