"use client"

import { useState, useEffect, useCallback } from "react"
import { ArrowUp, ArrowDown, Trophy, RotateCcw } from "lucide-react"

interface Coin {
  id: string
  symbol: string
  name: string
  image: string
  marketCap: number
  price: number
  rank: number
}

const formatMcap = (n: number) => {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  return `$${n.toLocaleString()}`
}

const pickTwo = (coins: Coin[], exclude?: string): [Coin, Coin] => {
  const pool = exclude ? coins.filter(c => c.id !== exclude) : coins
  const i = Math.floor(Math.random() * pool.length)
  let j = Math.floor(Math.random() * (pool.length - 1))
  if (j >= i) j++
  return [pool[i], pool[j]]
}

type GameState = "playing" | "correct" | "wrong" | "loading"

export default function Home() {
  const [coins, setCoins] = useState<Coin[]>([])
  const [left, setLeft] = useState<Coin | null>(null)
  const [right, setRight] = useState<Coin | null>(null)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [state, setState] = useState<GameState>("loading")
  const [showMcap, setShowMcap] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("hl-highscore")
    if (saved) setHighScore(parseInt(saved))
    fetch("/api/coins")
      .then(r => r.json())
      .then((data: Coin[]) => {
        setCoins(data)
        const [a, b] = pickTwo(data)
        setLeft(a)
        setRight(b)
        setState("playing")
      })
  }, [])

  const handleGuess = useCallback((guess: "higher" | "lower") => {
    if (!left || !right || state !== "playing") return

    const rightIsHigher = right.marketCap >= left.marketCap
    const isCorrect = (guess === "higher" && rightIsHigher) || (guess === "lower" && !rightIsHigher)

    setShowMcap(true)

    if (isCorrect) {
      setState("correct")
      const newScore = score + 1
      setScore(newScore)
      if (newScore > highScore) {
        setHighScore(newScore)
        localStorage.setItem("hl-highscore", String(newScore))
      }

      setTimeout(() => {
        setShowMcap(false)
        setLeft(right)
        const pool = coins.filter(c => c.id !== right.id)
        const next = pool[Math.floor(Math.random() * pool.length)]
        setRight(next)
        setState("playing")
      }, 1200)
    } else {
      setState("wrong")
    }
  }, [left, right, state, score, highScore, coins])

  const restart = () => {
    setScore(0)
    setShowMcap(false)
    const [a, b] = pickTwo(coins)
    setLeft(a)
    setRight(b)
    setState("playing")
  }

  if (state === "loading" || !left || !right) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-lg">Loading cryptos...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <h1 className="text-lg font-bold">📊 Higher Lower</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-sm">
            <Trophy className="size-4 text-yellow-500" />
            <span className="text-yellow-500 font-bold">{highScore}</span>
          </div>
          <div className="text-sm">
            Score: <span className="font-bold text-white">{score}</span>
          </div>
        </div>
      </div>

      {/* Game area */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left coin — known */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-b md:border-b-0 md:border-r border-white/5">
          <img src={left.image} alt={left.name} className="size-20 rounded-full mb-4" />
          <h2 className="text-2xl font-bold text-white">{left.name}</h2>
          <span className="text-gray-500 text-sm">{left.symbol}</span>
          <div className="mt-3 text-xl font-bold text-blue-400">{formatMcap(left.marketCap)}</div>
          <span className="text-xs text-gray-600 mt-1">Market Cap</span>
        </div>

        {/* VS badge */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden md:flex">
          <div className="bg-gray-900 border border-white/10 rounded-full size-14 flex items-center justify-center text-lg font-black text-white shadow-lg">
            VS
          </div>
        </div>
        <div className="md:hidden flex justify-center -my-3 z-20 relative">
          <div className="bg-gray-900 border border-white/10 rounded-full size-10 flex items-center justify-center text-sm font-black text-white shadow-lg">
            VS
          </div>
        </div>

        {/* Right coin — guess */}
        <div className={`flex-1 flex flex-col items-center justify-center p-6 transition-all duration-300 ${
          state === "correct" ? "bg-green-500/5 animate-pulse-green" :
          state === "wrong" ? "bg-red-500/5 animate-shake" :
          "bg-gradient-to-bl from-orange-500/5 to-pink-500/5"
        }`}>
          <img src={right.image} alt={right.name} className="size-20 rounded-full mb-4" />
          <h2 className="text-2xl font-bold text-white">{right.name}</h2>
          <span className="text-gray-500 text-sm">{right.symbol}</span>

          {/* Market cap reveal */}
          {showMcap ? (
            <div className="mt-3 animate-count-up">
              <div className={`text-xl font-bold ${state === "correct" ? "text-green-400" : "text-red-400"}`}>
                {formatMcap(right.marketCap)}
              </div>
              <span className="text-xs text-gray-600">Market Cap</span>
            </div>
          ) : (
            <div className="mt-3 text-gray-600 text-sm">has a market cap that is...</div>
          )}

          {/* Buttons */}
          {state === "playing" && (
            <div className="flex gap-3 mt-6 animate-slide-up">
              <button
                onClick={() => handleGuess("higher")}
                className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 font-bold rounded-2xl px-8 py-3 text-lg transition-all hover:scale-105 active:scale-95"
              >
                <ArrowUp className="size-5" /> Higher
              </button>
              <button
                onClick={() => handleGuess("lower")}
                className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-bold rounded-2xl px-8 py-3 text-lg transition-all hover:scale-105 active:scale-95"
              >
                <ArrowDown className="size-5" /> Lower
              </button>
            </div>
          )}

          {/* Game over */}
          {state === "wrong" && (
            <div className="mt-6 flex flex-col items-center gap-3 animate-slide-up">
              <div className="text-red-400 font-bold text-lg">Wrong! 💀</div>
              <div className="text-gray-400 text-sm">
                Final score: <span className="text-white font-bold">{score}</span>
              </div>
              <button
                onClick={restart}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl px-8 py-3 transition-all hover:scale-105"
              >
                <RotateCcw className="size-4" /> Play Again
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-2 text-xs text-gray-700 border-t border-white/5">
        Data from CoinGecko • Top 100 cryptos by market cap • Prices update every 5min
      </div>
    </main>
  )
}
