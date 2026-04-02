"use client"

import { useState, useEffect, useCallback } from "react"
import { ArrowUp, ArrowDown, Trophy, RotateCcw, Zap } from "lucide-react"

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

type GameState = "playing" | "correct" | "wrong" | "loading"

export default function Home() {
  const [coins, setCoins] = useState<Coin[]>([])
  const [left, setLeft] = useState<Coin | null>(null)
  const [right, setRight] = useState<Coin | null>(null)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [state, setState] = useState<GameState>("loading")
  const [showMcap, setShowMcap] = useState(false)
  const [streak, setStreak] = useState(0)
  const [lives, setLives] = useState(3)

  useEffect(() => {
    const saved = localStorage.getItem("hl-highscore")
    if (saved) setHighScore(parseInt(saved))
    fetch("/api/coins")
      .then(r => r.json())
      .then((data: Coin[]) => {
        setCoins(data)
        const i = Math.floor(Math.random() * data.length)
        let j = Math.floor(Math.random() * (data.length - 1))
        if (j >= i) j++
        setLeft(data[i])
        setRight(data[j])
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
      setStreak(s => s + 1)
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
      setStreak(0)
      const newLives = lives - 1
      setLives(newLives)

      if (newLives <= 0) {
        // Game over — stay on wrong state
        return
      }

      // Continue playing after showing the answer
      setTimeout(() => {
        setShowMcap(false)
        setLeft(right)
        const pool = coins.filter(c => c.id !== right.id)
        const next = pool[Math.floor(Math.random() * pool.length)]
        setRight(next)
        setState("playing")
      }, 1200)
    }
  }, [left, right, state, score, highScore, coins, lives])

  const restart = () => {
    setScore(0)
    setStreak(0)
    setLives(3)
    setShowMcap(false)
    const i = Math.floor(Math.random() * coins.length)
    let j = Math.floor(Math.random() * (coins.length - 1))
    if (j >= i) j++
    setLeft(coins[i])
    setRight(coins[j])
    setState("playing")
  }

  if (state === "loading" || !left || !right) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          <span className="text-gray-500 text-sm">Loading top 100 cryptos...</span>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background blobs — VenaLabs style */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/[0.04] blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-purple-600/[0.03] blur-[80px]" />
        <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full bg-indigo-500/[0.02] blur-[60px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 glass border-b border-violet-500/10">
        <div className="flex items-center justify-between px-5 py-3 max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <Zap className="size-5 text-violet-400" />
            <span className="font-bold text-sm tracking-tight">Higher Lower</span>
            <span className="text-[10px] text-violet-400/60 bg-violet-500/10 px-1.5 py-0.5 rounded-full font-medium">CRYPTO</span>
          </div>
          <div className="flex items-center gap-4">
            {streak >= 3 && (
              <span className="text-xs bg-orange-500/15 text-orange-400 px-2 py-0.5 rounded-full font-medium animate-slide-up">
                🔥 {streak} streak
              </span>
            )}
            <div className="flex items-center gap-1 text-sm">
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className={`transition-opacity ${i < lives ? "opacity-100" : "opacity-20"}`}>❤️</span>
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Trophy className="size-3.5 text-yellow-500" />
              <span className="text-yellow-500/80 font-semibold">{highScore}</span>
            </div>
            <div className="glass-strong rounded-full px-3 py-1 text-xs font-bold">{score}</div>
          </div>
        </div>
      </header>

      {/* Game area */}
      <div className="flex-1 flex flex-col md:flex-row relative z-10">
        {/* Left — known coin */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 gradient-purple">
          <div className="flex flex-col items-center gap-4 animate-slide-up">
            <div className="relative">
              <div className="absolute inset-0 bg-violet-500/20 rounded-full blur-xl scale-125" />
              <img src={left.image} alt={left.name} className="relative size-24 rounded-full ring-2 ring-violet-500/20" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold">{left.name}</h2>
              <span className="text-violet-400/60 text-sm font-medium">{left.symbol}</span>
            </div>
            <div className="glass-strong rounded-2xl px-5 py-2.5 text-center">
              <div className="text-xl font-bold text-violet-300">{formatMcap(left.marketCap)}</div>
              <div className="text-[10px] text-violet-400/40 uppercase tracking-wider mt-0.5">Market Cap</div>
            </div>
          </div>
        </div>

        {/* VS badge */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 hidden md:flex">
          <div className="glass-strong rounded-full size-16 flex items-center justify-center shadow-lg shadow-violet-500/10 animate-float">
            <span className="text-lg font-black text-violet-300">VS</span>
          </div>
        </div>
        <div className="md:hidden flex justify-center -my-4 z-30 relative">
          <div className="glass-strong rounded-full size-11 flex items-center justify-center shadow-lg shadow-violet-500/10">
            <span className="text-xs font-black text-violet-300">VS</span>
          </div>
        </div>

        {/* Right — guess coin */}
        <div className={`flex-1 flex flex-col items-center justify-center p-8 transition-all duration-500 ${
          state === "correct" ? "gradient-green animate-pulse-glow" :
          state === "wrong" ? "gradient-red animate-shake" :
          "gradient-purple"
        }`}>
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className={`absolute inset-0 rounded-full blur-xl scale-125 transition-colors duration-500 ${
                state === "correct" ? "bg-green-500/20" :
                state === "wrong" ? "bg-red-500/20" :
                "bg-violet-500/20"
              }`} />
              <img src={right.image} alt={right.name} className={`relative size-24 rounded-full ring-2 transition-colors duration-500 ${
                state === "correct" ? "ring-green-500/30" :
                state === "wrong" ? "ring-red-500/30" :
                "ring-violet-500/20"
              }`} />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold">{right.name}</h2>
              <span className="text-violet-400/60 text-sm font-medium">{right.symbol}</span>
            </div>

            {showMcap ? (
              <div className="glass-strong rounded-2xl px-5 py-2.5 text-center animate-count-reveal">
                <div className={`text-xl font-bold ${state === "correct" ? "text-green-400" : "text-red-400"}`}>
                  {formatMcap(right.marketCap)}
                </div>
                <div className="text-[10px] text-violet-400/40 uppercase tracking-wider mt-0.5">Market Cap</div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 text-center">has a market cap that is...</div>
            )}

            {/* Action buttons */}
            {state === "playing" && (
              <div className="flex gap-3 mt-2 animate-slide-up">
                <button
                  onClick={() => handleGuess("higher")}
                  className="flex items-center gap-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 hover:border-green-500/40 text-green-400 font-bold rounded-xl px-6 py-3 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
                >
                  <ArrowUp className="size-4" /> Higher
                </button>
                <button
                  onClick={() => handleGuess("lower")}
                  className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 font-bold rounded-xl px-6 py-3 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
                >
                  <ArrowDown className="size-4" /> Lower
                </button>
              </div>
            )}

            {/* Game over — 0 lives */}
            {state === "wrong" && lives <= 0 && (
              <div className="flex flex-col items-center gap-4 mt-2 animate-slide-up">
                <div className="text-center">
                  <div className="text-red-400 font-bold text-lg">Game Over 💀</div>
                  <div className="text-gray-500 text-sm mt-1">
                    Final score: <span className="text-white font-bold">{score}</span>
                  </div>
                </div>
                <button
                  onClick={restart}
                  className="flex items-center gap-2 glass-strong hover:bg-violet-500/15 text-white font-bold rounded-xl px-6 py-3 transition-all duration-200 hover:scale-[1.03]"
                >
                  <RotateCcw className="size-4" /> Play Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 glass border-t border-violet-500/10 text-center py-2 px-4">
        <span className="text-[11px] text-gray-600">Top 100 cryptos by market cap • CoinGecko • Prices refresh every 5min</span>
      </footer>
    </main>
  )
}
