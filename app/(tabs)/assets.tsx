import { useFinance } from '@/context/FinanceContext';
import { usePlan } from '@/context/PlanContext';
import { useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

type CustomAsset = {
  id: string; icon: string; name: string; sub: string;
  value: number; change: number | null; category: string;
};

const ASSET_CATEGORIES = [
  { label: '🏠 Property',  color: '#FF9F43', cat: 'property' },
  { label: '🚗 Vehicles',  color: '#a89fff', cat: 'vehicles' },
  { label: '₿ Crypto',     color: '#FFD700', cat: 'crypto'   },
  { label: '📈 Stocks',    color: '#6C63FF', cat: 'stocks'   },
  { label: '💰 Savings',   color: '#00D4AA', cat: 'savings'  },
  { label: '🎁 Other',     color: '#FF6B6B', cat: 'other'    },
];

const ICONS = ['🏠','🚗','₿','📈','💰','🏦','💎','🖥️','📱','🎸','⌚','✈️','🛥️','🏋️','🎁','🚢','🏍️','🚐'];

export default function AssetsScreen() {
  const { theme: c } = useTheme();
  const { hasFeature } = usePlan();
  const { cards, investments } = useFinance();

  const [customAssets, setCustomAssets] = useState<CustomAsset[]>([]);
  const [openCats, setOpenCats]         = useState<string[]>([]);
  const [showAdd, setShowAdd]           = useState(false);
  const [addMode, setAddMode]           = useState<'asset'|'vehicle'|'property'>('asset');

  // Generic asset fields
  const [newName, setNewName]           = useState('');
  const [newSub, setNewSub]             = useState('');
  const [newValue, setNewValue]         = useState('');
  const [newChange, setNewChange]       = useState('');
  const [newIcon, setNewIcon]           = useState('🏠');
  const [newCat, setNewCat]             = useState('property');
  const [newHasChange, setNewHasChange] = useState(false);

  // Vehicle specific
  const [vMake, setVMake]   = useState('');
  const [vModel, setVModel] = useState('');
  const [vYear, setVYear]   = useState('');
  const [vValue, setVValue] = useState('');
  const [vIcon, setVIcon]   = useState('🚗');

  // Property specific
  const [pAddress, setPAddress]   = useState('');
  const [pType, setPType]         = useState('Residential');
  const [pValue, setPValue]       = useState('');
  const [pMortgage, setPMortgage] = useState('');

  if (!hasFeature('investmentTracking')) {
    return (
      <View style={{ flex: 1, backgroundColor: c.dark, justifyContent: 'center', alignItems: 'center', padding: 30 }}>
        <Text style={{ fontSize: 60, marginBottom: 16 }}>💼</Text>
        <Text style={{ color: c.text, fontSize: 24, fontWeight: '900', marginBottom: 8 }}>Assets & Investments</Text>
        <Text style={{ color: c.muted, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>Track your cards, investments, property and more.{'\n'}Available on Premium and above.</Text>
        <View style={{ backgroundColor: c.card, borderRadius: 16, padding: 16, width: '100%', marginBottom: 24, borderWidth: 1, borderColor: c.border }}>
          {['Linked bank card balances','Stock & share portfolio','Crypto tracking','Property & vehicle values','Net worth calculation'].map((f, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
              <Text style={{ color: '#00D4AA', fontWeight: '700', fontSize: 14 }}>✓</Text>
              <Text style={{ color: c.text, fontSize: 13 }}>{f}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={{ backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center', width: '100%' }}>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>👑 Upgrade to Premium — £7.99/mo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggle = (label: string) =>
    setOpenCats(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);

  const openModal = (mode: 'asset'|'vehicle'|'property') => {
    setAddMode(mode);
    if (mode === 'vehicle')  { setNewCat('vehicles'); setNewIcon('🚗'); }
    if (mode === 'property') { setNewCat('property'); setNewIcon('🏠'); }
    setShowAdd(true);
  };

  const addAsset = () => {
    let asset: CustomAsset | null = null;

    if (addMode === 'vehicle') {
      if (!vMake || !vValue) return;
      asset = { id: Date.now().toString(), icon: vIcon, name: `${vYear} ${vMake} ${vModel}`.trim(), sub: 'Est. current value', value: parseFloat(vValue), change: null, category: 'vehicles' };
      setVMake(''); setVModel(''); setVYear(''); setVValue(''); setVIcon('🚗');
    } else if (addMode === 'property') {
      if (!pAddress || !pValue) return;
      const equity = parseFloat(pValue) - (parseFloat(pMortgage) || 0);
      asset = { id: Date.now().toString(), icon: '🏠', name: pAddress, sub: `${pType} · Equity: £${equity.toLocaleString('en-GB')}`, value: parseFloat(pValue), change: null, category: 'property' };
      setPAddress(''); setPType('Residential'); setPValue(''); setPMortgage('');
    } else {
      if (!newName || !newValue) return;
      asset = { id: Date.now().toString(), icon: newIcon, name: newName, sub: newSub, value: parseFloat(newValue), change: newHasChange ? parseFloat(newChange) || 0 : null, category: newCat };
      setNewName(''); setNewSub(''); setNewValue(''); setNewChange(''); setNewIcon('🏠'); setNewCat('property'); setNewHasChange(false);
    }

    if (asset) setCustomAssets(prev => [...prev, asset!]);
    setShowAdd(false);
  };

  const totalCards  = cards.reduce((s, card) => s + card.balance, 0);
  const totalInvest = investments.reduce((s, i) => s + i.value, 0);
  const totalCustom = customAssets.reduce((s, a) => s + a.value, 0);
  const totalAssets = [totalCards > 0 ? totalCards : 0, totalInvest > 0 ? totalInvest : 0, totalCustom > 0 ? totalCustom : 0].reduce((a, b) => a + b, 0);
  const totalLiab   = (totalCards < 0 ? totalCards : 0) + customAssets.filter(a => a.value < 0).reduce((s, a) => s + a.value, 0);
  const netWorth    = totalAssets + totalLiab;

  const plaidSections = [
    { label: '💳 Cards',       color: '#00D4AA', total: totalCards,  items: cards.map(card => ({ icon: '🏦', name: card.bank, sub: card.type, value: card.balance, change: null, id: null })) },
    { label: '📈 Investments', color: '#6C63FF', total: totalInvest, items: investments.map(inv => ({ icon: inv.icon, name: inv.name, sub: inv.sub, value: inv.value, change: inv.change, id: null })) },
  ].filter(s => s.items.length > 0);

  const customSections = ASSET_CATEGORIES.map(cat => ({
    label: cat.label, color: cat.color,
    total: customAssets.filter(a => a.category === cat.cat).reduce((s, a) => s + a.value, 0),
    items: customAssets.filter(a => a.category === cat.cat).map(a => ({ icon: a.icon, name: a.name, sub: a.sub, value: a.value, change: a.change, id: a.id })),
  })).filter(s => s.items.length > 0);

  const allSections = [...plaidSections, ...customSections];
  const empty = allSections.length === 0;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.dark, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 60, marginBottom: 20 }}>
        <Text style={{ color: c.text, fontSize: 26, fontWeight: '900' }}>Assets 💼</Text>
      </View>

      {/* Add Buttons */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
        {[
          { label: '🏠 Property', mode: 'property' as const },
          { label: '🚗 Vehicle',  mode: 'vehicle'  as const },
          { label: '➕ Other',    mode: 'asset'    as const },
        ].map(btn => (
          <TouchableOpacity key={btn.mode} style={{ flex: 1, backgroundColor: c.card, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: c.border }} onPress={() => openModal(btn.mode)}>
            <Text style={{ color: c.accent, fontSize: 13, fontWeight: '700' }}>{btn.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Net Worth */}
      <View style={{ backgroundColor: c.card, borderRadius: 24, padding: 22, borderWidth: 1, borderColor: c.border, marginBottom: 24 }}>
        <Text style={{ color: c.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 }}>NET WORTH</Text>
        <Text style={{ color: c.text, fontSize: 34, fontWeight: '900', marginVertical: 6 }}>
          £{netWorth.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: c.muted, fontSize: 11 }}>Total Assets</Text>
            <Text style={{ color: '#00D4AA', fontSize: 15, fontWeight: '700', marginTop: 2 }}>£{totalAssets.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</Text>
          </View>
          <View style={{ width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)' }} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: c.muted, fontSize: 11 }}>Liabilities</Text>
            <Text style={{ color: '#FF6B6B', fontSize: 15, fontWeight: '700', marginTop: 2 }}>£{Math.abs(totalLiab).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</Text>
          </View>
        </View>
      </View>

      {empty ? (
        <View style={{ alignItems: 'center', padding: 40 }}>
          <Text style={{ fontSize: 50, marginBottom: 16 }}>💼</Text>
          <Text style={{ color: c.text, fontSize: 18, fontWeight: '800', marginBottom: 8 }}>No assets yet</Text>
          <Text style={{ color: c.muted, fontSize: 13, textAlign: 'center' }}>Link your bank on the home screen or use the buttons above to add property, vehicles and more</Text>
        </View>
      ) : (
        allSections.map(section => {
          const isOpen = openCats.includes(section.label);
          return (
            <View key={section.label} style={{ backgroundColor: c.card, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }}>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10 }} onPress={() => toggle(section.label)}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: section.color }} />
                <Text style={{ color: c.text, fontSize: 14, fontWeight: '700', flex: 1 }}>{section.label}</Text>
                <Text style={{ color: section.total < 0 ? '#FF6B6B' : c.text, fontSize: 14, fontWeight: '800' }}>
                  {section.total < 0 ? '-' : ''}£{Math.abs(section.total).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </Text>
                <Text style={{ color: c.muted, fontSize: 11, marginLeft: 6 }}>{isOpen ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {isOpen && section.items.map((item: any, i: number) => (
                <TouchableOpacity
                  key={i}
                  onLongPress={() => item.id && setCustomAssets(prev => prev.filter(a => a.id !== item.id))}
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
                      {item.value < 0 ? '-' : ''}£{Math.abs(item.value).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
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
        })
      )}

      <Text style={{ color: c.muted, fontSize: 11, textAlign: 'center', marginBottom: 40 }}>Long press any custom asset to delete it</Text>

      {/* Add Modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <ScrollView style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: c.border }} showsVerticalScrollIndicator={false}>
            <View style={{ padding: 24 }}>

              {/* Vehicle Form */}
              {addMode === 'vehicle' && (
                <>
                  <Text style={{ color: c.text, fontSize: 18, fontWeight: '900', marginBottom: 20 }}>🚗 Add Vehicle</Text>
                  <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>Icon</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                    {['🚗','🚙','🏍️','🚐','🚕','🚌','🛻','🏎️'].map(ic => (
                      <TouchableOpacity key={ic} style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: vIcon === ic ? c.accent + '33' : c.card2, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: vIcon === ic ? c.accent : c.border }} onPress={() => setVIcon(ic)}>
                        <Text style={{ fontSize: 20 }}>{ic}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {[
                    { label: 'Make',        val: vMake,  set: setVMake,  ph: 'e.g. Ford'     },
                    { label: 'Model',       val: vModel, set: setVModel, ph: 'e.g. Focus'     },
                    { label: 'Year',        val: vYear,  set: setVYear,  ph: 'e.g. 2021'      },
                    { label: 'Est. Value (£)', val: vValue, set: setVValue, ph: 'e.g. 12500'  },
                  ].map((f, i) => (
                    <View key={i} style={{ marginBottom: 12 }}>
                      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{f.label}</Text>
                      <TextInput style={{ backgroundColor: c.card2, borderRadius: 12, padding: 14, color: c.text, fontSize: 15, borderWidth: 1, borderColor: c.border }} placeholder={f.ph} placeholderTextColor={c.muted} value={f.val} onChangeText={f.set} keyboardType={f.label.includes('Value') || f.label === 'Year' ? 'decimal-pad' : 'default'} />
                    </View>
                  ))}
                </>
              )}

              {/* Property Form */}
              {addMode === 'property' && (
                <>
                  <Text style={{ color: c.text, fontSize: 18, fontWeight: '900', marginBottom: 20 }}>🏠 Add Property</Text>
                  <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>Property Type</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                    {['Residential','Buy to Let','Commercial','Land'].map(type => (
                      <TouchableOpacity key={type} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50, backgroundColor: pType === type ? c.accent + '33' : c.card2, borderWidth: 1, borderColor: pType === type ? c.accent : c.border }} onPress={() => setPType(type)}>
                        <Text style={{ color: pType === type ? c.accent : c.muted, fontSize: 12, fontWeight: '600' }}>{type}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {[
                    { label: 'Address / Name',      val: pAddress,  set: setPAddress,  ph: 'e.g. 12 Oak Street'  },
                    { label: 'Est. Market Value (£)', val: pValue,  set: setPValue,    ph: 'e.g. 250000'          },
                    { label: 'Outstanding Mortgage (£)', val: pMortgage, set: setPMortgage, ph: 'e.g. 150000 (optional)' },
                  ].map((f, i) => (
                    <View key={i} style={{ marginBottom: 12 }}>
                      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{f.label}</Text>
                      <TextInput style={{ backgroundColor: c.card2, borderRadius: 12, padding: 14, color: c.text, fontSize: 15, borderWidth: 1, borderColor: c.border }} placeholder={f.ph} placeholderTextColor={c.muted} value={f.val} onChangeText={f.set} keyboardType={f.label.includes('£') ? 'decimal-pad' : 'default'} />
                    </View>
                  ))}
                  {pValue && pMortgage ? (
                    <View style={{ backgroundColor: c.card2, borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: c.border }}>
                      <Text style={{ color: c.muted, fontSize: 12 }}>Equity: <Text style={{ color: '#00D4AA', fontWeight: '700' }}>£{(parseFloat(pValue) - parseFloat(pMortgage)).toLocaleString('en-GB')}</Text></Text>
                    </View>
                  ) : null}
                </>
              )}

              {/* Generic Asset Form */}
              {addMode === 'asset' && (
                <>
                  <Text style={{ color: c.text, fontSize: 18, fontWeight: '900', marginBottom: 20 }}>➕ Add Asset</Text>
                  <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>Category</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                    {ASSET_CATEGORIES.map(cat => (
                      <TouchableOpacity key={cat.cat} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50, backgroundColor: newCat === cat.cat ? cat.color + '33' : c.card2, borderWidth: 1, borderColor: newCat === cat.cat ? cat.color : c.border }} onPress={() => setNewCat(cat.cat)}>
                        <Text style={{ color: newCat === cat.cat ? cat.color : c.muted, fontSize: 12, fontWeight: '600' }}>{cat.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>Icon</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                    {ICONS.map(ic => (
                      <TouchableOpacity key={ic} style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: newIcon === ic ? c.accent + '33' : c.card2, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: newIcon === ic ? c.accent : c.border }} onPress={() => setNewIcon(ic)}>
                        <Text style={{ fontSize: 20 }}>{ic}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {[
                    { label: 'Name',      val: newName,  set: setNewName,  ph: 'e.g. Bitcoin',   kb: 'default' as const     },
                    { label: 'Details',   val: newSub,   set: setNewSub,   ph: 'e.g. 0.5 BTC',   kb: 'default' as const     },
                    { label: 'Value (£)', val: newValue, set: setNewValue, ph: 'e.g. 15000',      kb: 'decimal-pad' as const },
                  ].map((f, i) => (
                    <View key={i} style={{ marginBottom: 12 }}>
                      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{f.label}</Text>
                      <TextInput style={{ backgroundColor: c.card2, borderRadius: 12, padding: 14, color: c.text, fontSize: 15, borderWidth: 1, borderColor: c.border }} placeholder={f.ph} placeholderTextColor={c.muted} value={f.val} onChangeText={f.set} keyboardType={f.kb} />
                    </View>
                  ))}
                  <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }} onPress={() => setNewHasChange(!newHasChange)}>
                    <View style={{ width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: newHasChange ? c.accent : c.muted, backgroundColor: newHasChange ? c.accent : 'transparent', justifyContent: 'center', alignItems: 'center' }}>
                      {newHasChange && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>✓</Text>}
                    </View>
                    <Text style={{ color: c.muted, fontSize: 13 }}>Add change % (for investments)</Text>
                  </TouchableOpacity>
                  {newHasChange && (
                    <View style={{ marginBottom: 12 }}>
                      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>Change %</Text>
                      <TextInput style={{ backgroundColor: c.card2, borderRadius: 12, padding: 14, color: c.text, fontSize: 15, borderWidth: 1, borderColor: c.border }} placeholder="e.g. 2.5 or -1.2" placeholderTextColor={c.muted} value={newChange} onChangeText={setNewChange} keyboardType="decimal-pad" />
                    </View>
                  )}
                </>
              )}

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 40 }}>
                <TouchableOpacity style={{ flex: 1, backgroundColor: c.card2, borderRadius: 14, padding: 16, alignItems: 'center' }} onPress={() => setShowAdd(false)}>
                  <Text style={{ color: c.muted, fontWeight: '700' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center' }} onPress={addAsset}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

    </ScrollView>
  );
}