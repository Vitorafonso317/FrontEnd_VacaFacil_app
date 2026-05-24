import { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, StyleSheet, Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import request from '../../../services/api';
import { uploadFotoAnuncio } from '../../../services/uploadService';
import AppInput from '../../../components/AppInput';
import type { ApiResponse, MarketplaceItem, MarketplaceInput } from '../../../types';
import { colors } from '../../../constants/colors';

const MAX_IMAGES = 3;

export default function EditarAnuncio() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState({ titulo: '', descricao: '', preco: '', contato: '' });
  const [existingFotos, setExistingFotos] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    request<ApiResponse<MarketplaceItem>>(`/marketplace/${id}`)
      .then(res => {
        setForm({
          titulo: res.data.titulo ?? '',
          descricao: res.data.descricao ?? '',
          preco: String(res.data.preco ?? ''),
          contato: res.data.contato ?? '',
        });
        setExistingFotos(res.data.fotos ?? []);
      })
      .catch(e => Alert.alert('Erro', e.message))
      .finally(() => setLoading(false));
  }, [id]);

  function set(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  const totalImages = existingFotos.length + newImages.length;

  async function pickImage() {
    if (totalImages >= MAX_IMAGES) {
      Alert.alert('Limite atingido', `Máximo de ${MAX_IMAGES} fotos por anúncio.`);
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão necessária', 'Permita o acesso à galeria nas configurações.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      quality: 0.75,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]) {
      setNewImages(prev => [...prev, result.assets[0].uri]);
    }
  }

  async function handleSave() {
    if (!form.titulo.trim()) return Alert.alert('Atenção', 'O título é obrigatório.');
    const precoNum = parseFloat(form.preco.replace(',', '.'));
    if (!form.preco || isNaN(precoNum) || precoNum <= 0) {
      return Alert.alert('Atenção', 'Informe um preço válido.');
    }

    setSaving(true);
    try {
      const payload: Partial<MarketplaceInput> & { fotos?: string[] } = {
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim() || undefined,
        preco: precoNum,
        contato: form.contato.trim() || undefined,
        fotos: existingFotos,
      };
      await request<ApiResponse<null>>(`/marketplace/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (newImages.length > 0) {
        await Promise.allSettled(
          newImages.map(uri => uploadFotoAnuncio(Number(id), uri))
        );
      }

      router.back();
    } catch (e: any) {
      Alert.alert('Erro ao salvar', e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialIcons name="arrow-back" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <Text style={s.title}>Editar Anúncio</Text>
      <Text style={s.subtitle}>Atualize as informações do seu anúncio.</Text>

      <View style={s.form}>

        {/* Fotos do anúncio */}
        <View style={s.field}>
          <Text style={s.label}>FOTOS DO ANIMAL ({totalImages}/{MAX_IMAGES})</Text>
          <View style={s.imageGrid}>
            {existingFotos.map((url, i) => (
              <View key={`ex-${i}`} style={s.imageTile}>
                <Image source={{ uri: url }} style={s.imageTileImg} resizeMode="cover" />
                <TouchableOpacity
                  style={s.removeBtn}
                  onPress={() => setExistingFotos(prev => prev.filter((_, j) => j !== i))}
                >
                  <MaterialIcons name="close" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {newImages.map((uri, i) => (
              <View key={`new-${i}`} style={s.imageTile}>
                <Image source={{ uri }} style={s.imageTileImg} resizeMode="cover" />
                <TouchableOpacity
                  style={s.removeBtn}
                  onPress={() => setNewImages(prev => prev.filter((_, j) => j !== i))}
                >
                  <MaterialIcons name="close" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {totalImages < MAX_IMAGES && (
              <TouchableOpacity style={s.addImageTile} onPress={pickImage} activeOpacity={0.7}>
                <MaterialIcons name="add-photo-alternate" size={28} color={colors.textSecondary} />
                <Text style={s.addImageText}>Adicionar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <AppInput
          label="TÍTULO *"
          value={form.titulo}
          onChangeText={v => set('titulo', v)}
          placeholder="Ex: Vaca Holandesa — 4 anos"
          autoCapitalize="sentences"
          maxLength={255}
        />

        <AppInput
          label="DESCRIÇÃO"
          value={form.descricao}
          onChangeText={v => set('descricao', v)}
          placeholder="Descreva o animal, condições, histórico..."
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          maxLength={500}
          style={{ height: 88, paddingTop: 12 }}
        />

        <AppInput
          label="PREÇO (R$) *"
          value={form.preco}
          onChangeText={v => set('preco', v)}
          placeholder="Ex: 4500,00"
          keyboardType="decimal-pad"
        />

        <AppInput
          label="CONTATO (WhatsApp ou e-mail)"
          value={form.contato}
          onChangeText={v => set('contato', v)}
          placeholder="Ex: 5531999999999 ou email@exemplo.com"
          autoCapitalize="none"
          keyboardType="email-address"
          maxLength={255}
        />

        <TouchableOpacity
          style={[s.btn, saving && s.btnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color={colors.onPrimary} />
            : <Text style={s.btnText}>SALVAR ALTERAÇÕES</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={s.cancelBtn} onPress={() => router.back()}>
          <Text style={s.cancelText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const TILE = 92;

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { paddingTop: 32, paddingBottom: 8 },
  backBtn: { padding: 4, marginLeft: -4 },
  title: { fontSize: 32, fontWeight: '700', color: colors.primary, letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: 32 },

  form: { gap: 24 },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.5, paddingHorizontal: 2 },

  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  imageTile: { width: TILE, height: TILE, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  imageTileImg: { width: '100%', height: '100%' },
  removeBtn: {
    position: 'absolute', top: 4, right: 4,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  addImageTile: {
    width: TILE, height: TILE, borderRadius: 8,
    borderWidth: 1.5, borderColor: colors.borderLight, borderStyle: 'dashed',
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  addImageText: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },

  btn: {
    height: 56, backgroundColor: colors.primary, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 5,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: colors.onPrimary, fontSize: 18, fontWeight: '600', letterSpacing: 1 },
  cancelBtn: { alignItems: 'center', paddingVertical: 8 },
  cancelText: { fontSize: 16, color: colors.textSecondary },
});
