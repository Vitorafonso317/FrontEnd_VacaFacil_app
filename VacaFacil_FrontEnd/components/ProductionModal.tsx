import { useState, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { getCows } from '../services/cattleService';
import { createProduction } from '../services/productionService';
import { enqueueProduction } from '../services/offlineQueue';
import AppInput from './AppInput';
import { useToast } from '../context/ToastContext';
import type { Cow } from '../types';
import { colors } from '../constants/colors';
import { todayISO } from '../utils';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  preSelectedCowId?: number;
  preSelectedCowName?: string;
};

export default function ProductionModal({ visible, onClose, onSaved, preSelectedCowId, preSelectedCowName }: Props) {
  const { showToast } = useToast();
  const [cows, setCows] = useState<Cow[]>([]);
  const [loadingCows, setLoadingCows] = useState(false);
  const [selectedCowId, setSelectedCowId] = useState<number | null>(preSelectedCowId ?? null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [data, setData] = useState(todayISO());
  const [litros, setLitros] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setData(todayISO());
    setLitros('');
    setObservacoes('');
    setPickerOpen(false);
    setSelectedCowId(preSelectedCowId ?? null);
    if (!preSelectedCowId) loadCows();
  }, [visible]);

  async function loadCows() {
    setLoadingCows(true);
    try {
      const res = await getCows(1, 100);
      setCows(res.data);
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setLoadingCows(false);
    }
  }

  function isValidDate(d: string) {
    return /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d));
  }

  async function handleSave() {
    if (!selectedCowId) {
      Alert.alert('Atenção', 'Selecione uma vaca.');
      return;
    }
    const litrosNum = parseFloat(litros.replace(',', '.'));
    if (!litros || isNaN(litrosNum) || litrosNum < 0.01) {
      Alert.alert('Atenção', 'Informe a quantidade de litros produzidos.');
      return;
    }
    if (litrosNum > 500) {
      Alert.alert('Valor inválido', 'O máximo permitido é 500 litros por registro.');
      return;
    }
    if (!data || !isValidDate(data)) {
      Alert.alert('Data inválida', 'Use o formato AAAA-MM-DD. Ex: 2025-06-15');
      return;
    }
    if (data > todayISO()) {
      Alert.alert('Data inválida', 'Não é possível registrar produção para datas futuras.');
      return;
    }
    setSaving(true);
    try {
      const net = await NetInfo.fetch();
      if (!net.isConnected) {
        await enqueueProduction({
          vaca_id: selectedCowId,
          data,
          litros: litrosNum,
          observacoes: observacoes.trim() || undefined,
        });
        showToast('Salvo offline — será sincronizado quando a internet voltar.', 'info');
        onSaved();
        onClose();
        return;
      }
      await createProduction({
        vaca_id: selectedCowId,
        data,
        litros: litrosNum,
        observacoes: observacoes.trim() || undefined,
      });
      showToast('Produção registrada com sucesso!');
      onSaved();
      onClose();
    } catch (e: any) {
      Alert.alert('Erro ao salvar', e.message);
    } finally {
      setSaving(false);
    }
  }

  const selectedCowName = preSelectedCowName
    ?? cows.find(c => c.id === selectedCowId)?.nome;

  const isPicked = !!preSelectedCowId;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={s.sheet}>
            <View style={s.handle} />
            <Text style={s.title}>Registrar Produção</Text>
            <Text style={s.subtitle}>Informe a produção de hoje</Text>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Vaca */}
              <Text style={s.label}>VACA</Text>
              {loadingCows ? (
                <ActivityIndicator color={colors.primary} style={{ marginBottom: 16 }} />
              ) : (
                <>
                  <TouchableOpacity
                    style={[s.selectRow, isPicked && s.selectRowDisabled]}
                    onPress={() => !isPicked && setPickerOpen(o => !o)}
                    activeOpacity={isPicked ? 1 : 0.7}
                  >
                    <Text style={selectedCowName ? s.selectValue : s.selectPlaceholder}>
                      {selectedCowName ?? 'Selecionar vaca...'}
                    </Text>
                    {!isPicked && (
                      <MaterialIcons
                        name={pickerOpen ? 'expand-less' : 'expand-more'}
                        size={22}
                        color={colors.textSecondary}
                      />
                    )}
                  </TouchableOpacity>
                  {pickerOpen && (
                    <View style={s.pickerList}>
                      {cows.map(cow => (
                        <TouchableOpacity
                          key={cow.id}
                          style={[s.pickerItem, selectedCowId === cow.id && s.pickerItemSelected]}
                          onPress={() => { setSelectedCowId(cow.id); setPickerOpen(false); }}
                        >
                          <Text style={[s.pickerItemText, selectedCowId === cow.id && s.pickerItemTextSelected]}>
                            {cow.nome}
                          </Text>
                          {selectedCowId === cow.id && (
                            <MaterialIcons name="check" size={18} color={colors.primary} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              )}

              <AppInput
                label="DATA"
                value={data}
                onChangeText={setData}
                placeholder="AAAA-MM-DD"
              />

              <AppInput
                label="LITROS PRODUZIDOS"
                value={litros}
                onChangeText={setLitros}
                placeholder="Ex: 28"
                keyboardType="decimal-pad"
              />

              <AppInput
                label="OBSERVAÇÕES (opcional)"
                value={observacoes}
                onChangeText={setObservacoes}
                placeholder="Ex: Produção normal"
              />

              <TouchableOpacity
                style={[s.saveBtn, saving && s.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving
                  ? <ActivityIndicator color={colors.onPrimary} />
                  : <Text style={s.saveBtnText}>SALVAR PRODUÇÃO</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
                <Text style={s.cancelText}>Cancelar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  backdrop: { flex: 1 },
  sheet: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, maxHeight: '90%',
  },
  handle: {
    width: 40, height: 4, backgroundColor: colors.borderLight,
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 20 },


  selectRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    height: 52, backgroundColor: colors.surfaceContainerLow,
    borderBottomWidth: 2, borderBottomColor: colors.borderLight,
    borderTopLeftRadius: 8, borderTopRightRadius: 8,
    paddingHorizontal: 16, marginBottom: 16,
  },
  selectRowDisabled: { opacity: 0.7 },
  selectValue: { fontSize: 16, color: colors.text },
  selectPlaceholder: { fontSize: 16, color: colors.textTertiary },

  pickerList: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 8, borderWidth: 1, borderColor: colors.borderLight,
    marginBottom: 16, overflow: 'hidden',
  },
  pickerItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, borderBottomWidth: 1, borderBottomColor: colors.surfaceContainerLow,
  },
  pickerItemSelected: { backgroundColor: colors.onPrimaryContainer },
  pickerItemText: { fontSize: 16, color: colors.text },
  pickerItemTextSelected: { fontWeight: '700', color: colors.primaryContainer },


  saveBtn: {
    height: 56, backgroundColor: colors.primary, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: colors.onPrimary, fontSize: 18, fontWeight: '600' },
  cancelBtn: { alignItems: 'center', paddingVertical: 14 },
  cancelText: { fontSize: 16, color: colors.textSecondary },
});
