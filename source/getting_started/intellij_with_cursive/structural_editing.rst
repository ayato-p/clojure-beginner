=============================
 構造的編集 (a.k.a. Paredit)
=============================

構造的編集( Emacs の Paredit モードとして知られている)は他の機能同様に Clojure デベロッパーをそれを好きな人と嫌いな人、好きから嫌いになった人に分けます。 Cursive は構造的編集を降るで提供し、ふたつの簡単でフラストレーションの少ないオンオフするための方法を提供します。構造的編集はタッチタイピングのように習得するまでは苦痛で練習も必要ですが、一度それに慣れてしまうともう二度とない生活に戻れないでしょう。

構造的編集の有効化と無効化
==========================
Clojure のコードに対して構造的編集はデフォルトで有効になっています。もしそれが好きでないなら、 ``Settings`` -> ``Clojure`` -> ``use structural editings`` から無効にできます。
 If you’d like to toggle it on and off quickly, you can use the widget in the status bar at the bottom of the screen, or you can use the Edit→Structural Editing→Toggle Structural Editing action. If you find yourself doing that a lot you can even assign a shortcut key to the action.

Selecting things
================
One of the nicest editing features of IntelliJ is its structural selection. Pressing Ctrl W (Alt up arrow on the Mac) will expand the selection to the surrounding semantic unit. You can shrink it back with Ctrl Shift W (Alt down arrow on the Mac). This is one of those features that seems trivial but soon you can’t live without it.

..
   TODO: gif here

Creating things
===============
The basic goal of structural editing is to make sure that your parenthesis always remain balanced. We’ll talk about parentheses here but all of the features for this work equivalently for forms created with curly brackets, square brackets or strings. When you open a parenthesis it is always created balanced, and when you press the close paren key the cursor will jump to the end of the nearest corresponding closing paren and tidy up any whitespace. In order to maintain everything balanced, inserting quotes inside a string automatically escapes it with a backslash, and opening a comment will shunt forms to the next line if required.

..
   TODO: gif here


When opening a balanced form with text selected, Cursive’s behavior is controlled by Settings→Editor→Smart Keys→Surround selection on typing quote or brace. If this option is selected, opening a balanced form will wrap the selection, otherwise the selection will be deleted and replaced with the empty delimiters. The Wrap with… commands will also wrap the following form in brackets or quotes. The Close … and newline functions will jump to the current closing delimiter, insert a newline and indent correctly.

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
