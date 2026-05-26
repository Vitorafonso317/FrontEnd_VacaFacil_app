import { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { createMedicamento } from '../services/medicamentosService';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { todayISO } from '../utils';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  cowId: number;
  cowName: string;
};

export default function SaudeModal({ visible, onClose, onSaved, cowId, cowName }: Props) {
  const { height: SCREEN_H } = useWindowDimensions();
  const [nomeMedicamento, setNomeMedicamento] = useState('');
  const [dataAplicacao, setDataAplicacao] = useState(todayISO());
  const [diasCarencia, setDiasCarencia] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setNomeMedicamento('');
    setDataAplicacao(todayISO());
    setDiasCarencia('');
    setObservacoes('');
  }, [visible]);

  function isValidDate(d: string) {
    return /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d));
  }

  async function handleSave() {
    if (!nomeMedicamento.trim()) {
      Alert.alert('Atenção', 'Informe o nome do medicamento.');
      return;
    }
    if (!isValidDate(dataAplicacao)) {
      Alert.alert('Data inválida', 'Use o formato AAAA-MM-DD. Ex: 2025-06-15');
      return;
    }
    const dias = parseInt(diasCarencia);
    if (!dias || dias < 1) {
      Alert.alert('Atenção', 'Informe os dias de carência (mínimo 1).');
      return;
    }

    setSaving(true);
    try {
      await createMedicamento({
        vaca_id: cowId,
        nome_medicamento: nomeMedicamento.trim(),
        data_aplicacao: dataAplicacao,
        dias_carencia: dias,
        observacoes: observacoes.trim() || undefined,
      });
      onSaved();
    } catch (e: any) {
      Alert.alert('Erro ao salvar', e.message);
    } finally {
      setSaving(false);
    }
  }

  // Calcula data de fim da carência em tempo real
  const dataFim = (() => {
    const dias = parseInt(diasCarencia);
    if (!isValidDate(dataAplicacao) || !dias || dias < 1) return null;
    const [y, m, d] = dataAplicacao.split('-').map(Number);
    const fim = new Date(y, m - 1, d + dias);
    return fim.toLocaleDateString('pt-BR');
  })();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView
        style={s.overlay}
        behavior="padding"
      >
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />

        <View style={[s.sheet, { maxHeight: SCREEN_H * 0.85 }]}>
          <View style={s.handle} />

          <View style={s.titleRow}>
            <MaterialIcons name="medication" size={22} color={colors.error} />
            <Text style={s.title}>Registrar Tratamento</Text>
          </View>
          <Text style={s.subtitle}>{cowName}</Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
            contentContainerStyle={s.scrollContent}
          >
            <Text style={s.label}>MEDICAMENTO *</Text>
            <TextInput
              style={s.input}
              value={nomeMedicamento}
              onChangeText={setNomeMedicamento}
              placeholder="Ex: Terramicina, Penstrep..."
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={s.label}>DATA DE APLICAÇÃO *</Text>
            <TextInput
              style={s.input}
              value={dataAplicacao}
              onChangeText={setDataAplicacao}
              placeholder="AAAA-MM-DD"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={s.label}>DIAS DE CARÊNCIA *</Text>
            <TextInput
              style={s.input}
              value={diasCarencia}
              onChangeText={setDiasCarencia}
              placeholder="Ex: 7 (conforme a bula)"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
            />

            {dataFim && (
              <View style={s.previewCard}>
                <MaterialIcons name="event-busy" size={18} color={colors.error} />
                <Text style={s.previewText}>
                  Leite descartável até <Text style={s.previewDate}>{dataFim}</Text>
                </Text>
              </View>
            )}

            <Text style={s.label}>OBSERVAÇÕES (opcional)</Text>
            <TextInput
              style={[s.input, s.inputMulti]}
              value={observacoes}
              onChangeText={setObservacoes}
              placeholder="Ex: Dose única, aplicar no úbere"
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[s.saveBtn, saving && s.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving
                ? <ActivityIndicator color={colors.onPrimary} />
                : <Text style={s.saveBtnTxt}>REGISTRAR TRATAMENTO</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
              <Text style={s.cancelTxt}>Cancelar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  scrollContent: { paddingBottom: 32 },
  sheet: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 12, paddingHorizontal: 24,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  handle: {
    width: 40, height: 4, backgroundColor: colors.borderLight,
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  title: { fontSize: 20, fontWeight: '700', fontFamily: fonts.bold, color: colors.text },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 20 },

  label: {
    fontSize: 12, fontWeight: '700', fontFamily: fonts.bold, color: colors.textSecondary,
    letterSpacing: 0.5, marginBottom: 6,
  },
  input: {
    height: 52, backgroundColor: colors.surfaceContainerLow,
    borderBottomWidth: 2, borderBottomColor: colors.borderLight,
    borderTopLeftRadius: 8, borderTopRightRadius: 8,
    paddingHorizontal: 16, fontSize: 16, color: colors.text, marginBottom: 16,
  },
  inputMulti: { height: 80, paddingTop: 12 },

  previewCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.errorContainer,
    borderRadius: 8, padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: colors.error,
  },
  previewText: { fontSize: 14, color: colors.text, flex: 1 },
  previewDate: { fontWeight: '700', fontFamily: fonts.bold, color: colors.error },

  saveBtn: {
    height: 56, backgroundColor: colors.error, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnTxt: { color: colors.onPrimary, fontSize: 16, fontWeight: '600', fontFamily: fonts.semiBold },

  cancelBtn: { alignItems: 'center', paddingVertical: 14 },
  cancelTxt: { fontSize: 16, color: colors.textSecondary },
});
