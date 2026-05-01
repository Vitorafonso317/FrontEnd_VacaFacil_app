import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  StyleSheet, ScrollView, Image, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { login } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../constants/colors';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  async function handleLogin() {
    if (!email || !password) return Alert.alert('Preencha todos os campos');
    setLoading(true);
    try {
      const res = await login(email, password);
      await signIn(res.data.token, res.data.user);
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
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
        <View style={s.field}>
          <Text style={s.label}>EMAIL</Text>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            placeholder="seu@email.com"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={s.field}>
          <Text style={s.label}>SENHA</Text>
          <TextInput
            style={s.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.textTertiary}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={s.btnPrimary} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={s.btnPrimaryText}>Entrar</Text>}
        </TouchableOpacity>

        <View style={s.links}>
          <TouchableOpacity>
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
          source={{ uri: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&q=80' }}
          style={s.image}
          resizeMode="cover"
        />
      </View>

      <Text style={s.footer}>TECNOLOGIA NO CAMPO</Text>
    </ScrollView>
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
  appName: { fontSize: 32, fontWeight: '700', color: colors.primary, letterSpacing: -0.5 },
  tagline: { fontSize: 16, color: colors.textSecondary, marginTop: 4 },

  card: {
    width: '100%',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 24,
    gap: 24,
  },
  field: { gap: 4 },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  input: {
    height: 56,
    backgroundColor: colors.surfaceContainerLow,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
  },

  btnPrimary: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: { color: colors.onPrimary, fontSize: 18, fontWeight: '600' },

  links: { alignItems: 'center', gap: 16 },
  linkPrimary: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  divider: { width: '100%', height: 1, backgroundColor: colors.borderLight },
  linkMuted: { fontSize: 16, color: colors.textSecondary },
  linkSecondary: { color: colors.secondary, fontWeight: '700' },

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
