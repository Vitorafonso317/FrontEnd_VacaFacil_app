import { useState } from 'react';
import {
  View, Text, TouchableOpacity, Alert,
  StyleSheet, ScrollView, Image, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { login } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import AppInput from '../../components/AppInput';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function handleLogin() {
    const emailNorm = email.trim().toLowerCase();
    if (!emailNorm || !password) return Alert.alert('Preencha todos os campos');
    if (!EMAIL_REGEX.test(emailNorm)) return Alert.alert('E-mail inválido', 'Digite um e-mail válido.');
    setLoading(true);
    try {
      const res = await login(emailNorm, password);
      await signIn(res.data.token, res.data.user, res.data.refreshToken);
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      {/* Logo */}
      <View style={s.logoSection}>
        <View style={s.logoBox}>
          <MaterialIcons name="agriculture" size={48} color={colors.primary} />
        </View>
        <Text style={s.appName}>VacaFácil</Text>
        <Text style={s.tagline}>Gestão leiteira profissional e simples.</Text>
      </View>

      {/* Card do formulário */}
      <View style={s.card}>
        <AppInput
          label="EMAIL"
          value={email}
          onChangeText={setEmail}
          placeholder="seu@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <AppInput
          label="SENHA"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
        />

        <TouchableOpacity style={s.btnPrimary} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={s.btnPrimaryText}>Entrar</Text>}
        </TouchableOpacity>

        <View style={s.links}>
          <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={s.linkPrimary}>Esqueci minha senha</Text>
          </TouchableOpacity>
          <View style={s.divider} />
          <Text style={s.linkMuted}>
            Não tem uma conta?{' '}
            <Text style={s.linkSecondary} onPress={() => router.push('/(auth)/register')}>
              Criar conta
            </Text>
          </Text>
        </View>
      </View>

      {/* Imagem decorativa */}
      <View style={s.imageBox}>
        <Image
          source={require('../../assets/vaca.jpg')}
          style={s.image}
          resizeMode="cover"
        />
      </View>

      <Text style={s.footer}>TECNOLOGIA NO CAMPO</Text>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { alignItems: 'center', paddingHorizontal: 20, paddingVertical: 32 },

  logoSection: { alignItems: 'center', marginBottom: 32 },
  logoBox: {
    padding: 12,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 16,
  },
  appName: { fontSize: 32, fontWeight: '700', fontFamily: fonts.bold, color: colors.primary, letterSpacing: -0.5 },
  tagline: { fontSize: 16, color: colors.textSecondary, marginTop: 4 },

  card: {
    width: '100%',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 24,
    gap: 20,
  },

  btnPrimary: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: { color: colors.onPrimary, fontSize: 18, fontWeight: '600', fontFamily: fonts.semiBold },

  links: { alignItems: 'center', gap: 16 },
  linkPrimary: { fontSize: 16, color: colors.primary, fontWeight: '600', fontFamily: fonts.semiBold },
  divider: { width: '100%', height: 1, backgroundColor: colors.borderLight },
  linkMuted: { fontSize: 16, color: colors.textSecondary },
  linkSecondary: { color: colors.secondary, fontWeight: '700', fontFamily: fonts.bold },

  imageBox: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginTop: 32,
  },
  image: { width: '100%', height: '100%' },

  footer: { marginTop: 24, fontSize: 12, color: colors.border, letterSpacing: 2 },
});
