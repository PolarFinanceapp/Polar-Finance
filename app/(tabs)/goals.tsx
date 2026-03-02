import { useLocale } from '@/context/LocaleContext';
import { usePlan } from '@/context/PlanContext';
import { useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Paywall from '../../components/Paywall';
import { useTheme } from '../../context/ThemeContext';

const ICONS = ['🏠','✈️','🚗','🛡️','📱','💻','🎓','👶','💍','🏋️','🎸','🐶'];
const COLORS = ['#6C63FF','#00D4AA','#FF9F43','#FF6B6B','#a89fff','#FFD700'];

type Goal = { icon: string; name: string; saved: number; target: number; color: string };

const initialGoals: Goal[] = [
  { icon: '🏠', name: 'House Deposit',  saved: 8200, target: 20000, color: '#6C63FF' },
  { icon: '✈️', name: 'Holiday Fund',   saved: 620,  target: 1500,  color: '#00D4AA' },
  { icon: '🚗', name: 'New Car',        saved: 3100, target: 8000,  color: '#FF9F43' },
  { icon: '🛡️', name: 'Emergency Fund', saved: 2000, target: 3000,  color: '#FF6B6B' },
  { icon: '📱', name: 'New iPhone',     saved: 350,  target: 1000,  color: '#a89fff' },
];

export default function GoalsScreen() {
  const { theme: c } = useTheme();
  const { maxGoals } = usePlan();
  const { formatAmount, currencySymbol, t } = useLocale();

  const [showPaywall, setShowPaywall] = useState(false);
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newSaved, setNewSaved] = useState('');
  const [newIcon, setNewIcon] = useState('🏠');
  const [newColor, setNewColor] = useState('#6C63FF');

  const canAddGoal = goals.length < maxGoals;
  const totalSaved = goals.reduce((s, g) => s + g.saved, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target, 0);
  const overallPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  const handleAdd = () => {
    if (!newName || !newTarget) return;
    setGoals([...goals, { icon: newIcon, name: newName, saved: parseFloat(newSaved) || 0, target: parseFloat(newTarget), color: newColor }]);
    setNewName(''); setNewTarget(''); setNewSaved(''); setNewIcon('🏠'); setNewColor('#6C63FF');
    setModalVisible(false);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.dark, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
      <Text style={{ color: c.text, fontSize: 26, fontWeight: '900', marginTop: 60, marginBottom: 20 }}>{t('savingGoals')} 🎯</Text>

      <View style={{ backgroundColor: c.card, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: c.border, marginBottom: 24 }}>
        <Text style={{ color: c.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.2 }}>{t('totalSaved')}</Text>
        <Text style={{ color: c.text, fontSize: 32, fontWeight: '900', marginTop: 4 }}>{formatAmount(totalSaved)}</Text>
        <Text style={{ color: c.muted, fontSize: 13, marginBottom: 12 }}>{t('of') || 'of'} {formatAmount(totalTarget)} {t('target').toLowerCase()}</Text>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 50, height: 10, overflow: 'hidden' }}>
          <View style={{ height: '100%', width: `${overallPct}%`, borderRadius: 50, backgroundColor: c.accent }} />
        </View>
        <Text style={{ color: c.accent, fontSize: 12, fontWeight: '700', marginTop: 6, textAlign: 'right' }}>{overallPct}% {t('overall')}</Text>
      </View>

      {goals.map((g, i) => {
        const pct = Math.min(Math.round((g.saved / g.target) * 100), 100);
        return (
          <View key={i} style={{ backgroundColor: c.card, borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: c.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: g.color + '22', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                <Text style={{ fontSize: 22 }}>{g.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontSize: 15, fontWeight: '700' }}>{g.name}</Text>
                <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{formatAmount(g.target - g.saved)} {t('toGo')}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={{ color: g.color, fontSize: 18, fontWeight: '900' }}>{pct}%</Text>
                <TouchableOpacity onPress={() => setGoals(goals.filter((_, idx) => idx !== i))}>
                  <Text style={{ color: '#FF6B6B', fontSize: 13, fontWeight: '700' }}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 50, height: 7, overflow: 'hidden', marginBottom: 10 }}>
              <View style={{ height: '100%', width: `${pct}%`, borderRadius: 50, backgroundColor: g.color }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: c.muted, fontSize: 12 }}>{t('saved')}: <Text style={{ color: '#00D4AA', fontWeight: '700' }}>{formatAmount(g.saved)}</Text></Text>
              <Text style={{ color: c.muted, fontSize: 12 }}>{t('target')}: <Text style={{ color: c.text, fontWeight: '700' }}>{formatAmount(g.target)}</Text></Text>
            </View>
          </View>
        );
      })}

      {canAddGoal ? (
        <TouchableOpacity style={{ backgroundColor: c.card, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: c.accent + '4D', marginBottom: 40, borderStyle: 'dashed' }} onPress={() => setModalVisible(true)}>
          <Text style={{ color: c.accent, fontSize: 15, fontWeight: '700' }}>＋ {t('addNewGoal')}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={() => setShowPaywall(true)} style={{ backgroundColor: c.card, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: c.border, marginBottom: 40 }}>
          <Text style={{ color: c.muted, fontSize: 13, textAlign: 'center' }}>
            🔒 {maxGoals <= 1 ? t('upgradeProGoals') : t('upgradePremiumGoals')}
          </Text>
        </TouchableOpacity>
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, borderWidth: 1, borderColor: c.border }}>
            <Text style={{ color: c.text, fontSize: 20, fontWeight: '900', marginBottom: 20, textAlign: 'center' }}>{t('newSavingGoal')}</Text>
            {[
              { label: t('goalName'), val: newName, set: setNewName, ph: 'e.g. Holiday Fund', kb: 'default' as const },
              { label: `${t('targetAmount')} (${currencySymbol})`, val: newTarget, set: setNewTarget, ph: 'e.g. 2000', kb: 'decimal-pad' as const },
              { label: `${t('alreadySaved')} (${currencySymbol})`, val: newSaved, set: setNewSaved, ph: 'e.g. 500', kb: 'decimal-pad' as const },
            ].map((f, i) => (
              <View key={i} style={{ marginBottom: 12 }}>
                <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{f.label}</Text>
                <TextInput style={{ backgroundColor: c.card2, borderRadius: 12, padding: 14, color: c.text, fontSize: 15, borderWidth: 1, borderColor: c.border }} placeholder={f.ph} placeholderTextColor={c.muted} value={f.val} onChangeText={f.set} keyboardType={f.kb} />
              </View>
            ))}
            <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{t('pickIcon')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {ICONS.map(ic => (
                <TouchableOpacity key={ic} style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: c.card2, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: newIcon === ic ? c.accent : 'transparent' }} onPress={() => setNewIcon(ic)}>
                  <Text style={{ fontSize: 20 }}>{ic}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{t('pickColour')}</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              {COLORS.map(col => (
                <TouchableOpacity key={col} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: col, borderWidth: 2, borderColor: newColor === col ? '#fff' : 'transparent' }} onPress={() => setNewColor(col)} />
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={{ flex: 1, backgroundColor: c.card2, borderRadius: 14, padding: 16, alignItems: 'center' }} onPress={() => setModalVisible(false)}>
                <Text style={{ color: c.muted, fontWeight: '700' }}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center', opacity: (!newName || !newTarget) ? 0.4 : 1 }} onPress={handleAdd}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>{t('add')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Paywall visible={showPaywall} onClose={() => setShowPaywall(false)} />
    </ScrollView>
  );
}