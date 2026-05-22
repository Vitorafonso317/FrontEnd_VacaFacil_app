import { useEffect, useState } from 'react';
import {
  View, Text, Switch, TouchableOpacity,
  ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  scheduleDailyProductionReminder,
  scheduleWeeklyFinanceReminder,
} from '../../services/notificationService';
import { colors } from '../../constants/colors';

const STORAGE_KEY = '@vacafacil:settings';

type Settings = {
  notifProducao: boolean;
  notifFinanceiro: boolean;
  notifMercado: boolean;
  mostrarDashboardStats: boolean;
};

const DEFAULT_SETTINGS: Settings = {
  notifProducao: true,
  notifFinanceiro: true,
  notifMercado: false,
  mostrarDashboardStats: true,
};

export default function Configuracoes() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try { setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) }); } catch {}
      }
      setLoading(false);
    });
  }, []);

  function toggle(key: keyof Settings) {
    setSettings(prev => {
      const next = { ...prev, [key]: !prev[key] };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      if (key === 'notifProducao')   scheduleDailyProductionReminder(next.notifProducao);
      if (key === 'notifFinanceiro') scheduleWeeklyFinanceReminder(next.notifFinanceiro);
      return next;
    });
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialIcons name="arrow-back" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <Text style={s.title}>Configurações</Text>
      <Text style={s.subtitle}>Personalize as preferências do app.</Text>

      <View style={s.section}>
        <Text style={s.sectionTitle}>NOTIFICAÇÕES</Text>

        <SettingRow
          icon="water-drop"
          label="Registros de Produção"
          description="Lembrete diário para registrar produção"
          value={settings.notifProducao}
          onToggle={() => toggle('notifProducao')}
        />
        <SettingRow
          icon="account-balance-wallet"
          label="Movimentações Financeiras"
          description="Alertas de receitas e despesas"
          value={settings.notifFinanceiro}
          onToggle={() => toggle('notifFinanceiro')}
        />
        <SettingRow
          icon="storefront"
          label="Novos Anúncios no Mercado"
          description="Notificar quando houver novos produtos"
          value={settings.notifMercado}
          onToggle={() => toggle('notifMercado')}
        />
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>EXIBIÇÃO</Text>

        <SettingRow
          icon="bar-chart"
          label="Estatísticas no Dashboard"
          description="Mostrar previsões e médias na tela inicial"
          value={settings.mostrarDashboardStats}
          onToggle={() => toggle('mostrarDashboardStats')}
        />
      </View>
    </ScrollView>
  );
}

type RowProps = {
  icon: string;
  label: string;
  description: string;
  value: boolean;
  onToggle: () => void;
};

function SettingRow({ icon, label, description, value, onToggle }: RowProps) {
  return (
    <View style={r.row}>
      <View style={r.iconBox}>
        <MaterialIcons name={icon as any} size={22} color={colors.primary} />
      </View>
      <View style={r.text}>
        <Text style={r.label}>{label}</Text>
        <Text style={r.desc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.borderLight, true: colors.primary + '66' }}
        thumbColor={value ? colors.primary : colors.border}
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { paddingTop: 32, paddingBottom: 8 },
  backBtn: { padding: 4, marginLeft: -4 },
  title: { fontSize: 32, fontWeight: '700', color: colors.primary, letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: 32 },
  section: { marginBottom: 32 },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: colors.textSecondary,
    letterSpacing: 0.8, marginBottom: 12, paddingHorizontal: 4,
  },
});

const r = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 10, borderWidth: 1, borderColor: colors.borderLight,
    padding: 14, marginBottom: 8,
  },
  iconBox: {
    width: 40, height: 40, borderRadius: 8,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center', justifyContent: 'center',
  },
  text: { flex: 1, gap: 2 },
  label: { fontSize: 15, fontWeight: '600', color: colors.text },
  desc: { fontSize: 12, color: colors.textSecondary },
});
