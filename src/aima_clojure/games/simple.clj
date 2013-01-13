(ns aima-clojure.games.simple
  (:use aima-clojure.game))

(def succs
  {:A {:a1 :B
       :a2 :C
       :a3 :D}
   :B {:b1 :B1
       :b2 :B2
       :b3 :B3}
   :C {:c1 :C1
       :c2 :C2
       :c3 :C3}
   :D {:d1 :D1
       :d2 :D2
       :d3 :D3}})

(def utils
  {:B1 3
   :B2 12
   :B3 8
   :C1 2
   :C2 4
   :C3 6
   :D1 14
   :D2 5
   :D3 2
   })

(def simple
  (reify 
    Game
    (moves [game state]
      (keys (succs state {})))
    (make-move [game state move]
      (get-in succs [state move]))
    (utility [game state player]
      (if (= player "MAX")
        (utils state)
        (- (utils state))))
    (terminal-test [game state]
      (not (#{:A :B :C :D} state)))
    (to-move [game state]
      (if (#{:B :C :D} state)
        "MIN"
        "MAX"))
    (display [game state]
      (clojure.pprint/pprint (:moves state)))))

(minimax-decision simple :A)