import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  ActionSheetIOS,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { getDashboardStats, type DashboardStats } from '../../services/dashboardService';
import { getMe, updateMe } from '../../services/userService';
import { uploadFotoUsuario } from '../../services/uploadService';
import { colors } from '../../constants/colors';

export default function Perfil() {
  const { user, signOut, updateUser } = useAuth();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [editVisible, setEditVisible] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ nome: user?.nome ?? '', email: user?.email ?? '' });

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, userRes] = await Promise.all([getDashboardStats(), getMe()]);
        setStats(statsRes);
        updateUser(userRes.data);
        setProfileForm({ nome: userRes.data.nome, email: userRes.data.email });
      } catch {
        setStats(null);
      }
    }

    load();
  }, []);

  async function pickAndUpload(source: 'camera' | 'gallery') {
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permissao necessaria', 'Permita o acesso nas configuracoes do dispositivo.');
      return;
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, allowsEditing: true, aspect: [1, 1] })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, allowsEditing: true, aspect: [1, 1] });

    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      const fotoUrl = await uploadFotoUsuario(result.assets[0].uri);
      updateUser({ foto_url: fotoUrl });
    } catch (e: any) {
      Alert.alert('Erro ao enviar foto', e.message);
    } finally {
      setUploading(false);
    }
  }

  function handleAvatarPress() {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancelar', 'Tirar foto', 'Escolher da galeria'], cancelButtonIndex: 0 },
        (i) => { if (i === 1) pickAndUpload('camera'); if (i === 2) pickAndUpload('gallery'); }
      );
      return;
    }

    Alert.alert('Foto de perfil', 'Escolha uma opcao', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Tirar foto', onPress: () => pickAndUpload('camera') },
      { text: 'Escolher da galeria', onPress: () => pickAndUpload('gallery') },
    ]);
  }

  function openEditProfile() {
    setProfileForm({ nome: user?.nome ?? '', email: user?.email ?? '' });
    setEditVisible(true);
  }

  async function handleSaveProfile() {
    const nome = profileForm.nome.trim();
    const email = profileForm.email.trim();

    if (!nome || !email) return Alert.alert('Preencha nome e email');

    setSavingProfile(true);
    try {
      await updateMe({ nome, email });
      updateUser({ nome, email });
      setEditVisible(false);
      Alert.alert('Perfil atualizado', 'Seus dados foram salvos.');
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setSavingProfile(false);
    }
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <View style={s.avatarSection}>
        <TouchableOpacity style={s.avatarWrapper} onPress={handleAvatarPress} activeOpacity={0.85} disabled={uploading}>
          {user?.foto_url ? (
            <Image source={{ uri: user.foto_url }} style={s.avatar} />
          ) : (
            <View style={[s.avatar, s.avatarPlaceholder]}>
              <MaterialIcons name="person" size={56} color={colors.textSecondary} />
            </View>
          )}
          <View style={s.cameraBtn}>
            {uploading ? <ActivityIndicator size="small" color={colors.onPrimary} /> : <MaterialIcons name="photo-camera" size={18} color={colors.onPrimary} />}
          </View>
        </TouchableOpacity>

        <Text style={s.userName}>{user?.nome ?? 'Produtor'}</Text>
        <View style={s.farmRow}>
          <MaterialIcons name="eco" size={16} color={colors.textSecondary} />
          <Text style={s.farmName}>Conta do produtor</Text>
        </View>
        <Text style={s.userEmail}>{user?.email ?? ''}</Text>
      </View>

      <View style={s.bentoGrid}>
        <View style={s.bentoCard}>
          <MaterialIcons name="pets" size={22} color={colors.primary} />
          <Text style={s.bentoLabel}>TOTAL DE VACAS</Text>
          <Text style={s.bentoValue}>{stats?.rebanho.total_vacas ?? 0}</Text>
        </View>
        <View style={s.bentoCard}>
          <MaterialIcons name="water-drop" size={22} color={colors.tertiary} />
          <Text style={s.bentoLabel}>PRODUCAO DIARIA</Text>
          <Text style={s.bentoValue}>{stats?.producao.media_diaria.toFixed(1) ?? '0'} L</Text>
        </View>
        <View style={[s.bentoCardFull, s.accountCard]}>
          <View>
            <Text style={s.accountLabel}>CONTA</Text>
            <Text style={s.accountTitle}>{user?.email ?? 'Usuario conectado'}</Text>
          </View>
          <MaterialIcons name="verified" size={28} color={colors.primary} />
        </View>
      </View>

      <View style={s.actions}>
        <TouchableOpacity style={s.btnPrimary} activeOpacity={0.85} onPress={openEditProfile}>
          <View style={s.btnContent}>
            <MaterialIcons name="edit" size={22} color={colors.onPrimary} />
            <Text style={s.btnPrimaryText}>Editar Perfil</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={colors.onPrimary} />
        </TouchableOpacity>

        <TouchableOpacity style={s.btnSecondary} activeOpacity={0.85} onPress={() => router.push('/configuracoes')}>
          <View style={s.btnContent}>
            <MaterialIcons name="settings" size={22} color={colors.secondary} />
            <Text style={s.btnSecondaryText}>Configuracoes</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={colors.secondary} />
        </TouchableOpacity>

        <TouchableOpacity style={s.btnDanger} onPress={signOut} activeOpacity={0.85}>
          <MaterialIcons name="logout" size={22} color={colors.onError} />
          <Text style={s.btnDangerText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.version}>VacaFacil v1.0.0</Text>

      <Modal visible={editVisible} transparent animationType="fade" onRequestClose={() => setEditVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Editar Perfil</Text>
              <TouchableOpacity style={s.iconBtn} onPress={() => setEditVisible(false)}>
                <MaterialIcons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={s.inputLabel}>Nome</Text>
            <TextInput style={s.input} value={profileForm.nome} onChangeText={nome => setProfileForm(prev => ({ ...prev, nome }))} placeholder="Seu nome" placeholderTextColor={colors.textTertiary} />

            <Text style={s.inputLabel}>Email</Text>
            <TextInput style={s.input} value={profileForm.email} onChangeText={email => setProfileForm(prev => ({ ...prev, email }))} placeholder="email@exemplo.com" placeholderTextColor={colors.textTertiary} autoCapitalize="none" keyboardType="email-address" />

            <TouchableOpacity style={[s.saveBtn, savingProfile && s.saveBtnDisabled]} onPress={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? <ActivityIndicator color={colors.onPrimary} /> : (
                <>
                  <MaterialIcons name="check" size={20} color={colors.onPrimary} />
                  <Text style={s.saveText}>Salvar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 40, gap: 32 },
  avatarSection: { alignItems: 'center', paddingTop: 32, gap: 8 },
  avatarWrapper: { position: 'relative', marginBottom: 8 },
  avatar: { width: 128, height: 128, borderRadius: 64, borderWidth: 4, borderColor: colors.surfaceContainerLowest },
  avatarPlaceholder: { backgroundColor: colors.surfaceContainerHighest, alignItems: 'center', justifyContent: 'center' },
  cameraBtn: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: { fontSize: 32, fontWeight: '700', color: colors.text },
  farmRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  farmName: { fontSize: 16, color: colors.textSecondary },
  userEmail: { fontSize: 16, color: colors.border },
  bentoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  bentoCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 12,
    gap: 4,
  },
  bentoCardFull: { width: '100%' },
  bentoLabel: { fontSize: 11, fontWeight: '700', color: colors.border, letterSpacing: 0.5 },
  bentoValue: { fontSize: 24, fontWeight: '700', color: colors.text },
  accountCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.onPrimaryContainer + '33',
    borderColor: colors.onPrimaryContainer,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  accountLabel: { fontSize: 11, fontWeight: '700', color: colors.primary, letterSpacing: 0.5 },
  accountTitle: { fontSize: 16, fontWeight: '600', color: colors.primary, marginTop: 2 },
  actions: { gap: 12 },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  btnPrimary: { height: 56, backgroundColor: colors.primary, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  btnPrimaryText: { fontSize: 16, fontWeight: '600', color: colors.onPrimary },
  btnSecondary: { height: 56, backgroundColor: colors.surfaceContainerLowest, borderWidth: 2, borderColor: colors.secondary, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  btnSecondaryText: { fontSize: 16, fontWeight: '600', color: colors.secondary },
  btnDanger: { height: 56, backgroundColor: colors.error, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnDangerText: { fontSize: 16, fontWeight: '600', color: colors.onError },
  version: { textAlign: 'center', fontSize: 12, color: colors.border },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.surfaceContainerLowest, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, gap: 10 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  inputLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginTop: 4 },
  input: { height: 48, borderWidth: 1, borderColor: colors.borderLight, borderRadius: 8, paddingHorizontal: 12, color: colors.text, backgroundColor: colors.surfaceContainerLowest },
  saveBtn: { marginTop: 8, height: 52, borderRadius: 8, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveBtnDisabled: { opacity: 0.7 },
  saveText: { color: colors.onPrimary, fontSize: 16, fontWeight: '700' },
});
