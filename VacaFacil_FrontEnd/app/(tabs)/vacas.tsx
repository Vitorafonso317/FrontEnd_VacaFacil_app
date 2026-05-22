import { useState, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  Alert, StyleSheet, TextInput, RefreshControl, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { deleteCow } from '../../services/cattleService';
import { useVacas, useRefreshOnFocus, QK } from '../../hooks/queries';
import { useAuth } from '../../context/AuthContext';
import { exportPdf, buildCowsReport } from '../../utils/pdf';
import type { Cow } from '../../types';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [quickCow, setQuickCow] = useState<Cow | null>(null);
  const [exporting, setExporting] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: cows = [], isLoading, isFetching, refetch } = useVacas();
  useRefreshOnFocus(QK.vacas);

  async function handleExport() {
    setExporting(true);
    const html = buildCowsReport(cows as Cow[], user?.nome ?? 'Produtor');
    await exportPdf(html, 'rebanho.pdf');
    setExporting(false);
  }

  async function handleDelete(id: number) {
    Alert.alert('Excluir vaca', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive', onPress: async () => {
          try {
            await deleteCow(id);
            queryClient.invalidateQueries({ queryKey: QK.vacas });
          } catch (e: any) {
            Alert.alert('Erro', e.message);
          }
        },
      },
    ]);
  }

  const filtered = useMemo(() => cows.filter(c => {
    const matchText = c.nome?.toLowerCase().includes(search.toLowerCase()) ||
      c.raca?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'todos' ||
      c.status_saude?.toLowerCase() === statusFilter ||
      (statusFilter === 'saudavel' && c.status_saude?.toLowerCase() === 'ativa');
    return matchText && matchStatus;
  }), [cows, search, statusFilter]);

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <View style={s.headerRow}>
          <Text style={s.title}>Minhas Vacas</Text>
          <TouchableOpacity onPress={handleExport} disabled={exporting} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            {exporting
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <MaterialIcons name="picture-as-pdf" size={24} color={colors.primary} />
            }
          </TouchableOpacity>
        </View>
        <Text style={s.subtitle}>Gerencie seu rebanho e monitore a produtividade individual.</Text>
      </View>

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
        removeClippedSubviews
        maxToRenderPerBatch={10}
        windowSize={7}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
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
              {item.foto_url ? (
                <Image source={{ uri: item.foto_url }} style={s.cowImage} resizeMode="cover" />
              ) : (
                <View style={[s.cowImage, s.cowImagePlaceholder]}>
                  <MaterialIcons name="agriculture" size={32} color={colors.primary} />
                </View>
              )}
              <View style={s.cardInfo}>
                <View style={s.cardTop}>
                  <Text style={s.cowName}>{item.nome}</Text>
                  <View style={[s.badge, { backgroundColor: st.bg }]}>
                    <Text style={[s.badgeText, { color: st.text }]}>{st.label.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={s.cowMeta}>
                  {[item.raca, item.idade ? `${item.idade} anos` : null, item.peso ? `${item.peso} kg` : null]
                    .filter(Boolean).join(' · ') || '—'}
                </Text>
              </View>

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

      <TouchableOpacity style={s.addBtn} onPress={() => router.push('/vacas/create')} activeOpacity={0.85}>
        <MaterialIcons name="add" size={22} color={colors.onPrimary} />
        <Text style={s.addBtnText}>Adicionar Vaca</Text>
      </TouchableOpacity>

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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', fontFamily: fonts.bold, color: colors.text, letterSpacing: -0.3 },
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
  chipText: { fontSize: 13, fontWeight: '600', fontFamily: fonts.semiBold, color: colors.textSecondary },
  chipTextActive: { color: colors.onPrimary },

  list: { paddingHorizontal: 20, gap: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 8, borderWidth: 1, borderColor: colors.borderLight, padding: 12,
  },
  cowImage: {
    width: 72, height: 72, borderRadius: 8, overflow: 'hidden',
  },
  cowImagePlaceholder: {
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center', justifyContent: 'center',
  },
  cardInfo: { flex: 1, gap: 4 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cowName: { fontSize: 14, fontWeight: '700', fontFamily: fonts.bold, color: colors.text },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  badgeText: { fontSize: 10, fontWeight: '700', fontFamily: fonts.bold },
  cowMeta: { fontSize: 14, color: colors.textSecondary },
  metaBold: { fontWeight: '700', fontFamily: fonts.bold },

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
  addBtnText: { color: colors.onPrimary, fontSize: 18, fontWeight: '600', fontFamily: fonts.semiBold },
});
