import { useFinance } from '@/context/FinanceContext';
import { useLocale } from '@/context/LocaleContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Share, Text, TouchableOpacity, View } from 'react-native';
import StarBackground from '../../components/StarBackground';
import { useTheme } from '../../context/ThemeContext';

// ── Types ─────────────────────────────────────────────────────────────────────
type TaxBand = { label: string; from: number; to: number | null; rate: number };
type TaxConfig = {
  region: string;
  flag: string;
  currency: string;
  personalAllowance: number;
  bands: TaxBand[];
  ni?: { label: string; rate: number; threshold: number };
  taxYear: string;
  checklist: string[];
};

// ── Tax data (all amounts in local currency) ──────────────────────────────────
const TAX_CONFIGS: Record<string, TaxConfig> = {
  GBP: {
    region: 'United Kingdom', flag: '🇬🇧', currency: 'GBP',
    personalAllowance: 12570, taxYear: '2024/25',
    bands: [
      { label: 'Personal Allowance', from: 0, to: 12570, rate: 0 },
      { label: 'Basic Rate', from: 12570, to: 50270, rate: 20 },
      { label: 'Higher Rate', from: 50270, to: 125140, rate: 40 },
      { label: 'Additional Rate', from: 125140, to: null, rate: 45 },
    ],
    ni: { label: 'National Insurance (Class 1)', rate: 8, threshold: 12570 },
    checklist: [
      'Register for Self Assessment if self-employed or earn over £100k',
      'Gather P60 / P45 from your employer',
      'Record all self-employment income and expenses',
      'Check Gift Aid donations for tax relief',
      'Note any rental income or capital gains',
      'Claim work-from-home allowance if eligible (£6/week)',
      'Submit return by 31 Jan (online) or 31 Oct (paper)',
      'Pay any tax owed by 31 January',
    ],
  },
  USD: {
    region: 'United States', flag: '🇺🇸', currency: 'USD',
    personalAllowance: 14600, taxYear: '2024',
    bands: [
      { label: '10%', from: 0, to: 11600, rate: 10 },
      { label: '12%', from: 11600, to: 47150, rate: 12 },
      { label: '22%', from: 47150, to: 100525, rate: 22 },
      { label: '24%', from: 100525, to: 191950, rate: 24 },
      { label: '32%', from: 191950, to: 243725, rate: 32 },
      { label: '35%', from: 243725, to: 609350, rate: 35 },
      { label: '37%', from: 609350, to: null, rate: 37 },
    ],
    ni: { label: 'Self-Employment Tax (SE)', rate: 15.3, threshold: 400 },
    checklist: [
      'Gather all W-2 forms from employers',
      'Collect 1099 forms for freelance / interest income',
      'Claim standard deduction ($14,600 single / $29,200 married)',
      'Contribute to 401(k) or IRA to reduce taxable income',
      'Track business expenses if self-employed (Schedule C)',
      'Note health insurance premiums — may be deductible',
      'File federal return by April 15',
      'Check if your state has additional income tax',
    ],
  },
  EUR: {
    region: 'European Union', flag: '🇪🇺', currency: 'EUR',
    personalAllowance: 10000, taxYear: '2024',
    bands: [
      { label: 'Tax-Free', from: 0, to: 10000, rate: 0 },
      { label: 'Low Rate', from: 10000, to: 25000, rate: 14 },
      { label: 'Standard Rate', from: 25000, to: 60000, rate: 30 },
      { label: 'Higher Rate', from: 60000, to: null, rate: 42 },
    ],
    checklist: [
      'Rates vary by country — check your national tax authority',
      'Gather employment income statements (e.g. Lohnsteuerbescheinigung in Germany)',
      'Record all freelance / self-employment income',
      'Check deductible expenses: childcare, education, donations',
      'File your annual tax return by the national deadline',
      'Check VAT obligations if running a business',
      'Keep receipts for all work-related expenses',
      'Review applicable social contribution rates',
    ],
  },
  JPY: {
    region: 'Japan', flag: '🇯🇵', currency: 'JPY',
    personalAllowance: 480000, taxYear: '2024',
    bands: [
      { label: '5%', from: 0, to: 1950000, rate: 5 },
      { label: '10%', from: 1950000, to: 3300000, rate: 10 },
      { label: '20%', from: 3300000, to: 6950000, rate: 20 },
      { label: '23%', from: 6950000, to: 9000000, rate: 23 },
      { label: '33%', from: 9000000, to: 18000000, rate: 33 },
      { label: '40%', from: 18000000, to: 40000000, rate: 40 },
      { label: '45%', from: 40000000, to: null, rate: 45 },
    ],
    ni: { label: 'Social Insurance (厚生年金)', rate: 18.3, threshold: 0 },
    checklist: [
      'File a final return (確定申告) if income > ¥20M or self-employed',
      'Gather withholding tax certificates (源泉徴収票)',
      'Check deductions: medical, earthquake insurance, donations',
      'Use My Number card for electronic filing (e-Tax)',
      'Filing period: February 16 – March 15',
      'Check Furusato Nozei donations for deductions',
      'Declare overseas income if you are a resident',
    ],
  },
  AUD: {
    region: 'Australia', flag: '🇦🇺', currency: 'AUD',
    personalAllowance: 18200, taxYear: '2023/24',
    bands: [
      { label: 'Tax-Free', from: 0, to: 18200, rate: 0 },
      { label: '19%', from: 18200, to: 45000, rate: 19 },
      { label: '32.5%', from: 45000, to: 120000, rate: 32.5 },
      { label: '37%', from: 120000, to: 180000, rate: 37 },
      { label: '45%', from: 180000, to: null, rate: 45 },
    ],
    ni: { label: 'Medicare Levy', rate: 2, threshold: 26000 },
    checklist: [
      'Lodge tax return via myGov / ATO app by 31 October',
      'Gather payment summaries from all employers',
      'Claim work-related deductions (must not be reimbursed)',
      'Check if HECS/HELP repayments are required',
      'Include bank interest, dividends, and rental income',
      'Check private health insurance rebate/surcharge',
      'Keep receipts for all deductions claimed',
      'Declare any crypto or capital gains events',
    ],
  },
  CAD: {
    region: 'Canada', flag: '🇨🇦', currency: 'CAD',
    personalAllowance: 15705, taxYear: '2024',
    bands: [
      { label: '15%', from: 0, to: 55867, rate: 15 },
      { label: '20.5%', from: 55867, to: 111733, rate: 20.5 },
      { label: '26%', from: 111733, to: 154906, rate: 26 },
      { label: '29%', from: 154906, to: 220000, rate: 29 },
      { label: '33%', from: 220000, to: null, rate: 33 },
    ],
    ni: { label: 'CPP Contributions', rate: 5.95, threshold: 3500 },
    checklist: [
      'File T1 return by April 30 (self-employed: June 15)',
      'Gather T4 slips from all employers',
      'Collect T5 for investment income, T3 for trust income',
      'Claim RRSP contributions to reduce taxable income',
      'Check provincial tax rates — they vary by province',
      'Claim eligible employment expenses on T2200',
      'Note any capital gains dispositions',
      'Use NETFILE or a CRA-certified software to file',
    ],
  },
  CHF: {
    region: 'Switzerland', flag: '🇨🇭', currency: 'CHF',
    personalAllowance: 17000, taxYear: '2024',
    bands: [
      { label: 'Tax-Free', from: 0, to: 17000, rate: 0 },
      { label: '0.77%', from: 17000, to: 31600, rate: 0.77 },
      { label: '8.8%', from: 31600, to: 41400, rate: 8.8 },
      { label: '11.5%', from: 41400, to: 55200, rate: 11.5 },
      { label: '13.2%', from: 55200, to: null, rate: 13.2 },
    ],
    ni: { label: 'AHV/AVS Social Insurance', rate: 10.6, threshold: 0 },
    checklist: [
      'Federal + cantonal + municipal taxes apply — rates vary by canton',
      'Submit tax declaration by March 31 (varies by canton)',
      'Declare all worldwide income and assets',
      'Check 2nd pillar (pension) and 3rd pillar deductions',
      'Claim work expenses, insurance premiums, childcare costs',
      'Note Quellensteuer (withholding tax) if applicable',
      'Declare bank accounts and portfolios (wealth tax applies)',
    ],
  },
  AED: {
    region: 'UAE', flag: '🇦🇪', currency: 'AED',
    personalAllowance: 0, taxYear: '2024',
    bands: [
      { label: 'Personal Income Tax', from: 0, to: null, rate: 0 },
    ],
    checklist: [
      'No personal income tax in the UAE — individuals pay 0%',
      'Corporate Tax of 9% applies to business profits over AED 375,000',
      'VAT of 5% applies to most goods and services',
      'Register for VAT if annual taxable supplies exceed AED 375,000',
      'Maintain records for at least 5 years for VAT purposes',
      'Free Zone companies may benefit from 0% CT rate if conditions are met',
      'Check DIFC / ADGM regulations if in financial free zones',
    ],
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function calcTax(annual: number, cfg: TaxConfig) {
  const taxable = Math.max(0, annual - cfg.personalAllowance);
  let remaining = taxable;
  let total = 0;
  const breakdown: { label: string; amount: number; rate: number }[] = [];
  for (const band of cfg.bands) {
    if (band.rate === 0) continue;
    const size = band.to ? band.to - band.from : Infinity;
    const inBand = Math.min(remaining, size);
    if (inBand <= 0) break;
    const taxed = (inBand * band.rate) / 100;
    total += taxed;
    breakdown.push({ label: band.label, amount: taxed, rate: band.rate });
    remaining -= inBand;
  }
  return { tax: total, effective: annual > 0 ? (total / annual) * 100 : 0, breakdown };
}

function bandColor(rate: number) {
  if (rate === 0) return '#00D4AA';
  if (rate < 20) return '#FFD700';
  if (rate < 35) return '#FF9F43';
  return '#FF6B6B';
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function TaxScreen() {
  const { theme: c } = useTheme();
  const { transactions } = useFinance();
  const { formatAmount, currency } = useLocale();

  const cfg = TAX_CONFIGS[currency] ?? TAX_CONFIGS['GBP'];

  const [annualIncome, setAnnualIncome] = useState(0);
  const [openSection, setOpenSection] = useState<string | null>('estimate');
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [ckKey, setCkKey] = useState('polar_tax_checklist_local');

  useEffect(() => {
    (async () => {
      try {
        const { supabase } = await import('../../lib/supabase');
        const { data: { user } } = await supabase.auth.getUser();
        const uid = user?.id ?? 'local';
        const incomeKey = `polar_income_${uid}`;
        const checkKey = `polar_tax_checklist_${uid}`;
        setCkKey(checkKey);
        const [rawIncome, rawChecked] = await Promise.all([
          AsyncStorage.getItem(incomeKey),
          AsyncStorage.getItem(checkKey),
        ]);
        if (rawIncome) {
          const sources = JSON.parse(rawIncome);
          const monthly = sources.reduce((s: number, src: any) => {
            const m = src.frequency === 'weekly' ? src.amount * 4.33
              : src.frequency === 'fortnightly' ? src.amount * 2.17
                : src.frequency === 'yearly' ? src.amount / 12
                  : src.amount;
            return s + m;
          }, 0);
          setAnnualIncome(Math.round(monthly * 12));
        }
        if (rawChecked) setChecked(JSON.parse(rawChecked));
      } catch { }
    })();
  }, []);

  const toggleCheck = async (i: number) => {
    const next = { ...checked, [i]: !checked[i] };
    setChecked(next);
    await AsyncStorage.setItem(ckKey, JSON.stringify(next));
  };

  const toggle = (key: string) => setOpenSection(p => p === key ? null : key);

  // Transaction data
  const totalIncomeTxn = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalExpenseTxn = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
  const catMap: Record<string, number> = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    catMap[t.cat] = (catMap[t.cat] || 0) + Math.abs(t.amount);
  });
  const topCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Tax calc
  const { tax, effective, breakdown } = calcTax(annualIncome, cfg);
  const niTax = cfg.ni && annualIncome > cfg.ni.threshold
    ? ((annualIncome - cfg.ni.threshold) * cfg.ni.rate) / 100
    : 0;
  const totalDed = tax + niTax;
  const takeHome = annualIncome - totalDed;
  const checkedCount = Object.values(checked).filter(Boolean).length;

  const handleExport = async () => {
    const lines = [
      `Polar Finance — Tax Summary (${cfg.taxYear})`,
      `Region: ${cfg.region}`,
      ``,
      `── Income ──`,
      `Annual Income: ${formatAmount(annualIncome)}`,
      `Recorded Income: ${formatAmount(totalIncomeTxn)}`,
      ``,
      `── Tax Estimate ──`,
      `Estimated Income Tax: ${formatAmount(tax)}`,
      cfg.ni ? `${cfg.ni.label}: ${formatAmount(niTax)}` : '',
      `Total Deductions: ${formatAmount(totalDed)}`,
      `Estimated Take-Home: ${formatAmount(takeHome)}`,
      `Effective Rate: ${effective.toFixed(1)}%`,
      ``,
      `── Top Expenses ──`,
      ...topCats.map(([cat, amt]) => `${cat}: ${formatAmount(amt)}`),
      `Total Expenses: ${formatAmount(totalExpenseTxn)}`,
      ``,
      `⚠️ Estimate only. Consult a qualified tax professional.`,
    ].filter(Boolean);
    try {
      await Share.share({ message: lines.join('\n'), title: 'Tax Summary' });
    } catch {
      Alert.alert('Export', 'Could not share. Try again.');
    }
  };

  // ── Section header ─────────────────────────────────────────────────────────
  const SectionHeader = ({ sKey, icon, label, sub }: { sKey: string; icon: string; label: string; sub?: string }) => (
    <TouchableOpacity onPress={() => toggle(sKey)}
      style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 }}>
      <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: c.accent + '18', justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name={icon as any} size={22} color={c.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.text, fontSize: 15, fontWeight: '700' }}>{label}</Text>
        {sub ? <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{sub}</Text> : null}
      </View>
      <Ionicons name={openSection === sKey ? 'chevron-up' : 'chevron-down'} size={18} color={c.muted} />
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.dark }}>
      <StarBackground />
      <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 60, marginBottom: 6 }}>
          <Text style={{ color: c.text, fontSize: 26, fontWeight: '900' }}>Tax Helper 🧾</Text>
          <TouchableOpacity onPress={handleExport}
            style={{ backgroundColor: c.accent + '22', borderRadius: 50, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: c.accent + '55', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="share-outline" size={15} color={c.accent} />
            <Text style={{ color: c.accent, fontSize: 13, fontWeight: '700' }}>Export</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ color: c.muted, fontSize: 13, marginBottom: 20 }}>{cfg.flag} {cfg.region} · Tax Year {cfg.taxYear}</Text>

        {/* Disclaimer */}
        <View style={{ backgroundColor: '#FFD70018', borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#FFD70044', flexDirection: 'row', gap: 10 }}>
          <Ionicons name="warning" size={18} color="#FFD700" style={{ marginTop: 1 }} />
          <Text style={{ color: c.muted, fontSize: 12, flex: 1, lineHeight: 18 }}>
            <Text style={{ color: '#FFD700', fontWeight: '700' }}>Estimate only. </Text>
            Always consult a qualified tax professional for your personal situation.
          </Text>
        </View>

        {/* ── Tax Estimate ── */}
        <View style={{ backgroundColor: c.card, borderRadius: 20, borderWidth: 1, borderColor: c.border, overflow: 'hidden', marginBottom: 14 }}>
          <SectionHeader sKey="estimate" icon="calculator"
            label="Tax Estimate"
            sub={annualIncome > 0 ? `Based on ${formatAmount(annualIncome)}/yr` : 'Set income in More → My Income'} />

          {openSection === 'estimate' && (
            <View style={{ borderTopWidth: 1, borderTopColor: c.border, padding: 16 }}>
              {annualIncome === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                  <Ionicons name="wallet-outline" size={40} color={c.muted} style={{ marginBottom: 10 }} />
                  <Text style={{ color: c.muted, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                    No income set up yet.{'\n'}
                    Go to <Text style={{ color: c.accent, fontWeight: '700' }}>More → My Income</Text> to add your salary.
                  </Text>
                </View>
              ) : (
                <>
                  {/* Summary cards */}
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                    {[
                      { label: 'Annual Income', value: formatAmount(annualIncome), color: '#00D4AA' },
                      { label: 'Est. Tax', value: formatAmount(tax), color: '#FF6B6B' },
                      { label: 'Take-Home', value: formatAmount(takeHome), color: c.accent },
                    ].map((item, i) => (
                      <View key={i} style={{ flex: 1, backgroundColor: c.card2, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: c.border }}>
                        <Text style={{ color: c.muted, fontSize: 10, fontWeight: '600', marginBottom: 4, textAlign: 'center' }}>{item.label}</Text>
                        <Text style={{ color: item.color, fontSize: 13, fontWeight: '800', textAlign: 'center' }}>{item.value}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Effective rate */}
                  <View style={{ backgroundColor: c.card2, borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: c.border }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ color: c.text, fontSize: 13, fontWeight: '700' }}>Effective Tax Rate</Text>
                      <Text style={{ color: '#FF6B6B', fontSize: 13, fontWeight: '800' }}>{effective.toFixed(1)}%</Text>
                    </View>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 50, height: 8, overflow: 'hidden' }}>
                      <View style={{ height: '100%', width: `${Math.min(effective, 100)}%`, borderRadius: 50, backgroundColor: '#FF6B6B' }} />
                    </View>
                  </View>

                  {/* Band breakdown */}
                  <Text style={{ color: c.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Band Breakdown</Text>
                  {breakdown.map((b, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: i < breakdown.length - 1 ? 1 : 0, borderBottomColor: c.border }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: c.text, fontSize: 13, fontWeight: '600' }}>{b.label}</Text>
                        <Text style={{ color: c.muted, fontSize: 11 }}>{b.rate}% rate</Text>
                      </View>
                      <Text style={{ color: '#FF6B6B', fontSize: 13, fontWeight: '700' }}>{formatAmount(b.amount)}</Text>
                    </View>
                  ))}

                  {/* NI / Social */}
                  {cfg.ni && niTax > 0 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: c.card2, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: c.border }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: c.text, fontSize: 13, fontWeight: '600' }}>{cfg.ni.label}</Text>
                        <Text style={{ color: c.muted, fontSize: 11 }}>{cfg.ni.rate}% rate</Text>
                      </View>
                      <Text style={{ color: '#FF9F43', fontSize: 13, fontWeight: '700' }}>{formatAmount(niTax)}</Text>
                    </View>
                  )}

                  {/* Totals */}
                  <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: c.border, gap: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: c.text, fontSize: 14, fontWeight: '800' }}>Total Est. Deductions</Text>
                      <Text style={{ color: '#FF6B6B', fontSize: 16, fontWeight: '900' }}>{formatAmount(totalDed)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: c.text, fontSize: 14, fontWeight: '800' }}>Est. Annual Take-Home</Text>
                      <Text style={{ color: '#00D4AA', fontSize: 16, fontWeight: '900' }}>{formatAmount(takeHome)}</Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          )}
        </View>

        {/* ── Tax Bands ── */}
        <View style={{ backgroundColor: c.card, borderRadius: 20, borderWidth: 1, borderColor: c.border, overflow: 'hidden', marginBottom: 14 }}>
          <SectionHeader sKey="bands" icon="podium"
            label="Tax Bands"
            sub={`${cfg.region} · ${cfg.taxYear}`} />

          {openSection === 'bands' && (
            <View style={{ borderTopWidth: 1, borderTopColor: c.border, padding: 16 }}>
              <Text style={{ color: c.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
                Personal Allowance: {formatAmount(cfg.personalAllowance)}
              </Text>
              {cfg.bands.map((band, i) => {
                const col = bandColor(band.rate);
                return (
                  <View key={i} style={{ marginBottom: 14 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ color: c.text, fontSize: 13, fontWeight: '600' }}>{band.label}</Text>
                      <Text style={{ color: col, fontSize: 13, fontWeight: '700' }}>{band.rate}%</Text>
                    </View>
                    <Text style={{ color: c.muted, fontSize: 11, marginBottom: 5 }}>
                      {formatAmount(band.from)} – {band.to ? formatAmount(band.to) : '∞'}
                    </Text>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 50, height: 6, overflow: 'hidden' }}>
                      <View style={{ height: '100%', width: `${Math.min(band.rate + 5, 100)}%`, borderRadius: 50, backgroundColor: col }} />
                    </View>
                  </View>
                );
              })}
              {cfg.ni && (
                <View style={{ marginTop: 4, backgroundColor: c.card2, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: c.border }}>
                  <Text style={{ color: '#FF9F43', fontSize: 13, fontWeight: '700', marginBottom: 2 }}>{cfg.ni.label}</Text>
                  <Text style={{ color: c.muted, fontSize: 12 }}>{cfg.ni.rate}% on earnings above {formatAmount(cfg.ni.threshold)}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* ── Income & Expense Summary ── */}
        <View style={{ backgroundColor: c.card, borderRadius: 20, borderWidth: 1, borderColor: c.border, overflow: 'hidden', marginBottom: 14 }}>
          <SectionHeader sKey="summary" icon="receipt"
            label="Income & Expense Summary"
            sub={`${transactions.length} recorded transactions`} />

          {openSection === 'summary' && (
            <View style={{ borderTopWidth: 1, borderTopColor: c.border, padding: 16 }}>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                <View style={{ flex: 1, backgroundColor: '#00D4AA18', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#00D4AA33' }}>
                  <Text style={{ color: c.muted, fontSize: 11, fontWeight: '600' }}>Recorded Income</Text>
                  <Text style={{ color: '#00D4AA', fontSize: 18, fontWeight: '900', marginTop: 4 }}>{formatAmount(totalIncomeTxn)}</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: '#FF6B6B18', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#FF6B6B33' }}>
                  <Text style={{ color: c.muted, fontSize: 11, fontWeight: '600' }}>Recorded Expenses</Text>
                  <Text style={{ color: '#FF6B6B', fontSize: 18, fontWeight: '900', marginTop: 4 }}>{formatAmount(totalExpenseTxn)}</Text>
                </View>
              </View>
              {topCats.length > 0 ? (
                <>
                  <Text style={{ color: c.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Top Expense Categories</Text>
                  {topCats.map(([cat, amt], i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: i < topCats.length - 1 ? 1 : 0, borderBottomColor: c.border }}>
                      <Text style={{ color: c.text, fontSize: 13, flex: 1, fontWeight: '600' }}>{cat}</Text>
                      <Text style={{ color: '#FF6B6B', fontSize: 13, fontWeight: '700' }}>{formatAmount(amt)}</Text>
                    </View>
                  ))}
                </>
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <Ionicons name="receipt-outline" size={36} color={c.muted} style={{ marginBottom: 8 }} />
                  <Text style={{ color: c.muted, fontSize: 13, textAlign: 'center' }}>No transactions recorded yet.</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* ── Checklist ── */}
        <View style={{ backgroundColor: c.card, borderRadius: 20, borderWidth: 1, borderColor: c.border, overflow: 'hidden', marginBottom: 14 }}>
          <SectionHeader sKey="checklist" icon="checkbox"
            label="Tax Checklist"
            sub={`${checkedCount}/${cfg.checklist.length} completed · ${cfg.region}`} />

          {openSection === 'checklist' && (
            <View style={{ borderTopWidth: 1, borderTopColor: c.border, padding: 16 }}>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 50, height: 6, overflow: 'hidden', marginBottom: 16 }}>
                <View style={{ height: '100%', borderRadius: 50, backgroundColor: '#00D4AA', width: `${cfg.checklist.length > 0 ? (checkedCount / cfg.checklist.length) * 100 : 0}%` }} />
              </View>
              {cfg.checklist.map((item, i) => (
                <TouchableOpacity key={i} onPress={() => toggleCheck(i)}
                  style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: i < cfg.checklist.length - 1 ? 1 : 0, borderBottomColor: c.border, gap: 12 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: checked[i] ? '#00D4AA' : c.muted, backgroundColor: checked[i] ? '#00D4AA' : 'transparent', justifyContent: 'center', alignItems: 'center', marginTop: 1 }}>
                    {checked[i] && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                  <Text style={{ color: checked[i] ? c.muted : c.text, fontSize: 13, flex: 1, lineHeight: 20, textDecorationLine: checked[i] ? 'line-through' : 'none' }}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
              {checkedCount === cfg.checklist.length && cfg.checklist.length > 0 && (
                <View style={{ backgroundColor: '#00D4AA22', borderRadius: 12, padding: 12, marginTop: 12, alignItems: 'center', borderWidth: 1, borderColor: '#00D4AA44' }}>
                  <Text style={{ color: '#00D4AA', fontSize: 13, fontWeight: '700' }}>🎉 Checklist complete!</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}