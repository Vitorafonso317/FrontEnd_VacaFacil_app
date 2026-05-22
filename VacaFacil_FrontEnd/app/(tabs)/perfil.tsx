import { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Image, ActivityIndicator, Alert, Platform, ActionSheetIOS, Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { uploadFotoUsuario } from '../../services/uploadService';
import { getDashboardStats, type DashboardStats } from '../../services/dashboardService';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';

export default function Perfil() {
  const router = useRouter();
  const { user, signOut, updateUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(() => {});
  }, []);

  async function pickAndUpload(source: 'camera' | 'gallery') {
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permissão necessária',
        source === 'camera'
          ? 'Permita o acesso à câmera nas configurações.'
          : 'Permita o acesso à galeria nas configurações.'
      );
      return;
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
          allowsEditing: true,
          aspect: [1, 1],
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
          allowsEditing: true,
          aspect: [1, 1],
        });

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
    } else {
      Alert.alert('Foto de perfil', 'Escolha uma opção', [
        { text: 'Cancelar', style: 'cancel' },
        { text: '📷 Tirar foto',          onPress: () => pickAndUpload('camera') },
        { text: '🖼️ Escolher da galeria', onPress: () => pickAndUpload('gallery') },
      ]);
    }
  }

  function handleSupport() {
    Linking.openURL('mailto:suporte@vacafacil.com.br?subject=Suporte%20VacaFácil').catch(() => {
      Alert.alert(
        'Suporte Técnico',
        'Para dúvidas ou problemas, entre em contato:\n\nsuporte@vacafacil.com.br',
        [{ text: 'OK' }]
      );
    });
  }

  const totalVacas = stats?.rebanho.total_vacas;
  const mediaDiaria = stats?.producao.media_diaria;
  const isPremium = user?.plano === 'ouro' || user?.plano === 'diamante';

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      {/* Avatar */}
      <View style={s.avatarSection}>
        <TouchableOpacity
          style={s.avatarWrapper}
          onPress={handleAvatarPress}
          activeOpacity={0.85}
          disabled={uploading}
        >
          {user?.foto_url ? (
            <Image source={{ uri: user.foto_url }} style={s.avatar} />
          ) : (
            <View style={[s.avatar, s.avatarPlaceholder]}>
              <MaterialIcons name="person" size={56} color={colors.textSecondary} />
            </View>
          )}

          <View style={s.cameraBtn}>
            {uploading
              ? <ActivityIndicator size="small" color={colors.onPrimary} />
              : <MaterialIcons name="photo-camera" size={18} color={colors.onPrimary} />
            }
          </View>
        </TouchableOpacity>

        <Text style={s.userName}>{user?.nome ?? 'Produtor'}</Text>
        <View style={s.farmRow}>
          <MaterialIcons name="eco" size={16} color={colors.textSecondary} />
          <Text style={s.farmName}>Produtor Rural</Text>
        </View>
        <Text style={s.userEmail}>{user?.email ?? ''}</Text>
      </View>

      {/* Stats Bento */}
      <View style={s.bentoGrid}>
        <View style={s.bentoCard}>
          <MaterialIcons name="pets" size={22} color={colors.primary} />
          <Text style={s.bentoLabel}>TOTAL DE VACAS</Text>
          <Text style={s.bentoValue}>
            {totalVacas !== undefined ? String(totalVacas) : '—'}
          </Text>
        </View>
        <View style={s.bentoCard}>
          <MaterialIcons name="water-drop" size={22} color={colors.tertiary} />
          <Text style={s.bentoLabel}>PRODUÇÃO MÉDIA</Text>
          <Text style={s.bentoValue}>
            {mediaDiaria !== undefined ? `${mediaDiaria.toFixed(1)}L` : '—'}
          </Text>
        </View>
        <View style={[s.bentoCardFull, isPremium ? s.premiumCard : s.freeCard]}>
          <View>
            <Text style={isPremium ? s.premiumLabel : s.freeLabel}>ASSINATURA</Text>
            <Text style={isPremium ? s.premiumTitle : s.freeTitle}>
              {isPremium ? 'Plano Ouro Ativo' : 'Plano Gratuito'}
            </Text>
          </View>
          {isPremium
            ? <MaterialIcons name="verified" size={28} color={colors.primary} />
            : (
              <TouchableOpacity
                style={s.upgradeBtn}
                onPress={() => router.push('/perfil/planos')}
                activeOpacity={0.8}
              >
                <Text style={s.upgradeBtnText}>Fazer Upgrade</Text>
              </TouchableOpacity>
            )
          }
        </View>
      </View>

      {/* Ações */}
      <View style={s.actions}>
        <TouchableOpacity
          style={s.btnPrimary}
          activeOpacity={0.85}
          onPress={() => router.push('/perfil/edit')}
        >
          <View style={s.btnContent}>
            <MaterialIcons name="edit" size={22} color={colors.onPrimary} />
            <Text style={s.btnPrimaryText}>Editar Perfil</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={colors.onPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={s.btnSecondary}
          activeOpacity={0.85}
          onPress={() => router.push('/perfil/settings')}
        >
          <View style={s.btnContent}>
            <MaterialIcons name="settings" size={22} color={colors.secondary} />
            <Text style={s.btnSecondaryText}>Configurações</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={colors.secondary} />
        </TouchableOpacity>

        <TouchableOpacity style={s.btnOutline} activeOpacity={0.85} onPress={handleSupport}>
          <View style={s.btnContent}>
            <MaterialIcons name="help" size={22} color={colors.text} />
            <Text style={s.btnOutlineText}>Suporte Técnico</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={colors.border} />
        </TouchableOpacity>

        <TouchableOpacity style={s.btnDanger} onPress={signOut} activeOpacity={0.85}>
          <MaterialIcons name="logout" size={22} color={colors.onError} />
          <Text style={s.btnDangerText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.version}>VacaFácil v2.4.0 • AgroTech Solutions</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 40, gap: 32 },

  avatarSection: { alignItems: 'center', paddingTop: 32, gap: 8 },
  avatarWrapper: { position: 'relative', marginBottom: 8 },
  avatar: {
    width: 128, height: 128, borderRadius: 64,
    borderWidth: 4, borderColor: colors.surfaceContainerLowest,
  },
  avatarPlaceholder: {
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center', justifyContent: 'center',
  },
  cameraBtn: {
    position: 'absolute', bottom: 4, right: 4,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary,
    borderWidth: 2, borderColor: colors.surfaceContainerLowest,
    alignItems: 'center', justifyContent: 'center',
  },
  userName: { fontSize: 32, fontWeight: '700', fontFamily: fonts.bold, color: colors.text, letterSpacing: -0.5 },
  farmRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  farmName: { fontSize: 16, color: colors.textSecondary },
  userEmail: { fontSize: 16, color: colors.border },

  bentoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  bentoCard: {
    flex: 1, minWidth: 140,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 8, borderWidth: 1, borderColor: colors.borderLight,
    padding: 12, gap: 4,
  },
  bentoCardFull: { width: '100%' },
  bentoLabel: { fontSize: 11, fontWeight: '700', fontFamily: fonts.bold, color: colors.border, letterSpacing: 0.5 },
  bentoValue: { fontSize: 24, fontWeight: '700', fontFamily: fonts.bold, color: colors.text, letterSpacing: -0.3 },
  premiumCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.onPrimaryContainer + '33',
    borderColor: colors.onPrimaryContainer, padding: 16, borderRadius: 8, borderWidth: 1,
  },
  premiumLabel: { fontSize: 11, fontWeight: '700', fontFamily: fonts.bold, color: colors.primary, letterSpacing: 0.5 },
  premiumTitle: { fontSize: 16, fontWeight: '600', fontFamily: fonts.semiBold, color: colors.primary, marginTop: 2 },

  freeCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.borderLight, padding: 16, borderRadius: 8, borderWidth: 1,
  },
  freeLabel: { fontSize: 11, fontWeight: '700', fontFamily: fonts.bold, color: colors.textSecondary, letterSpacing: 0.5 },
  freeTitle: { fontSize: 16, fontWeight: '600', fontFamily: fonts.semiBold, color: colors.text, marginTop: 2 },
  upgradeBtn: {
    backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 999,
  },
  upgradeBtnText: { fontSize: 13, fontWeight: '700', fontFamily: fonts.bold, color: colors.onPrimary },

  actions: { gap: 12 },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  btnPrimary: {
    height: 56, backgroundColor: colors.primary, borderRadius: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16,
  },
  btnPrimaryText: { fontSize: 16, fontWeight: '600', fontFamily: fonts.semiBold, color: colors.onPrimary },
  btnSecondary: {
    height: 56, backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 2, borderColor: colors.secondary, borderRadius: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16,
  },
  btnSecondaryText: { fontSize: 16, fontWeight: '600', fontFamily: fonts.semiBold, color: colors.secondary },
  btnOutline: {
    height: 56, backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1, borderColor: colors.borderLight, borderRadius: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16,
  },
  btnOutlineText: { fontSize: 16, fontWeight: '600', fontFamily: fonts.semiBold, color: colors.text },
  btnDanger: {
    height: 56, backgroundColor: colors.error, borderRadius: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  btnDangerText: { fontSize: 16, fontWeight: '600', fontFamily: fonts.semiBold, color: colors.onError },

  version: { textAlign: 'center', fontSize: 12, color: colors.border },
});
