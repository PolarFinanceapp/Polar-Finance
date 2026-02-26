import { usePlan } from '@/context/PlanContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

type Signal = { signal: string; buy: number; sell: number; neutral: number };
type Signals = { '15m'?: Signal; '30m'?: Signal; '1h'?: Signal; '4h'?: Signal; '1d'?: Signal };
type Recommendation = { rating: string; strongBuy: number; buy: number; hold: number; sell: number; strongSell: number };

type StockItem = {
  symbol: string; name?: string; price: number; change: number;
  type: 'stock' | 'commodity'; signals: Signals | null; recommendation: Recommendation | null;
};

type CryptoItem = {
  symbol: string; name: string; price: number; change: number; marketCap: number;
};

const TIMEFRAMES = ['15m','30m','1h','4h','1d'] as const;

const signalColor = (s: string, accent: string) =>
  s === 'buy' || s === 'strong_buy'   ? '#00D4AA' :
  s === 'sell' || s === 'strong_sell' ? '#FF6B6B' : accent;

const signalLabel = (s: string) =>
  s === 'buy'         ? 'BUY'         :
  s === 'strong_buy'  ? 'STRONG BUY'  :
  s === 'sell'        ? 'SELL'        :
  s === 'strong_sell' ? 'STRONG SELL' : 'NEUTRAL';

const ratingColor = (r: string) =>
  r.includes('Buy')  ? '#00D4AA' :
  r.includes('Sell') ? '#FF6B6B' : '#FFD700';

const cryptoIcon = (symbol: string) =>
  symbol === 'BTC' ? '₿' : symbol === 'ETH' ? '⟠' :
  symbol === 'SOL' ? '◎' : symbol === 'XRP' ? '✕' : '🪙';

export default function ExploreScreen() {
  const { theme: c } = useTheme();
  const { hasFeature } = usePlan();

  const [tab, setTab]               = useState<'stocks'|'commodities'|'crypto'>('stocks');
  const [stocks, setStocks]         = useState<StockItem[]>([]);
  const [commodities, setCommodities] = useState<StockItem[]>([]);
  const [crypto, setCrypto]         = useState<CryptoItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [disclaimer, setDisclaimer] = useState(true);

  const fetchData = async () => {
    try {
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/get-market-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setStocks(data.stocks || []);
      setCommodities(data.commodities || []);
      setCrypto(data.crypto || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load market data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  if (!hasFeature('investmentTracking')) {
    return (
      <View style={{ flex: 1, backgroundColor: c.dark, justifyContent: 'center', alignItems: 'center', padding: 30 }}>
        <Text style={{ fontSize: 60, marginBottom: 16 }}>📈</Text>
        <Text style={{ color: c.text, fontSize: 22, fontWeight: '900', marginBottom: 8, textAlign: 'center' }}>Live Market Signals</Text>
        <Text style={{ color: c.muted, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>
          Get live trading signals, analyst forecasts and trending picks for stocks, commodities and crypto.{'\n'}Available on Premium and above.
        </Text>
        <TouchableOpacity style={{ backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center', width: '100%' }}>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>👑 Upgrade to Premium — £7.99/mo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.dark, paddingHorizontal: 20 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} />}>

      <Text style={{ color: c.text, fontSize: 26, fontWeight: '900', marginTop: 60, marginBottom: 6 }}>Markets 📈</Text>
      <Text style={{ color: c.muted, fontSize: 13, marginBottom: 20 }}>Live signals · Pull to refresh</Text>

      {/* Disclaimer */}
      {disclaimer && (
        <View style={{ backgroundColor: '#FFD70022', borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#FFD70055', flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <Text style={{ fontSize: 20 }}>⚠️</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#FFD700', fontSize: 13, fontWeight: '700', marginBottom: 4 }}>Not Financial Advice</Text>
            <Text style={{ color: c.muted, fontSize: 12, lineHeight: 18 }}>
              Trading signals and forecasts shown here are for informational purposes only. Polar Finance is not a financial advisor. Always do your own research before investing. Capital at risk.
            </Text>
          </View>
          <TouchableOpacity onPress={() => setDisclaimer(false)}>
            <Text style={{ color: c.muted, fontSize: 18 }}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tab Switcher */}
      <View style={{ flexDirection: 'row', backgroundColor: c.card, borderRadius: 50, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: c.border }}>
        {(['stocks','commodities','crypto'] as const).map(t => (
          <TouchableOpacity key={t} style={{ flex: 1, paddingVertical: 8, borderRadius: 50, alignItems: 'center', backgroundColor: tab === t ? c.accent : 'transparent' }} onPress={() => setTab(t)}>
            <Text style={{ color: tab === t ? '#fff' : c.muted, fontSize: 12, fontWeight: '700' }}>
              {t === 'stocks' ? '📊 Stocks' : t === 'commodities' ? '🛢️ Commodities' : '₿ Crypto'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={{ alignItems: 'center', padding: 60 }}>
          <ActivityIndicator size="large" color={c.accent} />
          <Text style={{ color: c.muted, marginTop: 16, fontSize: 13 }}>Fetching live market data...</Text>
        </View>
      ) : error ? (
        <View style={{ alignItems: 'center', padding: 40 }}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>⚠️</Text>
          <Text style={{ color: '#FF6B6B', fontSize: 14, textAlign: 'center', marginBottom: 16 }}>{error}</Text>
          <TouchableOpacity style={{ backgroundColor: c.accent, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }} onPress={fetchData}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Crypto */}
          {tab === 'crypto' && crypto.map((item, i) => (
            <View key={i} style={{ backgroundColor: c.card, borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: c.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: c.card2, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 20 }}>{cryptoIcon(item.symbol)}</Text>
                  </View>
                  <View>
                    <Text style={{ color: c.text, fontSize: 15, fontWeight: '700' }}>{item.name}</Text>
                    <Text style={{ color: c.muted, fontSize: 11 }}>{item.symbol} · Mkt Cap £{(item.marketCap / 1e9).toFixed(1)}B</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: c.text, fontSize: 15, fontWeight: '800' }}>£{item.price.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</Text>
                  <Text style={{ color: item.change >= 0 ? '#00D4AA' : '#FF6B6B', fontSize: 12, fontWeight: '700' }}>
                    {item.change >= 0 ? '▲' : '▼'} {Math.abs(item.change).toFixed(2)}%
                  </Text>
                </View>
              </View>
            </View>
          ))}

          {/* Stocks & Commodities */}
          {tab !== 'crypto' && (tab === 'stocks' ? stocks : commodities).map((item, i) => {
            const isOpen = expanded === item.symbol;
            return (
              <View key={i} style={{ backgroundColor: c.card, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }}>
                <TouchableOpacity style={{ padding: 16 }} onPress={() => setExpanded(isOpen ? null : item.symbol)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: c.card2, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ color: c.accent, fontSize: 12, fontWeight: '900' }}>{item.symbol.slice(0,3)}</Text>
                      </View>
                      <View>
                        <Text style={{ color: c.text, fontSize: 15, fontWeight: '700' }}>{item.name || item.symbol}</Text>
                        <Text style={{ color: c.muted, fontSize: 11 }}>{item.symbol}</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: c.text, fontSize: 15, fontWeight: '800' }}>£{item.price.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</Text>
                      <Text style={{ color: item.change >= 0 ? '#00D4AA' : '#FF6B6B', fontSize: 12, fontWeight: '700' }}>
                        {item.change >= 0 ? '▲' : '▼'} {Math.abs(item.change).toFixed(2)}%
                      </Text>
                    </View>
                  </View>

                  {item.recommendation && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
                      <View style={{ backgroundColor: ratingColor(item.recommendation.rating) + '22', borderRadius: 50, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: ratingColor(item.recommendation.rating) + '55' }}>
                        <Text style={{ color: ratingColor(item.recommendation.rating), fontSize: 12, fontWeight: '700' }}>
                          {item.recommendation.rating}
                        </Text>
                      </View>
                      <Text style={{ color: c.muted, fontSize: 11 }}>Analyst consensus · Tap for signals</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Expanded */}
                {isOpen && item.signals && (
                  <View style={{ borderTopWidth: 1, borderTopColor: c.border, padding: 16 }}>
                    <Text style={{ color: c.text, fontSize: 13, fontWeight: '700', marginBottom: 12 }}>Trading Signals</Text>
                    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16 }}>
                      {TIMEFRAMES.map(tf => {
                        const sig = item.signals?.[tf];
                        if (!sig) return null;
                        const col = signalColor(sig.signal, c.accent);
                        return (
                          <View key={tf} style={{ flex: 1, backgroundColor: col + '22', borderRadius: 10, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: col + '55' }}>
                            <Text style={{ color: c.muted, fontSize: 9, marginBottom: 3 }}>{tf}</Text>
                            <Text style={{ color: col, fontSize: 9, fontWeight: '800', textAlign: 'center' }}>{signalLabel(sig.signal)}</Text>
                            <Text style={{ color: '#00D4AA', fontSize: 8, marginTop: 2 }}>B:{sig.buy}</Text>
                            <Text style={{ color: '#FF6B6B', fontSize: 8 }}>S:{sig.sell}</Text>
                          </View>
                        );
                      })}
                    </View>

                    {item.recommendation && (
                      <>
                        <Text style={{ color: c.text, fontSize: 13, fontWeight: '700', marginBottom: 10 }}>Analyst Forecast</Text>
                        {[
                          { label: 'Strong Buy',  val: item.recommendation.strongBuy,  color: '#00D4AA' },
                          { label: 'Buy',         val: item.recommendation.buy,         color: '#00D4AA' },
                          { label: 'Hold',        val: item.recommendation.hold,        color: '#FFD700' },
                          { label: 'Sell',        val: item.recommendation.sell,        color: '#FF6B6B' },
                          { label: 'Strong Sell', val: item.recommendation.strongSell,  color: '#FF6B6B' },
                        ].map((row, j) => {
                          const total = item.recommendation!.strongBuy + item.recommendation!.buy + item.recommendation!.hold + item.recommendation!.sell + item.recommendation!.strongSell;
                          const pct = total > 0 ? Math.round((row.val / total) * 100) : 0;
                          return (
                            <View key={j} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                              <Text style={{ color: c.muted, fontSize: 11, width: 75 }}>{row.label}</Text>
                              <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 50, height: 6, overflow: 'hidden' }}>
                                <View style={{ height: '100%', width: `${pct}%`, borderRadius: 50, backgroundColor: row.color }} />
                              </View>
                              <Text style={{ color: row.color, fontSize: 11, fontWeight: '700', width: 24, textAlign: 'right' }}>{row.val}</Text>
                            </View>
                          );
                        })}
                      </>
                    )}

                    <Text style={{ color: c.muted, fontSize: 10, marginTop: 10, textAlign: 'center' }}>
                      ⚠️ For informational purposes only. Not financial advice.
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}