import { CustomAsset, useFinance } from '@/context/FinanceContext';
import { useLocale } from '@/context/LocaleContext';
import { usePlan } from '@/context/PlanContext';
import { useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Paywall from '../../components/Paywall';
import { useTheme } from '../../context/ThemeContext';

const ASSET_CATEGORIES = [
  { label: '🏠 Property', color: '#FF9F43', cat: 'property' },
  { label: '🚗 Vehicles', color: '#a89fff', cat: 'vehicles' },
  { label: '₿ Crypto',    color: '#FFD700', cat: 'crypto'   },
  { label: '📈 Stocks',   color: '#6C63FF', cat: 'stocks'   },
  { label: '💰 Savings',  color: '#00D4AA', cat: 'savings'  },
  { label: '🎁 Other',    color: '#FF6B6B', cat: 'other'    },
];

const ICONS = ['🏠','🚗','₿','📈','💰','🏦','💎','🖥️','📱','🎸','⌚','✈️','🛥️','🏋️','🎁','🚢','🏍️','🚐'];

export default function AssetsScreen() {
  const { theme: c } = useTheme();
  const { hasFeature } = usePlan();
  const { cards, investments, customAssets, setCustomAssets } = useFinance();
  const { formatAmount, convertPrice, currencySymbol, t } = useLocale();

  const [showPaywall, setShowPaywall] = useState(false);
  const [openCats,    setOpenCats]    = useState<string[]>([]);
  const [showAdd,     setShowAdd]     = useState(false);
  const [addMode,     setAddMode]     = useState<'asset' | 'vehicle' | 'property'>('asset');

  // Asset form
  const [newName,       setNewName]       = useState('');
  const [newSub,        setNewSub]        = useState('');
  const [newValue,      setNewValue]      = useState('');
  const [newChange,     setNewChange]     = useState('');
  const [newIcon,       setNewIcon]       = useState('🏠');
  const [newCat,        setNewCat]        = useState('property');
  const [newHasChange,  setNewHasChange]  = useState(false);

  // Vehicle form
  const [vMake,  setVMake]  = useState('');
  const [vModel, setVModel] = useState('');
  const [vYear,  setVYear]  = useState('');
  const [vValue, setVValue] = useState('');
  const [vIcon,  setVIcon]  = useState('🚗');

  // Property form
  const [pAddress,  setPAddress]  = useState('');
  const [pType,     setPType]     = useState('Residential');
  const [pValue,    setPValue]    = useState('');
  const [pMortgage, setPMortgage] = useState('');

  if (!hasFeature('investmentTracking')) {
    return (
      <View style={{ flex: 1, backgroundColor: c.dark, justifyContent: 'center', alignItems: 'center', padding: 30 }}>
        <Text style={{ fontSize: 60, marginBottom: 16 }}>💼</Text>
        <Text style={{ color: c.text, fontSize: 24, fontWeight: '900', marginBottom: 8 }}>{t('assets')}</Text>
        <Text style={{ color: c.muted, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>{t('assetsDescription')}</Text>
        <View style={{ backgroundColor: c.card, borderRadius: 16, padding: 16, width: '100%', marginBottom: 24, borderWidth: 1, borderColor: c.border }}>
          {[t('cards'), t('investments'), 'Crypto', t('addProperty'), t('netWorthLabel')].map((f, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
              <Text style={{ color: '#00D4AA', fontWeight: '700', fontSize: 14 }}>✓</Text>
              <Text style={{ color: c.text, fontSize: 13 }}>{f}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity onPress={() => setShowPaywall(true)} style={{ backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center', width: '100%' }}>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>👑 {t('upgradePremiumAssets')} — {convertPrice(7.99)}{t('perMonth')}</Text>
        </TouchableOpacity>
        <Paywall visible={showPaywall} onClose={() => setShowPaywall(false)} />
      </View>
    );
  }

  const toggle = (label: string) =>
    setOpenCats(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);

  const openModal = (mode: 'asset' | 'vehicle' | 'property') => {
    setAddMode(mode);
    if (mode === 'vehicle')  { setNewCat('vehicles'); setNewIcon('🚗'); }
    if (mode === 'property') { setNewCat('property'); setNewIcon('🏠'); }
    setShowAdd(true);
  };

  const resetForms = () => {
    setNewName(''); setNewSub(''); setNewValue(''); setNewChange('');
    setNewIcon('🏠'); setNewCat('property'); setNewHasChange(false);
    setVMake(''); setVModel(''); setVYear(''); setVValue(''); setVIcon('🚗');
    setPAddress(''); setPType('Residential'); setPValue(''); setPMortgage('');
  };

  const addAsset = () => {
    let asset: CustomAsset | null = null;

    if (addMode === 'vehicle') {
      if (!vMake || !vValue) return;
      asset = {
        id: Date.now().toString(),
        icon: vIcon,
        name: `${vYear} ${vMake} ${vModel}`.trim(),
        sub: t('estValue'),
        value: parseFloat(vValue),
        change: null,
        category: 'vehicles',
      };
    } else if (addMode === 'property') {
      if (!pAddress || !pValue) return;
      const eq = parseFloat(pValue) - (parseFloat(pMortgage) || 0);
      asset = {
        id: Date.now().toString(),
        icon: '🏠',
        name: pAddress,
        sub: `${pType} · ${t('equity')}: ${formatAmount(eq)}`,
        value: parseFloat(pValue),
        change: null,
        category: 'property',
      };
    } else {
      if (!newName || !newValue) return;
      asset = {
        id: Date.now().toString(),
        icon: newIcon,
        name: newName,
        sub: newSub,
        value: parseFloat(newValue),
        change: newHasChange ? parseFloat(newChange) || 0 : null,
        category: newCat,
      };
    }

    if (asset) setCustomAssets([...customAssets, asset]);
    resetForms();
    setShowAdd(false);
  };

  const deleteAsset = (id: string) =>
    setCustomAssets(customAssets.filter(a => a.id !== id));

  // ── Derived totals ─────────────────────────────────────────────────────────
  const totalCards   = cards.reduce((s, card) => s + card.balance, 0);
  const totalInvest  = investments.reduce((s, i) => s + i.value, 0);
  const totalCustom  = customAssets.reduce((s, a) => s + a.value, 0);
  const totalAssets  = Math.max(0, totalCards) + Math.max(0, totalInvest) + Math.max(0, totalCustom);
  const totalLiab    = (totalCards < 0 ? totalCards : 0) + customAssets.filter(a => a.value < 0).reduce((s, a) => s + a.value, 0);
  const netWorth     = totalAssets + totalLiab;

  const plaidSections = [
    { label: `💳 ${t('cards')}`,       color: '#00D4AA', total: totalCards,  items: cards.map(card => ({ icon: '🏦', name: card.bank,  sub: card.type,  value: card.balance, change: null, id: null })) },
    { label: `📈 ${t('investments')}`, color: '#6C63FF', total: totalInvest, items: investments.map(inv => ({ icon: inv.icon, name: inv.name, sub: inv.sub, value: inv.value, change: inv.change, id: null })) },
  ].filter(s => s.items.length > 0);

  const customSections = ASSET_CATEGORIES.map(cat => ({
    label: cat.label,
    color: cat.color,
    total: customAssets.filter(a => a.category === cat.cat).reduce((s, a) => s + a.value, 0),
    items: customAssets.filter(a => a.category === cat.cat).map(a => ({ icon: a.icon, name: a.name, sub: a.sub, value: a.value, change: a.change, id: a.id })),
  })).filter(s => s.items.length > 0);

  const allSections = [...plaidSections, ...customSections];
  const empty = allSections.length === 0;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.dark, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 60, marginBottom: 20 }}>
        <Text style={{ color: c.text, fontSize: 26, fontWeight: '900' }}>{t('assets')} 💼</Text>
      </View>

      {/* Add buttons */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
        {[
          { label: `🏠 ${t('addProperty')}`, mode: 'property' as const },
          { label: `🚗 ${t('addVehicle')}`,  mode: 'vehicle'  as const },
          { label: `➕ ${t('addOther')}`,    mode: 'asset'    as const },
        ].map(btn => (
          <TouchableOpacity key={btn.mode}
            style={{ flex: 1, backgroundColor: c.card, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: c.border }}
            onPress={() => openModal(btn.mode)}>
            <Text style={{ color: c.accent, fontSize: 13, fontWeight: '700' }}>{btn.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Net Worth card */}
      <View style={{ backgroundColor: c.card, borderRadius: 24, padding: 22, borderWidth: 1, borderColor: c.border, marginBottom: 24 }}>
        <Text style={{ color: c.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 }}>{t('netWorthLabel')}</Text>
        <Text style={{ color: c.text, fontSize: 34, fontWeight: '900', marginVertical: 6 }}>{formatAmount(netWorth)}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: c.muted, fontSize: 11 }}>{t('totalAssets')}</Text>
            <Text style={{ color: '#00D4AA', fontSize: 15, fontWeight: '700', marginTop: 2 }}>{formatAmount(totalAssets)}</Text>
          </View>
          <View style={{ width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)' }} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: c.muted, fontSize: 11 }}>{t('liabilities')}</Text>
            <Text style={{ color: '#FF6B6B', fontSize: 15, fontWeight: '700', marginTop: 2 }}>{formatAmount(Math.abs(totalLiab))}</Text>
          </View>
        </View>
      </View>

      {/* Empty state */}
      {empty && (
        <View style={{ alignItems: 'center', padding: 40 }}>
          <Text style={{ fontSize: 50, marginBottom: 16 }}>💼</Text>
          <Text style={{ color: c.text, fontSize: 18, fontWeight: '800', marginBottom: 8 }}>{t('noAssetsYet')}</Text>
        </View>
      )}

      {/* Sections */}
      {allSections.map(section => {
        const isOpen = openCats.includes(section.label);
        return (
          <View key={section.label} style={{ backgroundColor: c.card, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }}>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10 }} onPress={() => toggle(section.label)}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: section.color }} />
              <Text style={{ color: c.text, fontSize: 14, fontWeight: '700', flex: 1 }}>{section.label}</Text>
              <Text style={{ color: section.total < 0 ? '#FF6B6B' : c.text, fontSize: 14, fontWeight: '800' }}>
                {section.total < 0 ? '-' : ''}{formatAmount(Math.abs(section.total))}
              </Text>
              <Text style={{ color: c.muted, fontSize: 11, marginLeft: 6 }}>{isOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {isOpen && section.items.map((item: any, i: number) => (
              <TouchableOpacity key={i}
                onLongPress={() => item.id && deleteAsset(item.id)}
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: c.border }}>
                <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: section.color + '22', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                  <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>{item.name}</Text>
                  <Text style={{ color: c.muted, fontSize: 11, marginTop: 2 }}>{item.sub}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: item.value < 0 ? '#FF6B6B' : c.text, fontSize: 14, fontWeight: '800' }}>
                    {item.value < 0 ? '-' : ''}{formatAmount(Math.abs(item.value))}
                  </Text>
                  {item.change !== null && item.change !== undefined && (
                    <Text style={{ color: item.change >= 0 ? '#00D4AA' : '#FF6B6B', fontSize: 11, fontWeight: '700', marginTop: 2 }}>
                      {item.change >= 0 ? '▲' : '▼'} {Math.abs(item.change)}%
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        );
      })}

      <Text style={{ color: c.muted, fontSize: 11, textAlign: 'center', marginBottom: 40 }}>{t('longPressDeleteAsset')}</Text>

      {/* ── Add Modal ── */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <ScrollView style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: c.border }} showsVerticalScrollIndicator={false}>
            <View style={{ padding: 24 }}>

              {/* Vehicle form */}
              {addMode === 'vehicle' && (
                <>
                  <Text style={{ color: c.text, fontSize: 18, fontWeight: '900', marginBottom: 20 }}>🚗 {t('addVehicle')}</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                    {['🚗','🚙','🏍️','🚐','🚕','🚌','🛻','🏎️'].map(ic => (
                      <TouchableOpacity key={ic}
                        style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: vIcon === ic ? c.accent + '33' : c.card2, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: vIcon === ic ? c.accent : c.border }}
                        onPress={() => setVIcon(ic)}>
                        <Text style={{ fontSize: 20 }}>{ic}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {[
                    { label: t('make'),  val: vMake,  set: setVMake,  ph: 'e.g. Ford',   kb: 'default'     as const },
                    { label: t('model'), val: vModel, set: setVModel, ph: 'e.g. Focus',  kb: 'default'     as const },
                    { label: t('year'),  val: vYear,  set: setVYear,  ph: 'e.g. 2021',   kb: 'number-pad'  as const },
                    { label: `${t('estValue')} (${currencySymbol})`, val: vValue, set: setVValue, ph: 'e.g. 12500', kb: 'decimal-pad' as const },
                  ].map((f, i) => (
                    <View key={i} style={{ marginBottom: 12 }}>
                      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{f.label}</Text>
                      <TextInput style={{ backgroundColor: c.card2, borderRadius: 12, padding: 14, color: c.text, fontSize: 15, borderWidth: 1, borderColor: c.border }} placeholder={f.ph} placeholderTextColor={c.muted} value={f.val} onChangeText={f.set} keyboardType={f.kb} />
                    </View>
                  ))}
                </>
              )}

              {/* Property form */}
              {addMode === 'property' && (
                <>
                  <Text style={{ color: c.text, fontSize: 18, fontWeight: '900', marginBottom: 20 }}>🏠 {t('addProperty')}</Text>
                  <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{t('propertyType')}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                    {['Residential','Buy to Let','Commercial','Land'].map(type => (
                      <TouchableOpacity key={type}
                        style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50, backgroundColor: pType === type ? c.accent + '33' : c.card2, borderWidth: 1, borderColor: pType === type ? c.accent : c.border }}
                        onPress={() => setPType(type)}>
                        <Text style={{ color: pType === type ? c.accent : c.muted, fontSize: 12, fontWeight: '600' }}>{type}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {[
                    { label: t('address'),              val: pAddress,  set: setPAddress,  ph: 'e.g. 12 Oak Street', kb: 'default'     as const },
                    { label: `${t('estMarketValue')} (${currencySymbol})`, val: pValue, set: setPValue, ph: 'e.g. 250000', kb: 'decimal-pad' as const },
                    { label: `${t('outstandingMortgage')} (${currencySymbol})`, val: pMortgage, set: setPMortgage, ph: 'e.g. 150000', kb: 'decimal-pad' as const },
                  ].map((f, i) => (
                    <View key={i} style={{ marginBottom: 12 }}>
                      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{f.label}</Text>
                      <TextInput style={{ backgroundColor: c.card2, borderRadius: 12, padding: 14, color: c.text, fontSize: 15, borderWidth: 1, borderColor: c.border }} placeholder={f.ph} placeholderTextColor={c.muted} value={f.val} onChangeText={f.set} keyboardType={f.kb} />
                    </View>
                  ))}
                  {pValue && pMortgage ? (
                    <View style={{ backgroundColor: c.card2, borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: c.border }}>
                      <Text style={{ color: c.muted, fontSize: 12 }}>
                        {t('equity')}: <Text style={{ color: '#00D4AA', fontWeight: '700' }}>{formatAmount(parseFloat(pValue) - parseFloat(pMortgage))}</Text>
                      </Text>
                    </View>
                  ) : null}
                </>
              )}

              {/* Other asset form */}
              {addMode === 'asset' && (
                <>
                  <Text style={{ color: c.text, fontSize: 18, fontWeight: '900', marginBottom: 20 }}>➕ {t('addOther')}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                    {ASSET_CATEGORIES.map(cat => (
                      <TouchableOpacity key={cat.cat}
                        style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50, backgroundColor: newCat === cat.cat ? cat.color + '33' : c.card2, borderWidth: 1, borderColor: newCat === cat.cat ? cat.color : c.border }}
                        onPress={() => setNewCat(cat.cat)}>
                        <Text style={{ color: newCat === cat.cat ? cat.color : c.muted, fontSize: 12, fontWeight: '600' }}>{cat.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                    {ICONS.map(ic => (
                      <TouchableOpacity key={ic}
                        style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: newIcon === ic ? c.accent + '33' : c.card2, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: newIcon === ic ? c.accent : c.border }}
                        onPress={() => setNewIcon(ic)}>
                        <Text style={{ fontSize: 20 }}>{ic}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {[
                    { label: t('name'),    val: newName,  set: setNewName,  ph: 'e.g. Bitcoin',    kb: 'default'     as const },
                    { label: t('details'), val: newSub,   set: setNewSub,   ph: 'e.g. 0.5 BTC',   kb: 'default'     as const },
                    { label: `${t('estValue')} (${currencySymbol})`, val: newValue, set: setNewValue, ph: 'e.g. 15000', kb: 'decimal-pad' as const },
                  ].map((f, i) => (
                    <View key={i} style={{ marginBottom: 12 }}>
                      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{f.label}</Text>
                      <TextInput style={{ backgroundColor: c.card2, borderRadius: 12, padding: 14, color: c.text, fontSize: 15, borderWidth: 1, borderColor: c.border }} placeholder={f.ph} placeholderTextColor={c.muted} value={f.val} onChangeText={f.set} keyboardType={f.kb} />
                    </View>
                  ))}
                </>
              )}

              {/* Buttons */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 40 }}>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: c.card2, borderRadius: 14, padding: 16, alignItems: 'center' }}
                  onPress={() => { resetForms(); setShowAdd(false); }}>
                  <Text style={{ color: c.muted, fontWeight: '700' }}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center' }}
                  onPress={addAsset}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>{t('add')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Paywall visible={showPaywall} onClose={() => setShowPaywall(false)} />
    </ScrollView>
  );
}