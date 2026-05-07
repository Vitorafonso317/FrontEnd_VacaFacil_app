import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ActionSheetIOS,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getCow, deleteCow } from '../../services/cattleService';
import { createProduction, getProduction } from '../../services/productionService';
import { uploadFotoVaca } from '../../services/uploadService';
import type { Cow, ProductionRecord } from '../../types';
import { colors } from '../../constants/colors';

const today = new Date().toISOString().slice(0, 10);

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  saudavel: { label: 'Ativa', color: colors.primaryContainer, bg: colors.onPrimaryContainer },
  ativa: { label: 'Ativa', color: colors.primaryContainer, bg: colors.onPrimaryContainer },
  seca: { label: 'Seca', color: colors.textSecondary, bg: colors.surfaceContainerHighest },
  tratamento: { label: 'Tratamento', color: colors.error, bg: colors.errorContainer },
};

export default function CowDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [cow, setCow] = useState<Cow | null>(null);
  const [production, setProduction] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [productionModalVisible, setProductionModalVisible] = useState(false);
  const [savingProduction, setSavingProduction] = useState(false);
  const [productionForm, setProductionForm] = useState({ data: today, litros: '', observacoes: '' });

  async function load() {
    setLoading(true);
    try {
      const [cowRes, productionRes] = await Promise.all([getCow(Number(id)), getProduction(1, 100)]);
      setCow(cowRes.data);
      setProduction(productionRes.data.filter(record => record.vaca_id === Number(id)));
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function reloadProduction() {
    const productionRes = await getProduction(1, 100);
    setProduction(productionRes.data.filter(record => record.vaca_id === Number(id)));
  }

  async function handleDelete() {
    async function remove() {
      try {
        await deleteCow(Number(id));
        router.back();
      } catch (e: any) {
        Alert.alert('Erro', e.message);
      }
    }

    if (Platform.OS === 'web') {
      if (window.confirm(`Deseja excluir ${cow?.nome}?`)) {
        await remove();
      }
      return;
    }

    Alert.alert('Excluir vaca', `Deseja excluir ${cow?.nome}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: remove,
      },
    ]);
  }

  async function pickAndUpload(source: 'camera' | 'gallery') {
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permissao necessaria', 'Permita o acesso nas configuracoes do dispositivo.');
      return;
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, allowsEditing: true, aspect: [4, 3] })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, allowsEditing: true, aspect: [4, 3] });

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
      return;
    }

    Alert.alert('Foto da vaca', 'Escolha uma opcao', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Tirar foto', onPress: () => pickAndUpload('camera') },
      { text: 'Escolher da galeria', onPress: () => pickAndUpload('gallery') },
    ]);
  }

  function openProductionModal() {
    setProductionForm({ data: today, litros: '', observacoes: '' });
    setProductionModalVisible(true);
  }

  async function handleCreateProduction() {
    const litros = Number(productionForm.litros.replace(',', '.'));

    if (!productionForm.data || !productionForm.litros) {
      return Alert.alert('Preencha data e litros');
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(productionForm.data)) {
      return Alert.alert('Data invalida', 'Use o formato YYYY-MM-DD.');
    }

    if (!Number.isFinite(litros) || litros <= 0) {
      return Alert.alert('Litros invalido', 'Informe uma quantidade maior que zero.');
    }

    setSavingProduction(true);
    try {
      await createProduction({
        vaca_id: Number(id),
        data: productionForm.data,
        litros,
        observacoes: productionForm.observacoes.trim() || undefined,
      });
      setProductionModalVisible(false);
      await reloadProduction();
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setSavingProduction(false);
    }
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;
  if (!cow) return <Text style={{ padding: 24, color: colors.text }}>Vaca nao encontrada.</Text>;

  const st = STATUS_MAP[cow.status_saude?.toLowerCase()] ?? STATUS_MAP.ativa;
  const totalLitros = production.reduce((sum, record) => sum + Number(record.litros || 0), 0);
  const media = production.length > 0 ? totalLitros / production.length : 0;
  const recentProduction = production.slice(0, 3);
  const chartBars = production.length
    ? production.slice(0, 7).map(record => Math.min(100, Math.max(20, Number(record.litros || 0) * 4)))
    : [20, 20, 20];

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.iconButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.primaryContainer} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} style={s.iconButton}>
          <MaterialIcons name="delete-outline" size={24} color={colors.error} />
        </TouchableOpacity>
      </View>

      <View style={s.hero}>
        <TouchableOpacity style={s.heroImageWrapper} onPress={handleFotoPress} activeOpacity={0.85} disabled={uploading}>
          {cow.foto_url ? (
            <Image source={{ uri: cow.foto_url }} style={s.heroImage} resizeMode="cover" />
          ) : (
            <View style={s.heroImagePlaceholder}>
              <MaterialIcons name="agriculture" size={64} color={colors.primaryContainer} />
              <Text style={s.placeholderText}>Toque para adicionar foto</Text>
            </View>
          )}
          <View style={s.cameraOverlay}>
            {uploading ? <ActivityIndicator color="#fff" size="small" /> : <MaterialIcons name="photo-camera" size={20} color="#fff" />}
          </View>
        </TouchableOpacity>

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
            <Text style={s.heroLabel}>Raca</Text>
            <Text style={s.heroValue}>{cow.raca ?? '-'}</Text>
          </View>
        </View>
      </View>

      <View style={s.actionsGrid}>
        <TouchableOpacity style={s.actionPrimary} activeOpacity={0.85} onPress={openProductionModal}>
          <MaterialIcons name="add-chart" size={28} color={colors.onPrimary} />
          <Text style={s.actionPrimaryText}>Registrar Leite</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionSecondary} activeOpacity={0.85} onPress={() => router.push(`/vacas/edit/${id}`)}>
          <MaterialIcons name="edit" size={28} color={colors.secondary} />
          <Text style={s.actionSecondaryText}>Editar</Text>
        </TouchableOpacity>
      </View>

      <View style={s.statsGrid}>
        <View style={[s.statCard, s.statFull]}>
          <View style={s.statHeader}>
            <View>
              <Text style={s.statLabel}>Producao Media</Text>
              <Text style={s.statValueLarge}>{media.toFixed(1)}L <Text style={s.statUnit}>/registro</Text></Text>
            </View>
            <View style={s.statIcon}>
              <MaterialIcons name="show-chart" size={22} color={colors.primary} />
            </View>
          </View>
          <View style={s.miniChart}>
            {chartBars.map((h, i) => (
              <View key={i} style={[s.miniBar, { height: h * 0.6, backgroundColor: colors.onPrimaryContainer }]} />
            ))}
          </View>
        </View>

        <View style={s.statCard}>
          <Text style={s.statLabel}>Peso Atual</Text>
          <Text style={s.statValueMd}>{cow.peso ?? '-'} kg</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statLabel}>Idade</Text>
          <Text style={s.statValueMd}>{cow.idade ?? '-'} anos</Text>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Historico Recente</Text>
        {recentProduction.length === 0 ? (
          <View style={s.historyItem}>
            <View style={[s.historyIcon, { backgroundColor: colors.surfaceContainerHighest }]}>
              <MaterialIcons name="show-chart" size={22} color={colors.textSecondary} />
            </View>
            <View style={s.historyInfo}>
              <Text style={s.historyTitle}>Nenhuma producao registrada</Text>
              <Text style={s.historySub}>Use Registrar Leite para iniciar</Text>
            </View>
          </View>
        ) : recentProduction.map(item => (
          <View key={item.id} style={s.historyItem}>
            <View style={[s.historyIcon, { backgroundColor: colors.onPrimaryContainer }]}>
              <MaterialIcons name="water-drop" size={22} color={colors.primary} />
            </View>
            <View style={s.historyInfo}>
              <Text style={s.historyTitle}>{item.litros}L registrados</Text>
              <Text style={s.historySub}>{item.data}</Text>
            </View>
          </View>
        ))}
      </View>

      <Modal visible={productionModalVisible} transparent animationType="fade" onRequestClose={() => setProductionModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Registrar Leite</Text>
              <TouchableOpacity style={s.iconBtn} onPress={() => setProductionModalVisible(false)}>
                <MaterialIcons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={s.inputLabel}>Data</Text>
            <TextInput style={s.input} value={productionForm.data} onChangeText={data => setProductionForm(prev => ({ ...prev, data }))} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textTertiary} />

            <Text style={s.inputLabel}>Litros</Text>
            <TextInput style={s.input} value={productionForm.litros} onChangeText={litros => setProductionForm(prev => ({ ...prev, litros }))} placeholder="Ex: 18.5" placeholderTextColor={colors.textTertiary} keyboardType="decimal-pad" />

            <Text style={s.inputLabel}>Observacoes</Text>
            <TextInput style={[s.input, s.inputMultiline]} value={productionForm.observacoes} onChangeText={observacoes => setProductionForm(prev => ({ ...prev, observacoes }))} placeholder="Opcional" placeholderTextColor={colors.textTertiary} multiline />

            <TouchableOpacity style={[s.saveBtn, savingProduction && s.saveBtnDisabled]} onPress={handleCreateProduction} disabled={savingProduction}>
              {savingProduction ? <ActivityIndicator color={colors.onPrimary} /> : (
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
  content: { paddingBottom: 40 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  iconButton: { padding: 4 },
  hero: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight, marginHorizontal: 20, overflow: 'hidden' },
  heroImageWrapper: { height: 200, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroImagePlaceholder: { flex: 1, backgroundColor: colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center', gap: 8 },
  placeholderText: { fontSize: 14, color: colors.textSecondary },
  cameraOverlay: { position: 'absolute', bottom: 10, right: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  statusBadge: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 12, fontWeight: '700' },
  heroInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', padding: 16 },
  heroTag: { fontSize: 12, fontWeight: '700', color: colors.secondary, letterSpacing: 0.5 },
  heroName: { fontSize: 24, fontWeight: '700', color: colors.text },
  heroRight: { alignItems: 'flex-end' },
  heroLabel: { fontSize: 12, color: colors.border },
  heroValue: { fontSize: 15, fontWeight: '700', color: colors.text },
  actionsGrid: { flexDirection: 'row', gap: 12, marginHorizontal: 20, marginTop: 16 },
  actionPrimary: { flex: 1, height: 88, backgroundColor: colors.primary, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 6 },
  actionPrimaryText: { color: colors.onPrimary, fontSize: 14, fontWeight: '600' },
  actionSecondary: { flex: 1, height: 88, backgroundColor: colors.surfaceContainerHighest, borderRadius: 12, borderWidth: 2, borderColor: colors.secondary, alignItems: 'center', justifyContent: 'center', gap: 6 },
  actionSecondaryText: { color: colors.secondary, fontSize: 14, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginHorizontal: 20, marginTop: 16 },
  statCard: { flex: 1, minWidth: 140, backgroundColor: colors.surfaceContainerLowest, borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight, padding: 14, gap: 6 },
  statFull: { width: '100%', flex: 0 },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  statIcon: { padding: 6, backgroundColor: colors.surfaceContainer, borderRadius: 8 },
  statLabel: { fontSize: 12, color: colors.border, fontWeight: '700', letterSpacing: 0.3 },
  statValueLarge: { fontSize: 28, fontWeight: '700', color: colors.primary },
  statUnit: { fontSize: 14, fontWeight: '400', color: colors.border },
  statValueMd: { fontSize: 22, fontWeight: '700', color: colors.text },
  miniChart: { flexDirection: 'row', alignItems: 'flex-end', height: 40, gap: 3, marginTop: 4 },
  miniBar: { flex: 1, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  section: { marginHorizontal: 20, marginTop: 24, gap: 10 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 2 },
  historyItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surfaceContainerLowest, borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight, padding: 12 },
  historyIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  historyInfo: { flex: 1 },
  historyTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  historySub: { fontSize: 12, color: colors.border, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.surfaceContainerLowest, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, gap: 10 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  inputLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginTop: 4 },
  input: { height: 48, borderWidth: 1, borderColor: colors.borderLight, borderRadius: 8, paddingHorizontal: 12, color: colors.text, backgroundColor: colors.surfaceContainerLowest },
  inputMultiline: { height: 76, paddingTop: 12, textAlignVertical: 'top' },
  saveBtn: { marginTop: 8, height: 52, borderRadius: 8, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveBtnDisabled: { opacity: 0.7 },
  saveText: { color: colors.onPrimary, fontSize: 16, fontWeight: '700' },
});
