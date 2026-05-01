import { getToken } from './api';

// Em emulador Android use '10.0.2.2', em dispositivo físico use o IP da sua máquina
const BASE_URL = 'http://10.0.2.2:5000';

async function uploadImagem(endpoint: string, imageUri: string): Promise<string> {
  const token = getToken();
  const ext = imageUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  const formData = new FormData();
  formData.append('foto', {
    uri: imageUri,
    name: `foto-${Date.now()}.${ext}`,
    type: mimeType,
  } as any);

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
  });

  const json = await response.json();
  if (!json.success) throw new Error(json.message ?? 'Erro ao enviar foto');
  return json.data.foto_url as string;
}

export function uploadFotoVaca(vacaId: number, imageUri: string): Promise<string> {
  return uploadImagem(`/vacas/${vacaId}/foto`, imageUri);
}

export function uploadFotoUsuario(imageUri: string): Promise<string> {
  return uploadImagem('/users/me/foto', imageUri);
}
