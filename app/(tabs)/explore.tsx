import { useLocale } from '@/context/LocaleContext';
import { usePlan } from '@/context/PlanContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Paywall from '../../components/Paywall';
import StarBackground from '../../components/StarBackground';
import { useTheme } from '../../context/ThemeContext';

type Signal = { signal: string; buy: number; sell: number; neutral: number };
type Signals = { '15m'?: Signal; '30m'?: Signal; '1h'?: Signal; '4h'?: Signal; '1d'?: Signal };
type Recommendation = { rating: string; strongBuy: number; buy: number; hold: number; sell: number; strongSell: number };
type StockItem = { symbol: string; name?: string; price: number; change: number; type: 'stock' | 'commodity'; signals: Signals | null; recommendation: Recommendation | null };
type CryptoItem = { symbol: string; name: string; price: number; change: number; marketCap: number };

const TIMEFRAMES = ['15m', '30m', '1h', '4h', '1d'] as const;
const sigColor = (s: string, a: string) => s === 'buy' || s === 'strong_buy' ? '#00D4AA' : s === 'sell' || s === 'strong_sell' ? '#FF6B6B' : a;
const sigLabel = (s: string) => s === 'strong_buy' ? 'STRONG BUY' : s === 'buy' ? 'BUY' : s === 'strong_sell' ? 'STRONG SELL' : s === 'sell' ? 'SELL' : 'NEUTRAL';
const ratColor = (r: string) => r.includes('Buy') ? '#00D4AA' : r.includes('Sell') ? '#FF6B6B' : '#FFD700';
const cIcon = (s: string) => s === 'BTC' ? '₿' : s === 'ETH' ? '⟠' : s === 'SOL' ? '◎' : s === 'XRP' ? '✕' : '🪙';

export default function ExploreScreen() {
  const { theme: c } = useTheme();
  const { hasFeature } = usePlan();
  const { formatAmount, convertPrice, convertRaw, currencySymbol, t } = useLocale();

  const [showPaywall, setShowPaywall] = useState(false);
  const [tab, setTab] = useState<'stocks' | 'commodities' | 'crypto'>('stocks');
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [commodities, setCommodities] = useState<StockItem[]>([]);
  const [crypto, setCrypto] = useState<CryptoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [disclaimer, setDisclaimer] = useState(true);

  const fetchData = async () => {
    try {
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { setError('Not authenticated - please log out and back in.'); setLoading(false); setRefreshing(false); return; }
      const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
      const res = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/get-market-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anonKey}`, 'apikey': anonKey },
        body: JSON.stringify({}),
      });
      const text = await res.text();
      console.log('[Markets] status:', res.status);
      if (!res.ok) { setError(`Server error ${res.status} - please try again shortly`); return; }
      let data: any;
      try { data = JSON.parse(text); } catch { setError('Invalid response from server'); return; }
      if (data.error) { setError(data.error); return; }
      setStocks(data.stocks ?? []); setCommodities(data.commodities ?? []); setCrypto(data.crypto ?? []);
    } catch (err: any) {
      setError(err.message || 'Failed to load market data');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchData(); };
  const fmtPrice = (p: number) => formatAmount(convertRaw(p));
  const fmtCap = (m: number) => `${currencySymbol}${(convertRaw(m) / 1e9).toFixed(1)}B`;

  if (!hasFeature('investmentTracking')) {
    return (
      <View style={{ flex: 1, backgroundColor: c.dark, justifyContent: 'center', alignItems: 'center', padding: 30 }}>
        <StarBackground />
        <Text style={{ fontSize: 60, marginBottom: 16 }}>📈</Text>
        <Text style={{ color: c.text, fontSize: 22, fontWeight: '900', marginBottom: 8, textAlign: 'center' }}>{t('markets')}</Text>
        <Text style={{ color: c.muted, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>{t('marketsDescription')}</Text>
        <TouchableOpacity onPress={() => setShowPaywall(true)} style={{ backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center', width: '100%' }}>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>👑 {t('upgradePremiumMarkets')} — {convertPrice(7.99)}{t('perMonth')}</Text>
        </TouchableOpacity>
        <Paywall visible={showPaywall} onClose={() => setShowPaywall(false)} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.dark }}>
      <StarBackground />
      <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} />}>

        <Text style={{ color: c.text, fontSize: 26, fontWeight: '900', marginTop: 60, marginBottom: 6 }}>{t('markets')} 📈</Text>
        <Text style={{ color: c.muted, fontSize: 13, marginBottom: 20 }}>{t('liveSignals')} · {t('pullToRefresh')}</Text>

        {disclaimer && (
          <View style={{ backgroundColor: '#FFD70022', borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#FFD70055', flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
            <Text style={{ fontSize: 20 }}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#FFD700', fontSize: 13, fontWeight: '700', marginBottom: 4 }}>{t('notFinancialAdvice')}</Text>
              <Text style={{ color: c.muted, fontSize: 12, lineHeight: 18 }}>{t('notFinancialAdviceDesc')}</Text>
            </View>
            <TouchableOpacity onPress={() => setDisclaimer(false)}><Text style={{ color: c.muted, fontSize: 18 }}>✕</Text></TouchableOpacity>
          </View>
        )}

        {/* Tabs */}
        <View style={{ flexDirection: 'row', backgroundColor: c.card, borderRadius: 50, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: c.border }}>
          {(['stocks', 'commodities', 'crypto'] as const).map(tb => (
            <TouchableOpacity key={tb} style={{ flex: 1, paddingVertical: 8, borderRadius: 50, alignItems: 'center', backgroundColor: tab === tb ? c.accent : 'transparent' }} onPress={() => setTab(tb)}>
              <Text style={{ color: tab === tb ? '#fff' : c.muted, fontSize: 12, fontWeight: '700' }}>
                {tb === 'stocks' ? `📊 ${t('stocks')}` : tb === 'commodities' ? `🛢️ ${t('commodities')}` : `₿ ${t('crypto')}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={{ alignItems: 'center', padding: 60 }}>
            <ActivityIndicator size="large" color={c.accent} />
            <Text style={{ color: c.muted, marginTop: 16, fontSize: 13 }}>{t('fetchingMarketData')}</Text>
            <Text style={{ color: c.muted, marginTop: 8, fontSize: 11, textAlign: 'center', opacity: 0.6 }}>First load takes up to 20 seconds</Text>
          </View>
        ) : error ? (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>⚠️</Text>
            <Text style={{ color: '#FF6B6B', fontSize: 14, textAlign: 'center', marginBottom: 16 }}>{error}</Text>
            <TouchableOpacity style={{ backgroundColor: c.accent, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }} onPress={() => { setLoading(true); fetchData(); }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{t('tryAgain')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {tab === 'crypto' && (
              crypto.length === 0
                ? <View style={{ alignItems: 'center', padding: 40 }}><Text style={{ fontSize: 40, marginBottom: 12 }}>🪙</Text><Text style={{ color: c.muted, fontSize: 14 }}>No crypto data available.</Text></View>
                : crypto.map((item, i) => (
                  <View key={i} style={{ backgroundColor: c.card, borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: c.border }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: c.card2, justifyContent: 'center', alignItems: 'center' }}>
                          <Text style={{ fontSize: 20 }}>{cIcon(item.symbol)}</Text>
                        </View>
                        <View>
                          <Text style={{ color: c.text, fontSize: 15, fontWeight: '700' }}>{item.name}</Text>
                          <Text style={{ color: c.muted, fontSize: 11 }}>{item.symbol} · {t('mktCap')} {fmtCap(item.marketCap)}</Text>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: c.text, fontSize: 15, fontWeight: '800' }}>{fmtPrice(item.price)}</Text>
                        <Text style={{ color: item.change >= 0 ? '#00D4AA' : '#FF6B6B', fontSize: 12, fontWeight: '700' }}>{item.change >= 0 ? '▲' : '▼'} {Math.abs(item.change).toFixed(2)}%</Text>
                      </View>
                    </View>
                  </View>
                ))
            )}

            {tab !== 'crypto' && (() => {
              const items = tab === 'stocks' ? stocks : commodities;
              if (items.length === 0) return <View style={{ alignItems: 'center', padding: 40 }}><Text style={{ fontSize: 40, marginBottom: 12 }}>📊</Text><Text style={{ color: c.muted, fontSize: 14 }}>No {tab} data available.</Text></View>;
              return items.map((item, i) => {
                const isOpen = expanded === item.symbol;
                return (
                  <View key={i} style={{ backgroundColor: c.card, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }}>
                    <TouchableOpacity style={{ padding: 16 }} onPress={() => setExpanded(isOpen ? null : item.symbol)}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: c.card2, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ color: c.accent, fontSize: 12, fontWeight: '900' }}>{item.symbol.slice(0, 3)}</Text>
                          </View>
                          <View>
                            <Text style={{ color: c.text, fontSize: 15, fontWeight: '700' }}>{item.name || item.symbol}</Text>
                            <Text style={{ color: c.muted, fontSize: 11 }}>{item.symbol}</Text>
                          </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ color: c.text, fontSize: 15, fontWeight: '800' }}>{fmtPrice(item.price)}</Text>
                          <Text style={{ color: item.change >= 0 ? '#00D4AA' : '#FF6B6B', fontSize: 12, fontWeight: '700' }}>{item.change >= 0 ? '▲' : '▼'} {Math.abs(item.change).toFixed(2)}%</Text>
                        </View>
                      </View>
                      {item.recommendation && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
                          <View style={{ backgroundColor: ratColor(item.recommendation.rating) + '22', borderRadius: 50, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: ratColor(item.recommendation.rating) + '55' }}>
                            <Text style={{ color: ratColor(item.recommendation.rating), fontSize: 12, fontWeight: '700' }}>{item.recommendation.rating}</Text>
                          </View>
                          <Text style={{ color: c.muted, fontSize: 11 }}>{t('analystConsensus')} · {t('tapForSignals')}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    {isOpen && item.signals && (
                      <View style={{ borderTopWidth: 1, borderTopColor: c.border, padding: 16 }}>
                        <Text style={{ color: c.text, fontSize: 13, fontWeight: '700', marginBottom: 12 }}>{t('tradingSignals')}</Text>
                        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16 }}>
                          {TIMEFRAMES.map(tf => {
                            const sig = item.signals?.[tf];
                            if (!sig) return null;
                            const col = sigColor(sig.signal, c.accent);
                            return (
                              <View key={tf} style={{ flex: 1, backgroundColor: col + '22', borderRadius: 10, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: col + '55' }}>
                                <Text style={{ color: c.muted, fontSize: 9, marginBottom: 3 }}>{tf}</Text>
                                <Text style={{ color: col, fontSize: 9, fontWeight: '800', textAlign: 'center' }}>{sigLabel(sig.signal)}</Text>
                                <Text style={{ color: '#00D4AA', fontSize: 8, marginTop: 2 }}>B:{sig.buy}</Text>
                                <Text style={{ color: '#FF6B6B', fontSize: 8 }}>S:{sig.sell}</Text>
                              </View>
                            );
                          })}
                        </View>
                        {item.recommendation && (
                          <>
                            <Text style={{ color: c.text, fontSize: 13, fontWeight: '700', marginBottom: 10 }}>{t('analystForecast')}</Text>
                            {[
                              { label: t('strongBuy'), val: item.recommendation.strongBuy, color: '#00D4AA' },
                              { label: t('buy'), val: item.recommendation.buy, color: '#00D4AA' },
                              { label: t('hold'), val: item.recommendation.hold, color: '#FFD700' },
                              { label: t('sell'), val: item.recommendation.sell, color: '#FF6B6B' },
                              { label: t('strongSell'), val: item.recommendation.strongSell, color: '#FF6B6B' },
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
                        <Text style={{ color: c.muted, fontSize: 10, marginTop: 10, textAlign: 'center' }}>⚠️ {t('infoOnly')}</Text>
                      </View>
                    )}
                  </View>
                );
              });
            })()}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}