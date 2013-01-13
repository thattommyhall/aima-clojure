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
  (apply max-key #(min-value game (make-move game state %))
         (moves game state)))



