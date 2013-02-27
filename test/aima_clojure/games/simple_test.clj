(ns aima-clojure.games.simple-test
  (:use aima-clojure.games.simple
        aima-clojure.game
        clojure.test))

(deftest minimax-test
  (testing "minimax"
    (is (= (minimax-decision simple :A)
           :a1))
    (is (= (minimax-decision simple :B)
           :b1))
    (is (= (minimax-decision simple :C)
           :c1))))
