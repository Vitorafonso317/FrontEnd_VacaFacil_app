import { Platform } from 'react-native';
import { BASE_URL, getToken } from './api';

async function uploadImagem(endpoint: string, imageUri: string): Promise<string> {
  const token = getToken();
  const ext = imageUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  const fileName = `foto-${Date.now()}.${ext}`;

  const formData = new FormData();

  if (Platform.OS === 'web') {
    const imageResponse = await fetch(imageUri);
    const blob = await imageResponse.blob();
    (formData as any).append('foto', blob, fileName);
  } else {
    formData.append('foto', {
      uri: imageUri,
      name: fileName,
      type: mimeType,
    } as any);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
  });

  const json = await response.json().catch(() => null);
  if (!json?.success) throw new Error(json?.message ?? json?.error ?? 'Erro ao enviar foto');
  return json.data.foto_url as string;
}

export function uploadFotoVaca(vacaId: number, imageUri: string): Promise<string> {
  return uploadImagem(`/vacas/${vacaId}/foto`, imageUri);
}

export function uploadFotoUsuario(imageUri: string): Promise<string> {
  return uploadImagem('/users/me/foto', imageUri);
}
