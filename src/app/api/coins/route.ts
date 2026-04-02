import { NextResponse } from "next/server"

export const revalidate = 300

interface CoinGeckoItem {
  id: string
  symbol: string
  name: string
  image: string
  market_cap: number
  current_price: number
  market_cap_rank: number
}

async function getKrakenSymbols(): Promise<Set<string>> {
  try {
    const res = await fetch("https://api.kraken.com/0/public/AssetPairs", { next: { revalidate: 3600 } })
    const data = await res.json()
    const pairs = data.result || {}
    const symbols = new Set<string>()
    for (const v of Object.values(pairs) as Array<{ base?: string }>) {
      let base = (v.base || "").toUpperCase()
      // Kraken prefixes some assets with X/Z
      if (base.startsWith("X") && base.length > 3) base = base.slice(1)
      if (base.startsWith("Z") && base.length > 3) base = base.slice(1)
      symbols.add(base)
    }
    return symbols
  } catch {
    return new Set()
  }
}

export async function GET() {
  try {
    const [cgRes, krakenSymbols] = await Promise.all([
      fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=200&page=1&sparkline=false",
        { next: { revalidate: 300 } }
      ),
      getKrakenSymbols(),
    ])

    if (!cgRes.ok) throw new Error("CoinGecko API error")

    const data: CoinGeckoItem[] = await cgRes.json()

    const coins = data
      .filter(c => c.market_cap > 0 && krakenSymbols.has(c.symbol.toUpperCase()))
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
