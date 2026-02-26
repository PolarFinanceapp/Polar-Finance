import { usePlan } from '@/context/PlanContext';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const familyMembers = [
  { name: 'James',   emoji: '👨', role: 'Admin',  income: 3200, spent: 1450, balance: 1750,  color: '#6C63FF' },
  { name: 'Sarah',   emoji: '👩', role: 'Member', income: 2800, spent: 1200, balance: 1600,  color: '#00D4AA' },
  { name: 'Olivia',  emoji: '👧', role: 'Member', income: 0,    spent: 120,  balance: -120,  color: '#FF9F43' },
  { name: 'Charlie', emoji: '👦', role: 'Member', income: 0,    spent: 80,   balance: -80,   color: '#a89fff' },
];

const familyGoals = [
  { icon: '🏖️', name: 'Family Holiday',  saved: 1200, target: 4000,  color: '#00D4AA' },
  { icon: '🏠', name: 'Home Renovation', saved: 3500, target: 10000, color: '#6C63FF' },
  { icon: '🎓', name: "Olivia's Uni Fund", saved: 8000, target: 30000, color: '#FFD700' },
];

export default function FamilyScreen() {
  const { theme: c } = useTheme();
  const { hasFeature } = usePlan();

  if (!hasFeature('familyView')) {
    return (
      <View style={{ flex: 1, backgroundColor: c.dark, justifyContent: 'center', alignItems: 'center', padding: 30 }}>
        <Text style={{ fontSize: 60, marginBottom: 16 }}>👨‍👩‍👧‍👦</Text>
        <Text style={{ color: c.text, fontSize: 24, fontWeight: '900', marginBottom: 8 }}>Family Overview</Text>
        <Text style={{ color: c.muted, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>This feature is available on the{'\n'}Lifetime Family plan</Text>
        <View style={{ backgroundColor: c.card, borderRadius: 16, padding: 16, width: '100%', marginBottom: 24, borderWidth: 1, borderColor: c.border }}>
          {["View all family members' finances","Shared family goals","Family spending breakdown","Up to 6 members"].map((f, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
              <Text style={{ color: '#00D4AA', fontWeight: '700', fontSize: 14 }}>✓</Text>
              <Text style={{ color: c.text, fontSize: 13 }}>{f}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={{ backgroundColor: '#FF9F43', borderRadius: 14, padding: 16, alignItems: 'center', width: '100%' }}>
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>👨‍👩‍👧‍👦 Upgrade to Lifetime Family — £129.99</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalIncome  = familyMembers.reduce((s, m) => s + m.income, 0);
  const totalSpent   = familyMembers.reduce((s, m) => s + m.spent, 0);
  const totalBalance = familyMembers.reduce((s, m) => s + m.balance, 0);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.dark, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
      <Text style={{ color: c.text, fontSize: 26, fontWeight: '900', marginTop: 60, marginBottom: 20 }}>Family Overview 👨‍👩‍👧‍👦</Text>

      {/* Summary */}
      <View style={{ backgroundColor: c.card, borderRadius: 24, padding: 22, borderWidth: 1, borderColor: c.border, marginBottom: 24 }}>
        <Text style={{ color: c.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 }}>FAMILY NET BALANCE</Text>
        <Text style={{ color: c.text, fontSize: 34, fontWeight: '900', marginVertical: 6 }}>£{totalBalance.toLocaleString()}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          {[
            { label: '↑ Income', val: totalIncome, color: '#00D4AA' },
            { label: '↓ Spent',  val: totalSpent,  color: '#FF6B6B' },
            { label: '👥 Members', val: familyMembers.length, color: '#a89fff' },
          ].map((item, i) => (
            <React.Fragment key={item.label}>
              {i > 0 && <View style={{ width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)' }} />}
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ color: c.muted, fontSize: 11 }}>{item.label}</Text>
                <Text style={{ color: item.color, fontSize: 15, fontWeight: '700', marginTop: 2 }}>£{item.val.toLocaleString()}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* Members */}
      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 12 }}>Members</Text>
      {familyMembers.map((m, i) => (
        <View key={i} style={{ backgroundColor: c.card, borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: c.border, flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: m.color + '33', borderWidth: 2, borderColor: m.color, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 22 }}>{m.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ color: c.text, fontSize: 15, fontWeight: '700' }}>{m.name}</Text>
              <View style={{ backgroundColor: m.color + '22', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 50 }}>
                <Text style={{ color: m.color, fontSize: 11, fontWeight: '600' }}>{m.role}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
              <Text style={{ color: c.muted, fontSize: 12 }}>In: <Text style={{ color: '#00D4AA' }}>£{m.income}</Text></Text>
              <Text style={{ color: c.muted, fontSize: 12 }}>Out: <Text style={{ color: '#FF6B6B' }}>£{m.spent}</Text></Text>
              <Text style={{ color: c.muted, fontSize: 12 }}>Net: <Text style={{ color: m.balance >= 0 ? '#00D4AA' : '#FF6B6B' }}>£{m.balance}</Text></Text>
            </View>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 50, height: 5, overflow: 'hidden' }}>
              <View style={{ height: '100%', width: `${Math.min(Math.round(m.spent / (m.income || 500) * 100), 100)}%`, borderRadius: 50, backgroundColor: m.color }} />
            </View>
          </View>
        </View>
      ))}

      {/* Family Goals */}
      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 12, marginTop: 8 }}>Shared Goals</Text>
      {familyGoals.map((g, i) => {
        const pct = Math.round(g.saved / g.target * 100);
        return (
          <View key={i} style={{ backgroundColor: c.card, borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: c.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <Text style={{ fontSize: 24 }}>{g.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>{g.name}</Text>
                <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>£{g.saved.toLocaleString()} of £{g.target.toLocaleString()}</Text>
              </View>
              <Text style={{ color: g.color, fontSize: 16, fontWeight: '900' }}>{pct}%</Text>
            </View>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 50, height: 7, overflow: 'hidden' }}>
              <View style={{ height: '100%', width: `${pct}%`, borderRadius: 50, backgroundColor: g.color }} />
            </View>
          </View>
        );
      })}

      {/* Spending Breakdown */}
      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 12, marginTop: 8 }}>Spending by Member</Text>
      <View style={{ backgroundColor: c.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: c.border, marginBottom: 40 }}>
        {familyMembers.map((m, i) => {
          const pct = Math.round(m.spent / totalSpent * 100);
          return (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Text style={{ fontSize: 18, width: 28 }}>{m.emoji}</Text>
              <Text style={{ color: c.text, fontSize: 13, fontWeight: '600', width: 55 }}>{m.name}</Text>
              <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 50, height: 8, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${pct}%`, borderRadius: 50, backgroundColor: m.color }} />
              </View>
              <Text style={{ color: c.muted, fontSize: 12, width: 40, textAlign: 'right' }}>£{m.spent}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}