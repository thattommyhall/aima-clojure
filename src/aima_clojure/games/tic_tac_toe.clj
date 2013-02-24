(ns aima-clojure.games.tic-tac-toe
  (:use aima-clojure.game))

(defn line [{:keys [to-move board] :as state}
            [y x :as move]
            [y-diff x-diff :as direction]]
  (map (fn [n]
         [(+ y (* y-diff n))
          (+ x (* x-diff n))
          ])
       (iterate inc 1)))

(defn k-in-row? [{:keys [to-move board] :as state}
                 move
                 [y-diff x-diff :as direction]
                 k]
  (let [opposite-direction [(- y-diff) (- x-diff)]]
    (>= (count
         (concat
          (take-while #(= to-move (get-in board %)) (line state move direction))
          (take-while #(= to-move (get-in board %)) (line state move opposite-direction))))
        (dec k))))

(defn calculate-utility [{:keys [to-move] :as state}
                         move
                         k]
  (if (some #(k-in-row? state move % k)
            [[0 1] [1 0] [1 -1] [1 1]])
    (if (= to-move :x) 1 -1)
    0))
  
(def s {:to-move :x
        :board [[:o :e :x]
                [:e :x :e]
                [:o :x :e]]
        :utility 0})

(take 5 (line s [0 1] [0 1]))
(calculate-utility s [0 1] 3)


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
                   {:keys [to-move board] :as state}
                   move]
         {:to-move (if (= :o to-move) :x :o)
          :board (assoc-in board move to-move)
          :utility (calculate-utility state move k)})
       (utility [game state player]
         (:utility state))
       (terminal-test [game state]
         (or (not= 0 (:utility state))
             (empty? (moves game state))))
       (to-move [game state]
         (:to-move state))
       (display [game state]
         (clojure.pprint/pprint (:board state)))
       (initial [game] {:to-move :x
                        :board [[:e :e :e]
                                [:e :e :e]
                                [:e :e :e]]
                        :utility 0})
       )))

(defn -main []
  (println (take 3 (line s
                         [2 0]
                         [-1 0]))
           ))