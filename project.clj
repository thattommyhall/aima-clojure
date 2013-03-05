(defproject aima-clojure "0.1.0-SNAPSHOT"
  :description "FIXME: write description"
  :url "http://example.com/FIXME"
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}
  :dependencies [[org.clojure/clojure "1.4.0"]
                 [org.clojure/test.generative "0.1.4"]
                 [org.clojure/data.generators "0.1.0"]
                 [org.clojure/clojurescript "0.0-1586"]
                 ]
  :plugins [[lein-cljsbuild "0.3.0"]]
  :source-paths ["src/clj"]             
  :cljsbuild {
              :crossovers [aima-clojure.game aima-clojure.games.tic-tac-toe]
              :crossover-path "crossover-cljs"
              :test-commands
              {"ttt" ["phantomjs" "public/games-dev.js" ""]}
              :builds {
                       :dev
                       {:source-paths ["src/cljs"]
                        :compiler {:output-to "public/games-dev.js"
                                   :optimizations :whitespace
                                   :pretty-print true}}
                       :prod
                       {:source-paths ["src/cljs"]
                        :compiler {:output-to "public/games.js"
                                   :optimizations :advanced
                                   }}}})