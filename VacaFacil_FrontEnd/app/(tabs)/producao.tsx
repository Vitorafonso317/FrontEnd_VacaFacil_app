import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  TextInput,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getProduction, createProduction, updateProduction, deleteProduction } from '../../services/productionService';
import { getCows } from '../../services/cattleService';
import type { Cow, ProductionRecord } from '../../types';
import { colors } from '../../constants/colors';

const today = new Date().toISOString().slice(0, 10);

type ProductionForm = {
  id?: number;
  vaca_id: string;
  data: string;
  litros: string;
  observacoes: string;
};

const emptyForm: ProductionForm = {
  vaca_id: '',
  data: today,
  litros: '',
  observacoes: '',
};

function parseNumber(value: string) {
  return Number(value.replace(',', '.'));
}

export default function Producao() {
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [cows, setCows] = useState<Cow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [cowPickerVisible, setCowPickerVisible] = useState(false);
  const [cowSearch, setCowSearch] = useState('');
  const [form, setForm] = useState<ProductionForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const cowById = useMemo(() => new Map(cows.map(cow => [cow.id, cow])), [cows]);

  async function load() {
    setLoading(true);
    try {
      const [productionRes, cowsRes] = await Promise.all([getProduction(1, 100), getCows(1, 100)]);
      setRecords(productionRes.data);
      setCows(cowsRes.data);
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreateModal() {
    setForm({ ...emptyForm, data: today });
    setModalVisible(true);
  }

  function openEditModal(record: ProductionRecord) {
    setForm({
      id: record.id,
      vaca_id: String(record.vaca_id),
      data: record.data,
      litros: String(record.litros),
      observacoes: record.observacoes ?? '',
    });
    setModalVisible(true);
  }

  function closeModal() {
    if (!saving) setModalVisible(false);
  }

  function validateForm() {
    const vacaId = Number(form.vaca_id);
    const litros = parseNumber(form.litros);

    if (!vacaId || !form.data || !form.litros) {
      Alert.alert('Preencha os campos obrigatorios');
      return null;
    }

    if (!cowById.has(vacaId)) {
      Alert.alert('Vaca invalida', 'Selecione uma vaca cadastrada.');
      return null;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.data)) {
      Alert.alert('Data invalida', 'Use o formato YYYY-MM-DD.');
      return null;
    }

    if (!Number.isFinite(litros) || litros <= 0) {
      Alert.alert('Litros invalido', 'Informe uma quantidade maior que zero.');
      return null;
    }

    return {
      vaca_id: vacaId,
      data: form.data,
      litros,
      observacoes: form.observacoes.trim() || undefined,
    };
  }

  async function handleSaveProduction() {
    const payload = validateForm();
    if (!payload) return;

    setSaving(true);
    try {
      if (form.id) {
        await updateProduction(form.id, payload);
      } else {
        await createProduction(payload);
      }
      setModalVisible(false);
      setForm(emptyForm);
      await load();
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(record: ProductionRecord) {
    async function remove() {
      try {
        await deleteProduction(record.id);
        setRecords(prev => prev.filter(item => item.id !== record.id));
      } catch (e: any) {
        Alert.alert('Erro', e.message);
      }
    }

    if (Platform.OS === 'web') {
      if (window.confirm(`Apagar registro de ${record.litros}L?`)) {
        remove();
      }
      return;
    }

    Alert.alert('Excluir producao', `Apagar registro de ${record.litros}L?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: remove,
      },
    ]);
  }

  const filtered = records.filter(record => {
    const cowName = cowById.get(record.vaca_id)?.nome ?? '';
    const term = search.toLowerCase();
    return cowName.toLowerCase().includes(term) || String(record.vaca_id).includes(term) || record.data?.includes(term);
  });

  const total = records.reduce((acc, record) => acc + Number(record.litros || 0), 0);
  const cowIds = new Set(records.map(record => record.vaca_id));
  const mediaPorVaca = cowIds.size > 0 ? total / cowIds.size : 0;
  const selectedCow = form.vaca_id ? cowById.get(Number(form.vaca_id)) : null;
  const filteredCows = cows.filter(cow =>
    cow.nome.toLowerCase().includes(cowSearch.toLowerCase()) ||
    String(cow.id).includes(cowSearch)
  );

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.labelCap}>PRODUCAO</Text>
            <Text style={s.title}>Historico</Text>
          </View>
          <View style={s.badge}>
            <Text style={s.badgeText}>{records.length} registros</Text>
          </View>
        </View>

        <View style={s.bentoRow}>
          <View style={s.bentoCard}>
            <MaterialIcons name="water-drop" size={22} color={colors.primary} />
            <Text style={s.bentoValue}>{total.toLocaleString('pt-BR')}L</Text>
            <Text style={s.bentoLabel}>Total registrado</Text>
          </View>
          <View style={s.bentoCard}>
            <MaterialIcons name="calendar-today" size={22} color={colors.secondary} />
            <Text style={s.bentoValue}>{mediaPorVaca.toFixed(1)}L</Text>
            <Text style={s.bentoLabel}>Media por vaca</Text>
          </View>
        </View>
      </View>

      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <MaterialIcons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={s.searchInput}
            placeholder="Filtrar por vaca ou data"
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
        renderItem={({ item }) => {
          const cow = cowById.get(item.vaca_id);
          return (
            <View style={s.card}>
              <View style={s.cardIcon}>
                <MaterialIcons name="agriculture" size={22} color={colors.primary} />
              </View>
              <View style={s.cardInfo}>
                <Text style={s.cardName}>{cow?.nome ?? `Vaca #${item.vaca_id}`}</Text>
                <Text style={s.cardSub}>{item.data}</Text>
                {item.observacoes ? <Text style={s.cardObs}>{item.observacoes}</Text> : null}
              </View>
              <Text style={s.cardValue}>{item.litros} L</Text>
              <TouchableOpacity style={s.iconAction} onPress={() => openEditModal(item)}>
                <MaterialIcons name="edit" size={21} color={colors.secondary} />
              </TouchableOpacity>
              <TouchableOpacity style={s.iconAction} onPress={() => handleDelete(item)}>
                <MaterialIcons name="delete-outline" size={22} color={colors.error} />
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={s.empty}>
            <MaterialIcons name="show-chart" size={48} color={colors.borderLight} />
            <Text style={s.emptyText}>Nenhum registro de producao.</Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: 100 }} />}
      />

      <TouchableOpacity style={s.fab} activeOpacity={0.85} onPress={openCreateModal}>
        <MaterialIcons name="add" size={22} color={colors.onPrimary} />
        <Text style={s.fabText}>Registrar Producao</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{form.id ? 'Editar Producao' : 'Registrar Producao'}</Text>
              <TouchableOpacity style={s.iconBtn} onPress={closeModal}>
                <MaterialIcons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={s.inputLabel}>Vaca</Text>
            <TouchableOpacity
              style={s.selectBox}
              onPress={() => {
                setCowSearch('');
                setCowPickerVisible(true);
              }}
            >
              <View style={s.selectIcon}>
                <MaterialIcons name="agriculture" size={22} color={colors.primary} />
              </View>
              <View style={s.selectInfo}>
                <Text style={s.selectTitle}>{selectedCow?.nome ?? 'Selecionar vaca'}</Text>
                <Text style={s.selectSub}>
                  {selectedCow ? `Brinco #${selectedCow.id}` : 'Toque para escolher uma vaca cadastrada'}
                </Text>
              </View>
              <MaterialIcons name="expand-more" size={24} color={colors.textSecondary} />
            </TouchableOpacity>

            <Text style={s.inputLabel}>Data</Text>
            <TextInput
              style={s.input}
              value={form.data}
              onChangeText={data => setForm(prev => ({ ...prev, data }))}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={s.inputLabel}>Litros</Text>
            <TextInput
              style={s.input}
              value={form.litros}
              onChangeText={litros => setForm(prev => ({ ...prev, litros }))}
              placeholder="Ex: 18.5"
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
            />

            <Text style={s.inputLabel}>Observacoes</Text>
            <TextInput
              style={[s.input, s.inputMultiline]}
              value={form.observacoes}
              onChangeText={observacoes => setForm(prev => ({ ...prev, observacoes }))}
              placeholder="Opcional"
              placeholderTextColor={colors.textTertiary}
              multiline
            />

            <TouchableOpacity style={[s.saveBtn, saving && s.saveBtnDisabled]} onPress={handleSaveProduction} disabled={saving}>
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

      <Modal visible={cowPickerVisible} transparent animationType="fade" onRequestClose={() => setCowPickerVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.pickerCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Escolher vaca</Text>
              <TouchableOpacity style={s.iconBtn} onPress={() => setCowPickerVisible(false)}>
                <MaterialIcons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={s.pickerSearch}>
              <MaterialIcons name="search" size={20} color={colors.textSecondary} />
              <TextInput
                style={s.searchInput}
                value={cowSearch}
                onChangeText={setCowSearch}
                placeholder="Buscar por nome ou brinco"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <ScrollView style={s.pickerList} contentContainerStyle={s.pickerListContent}>
              {filteredCows.length === 0 ? (
                <View style={s.pickerEmpty}>
                  <MaterialIcons name="agriculture" size={36} color={colors.borderLight} />
                  <Text style={s.emptyText}>Nenhuma vaca encontrada.</Text>
                </View>
              ) : filteredCows.map(cow => (
                <TouchableOpacity
                  key={cow.id}
                  style={[s.cowOption, form.vaca_id === String(cow.id) && s.cowOptionActive]}
                  onPress={() => {
                    setForm(prev => ({ ...prev, vaca_id: String(cow.id) }));
                    setCowPickerVisible(false);
                  }}
                >
                  <View style={s.cowOptionIcon}>
                    <MaterialIcons name="agriculture" size={22} color={colors.primary} />
                  </View>
                  <View style={s.selectInfo}>
                    <Text style={s.selectTitle}>{cow.nome}</Text>
                    <Text style={s.selectSub}>Brinco #{cow.id}{cow.raca ? ` - ${cow.raca}` : ''}</Text>
                  </View>
                  {form.vaca_id === String(cow.id) ? (
                    <MaterialIcons name="check-circle" size={22} color={colors.primary} />
                  ) : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, gap: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  labelCap: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.5 },
  title: { fontSize: 32, fontWeight: '700', color: colors.text },
  badge: { backgroundColor: colors.onPrimaryContainer, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '700', color: colors.primaryContainer },
  bentoRow: { flexDirection: 'row', gap: 12 },
  bentoCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    gap: 4,
  },
  bentoValue: { fontSize: 24, fontWeight: '700', color: colors.text },
  bentoLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  searchRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 8 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: { flex: 1, fontSize: 16, color: colors.text },
  list: { paddingHorizontal: 20, gap: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    minHeight: 64,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: '700', color: colors.text },
  cardSub: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  cardObs: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
  cardValue: { fontSize: 17, fontWeight: '700', color: colors.primary },
  iconAction: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
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
  selectBox: {
    minHeight: 64,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainerLowest,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
  },
  selectIcon: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: colors.onPrimaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectInfo: { flex: 1 },
  selectTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  selectSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  pickerCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    gap: 12,
    maxHeight: '82%',
  },
  pickerSearch: {
    height: 46,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainerLow,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  pickerList: { maxHeight: 360 },
  pickerListContent: { gap: 8 },
  cowOption: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 8,
    padding: 10,
  },
  cowOptionActive: { borderColor: colors.primary, backgroundColor: colors.onPrimaryContainer },
  cowOptionIcon: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerEmpty: { alignItems: 'center', paddingVertical: 28, gap: 8 },
  helperText: { fontSize: 13, color: colors.textSecondary },
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
  inputMultiline: { height: 76, paddingTop: 12, textAlignVertical: 'top' },
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
