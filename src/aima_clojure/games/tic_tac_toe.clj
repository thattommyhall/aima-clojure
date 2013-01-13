(ns aima-clojure.games.tic-tac-toe
  (:use aima-clojure.game))


(defn- calculate-utility [board move player k]
                                        ;(some #(> % k)
  (map (fn [[y-diff x-diff]]
         (map #(get-in board %)
              (take 4
              (iterate (fn [[y x]]
                         [(+ y y-diff)
                          (+ x x-diff)])
                       move))))
       [[0 1] [1 0] [1 -1] [1 1]]))
;)

(calculate-utility [[:e :e :e]
                    [:o :o :e]
                    [:x :x :e]]
                   [1 2]
                   :o
                   3)
         

(defn tic-tac-toe
  ([] (tic-tac-toe {}))
  ([{:keys [h v k]
     :or {h 3
          v 3
          k 3}}]
     (reify
       Game
       (moves [game state]
         (for [y (range v)
               x (range h)
               :when (= :e (get-in (:board state) [y x]))]
           [y x]))
       (make-move [game
                   {:keys [to-move board]}
                   move]
         {:to-move (if (= :o to-move) :x :o)
          :board (assoc-in board move to-move)
          :utility (calculate-utility board move player)})
       (utility [game state player]
         (:utility state))
       (terminal-test [game state]
         (or (not= 0 (:utility state))
             (empty? (moves game state))))
       (to-move [game state]
         (:to-move state))
       (display [game state]
         (clojure.pprint/pprint (:board state))))))