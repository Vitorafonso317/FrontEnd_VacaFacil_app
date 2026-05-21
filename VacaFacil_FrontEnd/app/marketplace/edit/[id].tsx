import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import request from '../../../services/api';
import type { ApiResponse, MarketplaceItem, MarketplaceInput } from '../../../types';
import { colors } from '../../../constants/colors';

export default function EditarAnuncio() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState({ titulo: '', descricao: '', preco: '', contato: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    request<ApiResponse<MarketplaceItem>>(`/marketplace/${id}`)
      .then(res => setForm({
        titulo: res.data.titulo ?? '',
        descricao: res.data.descricao ?? '',
        preco: String(res.data.preco ?? ''),
        contato: res.data.contato ?? '',
      }))
      .catch(e => Alert.alert('Erro', e.message))
      .finally(() => setLoading(false));
  }, [id]);

  function set(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!form.titulo.trim()) return Alert.alert('Atenção', 'O título é obrigatório.');
    const precoNum = parseFloat(form.preco.replace(',', '.'));
    if (!form.preco || isNaN(precoNum) || precoNum <= 0) {
      return Alert.alert('Atenção', 'Informe um preço válido.');
    }

    setSaving(true);
    try {
      const payload: Partial<MarketplaceInput> = {
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim() || undefined,
        preco: precoNum,
        contato: form.contato.trim() || undefined,
      };
      await request<ApiResponse<null>>(`/marketplace/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Erro ao salvar', e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialIcons name="arrow-back" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <Text style={s.title}>Editar Anúncio</Text>
      <Text style={s.subtitle}>Atualize as informações do seu anúncio.</Text>

      <View style={s.form}>
        <View style={s.field}>
          <Text style={s.label}>TÍTULO *</Text>
          <TextInput
            style={s.input} value={form.titulo} onChangeText={v => set('titulo', v)}
            placeholder="Ex: Vaca Holandesa — 4 anos"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="sentences" maxLength={255}
          />
        </View>

        <View style={s.field}>
          <Text style={s.label}>DESCRIÇÃO</Text>
          <TextInput
            style={[s.input, s.inputMultiline]}
            value={form.descricao} onChangeText={v => set('descricao', v)}
            placeholder="Descreva o animal, condições, histórico..."
            placeholderTextColor={colors.textTertiary}
            multiline numberOfLines={3} textAlignVertical="top" maxLength={500}
          />
        </View>

        <View style={s.field}>
          <Text style={s.label}>PREÇO (R$) *</Text>
          <TextInput
            style={s.input} value={form.preco} onChangeText={v => set('preco', v)}
            placeholder="Ex: 4500,00"
            placeholderTextColor={colors.textTertiary}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={s.field}>
          <Text style={s.label}>CONTATO (WhatsApp ou e-mail)</Text>
          <TextInput
            style={s.input} value={form.contato} onChangeText={v => set('contato', v)}
            placeholder="Ex: 5531999999999 ou email@exemplo.com"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none" keyboardType="email-address" maxLength={255}
          />
        </View>

        <TouchableOpacity
          style={[s.btn, saving && s.btnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color={colors.onPrimary} />
            : <Text style={s.btnText}>SALVAR ALTERAÇÕES</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={s.cancelBtn} onPress={() => router.back()}>
          <Text style={s.cancelText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { paddingTop: 32, paddingBottom: 8 },
  backBtn: { padding: 4, marginLeft: -4 },
  title: { fontSize: 32, fontWeight: '700', color: colors.primary, letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: 32 },

  form: { gap: 24 },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.5, paddingHorizontal: 2 },
  input: {
    height: 56, backgroundColor: colors.surfaceContainerLow,
    borderBottomWidth: 2, borderBottomColor: colors.borderLight,
    borderTopLeftRadius: 8, borderTopRightRadius: 8,
    paddingHorizontal: 16, fontSize: 16, color: colors.text,
  },
  inputMultiline: { height: 96, paddingTop: 14 },

  btn: {
    height: 56, backgroundColor: colors.primary, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 5,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: colors.onPrimary, fontSize: 18, fontWeight: '600', letterSpacing: 1 },
  cancelBtn: { alignItems: 'center', paddingVertical: 8 },
  cancelText: { fontSize: 16, color: colors.textSecondary },
});
