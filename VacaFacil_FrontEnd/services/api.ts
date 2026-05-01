import AsyncStorage from '@react-native-async-storage/async-storage';

// Em emulador Android use '10.0.2.2'
// Em dispositivo físico use o IP da sua máquina: 'http://192.168.X.X:5000'
const BASE_URL = 'http://10.0.2.2:5000';

const TIMEOUT_MS = 10_000; // 10 segundos

// Token em memória — lido uma vez do disco, depois servido direto daqui
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

    const json = await response.json();
    if (!json.success) throw new Error(json.message ?? 'Erro desconhecido');
    return json;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Servidor demorou muito para responder. Verifique sua conexão.');
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
