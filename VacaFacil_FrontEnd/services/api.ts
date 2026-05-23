import { BASE_URL } from '../constants/config';

const TIMEOUT_MS = 60_000;

let _token: string | null = null;
let _refreshToken: string | null = null;
let _onSignOut: (() => void) | null = null;
let _onTokensRefreshed: ((token: string, refreshToken: string) => void) | null = null;

// Evita múltiplas chamadas simultâneas de refresh
let _refreshPromise: Promise<boolean> | null = null;

export function setToken(token: string | null) {
  _token = token;
}

export function getToken() {
  return _token;
}

export function setRefreshToken(token: string | null) {
  _refreshToken = token;
}

export function setUnauthorizedHandler(fn: () => void) {
  _onSignOut = fn;
}

export function setTokensRefreshedHandler(fn: (token: string, refreshToken: string) => void) {
  _onTokensRefreshed = fn;
}

async function tryRefresh(): Promise<boolean> {
  if (!_refreshToken) return false;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: _refreshToken }),
      signal: AbortSignal.timeout(15_000),
    });
    const json = await res.json();
    if (!res.ok || !json.success) return false;
    _token = json.data.token;
    _refreshToken = json.data.refreshToken;
    _onTokensRefreshed?.(json.data.token, json.data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

type RequestMeta = { silent401?: boolean; _retried?: boolean };

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

    if (response.status === 401 && _token && !meta.silent401 && !meta._retried) {
      // Tenta renovar o token uma vez antes de deslogar
      if (!_refreshPromise) {
        _refreshPromise = tryRefresh().finally(() => { _refreshPromise = null; });
      }
      const refreshed = await _refreshPromise;
      if (refreshed) {
        return request<T>(path, options, { ...meta, _retried: true });
      }
      _onSignOut?.();
      throw new Error(json.message ?? 'Sessão expirada. Faça login novamente.');
    }

    if (response.status === 401) {
      if (_token && !meta.silent401) _onSignOut?.();
      throw new Error(json.message ?? 'Sessão expirada. Faça login novamente.');
    }

    if (!json.success) throw new Error(json.message ?? 'Erro desconhecido');
    return json;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('O servidor demorou para responder. Tente novamente em alguns segundos.');
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
