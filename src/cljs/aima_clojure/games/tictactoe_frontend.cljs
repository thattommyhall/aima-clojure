(ns aima-clojure.tictactoe-frontend
  (:require [clojure.string :as string]
            [goog.dom :as dom]
            [aima-clojure.games.tic-tac-toe :as ttt]
            [aima-clojure.game :as game]
            ))

(defn log [str]
  (js* "console.log(~{str})"))

(defn ctx []
  (let [surface (dom/getElement "board")]
    [(.getContext surface "2d")
     (. surface -width)
     (. surface -height)]))

(defn fill-rect [[surface] [x y width height] [r g b]]
  (set! (. surface -fillStyle) (str "rgb(" r "," g "," b ")"))
  (.fillRect surface x y width height))

(defn stroke-rect [[surface] [x y width height] line-width [r g b]]
  (set! (. surface -strokeStyle) (str "rgb(" r "," g "," b ")"))
  (set! (. surface -lineWidth) line-width)
  (.strokeRect surface x y width height))

(defn fill-circle [[surface] coords [r g b]]
  (let [[x y d] coords]
    (set! (. surface -fillStyle) (str "rgb(" r "," g "," b ")"))
    (. surface (beginPath))
    (.arc surface x y d 0 (* 2 Math/PI) true)
    (. surface (closePath))
    (. surface (fill))))

(def tic-tac-toe (ttt/tic-tac-toe))
(def make-move game/make-move)
(def minimax-decision game/minimax-decision)
(defn tests []

  (log (= (make-move tic-tac-toe
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
  (log (= (make-move tic-tac-toe
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
           :utility 1}))
  
  
  

  (log (= (minimax-decision tic-tac-toe
                            {:to-move :x
                             :board [[:x :e :e]
                                     [:o :o :e]
                                     [:x :e :e]]
                             :utility 0
                             })
          [1 2]))
  (log (= (minimax-decision tic-tac-toe
                            {:to-move :x
                             :board [[:o :e :x]
                                     [:e :x :e]
                                     [:o :x :e]]
                             :utility 0})
          [0 1]))
  (log (= (minimax-decision tic-tac-toe
                            {:to-move :o
                             :board [[:o :e :o]
                                     [:x :x :o]
                                     [:x :e :x]]
                             :utility 0})
          [0 1]))
  (log (= (minimax-decision tic-tac-toe
                            {:to-move :o
                             :board [[:x :x :o]
                                     [:e :o :x]
                                     [:e :o :x]]
                             :utility 0})
          [2 0]))
  (log (= (minimax-decision tic-tac-toe
                            {:to-move :o
                             :board [[:o :e :o]
                                     [:x :x :o]
                                     [:x :e :x]]
                             :utility 0})
          [0 1])))

(defn ^:export playGame []
  (let [board (ctx)]
    (fill-rect board [0 0 30 20] [255 255 255])))


(tests)

  ;; (playGame)