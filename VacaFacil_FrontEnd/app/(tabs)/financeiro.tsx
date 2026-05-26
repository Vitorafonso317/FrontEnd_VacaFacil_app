import { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  StyleSheet, RefreshControl, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useReceitas, useDespesas, useRefreshOnFocus, QK } from '../../hooks/queries';
import { useAuth } from '../../context/AuthContext';
import { useA11y } from '../../context/AccessibilityContext';
import { exportPdf, buildFinancialReport } from '../../utils/pdf';
import { deleteReceita, deleteDespesa } from '../../services/financialService';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { formatCurrency } from '../../utils';
import TransactionModal from '../../components/TransactionModal';
import EmptyState from '../../components/EmptyState';
import { SkeletonTransactionCard } from '../../components/Skeleton';
import type { FinancialRecord } from '../../types';

type Tab = 'receitas' | 'despesas';

export default function Financeiro() {
  const { btnHeight } = useA11y();
  const [tab, setTab] = useState<Tab>('receitas');
  const [modalVisible, setModalVisible] = useState(false);
  const [editRecord, setEditRecord] = useState<FinancialRecord | null>(null);
  const [exporting, setExporting] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: receitasResult, isLoading: rLoading, isFetching: rFetching, refetch: rRefetch } = useReceitas();
  const { data: despesasResult, isLoading: dLoading, isFetching: dFetching, refetch: dRefetch } = useDespesas();
  useRefreshOnFocus(QK.receitas);
  useRefreshOnFocus(QK.despesas);

  const loading = rLoading || dLoading;
  const isFetching = rFetching || dFetching;
  const receitas = receitasResult?.data ?? [];
  const despesas = despesasResult?.data ?? [];

  const totalReceitas = receitas.reduce((acc, r) => acc + (r.valor ?? 0), 0);
  const totalDespesas = despesas.reduce((acc, d) => acc + (d.valor ?? 0), 0);
  const saldo = totalReceitas - totalDespesas;
  const records = tab === 'receitas' ? receitas : despesas;
  const isReceita = tab === 'receitas';

  async function handleExport() {
    setExporting(true);
    const html = buildFinancialReport(receitas, despesas, user?.nome ?? 'Produtor');
    await exportPdf(html, 'financeiro.pdf');
    setExporting(false);
  }

  function handleOptions(item: FinancialRecord) {
    Alert.alert(item.descricao, undefined, [
      {
        text: 'Editar',
        onPress: () => { setEditRecord(item); setModalVisible(true); },
      },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => confirmDelete(item),
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  function confirmDelete(item: FinancialRecord) {
    Alert.alert('Excluir transação', `Excluir "${item.descricao}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          try {
            if (tab === 'receitas') await deleteReceita(item.id);
            else await deleteDespesa(item.id);
            queryClient.invalidateQueries({ queryKey: QK.receitas });
            queryClient.invalidateQueries({ queryKey: QK.despesas });
          } catch (e: any) {
            Alert.alert('Erro', e.message);
          }
        },
      },
    ]);
  }

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <Text style={s.screenTitle}>Financeiro</Text>
        <TouchableOpacity onPress={handleExport} disabled={exporting} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          {exporting
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <MaterialIcons name="picture-as-pdf" size={24} color={colors.primary} />
          }
        </TouchableOpacity>
      </View>
      <View style={s.bentoSection}>
        <View style={[s.card, s.cardFull]}>
          <Text style={s.labelCap}>SALDO ATUAL</Text>
          {loading
            ? <ActivityIndicator color={colors.primary} />
            : <Text style={[s.saldo, saldo < 0 && { color: colors.error }]}>{formatCurrency(saldo)}</Text>
          }
          <View style={s.trendRow}>
            <MaterialIcons
              name={saldo >= 0 ? 'trending-up' : 'trending-down'}
              size={16}
              color={saldo >= 0 ? colors.primary : colors.error}
            />
            <Text style={[s.trendText, saldo < 0 && { color: colors.error }]}>
              {saldo >= 0 ? 'Saldo positivo' : 'Saldo negativo'}
            </Text>
          </View>
        </View>
        <View style={s.bentoRow}>
          <View style={[s.card, s.cardHalf]}>
            <View style={s.cardIconRow}>
              <MaterialIcons name="arrow-downward" size={18} color={colors.primary} />
              <Text style={[s.labelCap, { color: colors.primary }]}>ENTRADAS</Text>
            </View>
            {loading
              ? <ActivityIndicator color={colors.primary} />
              : <Text style={s.valueH2}>{formatCurrency(totalReceitas)}</Text>
            }
          </View>
          <View style={[s.card, s.cardHalf]}>
            <View style={s.cardIconRow}>
              <MaterialIcons name="arrow-upward" size={18} color={colors.error} />
              <Text style={[s.labelCap, { color: colors.error }]}>SAÍDAS</Text>
            </View>
            {loading
              ? <ActivityIndicator color={colors.error} />
              : <Text style={s.valueH2}>{formatCurrency(totalDespesas)}</Text>
            }
          </View>
        </View>
      </View>

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
        <View style={{ paddingHorizontal: 20, gap: 8, marginTop: 8 }}>
          {Array.from({ length: 7 }).map((_, i) => <SkeletonTransactionCard key={i} />)}
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={s.list}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          windowSize={7}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={() => { rRefetch(); dRefetch(); }}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
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
                {isReceita ? '+' : '-'} {formatCurrency(item.valor)}
              </Text>
              <TouchableOpacity
                style={s.moreBtn}
                onPress={() => handleOptions(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="more-vert" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon={isReceita ? 'trending-up' : 'trending-down'}
              title={isReceita ? 'Nenhuma receita' : 'Nenhuma despesa'}
              subtitle={isReceita ? 'Registre suas entradas para acompanhar o faturamento da fazenda.' : 'Registre suas saidas para controlar os custos da fazenda.'}
            />
          }
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      )}

      <TouchableOpacity style={[s.fab, { height: btnHeight }]} activeOpacity={0.85} onPress={() => { setEditRecord(null); setModalVisible(true); }}>
        <MaterialIcons name="add" size={22} color={colors.onPrimary} />
        <Text style={s.fabText}>Nova Transação</Text>
      </TouchableOpacity>

      <TransactionModal
        visible={modalVisible}
        editRecord={editRecord ?? undefined}
        editTipo={editRecord ? (tab === 'receitas' ? 'receita' : 'despesa') : undefined}
        onClose={() => { setModalVisible(false); setEditRecord(null); }}
        onSaved={() => {
          setModalVisible(false);
          setEditRecord(null);
          queryClient.invalidateQueries({ queryKey: QK.receitas });
          queryClient.invalidateQueries({ queryKey: QK.despesas });
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4,
  },
  screenTitle: { fontSize: 24, fontWeight: '700', fontFamily: fonts.bold, color: colors.text, letterSpacing: -0.3 },
  bentoSection: { padding: 20, gap: 12 },
  bentoRow: { flexDirection: 'row', gap: 12 },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight, padding: 16, gap: 8,
  },
  cardFull: {},
  cardHalf: { flex: 1 },
  cardIconRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  labelCap: { fontSize: 12, fontWeight: '700', fontFamily: fonts.bold, color: colors.textSecondary, letterSpacing: 0.5 },
  saldo: { fontSize: 32, fontWeight: '700', fontFamily: fonts.bold, color: colors.primary, letterSpacing: -0.5 },
  valueH2: { fontSize: 22, fontWeight: '700', fontFamily: fonts.bold, color: colors.text, letterSpacing: -0.3 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trendText: { fontSize: 12, fontWeight: '700', fontFamily: fonts.bold, color: colors.primary },

  tabsRow: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 8,
    backgroundColor: colors.surfaceContainer, borderRadius: 8, padding: 4,
  },
  tabBtn: { flex: 1, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
  tabBtnActive: { backgroundColor: colors.surfaceContainerLowest },
  tabText: { fontSize: 15, fontWeight: '600', fontFamily: fonts.semiBold, color: colors.textSecondary },
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
  transTitle: { fontSize: 15, fontWeight: '600', fontFamily: fonts.semiBold, color: colors.text },
  transSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  transValue: { fontSize: 18, fontWeight: '700', fontFamily: fonts.bold },
  moreBtn: { padding: 4 },

  fab: {
    position: 'absolute', bottom: 20, left: 20, right: 20,
    height: 56, backgroundColor: colors.primary, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  fabText: { color: colors.onPrimary, fontSize: 18, fontWeight: '600', fontFamily: fonts.semiBold },
});
