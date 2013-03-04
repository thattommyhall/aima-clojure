(ns aima-clojure.game)

(defprotocol Game
  (moves [game state])
  (make-move [game state move])
  (utility [game state player])
  (terminal-test [game state])
  (to-move [game state])
  (display [game state])
  (initial [game]))

(declare min-value)
(defn max-value [game state player]
  (if (terminal-test game state)
    (utility game state player)
    (apply max
           (map
            #(min-value game (make-move game state %) player)
            (moves game state)))))

(defn min-value [game state player]
  (if (terminal-test game state)
    (utility game state player)
    (apply min
           (map
            #(max-value game (make-move game state %) player)
            (moves game state)))))

(defn minimax-decision [game state]
  (let [player (to-move game state)]
    (apply max-key #(min-value game (make-move game state %) player)
           (moves game state))))

