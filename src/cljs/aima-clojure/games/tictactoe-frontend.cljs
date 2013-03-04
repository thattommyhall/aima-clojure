(ns aima-clojure.tictactoe-frontend
  (:require [clojure.string :as string]
            [goog.dom :as dom]
            [aima-clojure.games.tic-tac-toe :as ttt]
           
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

(def g (ttt/tic-tac-toe))

(defn ^:export playGame []
  (let [board (ctx)]    
    (fill-rect board [0 0 30 20] [255 255 255])))


(playGame)