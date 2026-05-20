import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import request from '../../services/api';
import type { ApiResponse, MarketplaceItem, MarketplaceInput } from '../../types';
import { colors } from '../../constants/colors';

const CATEGORIAS = ['Bovino', 'Insumo', 'Equipamento', 'Outro'];

export default function CriarAnuncio() {
  const router = useRouter();
  const [form, setForm] = useState<{
    titulo: string;
    descricao: string;
    preco: string;
    categoria: string;
    contato: string;
  }>({ titulo: '', descricao: '', preco: '', categoria: '', contato: '' });
  const [loading, setLoading] = useState(false);

  function set(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    if (!form.titulo.trim()) return Alert.alert('Atenção', 'O título é obrigatório.');
    const precoNum = parseFloat(form.preco.replace(',', '.'));
    if (!form.preco || isNaN(precoNum) || precoNum <= 0) {
      return Alert.alert('Atenção', 'Informe um preço válido.');
    }

    setLoading(true);
    try {
      const payload: MarketplaceInput = {
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim() || undefined,
        preco: precoNum,
        categoria: form.categoria || undefined,
        contato: form.contato.trim() || undefined,
      };
      await request<ApiResponse<MarketplaceItem>>('/marketplace', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Erro ao publicar', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialIcons name="arrow-back" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <Text style={s.title}>Novo Anúncio</Text>
      <Text style={s.subtitle}>Publique um produto ou animal para venda.</Text>

      <View style={s.form}>
        <View style={s.field}>
          <Text style={s.label}>TÍTULO *</Text>
          <TextInput
            style={s.input} value={form.titulo} onChangeText={v => set('titulo', v)}
            placeholder="Ex: Vaca Holandesa — 4 anos"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="sentences"
          />
        </View>

        <View style={s.field}>
          <Text style={s.label}>DESCRIÇÃO</Text>
          <TextInput
            style={[s.input, s.inputMultiline]}
            value={form.descricao} onChangeText={v => set('descricao', v)}
            placeholder="Descreva o produto, condições, histórico..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
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
          <Text style={s.label}>CATEGORIA</Text>
          <View style={s.chipRow}>
            {CATEGORIAS.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[s.chip, form.categoria === cat && s.chipActive]}
                onPress={() => set('categoria', form.categoria === cat ? '' : cat)}
                activeOpacity={0.7}
              >
                <Text style={[s.chipText, form.categoria === cat && s.chipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.field}>
          <Text style={s.label}>CONTATO (WhatsApp ou e-mail)</Text>
          <TextInput
            style={s.input} value={form.contato} onChangeText={v => set('contato', v)}
            placeholder="Ex: 5531999999999 ou email@exemplo.com"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <TouchableOpacity style={s.btn} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
          {loading
            ? <ActivityIndicator color={colors.onPrimary} />
            : <Text style={s.btnText}>PUBLICAR ANÚNCIO</Text>
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
  field: { gap: 4 },
  label: { fontSize: 14, fontWeight: '700', color: colors.text, letterSpacing: 0.5, paddingHorizontal: 4 },
  input: {
    height: 56, backgroundColor: colors.surfaceContainerLow,
    borderBottomWidth: 2, borderBottomColor: colors.borderLight,
    borderTopLeftRadius: 8, borderTopRightRadius: 8,
    paddingHorizontal: 16, fontSize: 16, color: colors.text,
  },
  inputMultiline: { height: 96, paddingTop: 14 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999,
    borderWidth: 1, borderColor: colors.borderLight,
    backgroundColor: colors.surfaceContainerLow,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: colors.onPrimary },

  btn: {
    height: 56, backgroundColor: colors.primary, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  btnText: { color: colors.onPrimary, fontSize: 18, fontWeight: '600', letterSpacing: 1 },
  cancelBtn: { alignItems: 'center', paddingVertical: 8 },
  cancelText: { fontSize: 16, color: colors.textSecondary },
});
