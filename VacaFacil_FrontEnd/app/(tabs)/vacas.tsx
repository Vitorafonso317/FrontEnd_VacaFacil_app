import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  Alert, StyleSheet, TextInput, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { getCows, deleteCow } from '../../services/cattleService';
import type { Cow } from '../../types';
import { colors } from '../../constants/colors';
import ProductionModal from '../../components/ProductionModal';

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  saudavel: { bg: colors.onPrimaryContainer, text: colors.primaryContainer, label: 'Ativa' },
  ativa: { bg: colors.onPrimaryContainer, text: colors.primaryContainer, label: 'Ativa' },
  seca: { bg: colors.surfaceContainerHighest, text: colors.textSecondary, label: 'Seca' },
  tratamento: { bg: colors.errorContainer, text: colors.onErrorContainer, label: 'Tratamento' },
};

function getStatus(status: string) {
  return STATUS_STYLE[status?.toLowerCase()] ?? STATUS_STYLE['ativa'];
}

type StatusFilter = 'todos' | 'saudavel' | 'seca' | 'tratamento';
const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'todos', label: 'Todas' },
  { key: 'saudavel', label: 'Ativas' },
  { key: 'seca', label: 'Secas' },
  { key: 'tratamento', label: 'Tratamento' },
];

export default function Vacas() {
  const [cows, setCows] = useState<Cow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [quickCow, setQuickCow] = useState<Cow | null>(null);
  const router = useRouter();

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await getCows();
      setCows(res.data);
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  async function handleDelete(id: number) {
    Alert.alert('Excluir vaca', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive', onPress: async () => {
          try {
            await deleteCow(id);
            setCows(prev => prev.filter(c => c.id !== id));
          } catch (e: any) {
            Alert.alert('Erro', e.message);
          }
        }
      }
    ]);
  }

  const filtered = cows.filter(c => {
    const matchText = c.nome?.toLowerCase().includes(search.toLowerCase()) ||
      c.raca?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'todos' ||
      c.status_saude?.toLowerCase() === statusFilter ||
      (statusFilter === 'saudavel' && c.status_saude?.toLowerCase() === 'ativa');
    return matchText && matchStatus;
  });

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;

  return (
    <View style={s.screen}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Minhas Vacas</Text>
        <Text style={s.subtitle}>Gerencie seu rebanho e monitore a produtividade individual.</Text>
      </View>

      {/* Busca */}
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <MaterialIcons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={s.searchInput}
            placeholder="Buscar por nome ou raça..."
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Filtros por status */}
      <View style={s.chipsRow}>
        {STATUS_FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[s.chip, statusFilter === f.key && s.chipActive]}
            onPress={() => setStatusFilter(f.key)}
            activeOpacity={0.7}
          >
            <Text style={[s.chipText, statusFilter === f.key && s.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => {
          const st = getStatus(item.status_saude);
          return (
            <TouchableOpacity
              style={s.card}
              activeOpacity={0.8}
              onPress={() => router.push(`/vacas/${item.id}`)}
            >
              <View style={s.cowImage}>
                <MaterialIcons name="agriculture" size={32} color={colors.primary} />
              </View>
              <View style={s.cardInfo}>
                <View style={s.cardTop}>
                  <Text style={s.cowName}>{item.nome}</Text>
                  <View style={[s.badge, { backgroundColor: st.bg }]}>
                    <Text style={[s.badgeText, { color: st.text }]}>{st.label.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={s.cowMeta}><Text style={s.metaBold}>Raça:</Text> {item.raca ?? '—'}</Text>
                <Text style={s.cowMeta}><Text style={s.metaBold}>Idade:</Text> {item.idade ?? '—'}</Text>
              </View>

              {/* Registro rápido de leite */}
              <TouchableOpacity
                style={s.quickBtn}
                onPress={() => setQuickCow(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="water-drop" size={20} color={colors.onPrimary} />
              </TouchableOpacity>

              <MaterialIcons name="chevron-right" size={22} color={colors.border} />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={s.empty}>
            <MaterialIcons name="agriculture" size={48} color={colors.borderLight} />
            <Text style={s.emptyText}>Nenhuma vaca cadastrada.</Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: 100 }} />}
      />

      {/* Botão adicionar */}
      <TouchableOpacity style={s.addBtn} onPress={() => router.push('/vacas/create')} activeOpacity={0.85}>
        <MaterialIcons name="add" size={22} color={colors.onPrimary} />
        <Text style={s.addBtnText}>Adicionar Vaca</Text>
      </TouchableOpacity>

      {/* Modal de registro rápido de leite */}
      <ProductionModal
        visible={!!quickCow}
        onClose={() => setQuickCow(null)}
        onSaved={() => setQuickCow(null)}
        preSelectedCowId={quickCow?.id}
        preSelectedCowName={quickCow?.nome}
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, gap: 4 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 16, color: colors.textSecondary },

  searchRow: { paddingHorizontal: 20, marginBottom: 10 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surfaceContainerLow, borderRadius: 8,
    borderWidth: 1, borderColor: colors.borderLight, paddingHorizontal: 12, height: 48,
  },
  searchInput: { flex: 1, fontSize: 16, color: colors.text },

  chipsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 12 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
    borderWidth: 1, borderColor: colors.borderLight,
    backgroundColor: colors.surfaceContainerLow,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: colors.onPrimary },

  list: { paddingHorizontal: 20, gap: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 8, borderWidth: 1, borderColor: colors.borderLight, padding: 12,
  },
  cowImage: {
    width: 72, height: 72, borderRadius: 8,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center', justifyContent: 'center',
  },
  cardInfo: { flex: 1, gap: 4 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cowName: { fontSize: 14, fontWeight: '700', color: colors.text },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  cowMeta: { fontSize: 14, color: colors.textSecondary },
  metaBold: { fontWeight: '700' },

  quickBtn: {
    width: 40, height: 40, backgroundColor: colors.primary,
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },

  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 16, color: colors.textSecondary },

  addBtn: {
    position: 'absolute', bottom: 20, left: 20, right: 20,
    height: 56, backgroundColor: colors.primary, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  addBtnText: { color: colors.onPrimary, fontSize: 18, fontWeight: '600' },
});
