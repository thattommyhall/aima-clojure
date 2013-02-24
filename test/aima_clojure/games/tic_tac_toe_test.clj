(ns aima-clojure.games.tic-tac-toe-test
  (:use aima-clojure.games.tic-tac-toe
        aima-clojure.game
        clojure.test))



(deftest tic-tac-toe-test
  (testing "make-move"
    (is (= (make-move (tic-tac-toe)
                      {:to-move :o
                       :board [[:e :e :e]
                               [:o :o :e]
                               [:x :x :e]]
                       :utility 0}
                      [1 2])
           {:to-move :x
            :board [[:e :e :e]
                    [:o :o :o]
                    [:x :x :e]]
            :utility -1}))
    (is (= (make-move (tic-tac-toe)
                      {:to-move :x
                       :board [[:e :e :e]
                               [:o :o :e]
                               [:x :x :e]]
                       :utility 0}
                      [2 2])
           {:to-move :o
            :board [[:e :e :e]
                    [:o :o :e]
                    [:x :x :x]]
            :utility 1})
        )
    )
  
  (testing "minimax"
    (is (= (minimax-decision (tic-tac-toe)
                             {:to-move :o
                              :board [[:e :e :e]
                                      [:o :o :e]
                                      [:x :x :e]]
                              :utility 0
                              })
           [1 2]))
    (is (= (minimax-decision (tic-tac-toe)
                             {:to-move :x
                              :board [[:o :o :x]
                                      [:e :x :e]
                                      [:o :x :e]]
                              :utility 0})
           [1 0])))
  
  
  )
        
        
                             
