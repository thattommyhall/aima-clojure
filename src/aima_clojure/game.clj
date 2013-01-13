(ns aima-clojure.game)

(defprotocol GAME
  (legal-moves [game state])
  (make-move [game state move])
  (utility [game state player])
  (terminal-test [game state])
  (to-move [game state])
  (display [game state])
  (successors [game state]))

