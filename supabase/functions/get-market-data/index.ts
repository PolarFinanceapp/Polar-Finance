import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ALPHA   = Deno.env.get('ALPHA_VANTAGE_KEY')!
const FINNHUB = Deno.env.get('FINNHUB_KEY')!

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TOP_STOCKS      = ['AAPL','TSLA','NVDA']
const TOP_COMMODITIES = ['GLD','USO','SLV']
const TOP_CRYPTO      = ['bitcoin','ethereum','solana','ripple','cardano']

const commodityNames: Record<string, string> = { GLD: 'Gold', USO: 'Oil', SLV: 'Silver' }

async function getStockQuote(symbol: string) {
  try {
    const r = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA}`)
    const d = await r.json()
    const q = d['Global Quote']
    if (!q || !q['05. price']) return { symbol, price: 0, change: 0 }
    return {
      symbol,
      price:  parseFloat(q['05. price']),
      change: parseFloat(q['10. change percent']?.replace('%','') || '0'),
    }
  } catch {
    return { symbol, price: 0, change: 0 }
  }
}

async function getSignals(symbol: string) {
  const intervals: Record<string, string> = { '15': '15m', '30': '30m', '60': '1h', '240': '4h', 'D': '1d' }
  const results: Record<string, any> = {}
  await Promise.all(
    Object.entries(intervals).map(async ([res, label]) => {
      try {
        const r = await fetch(`https://finnhub.io/api/v1/scan/technical-indicator?symbol=${symbol}&resolution=${res}&token=${FINNHUB}`)
        const d = await r.json()
        results[label] = {
          signal:  d?.technicalAnalysis?.signal || 'neutral',
          buy:     d?.summary?.buy     || 0,
          sell:    d?.summary?.sell    || 0,
          neutral: d?.summary?.neutral || 0,
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
    const r = await fetch(`https://finnhub.io/api/v1/stock/recommendation?symbol=${symbol}&token=${FINNHUB}`)
    const d = await r.json()
    const latest = d?.[0]
    if (!latest) return { rating: 'Hold', strongBuy: 0, buy: 0, hold: 0, sell: 0, strongSell: 0 }
    const total = latest.strongBuy + latest.buy + latest.hold + latest.sell + latest.strongSell
    const score = total > 0 ? (latest.strongBuy * 2 + latest.buy - latest.sell - latest.strongSell * 2) / total : 0
    return {
      rating: score > 0.5 ? 'Strong Buy' : score > 0.1 ? 'Buy' : score < -0.5 ? 'Strong Sell' : score < -0.1 ? 'Sell' : 'Hold',
      strongBuy: latest.strongBuy, buy: latest.buy, hold: latest.hold,
      sell: latest.sell, strongSell: latest.strongSell,
    }
  } catch {
    return { rating: 'Hold', strongBuy: 0, buy: 0, hold: 0, sell: 0, strongSell: 0 }
  }
}

async function getCrypto() {
  try {
    const r = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=gbp&ids=${TOP_CRYPTO.join(',')}&order=market_cap_desc&per_page=5&page=1&sparkline=false&price_change_percentage=24h`)
    const d = await r.json()
    if (!Array.isArray(d)) return []
    return d.map((c: any) => ({
      symbol:    c.symbol.toUpperCase(),
      name:      c.name,
      price:     c.current_price,
      change:    c.price_change_percentage_24h,
      marketCap: c.market_cap,
    }))
  } catch {
    return []
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    // Fetch all quotes, signals, recommendations and crypto in parallel
    const [stockQuotes, commodityQuotes, crypto] = await Promise.all([
      Promise.all(TOP_STOCKS.map(getStockQuote)),
      Promise.all(TOP_COMMODITIES.map(getStockQuote)),
      getCrypto(),
    ])

    const [signals, recommendations] = await Promise.all([
      Promise.all(TOP_STOCKS.map(s => getSignals(s))),
      Promise.all(TOP_STOCKS.map(s => getRecommendation(s))),
    ])

    const stocks = stockQuotes.map((q, i) => ({
      ...q,
      type: 'stock',
      signals: signals[i],
      recommendation: recommendations[i],
    }))

    const commodities = commodityQuotes.map(q => ({
      ...q,
      type: 'commodity',
      name: commodityNames[q.symbol] || q.symbol,
      signals: null,
      recommendation: null,
    }))

    return new Response(JSON.stringify({ stocks, commodities, crypto }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})