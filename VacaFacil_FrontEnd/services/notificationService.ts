import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@vacafacil:settings';
const PROD_ID      = 'vf-daily-producao';
const FIN_ID       = 'vf-weekly-financeiro';
const EVT_PREFIX   = 'vf-event-';

// Chama fora de qualquer componente para que notificações funcionem em background
export function setupNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function setupAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('vacafacil', {
    name: 'VacaFácil',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
  });
}

async function hasPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ─── Lembrete diário de produção (07:00) ─────────────────────────────────────

export async function scheduleDailyProductionReminder(enabled: boolean) {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(PROD_ID).catch(() => {});
  if (!enabled) return;
  if (!(await hasPermission())) return;
  await Notifications.scheduleNotificationAsync({
    identifier: PROD_ID,
    content: {
      title: 'Registrar Produção',
      body: 'Não esqueça de registrar a produção de leite de hoje!',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 7,
      minute: 0,
    },
  });
}

// ─── Resumo financeiro semanal (segunda, 09:00) ───────────────────────────────

export async function scheduleWeeklyFinanceReminder(enabled: boolean) {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(FIN_ID).catch(() => {});
  if (!enabled) return;
  if (!(await hasPermission())) return;
  await Notifications.scheduleNotificationAsync({
    identifier: FIN_ID,
    content: {
      title: 'Resumo Financeiro Semanal',
      body: 'Revise as entradas e saídas da semana no VacaFácil.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 2, // 1 = domingo, 2 = segunda
      hour: 9,
      minute: 0,
    },
  });
}

// ─── Alertas de eventos reprodutivos ─────────────────────────────────────────
// Agenda um alerta 1 dia antes e outro 7 dias antes de cada evento

export async function scheduleEventReminders(
  events: Array<{ id: number; tipo_evento: string; data: string }>
) {
  if (Platform.OS === 'web') return;

  // Cancela alertas antigos de eventos
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.allSettled(
    scheduled
      .filter(n => n.identifier.startsWith(EVT_PREFIX))
      .map(n => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );

  if (events.length === 0) return;
  if (!(await hasPermission())) return;

  const now = Date.now();

  for (const evt of events) {
    const [y, m, d] = evt.data.split('-').map(Number);

    const schedule = async (daysBeforeEvent: number, suffix: string, body: string) => {
      const trigger = new Date(y, m - 1, d - daysBeforeEvent, 8, 0, 0, 0);
      if (trigger.getTime() <= now) return;
      await Notifications.scheduleNotificationAsync({
        identifier: `${EVT_PREFIX}${evt.id}-${suffix}`,
        content: { title: evt.tipo_evento, body, sound: true },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: trigger,
        },
      }).catch(() => {});
    };

    const diffDays = Math.ceil((new Date(y, m - 1, d).getTime() - now) / 86_400_000);

    if (diffDays >= 1 && diffDays <= 2) {
      await schedule(1, '1d', 'Evento de reprodução programado para amanhã.');
    }
    if (diffDays >= 7 && diffDays <= 8) {
      const label = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
      await schedule(7, '7d', `Evento previsto para ${label}. Prepare-se com antecedência.`);
    }
  }
}

// ─── Restaura ao abrir o app ──────────────────────────────────────────────────
// Re-agenda notificações baseadas nas preferências salvas (OS pode ter limpado ao reiniciar)

export async function restoreNotifications() {
  if (Platform.OS === 'web') return;
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    const settings = raw ? JSON.parse(raw) : {};
    await scheduleDailyProductionReminder(settings.notifProducao ?? true);
    await scheduleWeeklyFinanceReminder(settings.notifFinanceiro ?? true);
  } catch {}
}
