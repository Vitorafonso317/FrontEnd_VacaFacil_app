import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import request from '../../services/api';
import type { ApiResponse } from '../../types';
import { colors } from '../../constants/colors';

export default function EditarPerfil() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [nome, setNome] = useState(user?.nome ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [loading, setLoading] = useState(false);

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function handleSave() {
    const nomeTrim = nome.trim();
    const emailTrim = email.trim().toLowerCase();
    if (!nomeTrim) return Alert.alert('Atenção', 'O nome é obrigatório.');
    if (!emailTrim) return Alert.alert('Atenção', 'O e-mail é obrigatório.');
    if (!EMAIL_REGEX.test(emailTrim)) return Alert.alert('E-mail inválido', 'Digite um e-mail válido.');

    setLoading(true);
    try {
      await request<ApiResponse<unknown>>('/users/me', {
        method: 'PUT',
        body: JSON.stringify({ nome: nomeTrim, email: emailTrim }),
      });
      updateUser({ nome: nomeTrim, email: emailTrim });
      Alert.alert('Sucesso', 'Perfil atualizado!', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      Alert.alert('Erro ao salvar', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialIcons name="arrow-back" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <Text style={s.title}>Editar Perfil</Text>
      <Text style={s.subtitle}>Atualize seus dados de cadastro.</Text>

      <View style={s.form}>
        <View style={s.field}>
          <Text style={s.label}>NOME</Text>
          <TextInput
            style={s.input}
            value={nome}
            onChangeText={setNome}
            placeholder="Seu nome completo"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="words" maxLength={255}
          />
        </View>

        <View style={s.field}>
          <Text style={s.label}>E-MAIL</Text>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            placeholder="seu@email.com"
            placeholderTextColor={colors.textTertiary}
            keyboardType="email-address" autoCapitalize="none"
            autoCorrect={false} maxLength={255}
          />
        </View>

        <TouchableOpacity style={s.btn} onPress={handleSave} disabled={loading} activeOpacity={0.85}>
          {loading
            ? <ActivityIndicator color={colors.onPrimary} />
            : <Text style={s.btnText}>SALVAR ALTERAÇÕES</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={s.cancelBtn} onPress={() => router.back()}>
          <Text style={s.cancelText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
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

  btn: {
    height: 56, backgroundColor: colors.primary, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  btnText: { color: colors.onPrimary, fontSize: 18, fontWeight: '600', letterSpacing: 1 },
  cancelBtn: { alignItems: 'center', paddingVertical: 8 },
  cancelText: { fontSize: 16, color: colors.textSecondary },
});
