import { useState } from 'react';
import type React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert, Modal, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { updateMe } from '../services/userService';
import AppInput from '../components/AppInput';
import { colors } from '../constants/colors';

type NotificationKey = 'producao' | 'reproducao' | 'financeiro';

export default function Configuracoes() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notifications, setNotifications] = useState<Record<NotificationKey, boolean>>({
    producao: true,
    reproducao: true,
    financeiro: true,
  });
  const [online, setOnline] = useState(true);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [unit, setUnit] = useState<'Litros' | 'Mililitros'>('Litros');
  const [currency, setCurrency] = useState<'R$' | 'US$'>('R$');
  const [dateFormat, setDateFormat] = useState<'YYYY-MM-DD' | 'DD/MM/YYYY'>('YYYY-MM-DD');

  function toggleNotification(key: NotificationKey) {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function syncData() {
    setOnline(true);
    Alert.alert('Sincronizacao', 'Dados sincronizados com o backend.');
  }

  function cycleUnit() {
    setUnit(prev => prev === 'Litros' ? 'Mililitros' : 'Litros');
  }

  function cycleCurrency() {
    setCurrency(prev => prev === 'R$' ? 'US$' : 'R$');
  }

  function cycleDateFormat() {
    setDateFormat(prev => prev === 'YYYY-MM-DD' ? 'DD/MM/YYYY' : 'YYYY-MM-DD');
  }

  async function handleChangePassword() {
    if (password.length < 6) {
      return Alert.alert('Senha invalida', 'A nova senha deve ter no minimo 6 caracteres.');
    }

    setSavingPassword(true);
    try {
      await updateMe({ password });
      setPassword('');
      setPasswordVisible(false);
      Alert.alert('Senha atualizada', 'Use a nova senha no proximo login.');
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.primaryContainer} />
        </TouchableOpacity>
        <View>
          <Text style={s.title}>Configuracoes</Text>
          <Text style={s.subtitle}>Preferencias da conta e sincronizacao</Text>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Notificacoes</Text>
        <Row icon="notifications" title="Ativar alertas" right={<Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />} />
        <Row icon="water-drop" title="Producao" right={<Switch value={notifications.producao} onValueChange={() => toggleNotification('producao')} disabled={!notificationsEnabled} />} />
        <Row icon="pets" title="Reproducao" right={<Switch value={notifications.reproducao} onValueChange={() => toggleNotification('reproducao')} disabled={!notificationsEnabled} />} />
        <Row icon="account-balance-wallet" title="Financeiro" right={<Switch value={notifications.financeiro} onValueChange={() => toggleNotification('financeiro')} disabled={!notificationsEnabled} />} />
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Preferencias</Text>
        <Row icon="straighten" title="Unidade" detail={unit} onPress={cycleUnit} />
        <Row icon="payments" title="Moeda" detail={currency} onPress={cycleCurrency} />
        <Row icon="event" title="Formato de data" detail={dateFormat} onPress={cycleDateFormat} />
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Dados e sincronizacao</Text>
        <Row icon="cloud-sync" title="Sincronizar dados" detail="Buscar dados atualizados" onPress={syncData} />
        <Row icon={online ? 'wifi' : 'wifi-off'} title="Status" detail={online ? 'Online' : 'Offline'} onPress={() => setOnline(prev => !prev)} />
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Seguranca</Text>
        <Row icon="lock-reset" title="Alterar senha" onPress={() => setPasswordVisible(true)} />
        <Row icon="logout" title="Logout" danger onPress={signOut} />
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Sobre</Text>
        <Row icon="info" title="Versao do app" detail="1.0.0" />
        <Row icon="description" title="Termos de uso" onPress={() => Alert.alert('Termos de uso', 'Documento ainda nao cadastrado no app.')} />
        <Row icon="privacy-tip" title="Politica de privacidade" onPress={() => Alert.alert('Politica de privacidade', 'Documento ainda nao cadastrado no app.')} />
      </View>

      <Modal visible={passwordVisible} transparent animationType="fade" onRequestClose={() => setPasswordVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Alterar senha</Text>
              <TouchableOpacity style={s.iconBtn} onPress={() => setPasswordVisible(false)}>
                <MaterialIcons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <AppInput
              label="NOVA SENHA"
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo 6 caracteres"
              secureTextEntry
            />

            <TouchableOpacity style={[s.saveBtn, savingPassword && s.saveBtnDisabled]} onPress={handleChangePassword} disabled={savingPassword}>
              {savingPassword ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <>
                  <MaterialIcons name="check" size={20} color={colors.onPrimary} />
                  <Text style={s.saveText}>Salvar senha</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function Row({
  icon,
  title,
  detail,
  right,
  danger,
  onPress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  detail?: string;
  right?: React.ReactNode;
  danger?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={s.row} activeOpacity={onPress ? 0.75 : 1} onPress={onPress}>
      <View style={[s.rowIcon, danger && s.rowIconDanger]}>
        <MaterialIcons name={icon} size={22} color={danger ? colors.error : colors.primary} />
      </View>
      <View style={s.rowText}>
        <Text style={[s.rowTitle, danger && { color: colors.error }]}>{title}</Text>
        {detail ? <Text style={s.rowDetail}>{detail}</Text> : null}
      </View>
      {right ?? (onPress ? <MaterialIcons name="chevron-right" size={22} color={colors.border} /> : null)}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 18, paddingBottom: 40 },
  header: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textSecondary },
  section: { gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 4 },
  row: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: colors.onPrimaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconDanger: { backgroundColor: colors.errorContainer },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowDetail: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    gap: 10,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  saveBtn: {
    marginTop: 8,
    height: 52,
    borderRadius: 8,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveText: { color: colors.onPrimary, fontSize: 16, fontWeight: '700' },
});
