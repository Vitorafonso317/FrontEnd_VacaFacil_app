import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  Alert, StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getReceitas, getDespesas, deleteReceita, deleteDespesa } from '../../services/financialService';
import type { FinancialRecord } from '../../types';
import { colors } from '../../constants/colors';

type Tab = 'receitas' | 'despesas';

const ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  receitas: 'local-shipping',
  despesas: 'grass',
};

export default function Financeiro() {
  const [tab, setTab] = useState<Tab>('receitas');
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [loading, setLoading] = useState(true);

  async function load(t: Tab = tab) {
    setLoading(true);
    try {
      const res = t === 'receitas' ? await getReceitas() : await getDespesas();
      setRecords(res.data);
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(tab); }, [tab]);

  const total = records.reduce((acc, r) => acc + (r.valor ?? 0), 0);
  const isReceita = tab === 'receitas';

  return (
    <View style={s.screen}>
      {/* Bento Grid */}
      <View style={s.bentoSection}>
        <View style={[s.card, s.cardFull]}>
          <Text style={s.labelCap}>SALDO ATUAL</Text>
          <Text style={s.saldo}>R$ 45.280,00</Text>
          <View style={s.trendRow}>
            <MaterialIcons name="trending-up" size={16} color={colors.primary} />
            <Text style={s.trendText}>+12% este mês</Text>
          </View>
        </View>
        <View style={s.bentoRow}>
          <View style={[s.card, s.cardHalf]}>
            <View style={s.cardIconRow}>
              <MaterialIcons name="arrow-downward" size={18} color={colors.primary} />
              <Text style={[s.labelCap, { color: colors.primary }]}>ENTRADAS</Text>
            </View>
            <Text style={s.valueH2}>R$ 62.400</Text>
          </View>
          <View style={[s.card, s.cardHalf]}>
            <View style={s.cardIconRow}>
              <MaterialIcons name="arrow-upward" size={18} color={colors.error} />
              <Text style={[s.labelCap, { color: colors.error }]}>SAÍDAS</Text>
            </View>
            <Text style={s.valueH2}>R$ 17.120</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabsRow}>
        <TouchableOpacity
          style={[s.tabBtn, tab === 'receitas' && s.tabBtnActive]}
          onPress={() => setTab('receitas')}
        >
          <Text style={[s.tabText, tab === 'receitas' && s.tabTextActive]}>Receitas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tabBtn, tab === 'despesas' && s.tabBtnActive]}
          onPress={() => setTab('despesas')}
        >
          <Text style={[s.tabText, tab === 'despesas' && s.tabTextActive]}>Despesas</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <FlatList
          data={records}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={s.list}
          renderItem={({ item }) => (
            <View style={s.transCard}>
              <View style={[s.transIcon, { backgroundColor: isReceita ? colors.onPrimaryContainer : colors.errorContainer }]}>
                <MaterialIcons
                  name={isReceita ? 'local-shipping' : 'grass'}
                  size={22}
                  color={isReceita ? colors.primaryContainer : colors.error}
                />
              </View>
              <View style={s.transInfo}>
                <Text style={s.transTitle}>{item.descricao}</Text>
                <Text style={s.transSub}>{item.data}</Text>
              </View>
              <Text style={[s.transValue, { color: isReceita ? colors.primary : colors.error }]}>
                {isReceita ? '+' : '-'} R$ {item.valor?.toFixed(2)}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <MaterialIcons name="account-balance-wallet" size={48} color={colors.borderLight} />
              <Text style={s.emptyText}>Nenhum registro.</Text>
            </View>
          }
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={s.fab} activeOpacity={0.85}>
        <MaterialIcons name="add" size={22} color={colors.onPrimary} />
        <Text style={s.fabText}>Nova Transação</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  bentoSection: { padding: 20, gap: 12 },
  bentoRow: { flexDirection: 'row', gap: 12 },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight, padding: 16, gap: 8,
  },
  cardFull: {},
  cardHalf: { flex: 1 },
  cardIconRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  labelCap: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.5 },
  saldo: { fontSize: 32, fontWeight: '700', color: colors.primary, letterSpacing: -0.5 },
  valueH2: { fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trendText: { fontSize: 12, fontWeight: '700', color: colors.primary },

  tabsRow: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 8,
    backgroundColor: colors.surfaceContainer, borderRadius: 8, padding: 4,
  },
  tabBtn: { flex: 1, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
  tabBtnActive: { backgroundColor: colors.surfaceContainerLowest },
  tabText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: colors.primaryContainer },

  list: { paddingHorizontal: 20, gap: 8 },
  transCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 8, borderWidth: 1, borderColor: colors.borderLight,
    padding: 12, minHeight: 64,
  },
  transIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  transInfo: { flex: 1 },
  transTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  transSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  transValue: { fontSize: 18, fontWeight: '700' },

  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 16, color: colors.textSecondary },

  fab: {
    position: 'absolute', bottom: 20, right: 20,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.primary, paddingHorizontal: 20, height: 56,
    borderRadius: 999, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  fabText: { color: colors.onPrimary, fontSize: 16, fontWeight: '600' },
});
