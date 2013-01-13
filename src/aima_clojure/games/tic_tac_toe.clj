(ns aima-clojure.games.tic-tac-toe
  (:use aima-clojure.game))

(def initial-tic-state
  {:to-move :o
   :board [[:e :e :e]
           [:o :o :e]
           [:x :x :e]]
   })

(def tic-tac-toe
  (letfn [(winner [state]
            (let [triples
                  (fn [board]
                    (map #(map (partial get-in board) %)
                         (concat
                          (for [x [0 1 2]]
                            [[x 0] [x 1] [x 2]])
                          (for [y [0 1 2]]
                            [[0 y] [1 y] [2 y]])  
                          [[[0 0] [1 1] [2 2]]
                           [[0 2] [1 1] [2 0]]]
                          )))]
              (ffirst (filter #(or (= [:o :o :o] %)
                                   (= [:x :x :x] %))
                              (triples (:board state)))))
            )]
    (reify
      Game
      (moves [game state]
        (for [y (range 3)
              x (range 3)
              :when (= :e (get-in (:board state) [y x]))]
          [y x]))
          
      (make-move [game state move]
        {:to-move (if (= :o (:to-move state))
                    :o
                    :x)
         :moves (disj (:moves state) move)
         :board (assoc-in (:board state) move (:to-move state))})
      (utility [game state player]
        (if-let [w (winner state)]
          (if (= player w)
            1
            -1)
          0))
      (terminal-test [game state]
        (or (empty? (:moves state))
            (winner state)))
      (to-move [game state]
        (:to-move state))
      (display [game state]
        (clojure.pprint/pprint (:moves state)))
      )))
