import { useState, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { createReceita, createDespesa, updateReceita, updateDespesa } from '../services/financialService';
import AppInput from './AppInput';
import { useToast } from '../context/ToastContext';
import { colors } from '../constants/colors';
import { todayISO } from '../utils';
import type { FinancialRecord } from '../types';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  editRecord?: FinancialRecord;
  editTipo?: 'receita' | 'despesa';
};

export default function TransactionModal({ visible, onClose, onSaved, editRecord, editTipo }: Props) {
  const isEditing = !!editRecord;
  const { showToast } = useToast();

  const [tipo, setTipo] = useState<'receita' | 'despesa'>(editTipo ?? 'receita');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(todayISO());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (editRecord) {
      setTipo(editTipo ?? 'receita');
      setDescricao(editRecord.descricao ?? '');
      setValor(String(editRecord.valor ?? ''));
      setData(editRecord.data ?? todayISO());
    } else {
      setTipo('receita');
      setDescricao('');
      setValor('');
      setData(todayISO());
    }
  }, [visible, editRecord]);

  function isValidDate(d: string) {
    return /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d));
  }

  async function handleSave() {
    if (!descricao.trim()) {
      Alert.alert('Atenção', 'Informe a descrição.');
      return;
    }
    const valorNum = parseFloat(valor.replace(',', '.'));
    if (!valor || isNaN(valorNum) || valorNum <= 0) {
      Alert.alert('Atenção', 'Informe um valor válido.');
      return;
    }
    if (!data || !isValidDate(data)) {
      Alert.alert('Data inválida', 'Use o formato AAAA-MM-DD. Ex: 2025-06-15');
      return;
    }
    setSaving(true);
    try {
      const payload = { descricao: descricao.trim(), valor: valorNum, data };
      if (isEditing && editRecord) {
        if (tipo === 'receita') {
          await updateReceita(editRecord.id, payload);
        } else {
          await updateDespesa(editRecord.id, payload);
        }
      } else {
        if (tipo === 'receita') {
          await createReceita(payload);
        } else {
          await createDespesa(payload);
        }
      }
      showToast(isEditing ? 'Transação atualizada!' : `${tipo === 'receita' ? 'Receita' : 'Despesa'} registrada!`);
      onSaved();
      onClose();
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
            <Text style={s.title}>{isEditing ? 'Editar Transação' : 'Nova Transação'}</Text>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={s.toggle}>
                <TouchableOpacity
                  style={[s.toggleBtn, tipo === 'receita' && s.toggleBtnActive, isEditing && s.toggleBtnLocked]}
                  onPress={() => !isEditing && setTipo('receita')}
                  activeOpacity={isEditing ? 1 : 0.7}
                >
                  <Text style={[s.toggleText, tipo === 'receita' && s.toggleTextActive]}>
                    💰 Receita
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.toggleBtn, tipo === 'despesa' && s.toggleBtnActive, isEditing && s.toggleBtnLocked]}
                  onPress={() => !isEditing && setTipo('despesa')}
                  activeOpacity={isEditing ? 1 : 0.7}
                >
                  <Text style={[s.toggleText, tipo === 'despesa' && s.toggleTextActive]}>
                    📤 Despesa
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={s.fields}>
                <AppInput
                  label="DESCRIÇÃO"
                  value={descricao}
                  onChangeText={setDescricao}
                  placeholder="Ex: Venda de leite"
                />

                <AppInput
                  label="VALOR (R$)"
                  value={valor}
                  onChangeText={setValor}
                  placeholder="Ex: 1200,00"
                  keyboardType="decimal-pad"
                />

                <AppInput
                  label="DATA"
                  value={data}
                  onChangeText={setData}
                  placeholder="AAAA-MM-DD"
                />
              </View>

              <TouchableOpacity
                style={[s.saveBtn, saving && s.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving
                  ? <ActivityIndicator color={colors.onPrimary} />
                  : <Text style={s.saveBtnText}>{isEditing ? 'SALVAR ALTERAÇÕES' : 'SALVAR TRANSAÇÃO'}</Text>
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
  title: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 20 },

  toggle: {
    flexDirection: 'row', backgroundColor: colors.surfaceContainer,
    borderRadius: 8, padding: 4, marginBottom: 20,
  },
  toggleBtn: {
    flex: 1, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 6,
  },
  toggleBtnActive: { backgroundColor: colors.surfaceContainerLowest },
  toggleBtnLocked: { opacity: 0.6 },
  toggleText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  toggleTextActive: { color: colors.primaryContainer },

  fields: { gap: 16, marginBottom: 8 },

  saveBtn: {
    height: 56, backgroundColor: colors.primary, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: colors.onPrimary, fontSize: 18, fontWeight: '600' },
  cancelBtn: { alignItems: 'center', paddingVertical: 14 },
  cancelText: { fontSize: 16, color: colors.textSecondary },
});
