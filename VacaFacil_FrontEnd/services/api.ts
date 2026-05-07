import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const DEFAULT_PORT = 5000;
const TIMEOUT_MS = 10_000;

function getDefaultBaseUrl() {
  if (Platform.OS === 'android') return `http://10.0.2.2:${DEFAULT_PORT}`;
  return `http://localhost:${DEFAULT_PORT}`;
}

// Web/iOS simulator: http://localhost:5000
// Android emulator: http://10.0.2.2:5000
// Physical device: set EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:5000
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || getDefaultBaseUrl();

let _token: string | null = null;

export function setToken(token: string | null) {
  _token = token;
}

export function getToken() {
  return _token;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(_token ? { Authorization: `Bearer ${_token}` } : {}),
        ...options.headers,
      },
    });

    const json = await response.json().catch(() => null);
    if (!json) throw new Error('Resposta invalida do servidor.');
    if (response.status === 401) {
      throw new Error(json.message ?? json.error ?? 'Sessao expirada. Faca login novamente.');
    }
    if (!json.success) throw new Error(json.message ?? json.error ?? 'Erro desconhecido');
    return json;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Servidor demorou muito para responder. Verifique sua conexao.');
    }
    if (err.message === 'Network request failed') {
      throw new Error('Sem conexao com o servidor. Verifique se o backend esta rodando.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export default request;
