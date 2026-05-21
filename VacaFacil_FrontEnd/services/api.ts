import { BASE_URL } from '../constants/config';

const TIMEOUT_MS = 60_000;

let _token: string | null = null;
let _onUnauthorized: (() => void) | null = null;

export function setToken(token: string | null) {
  _token = token;
}

export function getToken() {
  return _token;
}

export function setUnauthorizedHandler(fn: () => void) {
  _onUnauthorized = fn;
}

type RequestMeta = { silent401?: boolean };

async function request<T>(path: string, options: RequestInit = {}, meta: RequestMeta = {}): Promise<T> {
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

    const json = await response.json();
    if (response.status === 401) {
      if (_token && !meta.silent401) _onUnauthorized?.();
      throw new Error(json.message ?? 'Sessão expirada. Faça login novamente.');
    }
    if (!json.success) throw new Error(json.message ?? 'Erro desconhecido');
    return json;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('O servidor demorou para responder (pode estar acordando). Tente novamente em alguns segundos.');
    }
    if (err.message === 'Network request failed') {
      throw new Error('Sem conexão com o servidor. Verifique se o backend está rodando.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export default request;
