import AsyncStorage from '@react-native-async-storage/async-storage';
import { createProduction } from './productionService';

const QUEUE_KEY = '@vacafacil:offline-queue';

export type QueuedProduction = {
  id: string;
  vaca_id: number;
  data: string;
  litros: number;
  observacoes?: string;
  queued_at: string;
};

export async function enqueueProduction(item: Omit<QueuedProduction, 'id' | 'queued_at'>) {
  const queue = await getQueue();
  queue.push({
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    queued_at: new Date().toISOString(),
  });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function getQueue(): Promise<QueuedProduction[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function processQueue(): Promise<{ success: number; failed: number }> {
  const queue = await getQueue();
  if (!queue.length) return { success: 0, failed: 0 };

  let success = 0;
  let failed = 0;
  const remaining: QueuedProduction[] = [];

  for (const item of queue) {
    try {
      await createProduction({
        vaca_id: item.vaca_id,
        data: item.data,
        litros: item.litros,
        observacoes: item.observacoes,
      });
      success++;
    } catch {
      remaining.push(item);
      failed++;
    }
  }

  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  return { success, failed };
}
