import { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Alert,
  StyleSheet, ScrollView, ActivityIndicator, TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { resetPassword } from '../../services/authService';
import AppInput from '../../components/AppInput';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';

export default function ResetPassword() {
  const { email = '' } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const inputs = useRef<(TextInput | null)[]>([]);

  function handleCodeChange(val: string, idx: number) {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[idx] = digit;
    setCode(next);
    if (digit && idx < 5) inputs.current[idx + 1]?.focus();
    if (!digit && idx > 0) inputs.current[idx - 1]?.focus();
  }

  function handleCodePaste(val: string, idx: number) {
    const digits = val.replace(/\D/g, '').slice(0, 6);
    if (digits.length === 6) {
      setCode(digits.split(''));
      inputs.current[5]?.focus();
    } else {
      handleCodeChange(val, idx);
    }
  }

  async function handleReset() {
    const codeStr = code.join('');
    if (codeStr.length < 6) return Alert.alert('Atenção', 'Digite o código de 6 dígitos.');
    if (!password || password.length < 6) return Alert.alert('Atenção', 'A senha deve ter no mínimo 6 caracteres.');
    if (password !== confirm) return Alert.alert('Atenção', 'As senhas não coincidem.');

    setLoading(true);
    try {
      await resetPassword(email as string, codeStr, password);
      Alert.alert(
        'Senha redefinida!',
        'Sua senha foi atualizada com sucesso. Faça login com a nova senha.',
        [{ text: 'Fazer login', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
        <MaterialIcons name="arrow-back" size={28} color={colors.primary} />
      </TouchableOpacity>

      <View style={s.iconBox}>
        <MaterialIcons name="lock-open" size={48} color={colors.primary} />
      </View>

      <Text style={s.title}>Nova senha</Text>
      <Text style={s.subtitle}>
        Digite o código de 6 dígitos enviado para{' '}
        <Text style={{ fontWeight: '700', color: colors.text }}>{email}</Text>{' '}
        e escolha uma nova senha.
      </Text>

      {/* Campos do código */}
      <Text style={s.label}>CÓDIGO DE VERIFICAÇÃO</Text>
      <View style={s.codeRow}>
        {code.map((digit, idx) => (
          <TextInput
            key={idx}
            ref={r => { inputs.current[idx] = r; }}
            style={[s.codeBox, digit && s.codeBoxFilled]}
            value={digit}
            onChangeText={v => handleCodePaste(v, idx)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            autoFocus={idx === 0}
          />
        ))}
      </View>

      <View style={s.form}>
        <AppInput
          label="NOVA SENHA"
          value={password}
          onChangeText={setPassword}
          placeholder="Mínimo 6 caracteres"
          secureTextEntry
        />
        <AppInput
          label="CONFIRMAR NOVA SENHA"
          value={confirm}
          onChangeText={setConfirm}
          placeholder="Repita a nova senha"
          secureTextEntry
        />

        <TouchableOpacity style={s.btnPrimary} onPress={handleReset} disabled={loading} activeOpacity={0.85}>
          {loading
            ? <ActivityIndicator color={colors.onPrimary} />
            : <Text style={s.btnPrimaryText}>Redefinir senha</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={s.cancelRow}>
          <Text style={s.cancelText}>Voltar ao login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },

  backBtn: { padding: 4, marginBottom: 24, alignSelf: 'flex-start' },

  iconBox: {
    width: 88, height: 88,
    backgroundColor: colors.onPrimaryContainer,
    borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24, alignSelf: 'flex-start',
  },

  title: { fontSize: 28, fontWeight: '700', fontFamily: fonts.bold, color: colors.text, letterSpacing: -0.5, marginBottom: 10 },
  subtitle: { fontSize: 16, color: colors.textSecondary, lineHeight: 24, marginBottom: 28 },

  label: { fontSize: 12, fontWeight: '700', fontFamily: fonts.bold, color: colors.textSecondary, letterSpacing: 0.5, marginBottom: 12 },

  codeRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  codeBox: {
    flex: 1, height: 56, borderRadius: 10,
    borderWidth: 1.5, borderColor: colors.borderLight,
    backgroundColor: colors.surfaceContainerLow,
    textAlign: 'center', fontSize: 24, fontWeight: '700',
    fontFamily: fonts.bold, color: colors.text,
  },
  codeBoxFilled: { borderColor: colors.primary, backgroundColor: colors.onPrimaryContainer },

  form: { gap: 20 },

  btnPrimary: {
    height: 56, backgroundColor: colors.primary, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  btnPrimaryText: { color: colors.onPrimary, fontSize: 18, fontWeight: '600', fontFamily: fonts.semiBold },

  cancelRow: { alignItems: 'center', paddingVertical: 4 },
  cancelText: { fontSize: 16, color: colors.textSecondary },
});
