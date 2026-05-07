import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  getReceitas,
  getDespesas,
  getFinancialReport,
  createReceita,
  createDespesa,
  deleteReceita,
  deleteDespesa,
} from '../../services/financialService';
import type { FinancialRecord } from '../../types';
import { colors } from '../../constants/colors';

type Tab = 'receitas' | 'despesas';

const today = new Date().toISOString().slice(0, 10);

const emptyForm = {
  tipo: 'receitas' as Tab,
  descricao: '',
  valor: '',
  data: today,
};

function formatCurrency(value: number) {
  return `R$ ${value.toFixed(2)}`;
}

function parseCurrency(value: string) {
  return Number(value.replace(/\./g, '').replace(',', '.'));
}

export default function Financeiro() {
  const [tab, setTab] = useState<Tab>('receitas');
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ receitas: 0, despesas: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

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

  async function loadSummary() {
    try {
      const res = await getFinancialReport();
      setSummary({
        receitas: Number(res.data.receitas_total || 0),
        despesas: Number(res.data.despesas_total || 0),
      });
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    }
  }

  useEffect(() => {
    load(tab);
    loadSummary();
  }, [tab]);

  function openNewTransaction() {
    setForm({ ...emptyForm, tipo: tab, data: today });
    setModalVisible(true);
  }

  function closeModal() {
    if (!saving) setModalVisible(false);
  }

  async function handleCreateTransaction() {
    const descricao = form.descricao.trim();
    const valor = parseCurrency(form.valor);

    if (!descricao || !form.valor || !form.data) {
      return Alert.alert('Preencha todos os campos');
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.data)) {
      return Alert.alert('Data invalida', 'Use o formato YYYY-MM-DD.');
    }

    if (!Number.isFinite(valor) || valor <= 0) {
      return Alert.alert('Valor invalido', 'Informe um valor maior que zero.');
    }

    setSaving(true);
    try {
      const payload = { descricao, valor, data: form.data };
      form.tipo === 'receitas' ? await createReceita(payload) : await createDespesa(payload);

      setModalVisible(false);
      setTab(form.tipo);
      setForm(emptyForm);
      await Promise.all([load(form.tipo), loadSummary()]);
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: FinancialRecord) {
    async function remove() {
      try {
        tab === 'receitas' ? await deleteReceita(item.id) : await deleteDespesa(item.id);
        setRecords(prev => prev.filter(record => record.id !== item.id));
        await loadSummary();
      } catch (e: any) {
        Alert.alert('Erro', e.message);
      }
    }

    if (Platform.OS === 'web') {
      if (window.confirm(`Tem certeza que deseja apagar "${item.descricao}"?`)) {
        await remove();
      }
      return;
    }

    Alert.alert(
      'Excluir transacao',
      `Tem certeza que deseja apagar "${item.descricao}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: remove,
        },
      ]
    );
  }

  const isReceita = tab === 'receitas';
  const saldo = summary.receitas - summary.despesas;

  return (
    <View style={s.screen}>
      <View style={s.bentoSection}>
        <View style={[s.card, s.cardFull]}>
          <Text style={s.labelCap}>SALDO ATUAL</Text>
          <Text style={s.saldo}>{formatCurrency(saldo)}</Text>
          <View style={s.trendRow}>
            <MaterialIcons name="sync" size={16} color={colors.primary} />
            <Text style={s.trendText}>Dados sincronizados com a API</Text>
          </View>
        </View>

        <View style={s.bentoRow}>
          <View style={[s.card, s.cardHalf]}>
            <View style={s.cardIconRow}>
              <MaterialIcons name="arrow-downward" size={18} color={colors.primary} />
              <Text style={[s.labelCap, { color: colors.primary }]}>ENTRADAS</Text>
            </View>
            <Text style={s.valueH2}>{formatCurrency(summary.receitas)}</Text>
          </View>

          <View style={[s.card, s.cardHalf]}>
            <View style={s.cardIconRow}>
              <MaterialIcons name="arrow-upward" size={18} color={colors.error} />
              <Text style={[s.labelCap, { color: colors.error }]}>SAIDAS</Text>
            </View>
            <Text style={s.valueH2}>{formatCurrency(summary.despesas)}</Text>
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
                {isReceita ? '+' : '-'} {formatCurrency(Number(item.valor || 0))}
              </Text>

              <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(item)}>
                <MaterialIcons name="delete-outline" size={22} color={colors.error} />
              </TouchableOpacity>
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

      <TouchableOpacity style={s.fab} activeOpacity={0.85} onPress={openNewTransaction}>
        <MaterialIcons name="add" size={22} color={colors.onPrimary} />
        <Text style={s.fabText}>Nova Transacao</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Nova Transacao</Text>
              <TouchableOpacity style={s.iconBtn} onPress={closeModal}>
                <MaterialIcons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={s.typeRow}>
              <TouchableOpacity
                style={[s.typeBtn, form.tipo === 'receitas' && s.typeBtnActive]}
                onPress={() => setForm(prev => ({ ...prev, tipo: 'receitas' }))}
              >
                <Text style={[s.typeText, form.tipo === 'receitas' && s.typeTextActive]}>Receita</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.typeBtn, form.tipo === 'despesas' && s.typeBtnActive]}
                onPress={() => setForm(prev => ({ ...prev, tipo: 'despesas' }))}
              >
                <Text style={[s.typeText, form.tipo === 'despesas' && s.typeTextActive]}>Despesa</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.inputLabel}>Descricao</Text>
            <TextInput
              style={s.input}
              value={form.descricao}
              onChangeText={descricao => setForm(prev => ({ ...prev, descricao }))}
              placeholder="Ex: Venda de leite"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={s.inputLabel}>Valor</Text>
            <TextInput
              style={s.input}
              value={form.valor}
              onChangeText={valor => setForm(prev => ({ ...prev, valor }))}
              placeholder="Ex: 1500.00"
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
            />

            <Text style={s.inputLabel}>Data</Text>
            <TextInput
              style={s.input}
              value={form.data}
              onChangeText={data => setForm(prev => ({ ...prev, data }))}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textTertiary}
            />

            <TouchableOpacity style={[s.saveBtn, saving && s.saveBtnDisabled]} onPress={handleCreateTransaction} disabled={saving}>
              {saving ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <>
                  <MaterialIcons name="check" size={20} color={colors.onPrimary} />
                  <Text style={s.saveText}>Salvar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  bentoSection: { padding: 20, gap: 12 },
  bentoRow: { flexDirection: 'row', gap: 12 },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 16,
    gap: 8,
  },
  cardFull: {},
  cardHalf: { flex: 1 },
  cardIconRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  labelCap: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.5 },
  saldo: { fontSize: 32, fontWeight: '700', color: colors.primary },
  valueH2: { fontSize: 22, fontWeight: '700', color: colors.text },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trendText: { fontSize: 12, fontWeight: '700', color: colors.primary },

  tabsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 8,
    padding: 4,
  },
  tabBtn: { flex: 1, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
  tabBtnActive: { backgroundColor: colors.surfaceContainerLowest },
  tabText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: colors.primaryContainer },

  list: { paddingHorizontal: 20, gap: 8 },
  transCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 12,
    minHeight: 64,
  },
  transIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  transInfo: { flex: 1 },
  transTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  transSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  transValue: { fontSize: 18, fontWeight: '700' },
  deleteBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 16, color: colors.textSecondary },

  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    height: 56,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: colors.onPrimary, fontSize: 16, fontWeight: '600' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    gap: 10,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  typeRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 8,
    padding: 4,
    marginVertical: 6,
  },
  typeBtn: { flex: 1, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
  typeBtnActive: { backgroundColor: colors.surfaceContainerLowest },
  typeText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  typeTextActive: { color: colors.primaryContainer },
  inputLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginTop: 4 },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    color: colors.text,
    backgroundColor: colors.surfaceContainerLowest,
  },
  saveBtn: {
    marginTop: 8,
    height: 52,
    borderRadius: 8,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveText: { color: colors.onPrimary, fontSize: 16, fontWeight: '700' },
});
