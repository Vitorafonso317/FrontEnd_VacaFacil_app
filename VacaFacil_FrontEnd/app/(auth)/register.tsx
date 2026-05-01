import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, SafeAreaView, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { register, login } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../constants/colors';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password || !confirmPassword)
      return Alert.alert('Campos obrigatórios', 'Preencha todos os campos.');
    if (password !== confirmPassword)
      return Alert.alert('Senhas diferentes', 'As senhas não coincidem.');
    if (password.length < 6)
      return Alert.alert('Senha fraca', 'Mínimo 6 caracteres.');
    if (!acceptedTerms)
      return Alert.alert('Termos de Uso', 'Aceite os termos para continuar.');

    setLoading(true);
    try {
      await register(name.trim(), email.trim().toLowerCase(), password);
      const res = await login(email.trim().toLowerCase(), password);
      await signIn(res.data.token, res.data.user);
    } catch (e: any) {
      Alert.alert('Erro ao cadastrar', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        {/* Header com botão voltar */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <MaterialIcons name="arrow-back" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Título */}
        <Text style={s.title}>Crie sua conta</Text>
        <Text style={s.subtitle}>Junte-se ao VacaFácil e simplifique o gerenciamento da sua fazenda.</Text>

        {/* Campos */}
        <View style={s.form}>
          <View style={s.field}>
            <Text style={s.label}>NOME</Text>
            <TextInput style={s.input} placeholder="Ex: João Silva" placeholderTextColor={colors.textTertiary}
              value={name} onChangeText={setName} autoCapitalize="words" />
          </View>

          <View style={s.field}>
            <Text style={s.label}>EMAIL</Text>
            <TextInput style={s.input} placeholder="email@exemplo.com" placeholderTextColor={colors.textTertiary}
              value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          </View>

          <View style={s.field}>
            <Text style={s.label}>SENHA</Text>
            <View style={s.inputRow}>
              <TextInput style={s.inputFlex} placeholder="••••••••" placeholderTextColor={colors.textTertiary}
                value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={s.eyeBtn}>
                <MaterialIcons name={showPassword ? 'visibility-off' : 'visibility'} size={22} color={colors.border} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={s.field}>
            <Text style={s.label}>CONFIRMAR SENHA</Text>
            <View style={s.inputRow}>
              <TextInput style={s.inputFlex} placeholder="••••••••" placeholderTextColor={colors.textTertiary}
                value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirm} />
              <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={s.eyeBtn}>
                <MaterialIcons name={showConfirm ? 'visibility-off' : 'visibility'} size={22} color={colors.border} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Termos */}
          <TouchableOpacity style={s.checkRow} onPress={() => setAcceptedTerms(v => !v)} activeOpacity={0.7}>
            <View style={[s.checkbox, acceptedTerms && s.checkboxOn]}>
              {acceptedTerms && <MaterialIcons name="check" size={14} color="#fff" />}
            </View>
            <Text style={s.termsText}>
              Eu aceito os <Text style={s.termsLink}>Termos de Uso</Text> e a <Text style={s.termsLink}>Política de Privacidade</Text> da VacaFácil.
            </Text>
          </TouchableOpacity>

          {/* Botão */}
          <TouchableOpacity style={s.btn} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={s.btnText}>CADASTRAR</Text>}
          </TouchableOpacity>

          {/* Link login */}
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={s.loginLink}>
            <Text style={s.loginText}>
              Já possui uma conta? <Text style={s.loginLinkText}>Fazer Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { paddingTop: 32, paddingBottom: 8 },
  backBtn: { padding: 4, marginLeft: -4 },
  title: { fontSize: 32, fontWeight: '700', color: colors.primary, marginBottom: 8, letterSpacing: -0.5 },
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
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  inputFlex: {
    flex: 1, height: 56, backgroundColor: colors.surfaceContainerLow,
    borderBottomWidth: 2, borderBottomColor: colors.borderLight,
    borderTopLeftRadius: 8, paddingHorizontal: 16, fontSize: 16, color: colors.text,
  },
  eyeBtn: {
    height: 56, width: 48, backgroundColor: colors.surfaceContainerLow,
    borderBottomWidth: 2, borderBottomColor: colors.borderLight,
    borderTopRightRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  checkbox: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 2,
    borderColor: colors.borderLight, alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  termsText: { flex: 1, fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  termsLink: { color: colors.primary, fontWeight: '700' },
  btn: {
    height: 56, backgroundColor: colors.primary, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  btnText: { color: colors.onPrimary, fontSize: 18, fontWeight: '600', letterSpacing: 1 },
  loginLink: { alignItems: 'center', marginTop: 8 },
  loginText: { fontSize: 16, color: colors.textSecondary },
  loginLinkText: { color: colors.primary, fontWeight: '700' },
});
