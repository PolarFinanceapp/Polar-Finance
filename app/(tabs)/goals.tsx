import { useLocale } from '@/context/LocaleContext';
import { usePlan } from '@/context/PlanContext';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Paywall from '../../components/Paywall';
import StarBackground from '../../components/StarBackground';
import { useTheme } from '../../context/ThemeContext';

const GOAL_ICONS = ['🏠', '✈️', '🚗', '🛡️', '📱', '💻', '🎓', '👶', '💍', '🏋️', '🎸', '🐶'];
const GOAL_COLORS = ['#6C63FF', '#00D4AA', '#FF9F43', '#FF6B6B', '#a89fff', '#FFD700'];
type Goal = { id: string; icon: string; name: string; saved: number; target: number; color: string };

export default function GoalsScreen() {
  const { theme: c } = useTheme();
  const { maxGoals } = usePlan();
  const { formatAmount, currencySymbol, t } = useLocale();
  const router = useRouter();

  const [showPaywall, setShowPaywall] = useState(false);
  const [goals, setGoalsState] = useState<Goal[]>([]);
  const [storageKey, setStorageKey] = useState<string | null>(null);
  const [addGoalVisible, setAddGoalVisible] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newSaved, setNewSaved] = useState('');
  const [newIcon, setNewIcon] = useState('🏠');
  const [newColor, setNewColor] = useState('#6C63FF');
  const [editName, setEditName] = useState('');
  const [editTarget, setEditTarget] = useState('');
  const [editSaved, setEditSaved] = useState('');
  const [editIcon, setEditIcon] = useState('🏠');
  const [editColor, setEditColor] = useState('#6C63FF');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const key = `polar_goals_${user?.id || 'local'}`;
      setStorageKey(key);
      const raw = await AsyncStorage.getItem(key);
      if (raw) setGoalsState(JSON.parse(raw));
    })();
  }, []);

  const setGoals = async (data: Goal[]) => { setGoalsState(data); if (storageKey) await AsyncStorage.setItem(storageKey, JSON.stringify(data)); };
  const addToSaved = (id: string, amount: number) => setGoals(goals.map(g => g.id === id ? { ...g, saved: Math.min(Math.max(0, g.saved + amount), g.target) } : g));
  const openEditGoal = (g: Goal) => { setEditGoal(g); setEditName(g.name); setEditTarget(g.target.toString()); setEditSaved(g.saved.toString()); setEditIcon(g.icon); setEditColor(g.color); };

  const handleAddGoal = () => {
    if (!newName || !newTarget) return;
    setGoals([...goals, { id: Date.now().toString(), icon: newIcon, name: newName, saved: parseFloat(newSaved) || 0, target: parseFloat(newTarget), color: newColor }]);
    setNewName(''); setNewTarget(''); setNewSaved(''); setNewIcon('🏠'); setNewColor('#6C63FF');
    setAddGoalVisible(false);
  };

  const handleSaveEdit = () => {
    if (!editGoal || !editName || !editTarget) return;
    setGoals(goals.map(g => g.id === editGoal.id ? { ...g, name: editName, target: parseFloat(editTarget), saved: parseFloat(editSaved) || 0, icon: editIcon, color: editColor } : g));
    setEditGoal(null);
  };

  const totalSaved = goals.reduce((s, g) => s + g.saved, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target, 0);
  const overallPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;
  const canAddGoal = goals.length < maxGoals;

  const FormFields = ({ name, setName, target, setTarget, saved, setSaved, icon, setIcon, color, setColor, onSubmit, onCancel, submitLabel }: any) => (
    <>
      {[
        { label: t('goalName'), val: name, set: setName, ph: 'e.g. Holiday Fund', kb: 'default' as const },
        { label: `${t('targetAmount')} (${currencySymbol})`, val: target, set: setTarget, ph: 'e.g. 2000', kb: 'decimal-pad' as const },
        { label: `${t('alreadySaved')} (${currencySymbol})`, val: saved, set: setSaved, ph: 'e.g. 500', kb: 'decimal-pad' as const },
      ].map((f, i) => (
        <View key={i} style={{ marginBottom: 12 }}>
          <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{f.label}</Text>
          <TextInput style={{ backgroundColor: c.card2, borderRadius: 12, padding: 14, color: c.text, fontSize: 15, borderWidth: 1, borderColor: c.border }} placeholder={f.ph} placeholderTextColor={c.muted} value={f.val} onChangeText={f.set} keyboardType={f.kb} />
        </View>
      ))}
      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{t('pickIcon')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {GOAL_ICONS.map(ic => (
          <TouchableOpacity key={ic} onPress={() => setIcon(ic)} style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: c.card2, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: icon === ic ? c.accent : 'transparent' }}>
            <Text style={{ fontSize: 20 }}>{ic}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{t('pickColour')}</Text>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        {GOAL_COLORS.map(col => (
          <TouchableOpacity key={col} onPress={() => setColor(col)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: col, borderWidth: 2.5, borderColor: color === col ? '#fff' : 'transparent' }} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: c.card2, borderRadius: 14, padding: 16, alignItems: 'center' }} onPress={onCancel}>
          <Text style={{ color: c.muted, fontWeight: '700' }}>{t('cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1, backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center', opacity: (!name || !target) ? 0.4 : 1 }} onPress={onSubmit} disabled={!name || !target}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>{submitLabel}</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // ── Back button component ──────────────────────────────────────────────────
  const BackBtn = () => (
    <TouchableOpacity onPress={() => router.back()}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 56, marginBottom: 4, alignSelf: 'flex-start' }}>
      <Ionicons name="chevron-back" size={20} color={c.accent} />
      <Text style={{ color: c.accent, fontSize: 15, fontWeight: '600' }}>Back</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.dark }}>
      <StarBackground />
      <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
        <BackBtn />
        <Text style={{ color: c.text, fontSize: 26, fontWeight: '900', marginTop: 8, marginBottom: 20 }}>{t('savingGoals')}</Text>

        {/* Summary */}
        <View style={{ backgroundColor: c.card, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: c.border, marginBottom: 24 }}>
          <Text style={{ color: c.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.2 }}>{t('totalSaved')}</Text>
          <Text style={{ color: c.text, fontSize: 32, fontWeight: '900', marginTop: 4 }}>{formatAmount(totalSaved)}</Text>
          <Text style={{ color: c.muted, fontSize: 13, marginBottom: 12 }}>of {formatAmount(totalTarget)} target</Text>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 50, height: 10, overflow: 'hidden' }}>
            <View style={{ height: '100%', width: `${overallPct}%`, borderRadius: 50, backgroundColor: c.accent }} />
          </View>
          <Text style={{ color: c.accent, fontSize: 12, fontWeight: '700', marginTop: 6, textAlign: 'right' }}>{overallPct}% {t('overall')}</Text>
        </View>

        {goals.length === 0 && (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Ionicons name="flag-outline" size={48} color={c.muted} style={{ marginBottom: 12 }} />
            <Text style={{ color: c.text, fontSize: 18, fontWeight: '800', marginBottom: 8 }}>No goals yet</Text>
            <Text style={{ color: c.muted, fontSize: 13, textAlign: 'center' }}>Add your first saving goal to get started</Text>
          </View>
        )}

        {goals.map(g => {
          const pct = Math.min(Math.round((g.saved / g.target) * 100), 100);
          return (
            <View key={g.id} style={{ backgroundColor: c.card, borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: c.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: g.color + '22', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                  <Text style={{ fontSize: 22 }}>{g.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontSize: 15, fontWeight: '700' }}>{g.name}</Text>
                  <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{formatAmount(g.target - g.saved)} to go</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={{ color: g.color, fontSize: 18, fontWeight: '900' }}>{pct}%</Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity onPress={() => openEditGoal(g)}><Ionicons name="create-outline" size={18} color={c.accent} /></TouchableOpacity>
                    <TouchableOpacity onPress={() => setGoals(goals.filter(x => x.id !== g.id))}><Ionicons name="trash-outline" size={18} color="#FF6B6B" /></TouchableOpacity>
                  </View>
                </View>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 50, height: 7, overflow: 'hidden', marginBottom: 10 }}>
                <View style={{ height: '100%', width: `${pct}%`, borderRadius: 50, backgroundColor: g.color }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ color: c.muted, fontSize: 12 }}>{t('saved')}: <Text style={{ color: '#00D4AA', fontWeight: '700' }}>{formatAmount(g.saved)}</Text></Text>
                <Text style={{ color: c.muted, fontSize: 12 }}>{t('target')}: <Text style={{ color: c.text, fontWeight: '700' }}>{formatAmount(g.target)}</Text></Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[10, 50, 100].map(amt => (
                  <TouchableOpacity key={amt} onPress={() => addToSaved(g.id, amt)} disabled={g.saved >= g.target}
                    style={{ flex: 1, backgroundColor: g.color + '22', borderRadius: 10, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: g.color + '44', opacity: g.saved >= g.target ? 0.4 : 1 }}>
                    <Text style={{ color: g.color, fontSize: 12, fontWeight: '700' }}>+{currencySymbol}{amt}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity onPress={() => addToSaved(g.id, -10)} disabled={g.saved <= 0}
                  style={{ flex: 1, backgroundColor: '#FF6B6B22', borderRadius: 10, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: '#FF6B6B44', opacity: g.saved <= 0 ? 0.4 : 1 }}>
                  <Text style={{ color: '#FF6B6B', fontSize: 12, fontWeight: '700' }}>-{currencySymbol}10</Text>
                </TouchableOpacity>
              </View>
              {pct >= 100 && (
                <View style={{ backgroundColor: '#00D4AA22', borderRadius: 12, padding: 10, marginTop: 10, alignItems: 'center', borderWidth: 1, borderColor: '#00D4AA44' }}>
                  <Text style={{ color: '#00D4AA', fontSize: 13, fontWeight: '700' }}>🎉 Goal reached!</Text>
                </View>
              )}
            </View>
          );
        })}

        {canAddGoal ? (
          <TouchableOpacity onPress={() => setAddGoalVisible(true)} style={{ backgroundColor: c.card, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: c.accent + '4D', marginBottom: 40, borderStyle: 'dashed' }}>
            <Text style={{ color: c.accent, fontSize: 15, fontWeight: '700' }}>+ {t('addNewGoal')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setShowPaywall(true)} style={{ backgroundColor: c.card, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: c.border, marginBottom: 40 }}>
            <Text style={{ color: c.muted, fontSize: 13, textAlign: 'center' }}>🔒 {maxGoals <= 1 ? t('upgradeProGoals') : t('upgradePremiumGoals')}</Text>
          </TouchableOpacity>
        )}

        <Modal visible={addGoalVisible} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
            <ScrollView style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: c.border }} showsVerticalScrollIndicator={false}>
              <View style={{ padding: 24 }}>
                <Text style={{ color: c.text, fontSize: 20, fontWeight: '900', marginBottom: 20, textAlign: 'center' }}>{t('newSavingGoal')}</Text>
                <FormFields name={newName} setName={setNewName} target={newTarget} setTarget={setNewTarget} saved={newSaved} setSaved={setNewSaved} icon={newIcon} setIcon={setNewIcon} color={newColor} setColor={setNewColor} onSubmit={handleAddGoal} onCancel={() => setAddGoalVisible(false)} submitLabel={t('add')} />
              </View>
            </ScrollView>
          </View>
        </Modal>

        <Modal visible={!!editGoal} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
            <ScrollView style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: c.border }} showsVerticalScrollIndicator={false}>
              <View style={{ padding: 24 }}>
                <Text style={{ color: c.text, fontSize: 20, fontWeight: '900', marginBottom: 20, textAlign: 'center' }}>✏️ Edit Goal</Text>
                <FormFields name={editName} setName={setEditName} target={editTarget} setTarget={setEditTarget} saved={editSaved} setSaved={setEditSaved} icon={editIcon} setIcon={setEditIcon} color={editColor} setColor={setEditColor} onSubmit={handleSaveEdit} onCancel={() => setEditGoal(null)} submitLabel={t('save')} />
              </View>
            </ScrollView>
          </View>
        </Modal>

        <Paywall visible={showPaywall} onClose={() => setShowPaywall(false)} />
      </ScrollView>
    </View>
  );
}