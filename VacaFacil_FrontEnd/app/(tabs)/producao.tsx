import { useState, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  StyleSheet, TextInput, RefreshControl, Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useProducao, useVacas, useRefreshOnFocus, QK } from '../../hooks/queries';
import { useAuth } from '../../context/AuthContext';
import { exportPdf, buildProductionReport } from '../../utils/pdf';
import type { Cow } from '../../types';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import ProductionModal from '../../components/ProductionModal';

export default function Producao() {
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [exporting, setExporting] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: prodResult, isLoading, isFetching, refetch } = useProducao();
  const { data: vacas = [] } = useVacas(1, 100);
  useRefreshOnFocus(QK.producao);

  const records = prodResult?.data ?? [];

  const cowMap = useMemo(() => {
    const map: Record<number, string> = {};
    (vacas as Cow[]).forEach(c => { map[c.id] = c.nome; });
    return map;
  }, [vacas]);

  const cowPhotoMap = useMemo(() => {
    const map: Record<number, string | undefined> = {};
    (vacas as Cow[]).forEach(c => { map[c.id] = c.foto_url; });
    return map;
  }, [vacas]);

  const filtered = useMemo(() => records.filter(r => {
    const nome = cowMap[r.vaca_id] ?? '';
    return nome.toLowerCase().includes(search.toLowerCase()) || r.data?.includes(search);
  }), [records, cowMap, search]);

  async function handleExport() {
    setExporting(true);
    const html = buildProductionReport(records, cowMap, user?.nome ?? 'Produtor');
    await exportPdf(html, 'producao.pdf');
    setExporting(false);
  }

  const totalMensal = useMemo(() => records.reduce((acc, r) => acc + (r.litros ?? 0), 0), [records]);
  const vacasUnicas = useMemo(() => new Set(records.map(r => r.vaca_id)).size, [records]);
  const mediaPorVaca = vacasUnicas > 0 ? (totalMensal / vacasUnicas).toFixed(1) : '0';

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.labelCap}>PRODUÇÃO DIÁRIA</Text>
            <Text style={s.title}>Histórico</Text>
          </View>
          <TouchableOpacity onPress={handleExport} disabled={exporting} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            {exporting
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <MaterialIcons name="picture-as-pdf" size={24} color={colors.primary} />
            }
          </TouchableOpacity>
        </View>

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

      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <MaterialIcons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={s.searchInput}
            placeholder="Filtrar por nome da vaca ou data"
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
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
          const nome = cowMap[item.vaca_id] ?? `Vaca #${item.vaca_id}`;
          const foto = cowPhotoMap[item.vaca_id];
          return (
            <View style={s.card}>
              <View style={s.cardIcon}>
                {foto
                  ? <Image source={{ uri: foto }} style={s.cardAvatar} />
                  : <Text style={s.cardInitial}>{nome.charAt(0).toUpperCase()}</Text>
                }
              </View>
              <View style={s.cardInfo}>
                <Text style={s.cardName}>{nome}</Text>
                <Text style={s.cardSub}>{item.data}</Text>
              </View>
              <Text style={s.cardValue}>{item.litros} L</Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={s.empty}>
            <MaterialIcons name="show-chart" size={48} color={colors.borderLight} />
            <Text style={s.emptyText}>Nenhum registro de produção.</Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: 100 }} />}
      />

      <TouchableOpacity style={s.fab} activeOpacity={0.85} onPress={() => setModalVisible(true)}>
        <MaterialIcons name="add" size={22} color={colors.onPrimary} />
        <Text style={s.fabText}>Registrar Produção</Text>
      </TouchableOpacity>

      <ProductionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSaved={() => {
          setModalVisible(false);
          queryClient.invalidateQueries({ queryKey: QK.producao });
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, gap: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  labelCap: { fontSize: 12, fontWeight: '700', fontFamily: fonts.bold, color: colors.textSecondary, letterSpacing: 0.5 },
  title: { fontSize: 32, fontWeight: '700', fontFamily: fonts.bold, color: colors.text, letterSpacing: -0.5 },

  bentoRow: { flexDirection: 'row', gap: 12 },
  bentoCard: {
    flex: 1, backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight,
    padding: 12, gap: 4,
  },
  bentoValue: { fontSize: 24, fontWeight: '700', fontFamily: fonts.bold, color: colors.text, letterSpacing: -0.3 },
  bentoLabel: { fontSize: 12, fontWeight: '700', fontFamily: fonts.bold, color: colors.textSecondary },

  searchRow: { paddingHorizontal: 20, marginBottom: 8 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surfaceContainerLow, borderRadius: 8,
    borderWidth: 1, borderColor: colors.borderLight, paddingHorizontal: 12, height: 48,
  },
  searchInput: { flex: 1, fontSize: 16, color: colors.text },

  list: { paddingHorizontal: 20, gap: 8 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight,
    padding: 12, minHeight: 64,
  },
  cardIcon: {
    width: 48, height: 48, borderRadius: 8,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  cardAvatar: { width: 48, height: 48, borderRadius: 8 },
  cardInitial: {
    fontSize: 20, fontWeight: '700', fontFamily: fonts.bold,
    color: colors.primary,
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: '700', fontFamily: fonts.bold, color: colors.text },
  cardSub: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  cardValue: { fontSize: 18, fontWeight: '700', fontFamily: fonts.bold, color: colors.primary },

  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 16, color: colors.textSecondary },

  fab: {
    position: 'absolute', bottom: 20, right: 20,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.primary, paddingHorizontal: 20, height: 56,
    borderRadius: 999, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  fabText: { color: colors.onPrimary, fontSize: 16, fontWeight: '600', fontFamily: fonts.semiBold },
});
