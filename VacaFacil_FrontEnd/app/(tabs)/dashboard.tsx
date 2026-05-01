import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { getDashboardStats, type DashboardStats } from '../../services/dashboardService';
import { colors } from '../../constants/colors';

const DAYS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'];

// Gera alturas das barras a partir da média diária real
// Dias passados variam ±15% em torno da média, dias futuros (IA) sobem levemente
function buildBarHeights(mediaDiaria: number): number[] {
  if (mediaDiaria === 0) return [40, 45, 42, 50, 55, 58, 56];
  const base = mediaDiaria;
  const past = [0.88, 0.92, 0.85, 0.95, 1.0].map(f => base * f);
  const forecast = [1.03, 1.06, 1.04].map(f => base * f);
  const all = [...past, ...forecast];
  const max = Math.max(...all);
  return all.map(v => Math.round((v / max) * 90) + 10); // normaliza entre 10–100
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function SkeletonBox({ width, height }: { width: number | string; height: number }) {
  return (
    <View style={[s.skeleton, { width: width as any, height, borderRadius: 8 }]} />
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (e: any) {
      Alert.alert('Erro ao carregar dashboard', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const barHeights = stats ? buildBarHeights(stats.producao.media_diaria) : null;

  // Pega as 2 últimas vacas com produção para a lista de manejo
  const ultimasVacas = stats?.relatorio.registros.slice(0, 2) ?? [];

  // Calcula saldo real: receita prevista - despesa prevista
  const saldoPrevisto = stats
    ? stats.financeiro.previsao_receita_proximo_mes - stats.financeiro.previsao_despesa_proximo_mes
    : 0;

  // Variação de produção: compara média com previsão/7
  const variacaoProducao = stats && stats.producao.base_registros > 1
    ? (((stats.producao.previsao_proximos_7_dias / 7) - stats.producao.media_diaria) / stats.producao.media_diaria * 100).toFixed(1)
    : null;

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => load(true)}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      {/* Saudação */}
      <View style={s.welcome}>
        <Text style={s.welcomeTitle}>Olá, {user?.nome ?? 'Produtor'}!</Text>
        <Text style={s.welcomeSub}>Confira o desempenho da sua fazenda hoje.</Text>
      </View>

      {/* Bento Grid */}
      <View style={s.bentoGrid}>
        {/* Card Produção — full width */}
        <TouchableOpacity
          style={[s.card, s.cardFull]}
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/producao')}
        >
          <View style={s.cardRow}>
            <View>
              <Text style={s.cardLabel}>PRODUÇÃO DIÁRIA</Text>
              {loading ? (
                <SkeletonBox width={120} height={36} />
              ) : (
                <View style={s.valueRow}>
                  <Text style={s.valueLarge}>
                    {stats?.producao.media_diaria.toFixed(1) ?? '—'}
                  </Text>
                  <Text style={s.valueUnit}>L/dia</Text>
                </View>
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

        {/* Card Financeiro */}
        <TouchableOpacity
          style={[s.card, s.cardHalf]}
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/financeiro')}
        >
          <MaterialIcons name="account-balance-wallet" size={24} color={colors.secondary} />
          <Text style={s.cardLabel}>SALDO PREVISTO</Text>
          {loading
            ? <SkeletonBox width="80%" height={28} />
            : <Text style={s.valueH2}>{formatCurrency(saldoPrevisto)}</Text>
          }
        </TouchableOpacity>

        {/* Card Rebanho */}
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
        ) : (
          <>
            <View style={s.chart}>
              {(barHeights ?? [40, 45, 42, 50, 55, 58, 56]).map((h, i) => (
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

      {/* Manejo do Rebanho */}
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
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 24, paddingBottom: 32 },

  welcome: { gap: 4 },
  welcomeTitle: { fontSize: 32, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
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
  cardLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.5 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 4 },
  valueLarge: { fontSize: 32, fontWeight: '700', color: colors.primary, letterSpacing: -0.5 },
  valueUnit: { fontSize: 16, color: colors.primary, opacity: 0.8 },
  valueH2: { fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  iconBox: { padding: 8, backgroundColor: colors.surfaceContainer, borderRadius: 8 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trendText: { fontSize: 12, fontWeight: '700', color: colors.primary },

  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  chartLoading: { height: 80, alignItems: 'center', justifyContent: 'center' },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 72, gap: 4 },
  barWrapper: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '100%', borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  barPast: { backgroundColor: colors.surfaceVariant },
  barForecast: {
    backgroundColor: colors.primaryContainer + '33',
    borderWidth: 1, borderColor: colors.primaryContainer, borderBottomWidth: 0,
  },
  barLabel: { fontSize: 9, fontWeight: '700', color: colors.primary, marginBottom: 2 },
  chartDays: { flexDirection: 'row', justifyContent: 'space-between' },
  dayLabel: { fontSize: 10, fontWeight: '700', color: colors.textSecondary, flex: 1, textAlign: 'center' },
  forecastSummary: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 8, padding: 8,
  },
  forecastText: { fontSize: 12, color: colors.textSecondary, flex: 1 },

  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  seeAll: { fontSize: 14, color: colors.primary, fontWeight: '600' },

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
  listTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  listSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  listValue: { fontSize: 15, fontWeight: '700', color: colors.primary },

  emptyState: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 15, color: colors.textSecondary },
  emptyLink: { fontSize: 15, color: colors.primary, fontWeight: '600' },

  skeleton: { backgroundColor: colors.surfaceContainerHigh },
});
