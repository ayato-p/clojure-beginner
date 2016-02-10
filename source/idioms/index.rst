イディオム集
============

複数のコレクションの要素を index ごとにまとめる
-----------------------------------------------

.. sourcecode:: clojure

    [0 1 2 3 4]
    [:a :b :c :d :e]

というふたつのベクタがあるときにこれらの要素を簡単に index
ごとにまとめる方法。

.. sourcecode:: clojure

    (let [a [0 1 2 3 4]
          b [:a :b :c :d :e]]
      (map vector
           a
           b))
    ;; ([0 :a] [1 :b] [2 :c] [3 :d] [4 :e])

気を付けないといけないのは ``map``
が一番短かいコレクションの長さで止まるので、全ての要素に対して行ないたい場合などは注意が必要です。

マップを平坦なシーケンスへと変換する
------------------------------------

次のようなマップデータを平坦なシーケンスへと変更したいときに使える方法です。

.. sourcecode:: clojure

    {:name    "ayato-p"
     :age     "24"
     :address "Japan"}

これはこのまま ``seq`` などを使うと平坦なシーケンスにはなりません。

.. sourcecode:: clojure

    (seq {:name    "ayato-p"
          :age     "24"
          :address "Japan"})
    ;; ([:name "ayato-p"] [:age "24"] [:address "Japan"])

この場合は次のように書きます。

.. sourcecode:: clojure

    (apply concat {:name    "ayato-p"
                   :age     "24"
                   :address "Japan"})
    ;; (:name "ayato-p" :age "24" :address "Japan")

``seq`` + ``flatten`` という方法もありますが、 ``flatten``
がネストした配列も全て平滑化してしまうため、この場合はあまり使うことが出来ません。

可変長引数を受け取る関数にシーケンスのデータを渡したい
------------------------------------------------------

.. sourcecode:: clojure

    (def v ["foo" "bar" "baz"])

    (defn f [& args]
      (clojure.string/join ", " args))

このような関数とデータがあった場合にどのようにすれば関数 ``f`` へベクタ
``v`` が渡せるかという問題です。 これは次のように書けます。

.. sourcecode:: clojure

    (apply f v)
    ;; "foo, bar, baz"

``apply`` を使う関数適用の形はよく使うので覚えておくと良いでしょう。

また、ベクタではなくマップの場合は次のように書けます。

.. sourcecode:: clojure

    (def m {:name "ayato-p" :age 24})

    (defn g [& {:as m :keys [name age]}]
      (str "name: " name ", "
           "age: " age))

    (apply g
           (apply concat m))
    ;; "name: ayato-p, age: 24"

シーケンスの全要素に関数を適用して ``nil`` を捨てる
---------------------------------------------------

``keep`` 関数を使いましょう。

.. sourcecode:: clojure

    (def people [{:name "ayato_p" :age 11}
                 {:name "alea12" :age 10}
                 {:name "zer0_u"}])

    (remove nil? (map :age people)) ;(11 10)
    (keep :age people) ;(11 10)

ある値が boolean かどうかを知りたい
-----------------------------------

.. sourcecode:: clojure

    (defn boolean? [b]
      (or (true? b)
          (false? b)))

    (boolean? true) ;true
    (boolean? false) ;true
    (boolean? Boolean/TRUE) ;true
    (boolean? Boolean/FALSE) ;true
    (boolean? (Boolean. "true")) ;false
    (boolean? (Boolean. "false")) ;false
    (boolean? "") ;false
    (boolean? nil) ;false
    (boolean? 0) ;false
    (boolean? 1) ;false

これでほとんどの場合は事足りるでしょう。

`ref: Special Forms <http://clojure.org/reference/special_forms#if>`__

複数の候補の中から ``nil`` でない値を見つけたら値を返す
-------------------------------------------------------

``or`` が使えます。

.. sourcecode:: clojure

    (or nil
        "ayato-p")
    ;; "ayato-p"

ただ、 ``false`` を見つけても無視されるので、 ``false``
が欲しい場合は気をつけましょう。

シーケンスが空かどうかを確かめたい
----------------------------------

``seq`` 関数を使います。

.. sourcecode:: clojure

    (def ev [])
    (def v [1 2])

    (if (seq nil)
      "not nil"
      "nil") ;"nil"

    (if (seq ev)
      "not empty"
      "empty") ;"empty"

    (if (seq v)
      "not empty"
      "empty") ;"not empty"

``seq`` 関数は便利なので、 ``nil`` に対しても使えるので "``nil``
または空のシーケンスか" というテストが簡単に出来ます。

マップに対して条件を満すときだけ ``assoc/dissoc`` して、それ以外のときはそのまま返したい
----------------------------------------------------------------------------------------

``cond->`` を使うと簡単です。

.. sourcecode:: clojure

    (def m {:foo 1 :bar 2})

    (cond-> m
      true (assoc :baz 3)) ;{:foo 1, :bar 2, :baz 3}

    (cond-> m
      false (assoc :baz 3)) ;{:foo 1, :bar 2}

``reduce`` を途中で止めたい
---------------------------

``reduced`` を使いましょう。

まず次のような無限の数値シーケンスに対してかけ算することを考えます。このときかけ算なので
``0`` を見つけたところで ``0`` を返すことが可能です(もし ``0``
が見つからなくて本当に無限のシーケンスがきたら止まらないですね)。

.. sourcecode:: clojure

    (reduce (fn [acc x]
              (if (zero? x)
                (reduced 0)
                (* acc x)))
            1
            (cycle [9 8 7 6 5 4 3 2 1 0]))
