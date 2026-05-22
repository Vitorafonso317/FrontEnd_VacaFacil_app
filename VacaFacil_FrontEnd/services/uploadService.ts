import { Platform } from 'react-native';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { getToken } from './api';
import { BASE_URL } from '../constants/config';

// Resize to max 900px on longest side and compress to ~70% quality
// Typical result: 2-5 MB → 80-200 KB (20-30x smaller)
async function compressImage(uri: string): Promise<string> {
  if (Platform.OS === 'web') return uri; // web handles via blob fetch

  const imageRef = await ImageManipulator
    .manipulate(uri)
    .resize({ width: 900 })
    .renderAsync();
  const result = await imageRef.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });
  return result.uri;
}

async function uploadImagem(endpoint: string, imageUri: string, urlField = 'foto_url'): Promise<string> {
  const token = getToken();
  const compressed = await compressImage(imageUri);

  const formData = new FormData();
  if (Platform.OS === 'web') {
    const blob = await fetch(compressed).then(r => r.blob());
    formData.append('foto', blob, `foto-${Date.now()}.jpg`);
  } else {
    formData.append('foto', {
      uri: compressed,
      name: `foto-${Date.now()}.jpg`,
      type: 'image/jpeg',
    } as any);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
  });

  const json = await response.json();
  if (!json.success) throw new Error(json.message ?? 'Erro ao enviar foto');
  return (json.data[urlField] ?? json.data.foto_url) as string;
}

export function uploadFotoVaca(vacaId: number, imageUri: string): Promise<string> {
  return uploadImagem(`/vacas/${vacaId}/foto`, imageUri);
}

export function uploadFotoUsuario(imageUri: string): Promise<string> {
  return uploadImagem('/users/me/foto', imageUri);
}

export function uploadFotoAnuncio(itemId: number, imageUri: string): Promise<string> {
  return uploadImagem(`/marketplace/${itemId}/foto`, imageUri);
}
