import { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { createReceita, createDespesa } from '../services/financialService';
import { colors } from '../constants/colors';
import { todayISO } from '../utils';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export default function TransactionModal({ visible, onClose, onSaved }: Props) {
  const [tipo, setTipo] = useState<'receita' | 'despesa'>('receita');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(todayISO());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTipo('receita');
    setDescricao('');
    setValor('');
    setData(todayISO());
  }, [visible]);

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
      if (tipo === 'receita') {
        await createReceita(payload);
      } else {
        await createDespesa(payload);
      }
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
            <Text style={s.title}>Nova Transação</Text>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Toggle Receita / Despesa */}
              <View style={s.toggle}>
                <TouchableOpacity
                  style={[s.toggleBtn, tipo === 'receita' && s.toggleBtnActive]}
                  onPress={() => setTipo('receita')}
                >
                  <Text style={[s.toggleText, tipo === 'receita' && s.toggleTextActive]}>
                    💰 Receita
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.toggleBtn, tipo === 'despesa' && s.toggleBtnActive]}
                  onPress={() => setTipo('despesa')}
                >
                  <Text style={[s.toggleText, tipo === 'despesa' && s.toggleTextActive]}>
                    📤 Despesa
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={s.label}>DESCRIÇÃO</Text>
              <TextInput
                style={s.input}
                value={descricao}
                onChangeText={setDescricao}
                placeholder="Ex: Venda de leite"
                placeholderTextColor={colors.textTertiary}
              />

              <Text style={s.label}>VALOR (R$)</Text>
              <TextInput
                style={s.input}
                value={valor}
                onChangeText={setValor}
                placeholder="Ex: 1200,00"
                placeholderTextColor={colors.textTertiary}
                keyboardType="decimal-pad"
              />

              <Text style={s.label}>DATA</Text>
              <TextInput
                style={s.input}
                value={data}
                onChangeText={setData}
                placeholder="AAAA-MM-DD"
                placeholderTextColor={colors.textTertiary}
              />

              <TouchableOpacity
                style={[s.saveBtn, saving && s.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving
                  ? <ActivityIndicator color={colors.onPrimary} />
                  : <Text style={s.saveBtnText}>SALVAR TRANSAÇÃO</Text>
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
  toggleText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  toggleTextActive: { color: colors.primaryContainer },

  label: {
    fontSize: 12, fontWeight: '700', color: colors.textSecondary,
    letterSpacing: 0.5, marginBottom: 6,
  },
  input: {
    height: 52, backgroundColor: colors.surfaceContainerLow,
    borderBottomWidth: 2, borderBottomColor: colors.borderLight,
    borderTopLeftRadius: 8, borderTopRightRadius: 8,
    paddingHorizontal: 16, fontSize: 16, color: colors.text, marginBottom: 16,
  },

  saveBtn: {
    height: 56, backgroundColor: colors.primary, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: colors.onPrimary, fontSize: 18, fontWeight: '600' },
  cancelBtn: { alignItems: 'center', paddingVertical: 14 },
  cancelText: { fontSize: 16, color: colors.textSecondary },
});
