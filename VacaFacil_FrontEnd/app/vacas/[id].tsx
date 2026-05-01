import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, Alert, StyleSheet, ActionSheetIOS, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getCow, deleteCow } from '../../services/cattleService';
import { uploadFotoVaca } from '../../services/uploadService';
import type { Cow } from '../../types';
import { colors } from '../../constants/colors';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  saudavel:   { label: 'Ativa',       color: colors.primaryContainer,  bg: colors.onPrimaryContainer },
  ativa:      { label: 'Ativa',       color: colors.primaryContainer,  bg: colors.onPrimaryContainer },
  seca:       { label: 'Seca',        color: colors.textSecondary,     bg: colors.surfaceContainerHighest },
  tratamento: { label: 'Tratamento',  color: colors.error,             bg: colors.errorContainer },
};

export default function CowDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [cow, setCow] = useState<Cow | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    getCow(Number(id))
      .then(res => setCow(res.data))
      .catch(e => Alert.alert('Erro', e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    Alert.alert('Excluir vaca', `Deseja excluir ${cow?.nome}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive', onPress: async () => {
          try { await deleteCow(Number(id)); router.back(); }
          catch (e: any) { Alert.alert('Erro', e.message); }
        },
      },
    ]);
  }

  async function pickAndUpload(source: 'camera' | 'gallery') {
    // Pede permissão
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permissão necessária',
        source === 'camera'
          ? 'Permita o acesso à câmera nas configurações do dispositivo.'
          : 'Permita o acesso à galeria nas configurações do dispositivo.'
      );
      return;
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,        // comprime para 70% — reduz tamanho do upload
          allowsEditing: true,
          aspect: [4, 3],
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
          allowsEditing: true,
          aspect: [4, 3],
        });

    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      const fotoUrl = await uploadFotoVaca(Number(id), result.assets[0].uri);
      setCow(prev => prev ? { ...prev, foto_url: fotoUrl } : prev);
    } catch (e: any) {
      Alert.alert('Erro ao enviar foto', e.message);
    } finally {
      setUploading(false);
    }
  }

  function handleFotoPress() {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancelar', 'Tirar foto', 'Escolher da galeria'], cancelButtonIndex: 0 },
        (i) => { if (i === 1) pickAndUpload('camera'); if (i === 2) pickAndUpload('gallery'); }
      );
    } else {
      Alert.alert('Foto da vaca', 'Escolha uma opção', [
        { text: 'Cancelar', style: 'cancel' },
        { text: '📷 Tirar foto',        onPress: () => pickAndUpload('camera') },
        { text: '🖼️ Escolher da galeria', onPress: () => pickAndUpload('gallery') },
      ]);
    }
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;
  if (!cow) return <Text style={{ padding: 24, color: colors.text }}>Vaca não encontrada.</Text>;

  const st = STATUS_MAP[cow.status_saude?.toLowerCase()] ?? STATUS_MAP['ativa'];

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      {/* Header */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={colors.primaryContainer} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} style={s.deleteBtn}>
          <MaterialIcons name="delete-outline" size={24} color={colors.error} />
        </TouchableOpacity>
      </View>

      {/* Hero com foto */}
      <View style={s.hero}>
        <TouchableOpacity
          style={s.heroImageWrapper}
          onPress={handleFotoPress}
          activeOpacity={0.85}
          disabled={uploading}
        >
          {cow.foto_url ? (
            <Image source={{ uri: cow.foto_url }} style={s.heroImage} resizeMode="cover" />
          ) : (
            <View style={s.heroImagePlaceholder}>
              <MaterialIcons name="agriculture" size={64} color={colors.primaryContainer} />
              <Text style={s.placeholderText}>Toque para adicionar foto</Text>
            </View>
          )}

          {/* Overlay do botão de câmera */}
          <View style={s.cameraOverlay}>
            {uploading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <MaterialIcons name="photo-camera" size={20} color="#fff" />
            )}
          </View>
        </TouchableOpacity>

        {/* Badge de status */}
        <View style={[s.statusBadge, { backgroundColor: st.bg }]}>
          <MaterialIcons name="check-circle" size={14} color={st.color} />
          <Text style={[s.statusText, { color: st.color }]}>{st.label}</Text>
        </View>

        <View style={s.heroInfo}>
          <View>
            <Text style={s.heroTag}>Brinco #{cow.id}</Text>
            <Text style={s.heroName}>{cow.nome}</Text>
          </View>
          <View style={s.heroRight}>
            <Text style={s.heroLabel}>Raça</Text>
            <Text style={s.heroValue}>{cow.raca ?? '—'}</Text>
          </View>
        </View>
      </View>

      {/* Ações rápidas */}
      <View style={s.actionsGrid}>
        <TouchableOpacity style={s.actionPrimary} activeOpacity={0.85}>
          <MaterialIcons name="add-chart" size={28} color={colors.onPrimary} />
          <Text style={s.actionPrimaryText}>Registrar Leite</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.actionSecondary}
          activeOpacity={0.85}
          onPress={() => router.push(`/vacas/edit/${id}`)}
        >
          <MaterialIcons name="edit" size={28} color={colors.secondary} />
          <Text style={s.actionSecondaryText}>Editar</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={s.statsGrid}>
        <View style={[s.statCard, s.statFull]}>
          <View style={s.statHeader}>
            <View>
              <Text style={s.statLabel}>Produção Média</Text>
              <Text style={s.statValueLarge}>28.5L <Text style={s.statUnit}>/dia</Text></Text>
            </View>
            <View style={s.statIcon}>
              <MaterialIcons name="show-chart" size={22} color={colors.primary} />
            </View>
          </View>
          <View style={s.miniChart}>
            {[40, 60, 55, 85, 70, 100, 80].map((h, i) => (
              <View key={i} style={[s.miniBar, {
                height: h * 0.6,
                backgroundColor: i === 5 ? colors.primaryContainer : colors.onPrimaryContainer,
              }]} />
            ))}
          </View>
        </View>

        <View style={s.statCard}>
          <Text style={s.statLabel}>Peso Atual</Text>
          <Text style={s.statValueMd}>{cow.peso ?? '—'} kg</Text>
        </View>

        <View style={s.statCard}>
          <Text style={s.statLabel}>Idade</Text>
          <Text style={s.statValueMd}>{cow.idade ?? '—'} anos</Text>
        </View>
      </View>

      {/* Histórico */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Histórico Recente</Text>
        {[
          { icon: 'vaccines',        bg: colors.errorContainer,          color: colors.error,             title: 'Vacinação Aftosa',  sub: '12 Out 2024' },
          { icon: 'pets',            bg: colors.secondaryContainer,      color: colors.onSecondaryContainer, title: 'Cio Detectado',  sub: '05 Out 2024' },
          { icon: 'monitor-weight',  bg: colors.surfaceContainerHighest, color: colors.textSecondary,     title: 'Pesagem Mensal',    sub: '01 Out 2024' },
        ].map((item, i) => (
          <TouchableOpacity key={i} style={s.historyItem} activeOpacity={0.8}>
            <View style={[s.historyIcon, { backgroundColor: item.bg }]}>
              <MaterialIcons name={item.icon as any} size={22} color={item.color} />
            </View>
            <View style={s.historyInfo}>
              <Text style={s.historyTitle}>{item.title}</Text>
              <Text style={s.historySub}>{item.sub}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.border} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 40 },

  topBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },
  backBtn: { padding: 4 },
  deleteBtn: { padding: 4 },

  hero: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight,
    marginHorizontal: 20, overflow: 'hidden',
  },
  heroImageWrapper: { height: 200, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroImagePlaceholder: {
    flex: 1, backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  placeholderText: { fontSize: 14, color: colors.textSecondary },
  cameraOverlay: {
    position: 'absolute', bottom: 10, right: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  statusBadge: {
    position: 'absolute', top: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
  },
  statusText: { fontSize: 12, fontWeight: '700' },
  heroInfo: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', padding: 16,
  },
  heroTag: { fontSize: 12, fontWeight: '700', color: colors.secondary, letterSpacing: 0.5 },
  heroName: { fontSize: 24, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  heroRight: { alignItems: 'flex-end' },
  heroLabel: { fontSize: 12, color: colors.border },
  heroValue: { fontSize: 15, fontWeight: '700', color: colors.text },

  actionsGrid: { flexDirection: 'row', gap: 12, marginHorizontal: 20, marginTop: 16 },
  actionPrimary: {
    flex: 1, height: 88, backgroundColor: colors.primary, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  actionPrimaryText: { color: colors.onPrimary, fontSize: 14, fontWeight: '600' },
  actionSecondary: {
    flex: 1, height: 88, backgroundColor: colors.surfaceContainerHighest,
    borderRadius: 12, borderWidth: 2, borderColor: colors.secondary,
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  actionSecondaryText: { color: colors.secondary, fontSize: 14, fontWeight: '600' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginHorizontal: 20, marginTop: 16 },
  statCard: {
    flex: 1, minWidth: 140,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight, padding: 14, gap: 6,
  },
  statFull: { width: '100%', flex: 0 },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  statIcon: { padding: 6, backgroundColor: colors.surfaceContainer, borderRadius: 8 },
  statLabel: { fontSize: 12, color: colors.border, fontWeight: '700', letterSpacing: 0.3 },
  statValueLarge: { fontSize: 28, fontWeight: '700', color: colors.primary, letterSpacing: -0.5 },
  statUnit: { fontSize: 14, fontWeight: '400', color: colors.border },
  statValueMd: { fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  miniChart: { flexDirection: 'row', alignItems: 'flex-end', height: 40, gap: 3, marginTop: 4 },
  miniBar: { flex: 1, borderTopLeftRadius: 2, borderTopRightRadius: 2 },

  section: { marginHorizontal: 20, marginTop: 24, gap: 10 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.text, letterSpacing: -0.3, marginBottom: 2 },
  historyItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight, padding: 12,
  },
  historyIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  historyInfo: { flex: 1 },
  historyTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  historySub: { fontSize: 12, color: colors.border, marginTop: 2 },
});
