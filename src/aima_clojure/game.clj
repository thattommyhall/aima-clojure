(ns aima-clojure.game
  (:require [clojure.pprint]))

(defprotocol Game
  (moves [game state])
  (make-move [game state move])
  (utility [game state player])
  (terminal-test [game state])
  (to-move [game state])
  (display [game state]))

(declare min-value)
(defn max-value [game state]
  (if (terminal-test game state)
    (utility game state (to-move game state))
    (apply max
     (map
      #(min-value game (make-move game state %))
      (moves game state)))))
  
(defn min-value [game state]
  (if (terminal-test game state)
    (utility game state (to-move game state))
    (apply min
     (map
      #(max-value game (make-move game state %))
      (moves game state)))))

(defn minimax-decision [game state]
  (apply max-key #(min-value (make-move game state %))
         (moves game state)))

(def eg-game {:to-move :p1
              :moves #{:a :b :c}})

(defrecord Tic []
  Game
  (moves [game state]
    (:moves state))
  (make-move [game state move]
    {:to-move (if (= (:to-move state)
                     :p1)
                :p2
                :p1)
     :moves (disj (:moves state) move)})
  (utility [game state player]
    (if (= (to-move game state) :a)
      1
      -1))
  (terminal-test [game state]
    (empty? (:moves state)))
  (to-move [game state]
    (:to-move state))
  (display [game state]
    (clojure.pprint/pprint (:moves state))))


