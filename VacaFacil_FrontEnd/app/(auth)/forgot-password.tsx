import { useState } from 'react';
import {
  View, Text, TouchableOpacity, Alert,
  StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { forgotPassword } from '../../services/authService';
import AppInput from '../../components/AppInput';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function handleSend() {
    const emailNorm = email.trim().toLowerCase();
    if (!emailNorm) return Alert.alert('Informe o e-mail cadastrado.');
    if (!EMAIL_REGEX.test(emailNorm)) return Alert.alert('E-mail inválido', 'Digite um e-mail válido.');
    setLoading(true);
    try {
      await forgotPassword(emailNorm);
      setSent(true);
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <View style={s.screen}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={28} color={colors.primary} />
        </TouchableOpacity>

        <View style={s.successBox}>
          <View style={s.successIcon}>
            <MaterialIcons name="mark-email-read" size={48} color={colors.primary} />
          </View>
          <Text style={s.successTitle}>E-mail enviado!</Text>
          <Text style={s.successSub}>
            Se o endereço <Text style={{ fontWeight: '700' }}>{email.trim().toLowerCase()}</Text>{' '}
            estiver cadastrado, você receberá um código de 6 dígitos em instantes.
          </Text>
          <Text style={s.successHint}>O código expira em 15 minutos.</Text>

          <TouchableOpacity
            style={s.btnPrimary}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/(auth)/reset-password', params: { email: email.trim().toLowerCase() } })}
          >
            <Text style={s.btnPrimaryText}>Inserir código</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.btnGhost} onPress={() => setSent(false)}>
            <Text style={s.btnGhostText}>Reenviar e-mail</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
        <MaterialIcons name="arrow-back" size={28} color={colors.primary} />
      </TouchableOpacity>

      <View style={s.iconBox}>
        <MaterialIcons name="lock-reset" size={48} color={colors.primary} />
      </View>

      <Text style={s.title}>Esqueceu a senha?</Text>
      <Text style={s.subtitle}>
        Digite o e-mail da sua conta e enviaremos um código de 6 dígitos para redefinir sua senha.
      </Text>

      <View style={s.form}>
        <AppInput
          label="E-MAIL CADASTRADO"
          value={email}
          onChangeText={setEmail}
          placeholder="seu@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
          autoFocus
        />

        <TouchableOpacity style={s.btnPrimary} onPress={handleSend} disabled={loading} activeOpacity={0.85}>
          {loading
            ? <ActivityIndicator color={colors.onPrimary} />
            : <Text style={s.btnPrimaryText}>Enviar código</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={s.cancelRow}>
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
  subtitle: { fontSize: 16, color: colors.textSecondary, lineHeight: 24, marginBottom: 32 },

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

  // Estado de sucesso
  successBox: { flex: 1, paddingHorizontal: 24, paddingTop: 40, gap: 16 },
  successIcon: {
    width: 88, height: 88,
    backgroundColor: colors.onPrimaryContainer,
    borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  successTitle: { fontSize: 28, fontWeight: '700', fontFamily: fonts.bold, color: colors.text, letterSpacing: -0.5 },
  successSub: { fontSize: 16, color: colors.textSecondary, lineHeight: 24 },
  successHint: { fontSize: 13, color: colors.textTertiary },

  btnGhost: {
    height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  btnGhostText: { color: colors.primary, fontSize: 16, fontWeight: '600', fontFamily: fonts.semiBold },
});
