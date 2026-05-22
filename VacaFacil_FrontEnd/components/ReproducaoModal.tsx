import { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { createReproducao, updateReproducao } from '../services/reproducaoService';
import type { ReproducaoEvent } from '../types';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { todayISO } from '../utils';

const TIPOS = [
  'Inseminação',
  'Parto',
  'Diagnóstico de Gestação',
  'Cio',
  'Secagem',
  'Outro',
];

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  cowId: number;
  cowName: string;
  editing?: ReproducaoEvent | null;
};

export default function ReproducaoModal({ visible, onClose, onSaved, cowId, cowName, editing }: Props) {
  const [tipoOpen, setTipoOpen] = useState(false);
  const [tipo, setTipo] = useState('');
  const [data, setData] = useState(todayISO());
  const [observacoes, setObservacoes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTipoOpen(false);
    if (editing) {
      setTipo(editing.tipo_evento);
      setData(editing.data);
      setObservacoes(editing.observacoes ?? '');
    } else {
      setTipo('');
      setData(todayISO());
      setObservacoes('');
    }
  }, [visible, editing]);

  function isValidDate(d: string) {
    return /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d));
  }

  async function handleSave() {
    if (!tipo.trim()) {
      Alert.alert('Atenção', 'Selecione o tipo de evento.');
      return;
    }
    if (!isValidDate(data)) {
      Alert.alert('Data inválida', 'Use o formato AAAA-MM-DD. Ex: 2025-06-15');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateReproducao(editing.id, {
          tipo_evento: tipo.trim(),
          data,
          observacoes: observacoes.trim() || undefined,
        });
      } else {
        await createReproducao({
          vaca_id: cowId,
          tipo_evento: tipo.trim(),
          data,
          observacoes: observacoes.trim() || undefined,
        });
      }
      onSaved();
    } catch (e: any) {
      Alert.alert('Erro ao salvar', e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={s.sheet}>
            <View style={s.handle} />
            <Text style={s.title}>{editing ? 'Editar Evento' : 'Evento Reprodutivo'}</Text>
            <Text style={s.subtitle}>{cowName}</Text>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {/* Tipo de evento */}
              <Text style={s.label}>TIPO DE EVENTO *</Text>
              <TouchableOpacity
                style={s.selectRow}
                onPress={() => setTipoOpen(o => !o)}
                activeOpacity={0.7}
              >
                <Text style={tipo ? s.selectValue : s.selectPlaceholder}>
                  {tipo || 'Selecionar tipo...'}
                </Text>
                <MaterialIcons
                  name={tipoOpen ? 'expand-less' : 'expand-more'}
                  size={22}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              {tipoOpen && (
                <View style={s.pickerList}>
                  {TIPOS.map(t => (
                    <TouchableOpacity
                      key={t}
                      style={[s.pickerItem, tipo === t && s.pickerItemSelected]}
                      onPress={() => { setTipo(t); setTipoOpen(false); }}
                    >
                      <Text style={[s.pickerItemTxt, tipo === t && s.pickerItemTxtSelected]}>
                        {t}
                      </Text>
                      {tipo === t && <MaterialIcons name="check" size={18} color={colors.primary} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Data */}
              <Text style={s.label}>DATA *</Text>
              <TextInput
                style={s.input}
                value={data}
                onChangeText={setData}
                placeholder="AAAA-MM-DD"
                placeholderTextColor={colors.textTertiary}
              />

              {/* Observações */}
              <Text style={s.label}>OBSERVAÇÕES (opcional)</Text>
              <TextInput
                style={[s.input, s.inputMulti]}
                value={observacoes}
                onChangeText={setObservacoes}
                placeholder="Ex: Inseminação com touro Girolando"
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
                  : <Text style={s.saveBtnTxt}>{editing ? 'SALVAR ALTERAÇÕES' : 'SALVAR EVENTO'}</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
                <Text style={s.cancelTxt}>Cancelar</Text>
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
    padding: 24, maxHeight: '85%',
  },
  handle: {
    width: 40, height: 4, backgroundColor: colors.borderLight,
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  title: { fontSize: 20, fontWeight: '700', fontFamily: fonts.bold, color: colors.text, marginBottom: 2 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 20 },

  label: {
    fontSize: 12, fontWeight: '700', fontFamily: fonts.bold, color: colors.textSecondary,
    letterSpacing: 0.5, marginBottom: 6,
  },

  selectRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    height: 52, backgroundColor: colors.surfaceContainerLow,
    borderBottomWidth: 2, borderBottomColor: colors.borderLight,
    borderTopLeftRadius: 8, borderTopRightRadius: 8,
    paddingHorizontal: 16, marginBottom: 16,
  },
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
  pickerItemTxt: { fontSize: 16, color: colors.text },
  pickerItemTxtSelected: { fontWeight: '700', fontFamily: fonts.bold, color: colors.primaryContainer },

  input: {
    height: 52, backgroundColor: colors.surfaceContainerLow,
    borderBottomWidth: 2, borderBottomColor: colors.borderLight,
    borderTopLeftRadius: 8, borderTopRightRadius: 8,
    paddingHorizontal: 16, fontSize: 16, color: colors.text, marginBottom: 16,
  },
  inputMulti: { height: 80, paddingTop: 12 },

  saveBtn: {
    height: 56, backgroundColor: colors.secondary, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnTxt: { color: colors.onPrimary, fontSize: 18, fontWeight: '600', fontFamily: fonts.semiBold },

  cancelBtn: { alignItems: 'center', paddingVertical: 14 },
  cancelTxt: { fontSize: 16, color: colors.textSecondary },
});
