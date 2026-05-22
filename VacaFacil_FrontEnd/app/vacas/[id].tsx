import { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, Alert, StyleSheet, ActionSheetIOS, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import { getCow, deleteCow } from '../../services/cattleService';
import { uploadFotoVaca } from '../../services/uploadService';
import { deleteReproducao } from '../../services/reproducaoService';
import { deleteMedicamento } from '../../services/medicamentosService';
import { useQuery } from '@tanstack/react-query';
import {
  useProducaoByCow, useReproducao, useEstaEmCarencia, QK,
} from '../../hooks/queries';
import type { Cow, ProductionRecord, ReproducaoEvent } from '../../types';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import ProductionModal from '../../components/ProductionModal';
import ReproducaoModal from '../../components/ReproducaoModal';
import SaudeModal from '../../components/SaudeModal';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  saudavel:   { label: 'Ativa',      color: colors.primaryContainer, bg: colors.onPrimaryContainer },
  ativa:      { label: 'Ativa',      color: colors.primaryContainer, bg: colors.onPrimaryContainer },
  seca:       { label: 'Seca',       color: colors.textSecondary,    bg: colors.surfaceContainerHighest },
  tratamento: { label: 'Tratamento', color: colors.error,            bg: colors.errorContainer },
};

const REPRO_ICON: Record<string, React.ComponentProps<typeof MaterialIcons>['name']> = {
  inseminação: 'science',
  inseminacao: 'science',
  parto:       'child-friendly',
  diagnóstico: 'medical-services',
  diagnostico: 'medical-services',
  cio:         'favorite',
  secagem:     'water-drop',
};

type TimelineEntry =
  | { kind: 'production'; data: ProductionRecord }
  | { kind: 'repro';      data: ReproducaoEvent };

function fmtDate(s: string) {
  const [, m, d] = s.split('-');
  return `${d}/${m}`;
}

function fmtFull(s: string) {
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}

export default function CowDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cowId = Number(id);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [uploading, setUploading] = useState(false);
  const [prodModal, setProdModal] = useState(false);
  const [reproModal, setReproModal] = useState(false);
  const [saudeModal, setSaudeModal] = useState(false);
  const [editingRepro, setEditingRepro] = useState<ReproducaoEvent | null>(null);

  const { data: cow, isLoading: cowLoading } = useQuery<Cow>({
    queryKey: ['cow', cowId],
    queryFn: () => getCow(cowId).then(r => r.data),
    enabled: cowId > 0,
  });

  const { data: producaoData = [], isLoading: prodLoading } = useProducaoByCow(cowId);
  const { data: reproData = [], isLoading: reproLoading } = useReproducao(cowId);
  const { emCarencia, tratamento, isLoading: carenciaLoading } = useEstaEmCarencia(cowId);

  const avgLitros = useMemo(() => {
    if (!producaoData.length) return null;
    return producaoData.reduce((s, r) => s + (r.litros ?? 0), 0) / producaoData.length;
  }, [producaoData]);

  // Previsão de parto: último evento "Inseminação" + 283 dias
  const partoPrevisto = useMemo(() => {
    const insem = [...reproData]
      .filter(e => e.tipo_evento?.toLowerCase().includes('insemina'))
      .sort((a, b) => b.data.localeCompare(a.data))[0];
    if (!insem) return null;
    const [y, m, d] = insem.data.split('-').map(Number);
    const partoDate = new Date(y, m - 1, d + 283);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dias = Math.ceil((partoDate.getTime() - hoje.getTime()) / 86_400_000);
    return { dias, data: partoDate.toLocaleDateString('pt-BR') };
  }, [reproData]);

  const timeline: TimelineEntry[] = useMemo(() => {
    const prod: TimelineEntry[] = producaoData.map(d => ({ kind: 'production', data: d }));
    const repro: TimelineEntry[] = reproData.map(d => ({ kind: 'repro', data: d }));
    return [...prod, ...repro].sort((a, b) => b.data.data.localeCompare(a.data.data));
  }, [producaoData, reproData]);

  const loading = cowLoading || prodLoading || reproLoading || carenciaLoading;

  async function handleDelete() {
    Alert.alert('Excluir vaca', `Deseja excluir ${cow?.nome}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive', onPress: async () => {
          try { await deleteCow(cowId); router.back(); }
          catch (e: any) { Alert.alert('Erro', e.message); }
        },
      },
    ]);
  }

  async function pickAndUpload(source: 'camera' | 'gallery') {
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Permita o acesso nas configurações do dispositivo.');
      return;
    }
    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, allowsEditing: true, aspect: [4, 3] })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, allowsEditing: true, aspect: [4, 3] });
    if (result.canceled || !result.assets[0]) return;
    setUploading(true);
    try {
      await uploadFotoVaca(cowId, result.assets[0].uri);
      queryClient.invalidateQueries({ queryKey: ['cow', cowId] });
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
        { text: '📷 Tirar foto', onPress: () => pickAndUpload('camera') },
        { text: '🖼️ Galeria',   onPress: () => pickAndUpload('gallery') },
      ]);
    }
  }

  async function handleRemoverCarencia() {
    if (!tratamento) return;
    Alert.alert('Encerrar tratamento', `Remover "${tratamento.nome_medicamento}" e liberar o leite?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive', onPress: async () => {
          try {
            await deleteMedicamento(tratamento.id);
            queryClient.invalidateQueries({ queryKey: [...QK.carencia, cowId] });
          } catch (e: any) {
            Alert.alert('Erro', e.message);
          }
        },
      },
    ]);
  }

  function handleEditRepro(event: ReproducaoEvent) {
    setEditingRepro(event);
    setReproModal(true);
  }

  async function handleDeleteRepro(event: ReproducaoEvent) {
    Alert.alert('Remover evento', `Remover "${event.tipo_evento}" de ${fmtFull(event.data)}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive', onPress: async () => {
          try {
            await deleteReproducao(event.id);
            queryClient.invalidateQueries({ queryKey: [...QK.reproducao, cowId] });
            queryClient.invalidateQueries({ queryKey: QK.reproProx });
          } catch (e: any) {
            Alert.alert('Erro', e.message);
          }
        },
      },
    ]);
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;
  if (!cow) return <Text style={{ padding: 24, color: colors.text }}>Vaca não encontrada.</Text>;

  const st = STATUS_MAP[cow.status_saude?.toLowerCase()] ?? STATUS_MAP['ativa'];

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>

      {/* Barra superior */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.topBtn}>
          <MaterialIcons name="arrow-back" size={24} color={colors.primaryContainer} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} style={s.topBtn}>
          <MaterialIcons name="delete-outline" size={24} color={colors.error} />
        </TouchableOpacity>
      </View>

      {/* Hero */}
      <View style={s.hero}>
        <TouchableOpacity style={s.heroImgWrapper} onPress={handleFotoPress} activeOpacity={0.85} disabled={uploading}>
          {cow.foto_url ? (
            <Image source={{ uri: cow.foto_url }} style={s.heroImg} resizeMode="cover" />
          ) : (
            <View style={s.heroImgPlaceholder}>
              <MaterialIcons name="agriculture" size={64} color={colors.primaryContainer} />
              <Text style={s.placeholderTxt}>Toque para adicionar foto</Text>
            </View>
          )}
          <View style={s.cameraOverlay}>
            {uploading
              ? <ActivityIndicator color="#fff" size="small" />
              : <MaterialIcons name="photo-camera" size={20} color="#fff" />}
          </View>
        </TouchableOpacity>

        <View style={[s.statusBadge, { backgroundColor: st.bg }]}>
          <MaterialIcons name="check-circle" size={14} color={st.color} />
          <Text style={[s.statusTxt, { color: st.color }]}>{st.label}</Text>
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

      {/* Banner de carência ativa */}
      {emCarencia && tratamento && (
        <View style={s.carenciaBanner}>
          <MaterialIcons name="medication" size={20} color={colors.error} />
          <View style={s.carenciaInfo}>
            <Text style={s.carenciaTitulo}>EM CARÊNCIA — LEITE DESCARTÁVEL</Text>
            <Text style={s.carenciaDetalhe}>
              {tratamento.nome_medicamento} · liberado em{' '}
              {new Date(tratamento.data_fim_carencia + 'T00:00:00').toLocaleDateString('pt-BR')}
            </Text>
          </View>
          <TouchableOpacity onPress={handleRemoverCarencia} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name="close" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      )}

      {/* Ações rápidas */}
      <View style={s.actionsGrid}>
        <TouchableOpacity style={s.actionPrimary} activeOpacity={0.85} onPress={() => setProdModal(true)}>
          <MaterialIcons name="water-drop" size={26} color={colors.onPrimary} />
          <Text style={s.actionPrimaryTxt}>Registrar Leite</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionSecondary} activeOpacity={0.85} onPress={() => { setEditingRepro(null); setReproModal(true); }}>
          <MaterialIcons name="favorite" size={26} color={colors.secondary} />
          <Text style={s.actionSecondaryTxt}>Evento Reprod.</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.actionOutline, emCarencia && s.actionOutlineDanger]}
          activeOpacity={0.85}
          onPress={() => setSaudeModal(true)}
        >
          <MaterialIcons name="medication" size={22} color={emCarencia ? colors.error : colors.textSecondary} />
          <Text style={[s.actionOutlineTxt, emCarencia && { color: colors.error }]}>
            {emCarencia ? 'Carência' : 'Tratamento'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionOutlineSmall} activeOpacity={0.85} onPress={() => router.push(`/vacas/edit/${id}`)}>
          <MaterialIcons name="edit" size={20} color={colors.textSecondary} />
          <Text style={s.actionOutlineTxt}>Editar</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={s.statsGrid}>
        <View style={[s.statCard, s.statFull]}>
          <View style={s.statHeader}>
            <View>
              <Text style={s.statLabel}>Produção Média</Text>
              <Text style={s.statValueLarge}>
                {avgLitros !== null ? `${avgLitros.toFixed(1)}L` : '—'}
                {avgLitros !== null && <Text style={s.statUnit}> /dia</Text>}
              </Text>
            </View>
            <View style={s.statIcon}>
              <MaterialIcons name="show-chart" size={22} color={colors.primary} />
            </View>
          </View>
          {avgLitros === null && (
            <Text style={s.statEmptyHint}>Registre produções para ver a média.</Text>
          )}
        </View>

        <View style={s.statCard}>
          <Text style={s.statLabel}>Peso</Text>
          <Text style={s.statValueMd}>{cow.peso != null ? `${cow.peso} kg` : '—'}</Text>
        </View>

        <View style={s.statCard}>
          <Text style={s.statLabel}>Idade</Text>
          <Text style={s.statValueMd}>{cow.idade != null ? `${cow.idade} anos` : '—'}</Text>
        </View>
      </View>

      {/* Previsão de Parto */}
      {partoPrevisto !== null && (
        <View style={[s.partoCard, partoPrevisto.dias < 0 && s.partoCardVencido]}>
          <View style={s.partoLeft}>
            <MaterialIcons
              name="child-friendly"
              size={28}
              color={partoPrevisto.dias < 0 ? colors.error : colors.secondary}
            />
          </View>
          <View style={s.partoInfo}>
            <Text style={s.partoLabel}>PARTO PREVISTO</Text>
            <Text style={[s.partoDias, partoPrevisto.dias < 0 && s.partoDiasVencido]}>
              {partoPrevisto.dias < 0
                ? `Atrasado ${Math.abs(partoPrevisto.dias)} dias`
                : partoPrevisto.dias === 0
                  ? 'Hoje!'
                  : `Em ${partoPrevisto.dias} dias`}
            </Text>
            <Text style={s.partoData}>{partoPrevisto.data}</Text>
          </View>
        </View>
      )}

      {/* Linha do Tempo */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Linha do Tempo</Text>
          <Text style={s.sectionSub}>{timeline.length} registros</Text>
        </View>

        {timeline.length === 0 ? (
          <View style={s.timelineEmpty}>
            <MaterialIcons name="timeline" size={36} color={colors.borderLight} />
            <Text style={s.timelineEmptyTxt}>Nenhum registro ainda.</Text>
            <Text style={s.timelineEmptyHint}>Registre leite ou um evento reprodutivo para começar.</Text>
          </View>
        ) : (
          <View style={s.timeline}>
            {timeline.map((entry, idx) => {
              const isLast = idx === timeline.length - 1;

              if (entry.kind === 'production') {
                const rec = entry.data;
                return (
                  <View key={`p-${rec.id}`} style={s.tlRow}>
                    <View style={s.tlLeft}>
                      <View style={[s.tlDot, s.tlDotProd]}>
                        <MaterialIcons name="water-drop" size={12} color={colors.onPrimary} />
                      </View>
                      {!isLast && <View style={s.tlLine} />}
                    </View>
                    <View style={[s.tlCard, s.tlCardProd]}>
                      <View style={s.tlCardRow}>
                        <View style={s.tlCardLeft}>
                          <Text style={s.tlDate}>{fmtDate(rec.data)}</Text>
                          <Text style={s.tlTitle}>Produção de leite</Text>
                          {rec.observacoes ? <Text style={s.tlObs}>{rec.observacoes}</Text> : null}
                        </View>
                        <Text style={s.tlValueProd}>{rec.litros}L</Text>
                      </View>
                    </View>
                  </View>
                );
              }

              const evt = entry.data;
              const iconName = REPRO_ICON[evt.tipo_evento?.toLowerCase()] ?? 'event';
              return (
                <View key={`r-${evt.id}`} style={s.tlRow}>
                  <View style={s.tlLeft}>
                    <View style={[s.tlDot, s.tlDotRepro]}>
                      <MaterialIcons name={iconName} size={12} color={colors.onPrimary} />
                    </View>
                    {!isLast && <View style={s.tlLine} />}
                  </View>
                  <View style={[s.tlCard, s.tlCardRepro]}>
                    <View style={s.tlCardRow}>
                      <View style={s.tlCardLeft}>
                        <Text style={s.tlDate}>{fmtDate(evt.data)}</Text>
                        <Text style={s.tlTitle}>{evt.tipo_evento}</Text>
                        {evt.observacoes ? <Text style={s.tlObs}>{evt.observacoes}</Text> : null}
                      </View>
                      <View style={s.tlActions}>
                        <TouchableOpacity
                          onPress={() => handleEditRepro(evt)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <MaterialIcons name="edit" size={14} color={colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteRepro(evt)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <MaterialIcons name="close" size={14} color={colors.textTertiary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <ProductionModal
        visible={prodModal}
        onClose={() => setProdModal(false)}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: [...QK.producaoCow, cowId] });
          setProdModal(false);
        }}
        preSelectedCowId={cowId}
        preSelectedCowName={cow.nome}
      />

      <SaudeModal
        visible={saudeModal}
        onClose={() => setSaudeModal(false)}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: [...QK.carencia, cowId] });
          setSaudeModal(false);
        }}
        cowId={cowId}
        cowName={cow.nome}
      />

      <ReproducaoModal
        visible={reproModal}
        onClose={() => { setReproModal(false); setEditingRepro(null); }}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: [...QK.reproducao, cowId] });
          queryClient.invalidateQueries({ queryKey: QK.reproProx });
          setReproModal(false);
          setEditingRepro(null);
        }}
        cowId={cowId}
        cowName={cow.nome}
        editing={editingRepro}
      />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 48 },

  topBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },
  topBtn: { padding: 4 },

  hero: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight,
    marginHorizontal: 20, overflow: 'hidden',
  },
  heroImgWrapper: { height: 200, position: 'relative' },
  heroImg: { width: '100%', height: '100%' },
  heroImgPlaceholder: {
    flex: 1, backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  placeholderTxt: { fontSize: 14, color: colors.textSecondary },
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
  statusTxt: { fontSize: 12, fontWeight: '700', fontFamily: fonts.bold },
  heroInfo: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', padding: 16,
  },
  heroTag: { fontSize: 12, fontWeight: '700', fontFamily: fonts.bold, color: colors.secondary, letterSpacing: 0.5 },
  heroName: { fontSize: 24, fontWeight: '700', fontFamily: fonts.bold, color: colors.text, letterSpacing: -0.3 },
  heroRight: { alignItems: 'flex-end' },
  heroLabel: { fontSize: 12, color: colors.border },
  heroValue: { fontSize: 15, fontWeight: '700', fontFamily: fonts.bold, color: colors.text },

  carenciaBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 20, marginTop: 12,
    backgroundColor: colors.errorContainer,
    borderRadius: 10, borderWidth: 1.5, borderColor: colors.error,
    padding: 12,
  },
  carenciaInfo: { flex: 1 },
  carenciaTitulo: { fontSize: 11, fontWeight: '700', fontFamily: fonts.bold, color: colors.error, letterSpacing: 0.5 },
  carenciaDetalhe: { fontSize: 13, color: colors.text, marginTop: 1 },

  actionsGrid: { flexDirection: 'row', gap: 8, marginHorizontal: 20, marginTop: 16 },
  actionPrimary: {
    flex: 1, height: 72, backgroundColor: colors.primary, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  actionPrimaryTxt: { color: colors.onPrimary, fontSize: 12, fontWeight: '600', fontFamily: fonts.semiBold },
  actionSecondary: {
    flex: 1, height: 72, backgroundColor: colors.surfaceContainerHighest,
    borderRadius: 12, borderWidth: 2, borderColor: colors.secondary,
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  actionSecondaryTxt: { color: colors.secondary, fontSize: 12, fontWeight: '600', fontFamily: fonts.semiBold },
  actionOutline: {
    width: 72, height: 72, backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight,
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  actionOutlineDanger: { borderColor: colors.error, backgroundColor: colors.errorContainer },
  actionOutlineSmall: {
    width: 60, height: 72, backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight,
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  actionOutlineTxt: { color: colors.textSecondary, fontSize: 11, fontWeight: '600', fontFamily: fonts.semiBold },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginHorizontal: 20, marginTop: 16 },
  statCard: {
    flex: 1, minWidth: 140,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight, padding: 14, gap: 6,
  },
  statFull: { width: '100%', flex: 0 },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  statIcon: { padding: 6, backgroundColor: colors.surfaceContainer, borderRadius: 8 },
  statLabel: { fontSize: 12, color: colors.border, fontWeight: '700', fontFamily: fonts.bold, letterSpacing: 0.3 },
  statValueLarge: { fontSize: 28, fontWeight: '700', fontFamily: fonts.bold, color: colors.primary, letterSpacing: -0.5 },
  statUnit: { fontSize: 14, fontWeight: '400', fontFamily: fonts.regular, color: colors.border },
  statValueMd: { fontSize: 22, fontWeight: '700', fontFamily: fonts.bold, color: colors.text, letterSpacing: -0.3 },
  statEmptyHint: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },

  partoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: 20, marginTop: 16,
    backgroundColor: colors.onPrimaryContainer,
    borderRadius: 12, borderWidth: 1.5, borderColor: colors.secondary,
    padding: 16,
  },
  partoCardVencido: {
    backgroundColor: colors.errorContainer,
    borderColor: colors.error,
  },
  partoLeft: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: 'center', justifyContent: 'center',
  },
  partoInfo: { flex: 1, gap: 2 },
  partoLabel: { fontSize: 11, fontWeight: '700', fontFamily: fonts.bold, color: colors.textSecondary, letterSpacing: 0.5 },
  partoDias: { fontSize: 20, fontWeight: '700', fontFamily: fonts.bold, color: colors.secondary, letterSpacing: -0.3 },
  partoDiasVencido: { color: colors.error },
  partoData: { fontSize: 13, color: colors.textSecondary },

  section: { marginHorizontal: 20, marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', fontFamily: fonts.bold, color: colors.text, letterSpacing: -0.3 },
  sectionSub: { fontSize: 12, color: colors.textTertiary },

  timelineEmpty: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  timelineEmptyTxt: { fontSize: 15, color: colors.textSecondary },
  timelineEmptyHint: { fontSize: 13, color: colors.textTertiary, textAlign: 'center' },

  timeline: { gap: 0 },

  tlRow: { flexDirection: 'row', gap: 12 },
  tlLeft: { alignItems: 'center', width: 28 },
  tlDot: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 1,
  },
  tlDotProd:  { backgroundColor: colors.primary },
  tlDotRepro: { backgroundColor: colors.secondary },
  tlLine: { flex: 1, width: 2, backgroundColor: colors.borderLight, marginVertical: 2 },

  tlCard: {
    flex: 1, borderRadius: 10, borderWidth: 1,
    padding: 12, marginBottom: 10,
  },
  tlCardProd:  { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.borderLight },
  tlCardRepro: { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.borderLight },

  tlCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  tlCardLeft: { flex: 1, gap: 2 },
  tlDate: { fontSize: 11, fontWeight: '700', fontFamily: fonts.bold, color: colors.textTertiary, letterSpacing: 0.3 },
  tlTitle: { fontSize: 14, fontWeight: '600', fontFamily: fonts.semiBold, color: colors.text },
  tlObs: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  tlValueProd: { fontSize: 18, fontWeight: '700', fontFamily: fonts.bold, color: colors.primary, letterSpacing: -0.3 },
  tlDeleteBtn: { padding: 2 },
  tlActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
});
