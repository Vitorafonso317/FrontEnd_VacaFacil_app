import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://localhost:5000';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await AsyncStorage.getItem('token');

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const json = await response.json();

  if (!json.success) throw new Error(json.message);

  return json;
}

export default request;
