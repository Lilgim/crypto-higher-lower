import { NextResponse } from "next/server"

export const revalidate = 300 // cache 5 minutes

interface CoinGeckoItem {
  id: string
  symbol: string
  name: string
  image: string
  market_cap: number
  current_price: number
  market_cap_rank: number
}

export async function GET() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false",
      { next: { revalidate: 300 } }
    )
    
    if (!res.ok) throw new Error("CoinGecko API error")

    const data: CoinGeckoItem[] = await res.json()

    const coins = data
      .filter(c => c.market_cap > 0)
      .map(c => ({
        id: c.id,
        symbol: c.symbol.toUpperCase(),
        name: c.name,
        image: c.image,
        marketCap: c.market_cap,
        price: c.current_price,
        rank: c.market_cap_rank,
      }))

    return NextResponse.json(coins)
  } catch {
    return NextResponse.json({ error: "Failed to fetch coins" }, { status: 500 })
  }
}
