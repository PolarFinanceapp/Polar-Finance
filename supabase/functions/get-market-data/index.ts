// deno-lint-ignore-file
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const POLYGON = (globalThis as any).Deno.env.get('POLYGON_KEY') ?? ''
const FINNHUB = (globalThis as any).Deno.env.get('FINNHUB_KEY') ?? ''

const CACHE_TTL_MS = 5 * 60 * 1000

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TOP_STOCKS = ['AAPL', 'NVDA', 'GOOGL', 'META', 'AMZN']
const TOP_COMMODITIES = ['GLD', 'USO', 'SLV']
const TOP_CRYPTO = ['bitcoin', 'ethereum', 'solana', 'ripple', 'cardano']
const commodityNames: Record<string, string> = { GLD: 'Gold', USO: 'Oil', SLV: 'Silver' }

let cache: { data: Record<string, unknown>; ts: number } | null = null

// Fetch with a timeout so hanging API calls don't block everything
async function fetchWithTimeout(url: string, ms = 5000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

async function getStockQuote(symbol: string) {
  try {
    const r = await fetchWithTimeout(
      `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${POLYGON}`
    )
    const d = await r.json()
    const result = d?.results?.[0]
    if (!result) return { symbol, price: 0, change: 0 }
    const price = result.c ?? 0
    const open = result.o ?? price
    const change = open > 0 ? ((price - open) / open) * 100 : 0
    return { symbol, price, change: Math.round(change * 100) / 100 }
  } catch {
    return { symbol, price: 0, change: 0 }
  }
}

async function getSignals(symbol: string) {
  const intervals: Record<string, string> = {
    '15': '15m', '30': '30m', '60': '1h', '240': '4h', 'D': '1d',
  }
  const results: Record<string, unknown> = {}
  await Promise.all(
    Object.entries(intervals).map(async ([res, label]) => {
      try {
        const r = await fetchWithTimeout(
          `https://finnhub.io/api/v1/scan/technical-indicator?symbol=${symbol}&resolution=${res}&token=${FINNHUB}`
        )
        const d = await r.json()
        results[label] = {
          signal: d?.technicalAnalysis?.signal ?? 'neutral',
          buy: d?.summary?.buy ?? 0,
          sell: d?.summary?.sell ?? 0,
          neutral: d?.summary?.neutral ?? 0,
        }
      } catch {
        results[label] = { signal: 'neutral', buy: 0, sell: 0, neutral: 0 }
      }
    })
  )
  return results
}

async function getRecommendation(symbol: string) {
  try {
    const r = await fetchWithTimeout(
      `https://finnhub.io/api/v1/stock/recommendation?symbol=${symbol}&token=${FINNHUB}`
    )
    const d = await r.json()
    const latest = d?.[0]
    if (!latest) return { rating: 'Hold', strongBuy: 0, buy: 0, hold: 0, sell: 0, strongSell: 0 }
    const total = latest.strongBuy + latest.buy + latest.hold + latest.sell + latest.strongSell
    const score = total > 0
      ? (latest.strongBuy * 2 + latest.buy - latest.sell - latest.strongSell * 2) / total
      : 0
    return {
      rating: score > 0.5 ? 'Strong Buy' : score > 0.1 ? 'Buy' : score < -0.5 ? 'Strong Sell' : score < -0.1 ? 'Sell' : 'Hold',
      strongBuy: latest.strongBuy,
      buy: latest.buy,
      hold: latest.hold,
      sell: latest.sell,
      strongSell: latest.strongSell,
    }
  } catch {
    return { rating: 'Hold', strongBuy: 0, buy: 0, hold: 0, sell: 0, strongSell: 0 }
  }
}

async function getCrypto() {
  try {
    const r = await fetchWithTimeout(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=gbp&ids=${TOP_CRYPTO.join(',')}&order=market_cap_desc&per_page=5&page=1&sparkline=false&price_change_percentage=24h`
    )
    const d = await r.json()
    if (!Array.isArray(d)) return []
    return d.map((c: Record<string, unknown>) => ({
      symbol: String(c.symbol ?? '').toUpperCase(),
      name: c.name,
      price: c.current_price,
      change: c.price_change_percentage_24h,
      marketCap: c.market_cap,
    }))
  } catch {
    return []
  }
}

async function fetchFresh(): Promise<Record<string, unknown>> {
  // All quotes + crypto in parallel
  const [stockQuotes, commodityQuotes, crypto] = await Promise.all([
    Promise.all(TOP_STOCKS.map(getStockQuote)),
    Promise.all(TOP_COMMODITIES.map(getStockQuote)),
    getCrypto(),
  ])

  // Signals + recommendations for top 3 stocks — all in parallel
  const top3 = TOP_STOCKS.slice(0, 3)
  const [signalResults, recResults] = await Promise.all([
    Promise.all(top3.map(s => getSignals(s))),
    Promise.all(top3.map(s => getRecommendation(s))),
  ])

  const stocks = stockQuotes.map((q, i) => ({
    ...q,
    type: 'stock',
    signals: i < 3 ? signalResults[i] : null,
    recommendation: i < 3 ? recResults[i] : null,
  }))

  const commodities = commodityQuotes.map(q => ({
    ...q,
    type: 'commodity',
    name: commodityNames[q.symbol] ?? q.symbol,
    signals: null,
    recommendation: null,
  }))

  return { stocks, commodities, crypto }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const now = Date.now()

    // Cache hit — return immediately
    if (cache && now - cache.ts < CACHE_TTL_MS) {
      return new Response(JSON.stringify({ ...cache.data, cached: true }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    // Stale cache — return stale immediately, refresh in background
    if (cache) {
      fetchFresh()
        .then(data => { cache = { data, ts: Date.now() } })
        .catch(() => { })
      return new Response(JSON.stringify({ ...cache.data, cached: true, stale: true }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    // No cache — fetch fresh and wait
    const data = await fetchFresh()
    cache = { data, ts: now }

    return new Response(JSON.stringify({ ...data, cached: false }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })

  } catch (err: unknown) {
    // On error, return stale cache if available rather than failing
    if (cache) {
      return new Response(JSON.stringify({ ...cache.data, cached: true, stale: true }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})