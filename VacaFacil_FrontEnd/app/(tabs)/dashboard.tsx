import { useMemo, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useDashboard, useVacas, useProximasTarefas, usePartosProximos, useAnomalias, useCarencia, useRefreshOnFocus, QK } from '../../hooks/queries';
import type { Anomalia } from '../../hooks/queries';
import type { Medicamento } from '../../types';
import { scheduleCarenciaFim } from '../../services/notificationService';
import { scheduleEventReminders, schedulePartoPrevisto } from '../../services/notificationService';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { formatCurrency } from '../../utils';
import Sparkline from '../../components/Sparkline';

const DAYS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'];

const EVENTO_ICON: Record<string, 'science' | 'child-friendly' | 'medical-services' | 'event'> = {
  inseminação: 'science',
  inseminacao: 'science',
  parto: 'child-friendly',
  diagnóstico: 'medical-services',
  diagnostico: 'medical-services',
};

function getDaysLeft(dateStr: string) {
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
  return diff <= 0 ? 'Hoje' : diff === 1 ? '1 dia' : `${diff} dias`;
}

function fmtDate(dateStr: string) {
  const [, m, d] = dateStr.split('-');
  return `${d}/${m}`;
}

function buildBarHeights(mediaDiaria: number): number[] {
  if (mediaDiaria === 0) return [40, 45, 42, 50, 55, 58, 56];
  const base = mediaDiaria;
  const past = [0.88, 0.92, 0.85, 0.95, 1.0].map(f => base * f);
  const forecast = [1.03, 1.06, 1.04].map(f => base * f);
  const all = [...past, ...forecast];
  const max = Math.max(...all);
  return all.map(v => Math.round((v / max) * 90) + 10);
}

function SkeletonBox({ width, height }: { width: number | string; height: number }) {
  return (
    <View style={[s.skeleton, { width: width as any, height, borderRadius: 8 }]} />
  );
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const { data: stats, isLoading: loading, isFetching, refetch } = useDashboard(!authLoading);
  const { data: tarefas = [] } = useProximasTarefas();
  const { data: vacas = [] } = useVacas();
  const { data: partosProximos = [] } = usePartosProximos();
  const { data: anomalias = [] } = useAnomalias();
  const { data: carencias = [] } = useCarencia();
  useRefreshOnFocus(QK.dashboard);

  const vacaMap = useMemo(() => {
    const map: Record<number, string> = {};
    (vacas as any[]).forEach(v => { map[v.id] = v.nome; });
    return map;
  }, [vacas]);

  useEffect(() => {
    if (tarefas.length > 0) scheduleEventReminders(tarefas as any[]);
  }, [tarefas]);

  useEffect(() => {
    if (carencias.length > 0) scheduleCarenciaFim(carencias as Medicamento[]);
  }, [carencias]);

  useEffect(() => {
    if (partosProximos.length === 0) return;
    const insems = partosProximos.map(p => ({
      id: p.id,
      vaca_nome: vacaMap[p.vaca_id] ?? `Vaca #${p.vaca_id}`,
      data: p.insemData,
    }));
    schedulePartoPrevisto(insems);
  }, [partosProximos, vacaMap]);

  const barHeights = stats ? buildBarHeights(stats.producao.media_diaria) : null;
  const ultimasVacas = stats?.relatorio.registros.slice(0, 2) ?? [];

  const spark7days = useMemo(() => {
    if (!stats?.relatorio.registros) return [];
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const iso = d.toISOString().split('T')[0];
      return stats.relatorio.registros
        .filter(r => r.data === iso)
        .reduce((sum, r) => sum + (r.litros ?? 0), 0);
    });
  }, [stats]);
  const saldoAtual = stats?.financeiro?.saldo ?? 0;
  const variacaoProducao = stats && stats.producao.base_registros > 1
    ? (((stats.producao.previsao_proximos_7_dias / 7) - stats.producao.media_diaria) / stats.producao.media_diaria * 100).toFixed(1)
    : null;

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.content}
      refreshControl={
        <RefreshControl
          refreshing={isFetching}
          onRefresh={refetch}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      <View style={s.welcome}>
        <Text style={s.welcomeTitle}>Olá, {user?.nome ?? 'Produtor'}!</Text>
        <Text style={s.welcomeSub}>Confira o desempenho da sua fazenda hoje.</Text>
      </View>

      <View style={s.bentoGrid}>
        <TouchableOpacity
          style={[s.card, s.cardFull]}
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/producao')}
        >
          <View style={s.cardRow}>
            <View>
              <Text style={s.cardLabel}>PRODUÇÃO DIÁRIA</Text>
              {loading ? (
                <View style={{ gap: 10 }}>
                  <SkeletonBox width={120} height={36} />
                  <SkeletonBox width="100%" height={36} />
                </View>
              ) : (
                <>
                  <View style={s.valueRow}>
                    <Text style={s.valueLarge}>
                      {stats?.producao.media_diaria.toFixed(1) ?? '—'}
                    </Text>
                    <Text style={s.valueUnit}>L/dia</Text>
                  </View>
                  {spark7days.some(v => v > 0) && (
                    <Sparkline data={spark7days} height={36} />
                  )}
                </>
              )}
            </View>
            <View style={s.iconBox}>
              <MaterialIcons name="show-chart" size={28} color={colors.primary} />
            </View>
          </View>
          <View style={s.trendRow}>
            <MaterialIcons
              name={variacaoProducao && Number(variacaoProducao) >= 0 ? 'trending-up' : 'trending-down'}
              size={16}
              color={variacaoProducao && Number(variacaoProducao) >= 0 ? colors.primary : colors.error}
            />
            {loading ? (
              <SkeletonBox width={160} height={12} />
            ) : (
              <Text style={[
                s.trendText,
                variacaoProducao && Number(variacaoProducao) < 0 && { color: colors.error },
              ]}>
                {variacaoProducao
                  ? `${Number(variacaoProducao) >= 0 ? '+' : ''}${variacaoProducao}% previsão IA`
                  : `Baseado em ${stats?.producao.base_registros ?? 0} registros`}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.card, s.cardHalf]}
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/financeiro')}
        >
          <MaterialIcons name="account-balance-wallet" size={24} color={colors.secondary} />
          <Text style={s.cardLabel}>SALDO ATUAL</Text>
          {loading
            ? <SkeletonBox width="80%" height={28} />
            : <Text style={s.valueH2}>{formatCurrency(saldoAtual)}</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.card, s.cardHalf]}
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/vacas')}
        >
          <MaterialIcons name="agriculture" size={24} color={colors.primary} />
          <Text style={s.cardLabel}>REBANHO ATIVO</Text>
          {loading
            ? <SkeletonBox width="60%" height={28} />
            : <Text style={s.valueH2}>{stats?.rebanho.total_vacas ?? 0} Cabeças</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Badge Partos Próximos */}
      {partosProximos.length > 0 && (
        <TouchableOpacity
          style={s.partoAlert}
          activeOpacity={0.85}
          onPress={() => router.push('/(tabs)/vacas')}
        >
          <View style={s.partoAlertLeft}>
            <MaterialIcons name="child-friendly" size={28} color={colors.secondary} />
            <View style={s.partoBadge}>
              <Text style={s.partoBadgeTxt}>{partosProximos.length}</Text>
            </View>
          </View>
          <View style={s.partoAlertInfo}>
            <Text style={s.partoAlertTitle}>
              {partosProximos.length === 1 ? '1 parto previsto' : `${partosProximos.length} partos previstos`} nos próximos 30 dias
            </Text>
            <Text style={s.partoAlertSub}>
              Mais próximo:{' '}
              {vacaMap[partosProximos[0].vaca_id] ?? `Vaca #${partosProximos[0].vaca_id}`}{' '}
              — em {partosProximos[0].dias} {partosProximos[0].dias === 1 ? 'dia' : 'dias'}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={colors.secondary} />
        </TouchableOpacity>
      )}

      {/* Card de Alertas de Saúde */}
      {anomalias.length > 0 && (
        <View style={s.alertaSection}>
          <View style={s.alertaHeader}>
            <MaterialIcons name="warning" size={18} color={colors.error} />
            <Text style={s.alertaTitle}>Alertas de Saúde</Text>
            <View style={s.alertaBadge}>
              <Text style={s.alertaBadgeTxt}>{anomalias.length}</Text>
            </View>
          </View>
          {anomalias.map((a: Anomalia) => (
            <TouchableOpacity
              key={a.vaca_id}
              style={[s.alertaCard, a.severidade === 'alta' ? s.alertaCardAlta : s.alertaCardMedia]}
              activeOpacity={0.85}
              onPress={() => router.push(`/vacas/${a.vaca_id}`)}
            >
              <View style={[s.alertaIndicator, a.severidade === 'alta' ? s.indicatorAlta : s.indicatorMedia]} />
              <View style={s.alertaInfo}>
                <View style={s.alertaRow}>
                  <Text style={s.alertaVaca}>{a.vaca_nome}</Text>
                  <View style={[s.severidadeBadge, a.severidade === 'alta' ? s.severidadeAlta : s.severidadeMedia]}>
                    <Text style={s.severidadeTxt}>
                      {a.severidade === 'alta' ? 'GRAVE' : 'ATENÇÃO'} −{a.queda_pct}%
                    </Text>
                  </View>
                </View>
                <Text style={s.alertaMensagem}>{a.mensagem}</Text>
                <Text style={s.alertaSugestao}>{a.sugestao}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Card Descarte de Leite (carência) */}
      {carencias.length > 0 && (
        <View style={s.carenciaSection}>
          <View style={s.carenciaHeader}>
            <MaterialIcons name="no-drinks" size={18} color="#F59E0B" />
            <Text style={s.carenciaTitle}>Descarte de Leite</Text>
            <View style={s.carenciaBadge}>
              <Text style={s.carenciaBadgeTxt}>{carencias.length}</Text>
            </View>
          </View>
          {(carencias as Medicamento[]).map(c => {
            const fimDate = new Date(c.data_fim_carencia + 'T00:00:00');
            const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
            const diasRestantes = Math.ceil((fimDate.getTime() - hoje.getTime()) / 86_400_000);
            return (
              <TouchableOpacity
                key={c.id}
                style={s.carenciaCard}
                activeOpacity={0.85}
                onPress={() => router.push(`/vacas/${c.vaca_id}`)}
              >
                <View style={s.carenciaIndicator} />
                <View style={s.carenciaInfo}>
                  <View style={s.carenciaRow}>
                    <Text style={s.carenciaVaca}>{c.vaca_nome}</Text>
                    <Text style={s.carenciaDias}>
                      {diasRestantes === 0 ? 'Hoje libera!' : `${diasRestantes} ${diasRestantes === 1 ? 'dia' : 'dias'}`}
                    </Text>
                  </View>
                  <Text style={s.carenciaMed}>{c.nome_medicamento} · até {fimDate.toLocaleDateString('pt-BR')}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Gráfico Previsão IA */}
      <View style={s.card}>
        <View style={s.chartHeader}>
          <View>
            <Text style={s.sectionTitle}>Previsão IA</Text>
            <Text style={s.cardLabel}>Produção estimada para os próximos 7 dias</Text>
          </View>
          <MaterialIcons name="auto-awesome" size={22} color={colors.tertiary} />
        </View>

        {loading ? (
          <View style={s.chartLoading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : stats && stats.producao.base_registros === 0 ? (
          <View style={s.chartEmpty}>
            <MaterialIcons name="auto-awesome" size={32} color={colors.borderLight} />
            <Text style={s.chartEmptyText}>
              Registre a produção das suas vacas para ativar a previsão inteligente
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/producao')}>
              <Text style={s.emptyLink}>Registrar agora</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={s.chart}>
              {(barHeights ?? []).map((h, i) => (
                <View key={i} style={s.barWrapper}>
                  {i >= 4 && <Text style={s.barLabel}>IA</Text>}
                  <View style={[
                    s.bar,
                    { height: h * 0.72 },
                    i >= 4 ? s.barForecast : s.barPast,
                  ]} />
                </View>
              ))}
            </View>
            <View style={s.chartDays}>
              {DAYS.map(d => <Text key={d} style={s.dayLabel}>{d}</Text>)}
            </View>
            {stats && (
              <View style={s.forecastSummary}>
                <MaterialIcons name="info-outline" size={14} color={colors.textSecondary} />
                <Text style={s.forecastText}>
                  Previsão total: {stats.producao.previsao_proximos_7_dias.toFixed(0)}L nos próximos 7 dias
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* Últimas Produções */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Últimas Produções</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/producao')}>
            <Text style={s.seeAll}>Ver Todas</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <>
            <View style={s.listItem}><SkeletonBox width="100%" height={40} /></View>
            <View style={s.listItem}><SkeletonBox width="100%" height={40} /></View>
          </>
        ) : ultimasVacas.length === 0 ? (
          <View style={s.emptyState}>
            <MaterialIcons name="show-chart" size={36} color={colors.borderLight} />
            <Text style={s.emptyText}>Nenhuma produção registrada ainda.</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/producao')}>
              <Text style={s.emptyLink}>Registrar agora</Text>
            </TouchableOpacity>
          </View>
        ) : (
          ultimasVacas.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={s.listItem}
              activeOpacity={0.8}
              onPress={() => router.push(`/vacas/${item.vaca_id}`)}
            >
              <View style={s.listIcon}>
                <MaterialIcons name="agriculture" size={22} color={colors.primary} />
              </View>
              <View style={s.listInfo}>
                <Text style={s.listTitle}>{item.vaca_nome}</Text>
                <Text style={s.listSub}>{item.data} • {item.litros}L registrados</Text>
              </View>
              <Text style={s.listValue}>{item.litros}L</Text>
              <MaterialIcons name="chevron-right" size={22} color={colors.border} />
            </TouchableOpacity>
          ))
        )}
      </View>
      {/* Próximas Tarefas */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Próximas Tarefas</Text>
          <Text style={s.sectionCaption}>Próximos 60 dias</Text>
        </View>

        {tarefas.length === 0 ? (
          <View style={s.emptyState}>
            <MaterialIcons name="event-available" size={36} color={colors.borderLight} />
            <Text style={s.emptyText}>Nenhum evento agendado.</Text>
          </View>
        ) : (
          tarefas.slice(0, 5).map((item: any) => {
            const icon = EVENTO_ICON[item.tipo_evento?.toLowerCase()] ?? 'event';
            return (
              <View key={item.id} style={s.listItem}>
                <View style={[s.listIcon, { backgroundColor: colors.surfaceContainerHighest }]}>
                  <MaterialIcons name={icon} size={20} color={colors.secondary} />
                </View>
                <View style={s.listInfo}>
                  <Text style={s.listTitle}>{item.tipo_evento}</Text>
                  <Text style={s.listSub}>
                    {vacaMap[item.vaca_id] ?? `Vaca #${item.vaca_id}`} • {fmtDate(item.data)}
                  </Text>
                </View>
                <View style={s.daysLeftBadge}>
                  <Text style={s.daysLeftText}>{getDaysLeft(item.data)}</Text>
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 24, paddingBottom: 32 },

  welcome: { gap: 4 },
  welcomeTitle: { fontSize: 32, fontWeight: '700', fontFamily: fonts.bold, color: colors.text, letterSpacing: -0.5 },
  welcomeSub: { fontSize: 16, color: colors.textSecondary },

  bentoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight,
    padding: 16, gap: 12,
  },
  cardFull: { width: '100%' },
  cardHalf: { flex: 1, minWidth: 140 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLabel: { fontSize: 12, fontWeight: '700', fontFamily: fonts.bold, color: colors.textSecondary, letterSpacing: 0.5 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 4 },
  valueLarge: { fontSize: 32, fontWeight: '700', fontFamily: fonts.bold, color: colors.primary, letterSpacing: -0.5 },
  valueUnit: { fontSize: 16, color: colors.primary, opacity: 0.8 },
  valueH2: { fontSize: 22, fontWeight: '700', fontFamily: fonts.bold, color: colors.text, letterSpacing: -0.3 },
  iconBox: { padding: 8, backgroundColor: colors.surfaceContainer, borderRadius: 8 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trendText: { fontSize: 12, fontWeight: '700', fontFamily: fonts.bold, color: colors.primary },

  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sectionTitle: { fontSize: 20, fontWeight: '700', fontFamily: fonts.bold, color: colors.text, letterSpacing: -0.3 },
  chartLoading: { height: 80, alignItems: 'center', justifyContent: 'center' },
  chartEmpty: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  chartEmptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 72, gap: 4 },
  barWrapper: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '100%', borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  barPast: { backgroundColor: colors.surfaceVariant },
  barForecast: {
    backgroundColor: colors.primaryContainer + '33',
    borderWidth: 1, borderColor: colors.primaryContainer, borderBottomWidth: 0,
  },
  barLabel: { fontSize: 9, fontWeight: '700', fontFamily: fonts.bold, color: colors.primary, marginBottom: 2 },
  chartDays: { flexDirection: 'row', justifyContent: 'space-between' },
  dayLabel: { fontSize: 10, fontWeight: '700', fontFamily: fonts.bold, color: colors.textSecondary, flex: 1, textAlign: 'center' },
  forecastSummary: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 8, padding: 8,
  },
  forecastText: { fontSize: 12, color: colors.textSecondary, flex: 1 },

  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  seeAll: { fontSize: 14, color: colors.primary, fontWeight: '600', fontFamily: fonts.semiBold },
  sectionCaption: { fontSize: 12, color: colors.textSecondary },

  daysLeftBadge: {
    backgroundColor: colors.onPrimaryContainer,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
  },
  daysLeftText: { fontSize: 11, fontWeight: '700', fontFamily: fonts.bold, color: colors.primaryContainer },

  listItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 8, borderWidth: 1, borderColor: colors.borderLight,
    padding: 12, minHeight: 64,
  },
  listIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center', justifyContent: 'center',
  },
  listInfo: { flex: 1 },
  listTitle: { fontSize: 15, fontWeight: '600', fontFamily: fonts.semiBold, color: colors.text },
  listSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  listValue: { fontSize: 15, fontWeight: '700', fontFamily: fonts.bold, color: colors.primary },

  emptyState: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 15, color: colors.textSecondary },
  emptyLink: { fontSize: 15, color: colors.primary, fontWeight: '600', fontFamily: fonts.semiBold },

  skeleton: { backgroundColor: colors.surfaceContainerHigh },

  partoAlert: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.onPrimaryContainer,
    borderRadius: 12, borderWidth: 1.5, borderColor: colors.secondary,
    padding: 14,
  },
  partoAlertLeft: { position: 'relative', width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  partoBadge: {
    position: 'absolute', top: -4, right: -6,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.secondary,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  partoBadgeTxt: { fontSize: 10, fontWeight: '700', fontFamily: fonts.bold, color: colors.onPrimary },
  partoAlertInfo: { flex: 1, gap: 2 },
  partoAlertTitle: { fontSize: 14, fontWeight: '700', fontFamily: fonts.bold, color: colors.text },
  partoAlertSub: { fontSize: 12, color: colors.textSecondary },

  alertaSection: { gap: 10 },
  alertaHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertaTitle: { fontSize: 18, fontWeight: '700', fontFamily: fonts.bold, color: colors.text, flex: 1 },
  alertaBadge: {
    minWidth: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.error, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  alertaBadgeTxt: { fontSize: 11, fontWeight: '700', fontFamily: fonts.bold, color: '#fff' },

  alertaCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, borderWidth: 1, padding: 14, overflow: 'hidden',
  },
  alertaCardAlta: { backgroundColor: colors.errorContainer, borderColor: colors.error },
  alertaCardMedia: { backgroundColor: colors.warningContainer, borderColor: colors.warning },

  alertaIndicator: { width: 4, alignSelf: 'stretch', borderRadius: 2 },
  indicatorAlta: { backgroundColor: colors.error },
  indicatorMedia: { backgroundColor: colors.warning },

  alertaInfo: { flex: 1, gap: 4 },
  alertaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  alertaVaca: { fontSize: 15, fontWeight: '700', fontFamily: fonts.bold, color: colors.text },

  severidadeBadge: {
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999,
  },
  severidadeAlta: { backgroundColor: colors.error },
  severidadeMedia: { backgroundColor: colors.warning },
  severidadeTxt: { fontSize: 10, fontWeight: '700', fontFamily: fonts.bold, color: '#fff' },

  alertaMensagem: { fontSize: 13, color: colors.text },
  alertaSugestao: { fontSize: 12, color: colors.textSecondary, fontStyle: 'italic' },

  carenciaSection: { gap: 10 },
  carenciaHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  carenciaTitle: { fontSize: 18, fontWeight: '700', fontFamily: fonts.bold, color: colors.text, flex: 1 },
  carenciaBadge: {
    minWidth: 22, height: 22, borderRadius: 11,
    backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  carenciaBadgeTxt: { fontSize: 11, fontWeight: '700', fontFamily: fonts.bold, color: '#fff' },
  carenciaCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFFBEB',
    borderRadius: 12, borderWidth: 1, borderColor: '#F59E0B',
    padding: 14, overflow: 'hidden',
  },
  carenciaIndicator: { width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: '#F59E0B' },
  carenciaInfo: { flex: 1, gap: 3 },
  carenciaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  carenciaVaca: { fontSize: 15, fontWeight: '700', fontFamily: fonts.bold, color: colors.text },
  carenciaDias: { fontSize: 13, fontWeight: '700', fontFamily: fonts.bold, color: '#D97706' },
  carenciaMed: { fontSize: 12, color: colors.textSecondary },
});
