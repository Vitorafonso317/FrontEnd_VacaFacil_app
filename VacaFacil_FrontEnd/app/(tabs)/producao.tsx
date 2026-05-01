import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  Alert, StyleSheet, TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getProduction } from '../../services/productionService';
import type { ProductionRecord } from '../../types';
import { colors } from '../../constants/colors';

export default function Producao() {
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const router = useRouter();

  async function load() {
    try {
      const res = await getProduction();
      setRecords(res.data);
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = records.filter(r =>
    String(r.vaca_id).includes(search) || r.data?.includes(search)
  );

  const totalMensal = records.reduce((acc, r) => acc + (r.litros ?? 0), 0);
  const mediaPorVaca = records.length > 0 ? (totalMensal / records.length).toFixed(1) : '0';

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;

  return (
    <View style={s.screen}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.labelCap}>PRODUÇÃO DIÁRIA</Text>
            <Text style={s.title}>Histórico</Text>
          </View>
          <View style={s.badge}>
            <Text style={s.badgeText}>+12% vs. Ontem</Text>
          </View>
        </View>

        {/* Bento resumo */}
        <View style={s.bentoRow}>
          <View style={s.bentoCard}>
            <MaterialIcons name="water-drop" size={22} color={colors.primary} />
            <Text style={s.bentoValue}>{totalMensal.toLocaleString('pt-BR')}L</Text>
            <Text style={s.bentoLabel}>Total Mensal</Text>
          </View>
          <View style={s.bentoCard}>
            <MaterialIcons name="calendar-today" size={22} color={colors.secondary} />
            <Text style={s.bentoValue}>{mediaPorVaca}L</Text>
            <Text style={s.bentoLabel}>Média por Vaca</Text>
          </View>
        </View>
      </View>

      {/* Busca */}
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <MaterialIcons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={s.searchInput}
            placeholder="Filtrar por nome ou data"
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={s.filterBtn}>
          <MaterialIcons name="tune" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={s.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} activeOpacity={0.8}>
            <View style={s.cardIcon}>
              <MaterialIcons name="agriculture" size={22} color={colors.primary} />
            </View>
            <View style={s.cardInfo}>
              <Text style={s.cardName}>Vaca #{item.vaca_id}</Text>
              <Text style={s.cardSub}>{item.data}</Text>
            </View>
            <View style={s.cardRight}>
              <Text style={s.cardValue}>{item.litros} L</Text>
              <MaterialIcons name="chevron-right" size={18} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <MaterialIcons name="show-chart" size={48} color={colors.borderLight} />
            <Text style={s.emptyText}>Nenhum registro de produção.</Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: 100 }} />}
      />

      {/* FAB */}
      <TouchableOpacity style={s.fab} activeOpacity={0.85}>
        <MaterialIcons name="add" size={22} color={colors.onPrimary} />
        <Text style={s.fabText}>Registrar Produção</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, gap: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  labelCap: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.5 },
  title: { fontSize: 32, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  badge: { backgroundColor: colors.onPrimaryContainer, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '700', color: colors.primaryContainer },

  bentoRow: { flexDirection: 'row', gap: 12 },
  bentoCard: {
    flex: 1, backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb',
    padding: 12, gap: 4,
  },
  bentoValue: { fontSize: 24, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  bentoLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },

  searchRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 8 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surfaceContainerLow, borderRadius: 8,
    borderWidth: 1, borderColor: colors.borderLight, paddingHorizontal: 12, height: 48,
  },
  searchInput: { flex: 1, fontSize: 16, color: colors.text },
  filterBtn: {
    width: 48, height: 48, backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 8, borderWidth: 1, borderColor: colors.borderLight,
    alignItems: 'center', justifyContent: 'center',
  },

  list: { paddingHorizontal: 20, gap: 8 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb',
    padding: 12, minHeight: 64,
  },
  cardIcon: {
    width: 48, height: 48, borderRadius: 8,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center', justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: '700', color: colors.text },
  cardSub: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  cardValue: { fontSize: 18, fontWeight: '700', color: colors.primary },

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
