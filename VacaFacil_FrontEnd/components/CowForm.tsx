import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../constants/colors';
import type { CowInput } from '../types';

type FormState = {
  nome: string;
  raca: string;
  idade: string;
  peso: string;
  status_saude: string;
};

type Props = {
  title: string;
  subtitle: string;
  submitLabel: string;
  form: FormState;
  loading: boolean;
  onChange: (field: keyof FormState, value: string) => void;
  onSubmit: () => void;
};

const STATUS_OPTIONS = ['saudavel', 'seca', 'tratamento'];

export default function CowForm({ title, subtitle, submitLabel, form, loading, onChange, onSubmit }: Props) {
  const router = useRouter();

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialIcons name="arrow-back" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <Text style={s.title}>{title}</Text>
      <Text style={s.subtitle}>{subtitle}</Text>

      <View style={s.form}>
        <View style={s.field}>
          <Text style={s.label}>NOME *</Text>
          <TextInput
            style={s.input} value={form.nome} onChangeText={v => onChange('nome', v)}
            placeholder="Ex: Mimosa" placeholderTextColor={colors.textTertiary}
            autoCapitalize="words"
          />
        </View>

        <View style={s.field}>
          <Text style={s.label}>RAÇA</Text>
          <TextInput
            style={s.input} value={form.raca} onChangeText={v => onChange('raca', v)}
            placeholder="Ex: Holandesa" placeholderTextColor={colors.textTertiary}
          />
        </View>

        <View style={s.row}>
          <View style={[s.field, s.flex1]}>
            <Text style={s.label}>IDADE (anos)</Text>
            <TextInput
              style={s.input} value={form.idade} onChangeText={v => onChange('idade', v)}
              placeholder="Ex: 3" placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
            />
          </View>
          <View style={[s.field, s.flex1]}>
            <Text style={s.label}>PESO (kg)</Text>
            <TextInput
              style={s.input} value={form.peso} onChangeText={v => onChange('peso', v)}
              placeholder="Ex: 520" placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={s.field}>
          <Text style={s.label}>STATUS DE SAÚDE</Text>
          <View style={s.statusRow}>
            {STATUS_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[s.statusBtn, form.status_saude === opt && s.statusBtnActive]}
                onPress={() => onChange('status_saude', opt)}
              >
                <Text style={[s.statusBtnText, form.status_saude === opt && s.statusBtnTextActive]}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={s.btn} onPress={onSubmit} disabled={loading} activeOpacity={0.85}>
          {loading
            ? <ActivityIndicator color={colors.onPrimary} />
            : <Text style={s.btnText}>{submitLabel}</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={s.cancelBtn} onPress={() => router.back()}>
          <Text style={s.cancelText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

export function cowInputFromForm(form: FormState): CowInput {
  return {
    nome: form.nome.trim(),
    raca: form.raca || undefined,
    idade: form.idade ? Number(form.idade) : undefined,
    peso: form.peso ? Number(form.peso) : undefined,
    status_saude: form.status_saude,
  };
}

export const DEFAULT_FORM: FormState = {
  nome: '', raca: '', idade: '', peso: '', status_saude: 'saudavel',
};

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
  row: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
  statusRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  statusBtn: {
    flex: 1, height: 44, borderRadius: 8, borderWidth: 1,
    borderColor: colors.borderLight, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLow,
  },
  statusBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  statusBtnText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  statusBtnTextActive: { color: colors.onPrimary },
  btn: {
    height: 56, backgroundColor: colors.primary, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  btnText: { color: colors.onPrimary, fontSize: 18, fontWeight: '600', letterSpacing: 1 },
  cancelBtn: { alignItems: 'center', paddingVertical: 8 },
  cancelText: { fontSize: 16, color: colors.textSecondary },
});
