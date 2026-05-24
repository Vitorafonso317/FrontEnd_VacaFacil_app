import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, StyleSheet, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import request from '../../services/api';
import { getCows } from '../../services/cattleService';
import { uploadFotoAnuncio } from '../../services/uploadService';
import AppInput from '../../components/AppInput';
import type { ApiResponse, MarketplaceItem, MarketplaceInput, Cow } from '../../types';
import { colors } from '../../constants/colors';

const MAX_IMAGES = 3;

export default function CriarAnuncio() {
  const router = useRouter();
  const [cows, setCows] = useState<Cow[]>([]);
  const [loadingCows, setLoadingCows] = useState(true);
  const [selectedCow, setSelectedCow] = useState<Cow | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [form, setForm] = useState({ titulo: '', descricao: '', preco: '', contato: '' });
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    getCows(1, 100)
      .then(res => setCows(res.data))
      .catch(e => Alert.alert('Erro', e.message))
      .finally(() => setLoadingCows(false));
  }, []);

  function selectCow(cow: Cow) {
    setSelectedCow(cow);
    setPickerOpen(false);
    setForm(prev => {
      if (prev.titulo.trim()) return prev;
      const parts: string[] = [cow.nome];
      if (cow.raca) parts.push(cow.raca);
      if (cow.idade) parts.push(`${cow.idade} anos`);
      return { ...prev, titulo: parts.join(' — ') };
    });
  }

  function set(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleToggleLocation() {
    if (location) { setLocation(null); return; }
    setGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Permita o acesso à localização nas configurações.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    } catch {
      Alert.alert('Erro', 'Não foi possível obter sua localização.');
    } finally {
      setGettingLocation(false);
    }
  }

  async function pickImage() {
    if (images.length >= MAX_IMAGES) {
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
      setImages(prev => [...prev, result.assets[0].uri]);
    }
  }

  function removeImage(index: number) {
    setImages(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!selectedCow) return Alert.alert('Atenção', 'Selecione uma vaca do seu rebanho para anunciar.');
    if (!form.titulo.trim()) return Alert.alert('Atenção', 'O título é obrigatório.');
    const precoNum = parseFloat(form.preco.replace(',', '.'));
    if (!form.preco || isNaN(precoNum) || precoNum <= 0) {
      return Alert.alert('Atenção', 'Informe um preço válido.');
    }

    setLoading(true);
    try {
      const payload: MarketplaceInput = {
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim() || undefined,
        preco: precoNum,
        categoria: 'Bovino',
        contato: form.contato.trim() || undefined,
        vaca_id: selectedCow.id,
        latitude: location?.latitude,
        longitude: location?.longitude,
      };
      const res = await request<ApiResponse<MarketplaceItem>>('/marketplace', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Upload fotos em paralelo — falhas não bloqueiam o anúncio
      if (images.length > 0 && res.data?.id) {
        await Promise.allSettled(
          images.map(uri => uploadFotoAnuncio(res.data.id, uri))
        );
      }

      router.back();
    } catch (e: any) {
      Alert.alert('Erro ao publicar', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialIcons name="arrow-back" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <Text style={s.title}>Novo Anúncio</Text>
      <Text style={s.subtitle}>Selecione uma vaca do seu rebanho e publique para venda.</Text>

      <View style={s.form}>

        {/* Seletor de vaca */}
        <View style={s.field}>
          <Text style={s.label}>VACA *</Text>
          {loadingCows ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
          ) : cows.length === 0 ? (
            <View style={s.emptyHerd}>
              <MaterialIcons name="agriculture" size={20} color={colors.textSecondary} />
              <Text style={s.emptyHerdText}>Nenhuma vaca cadastrada no seu rebanho.</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={s.selectRow}
                onPress={() => setPickerOpen(o => !o)}
                activeOpacity={0.7}
              >
                <Text style={selectedCow ? s.selectValue : s.selectPlaceholder}>
                  {selectedCow ? selectedCow.nome : 'Selecionar vaca...'}
                </Text>
                <MaterialIcons
                  name={pickerOpen ? 'expand-less' : 'expand-more'}
                  size={22}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              {pickerOpen && (
                <View style={s.pickerList}>
                  {cows.map(cow => (
                    <TouchableOpacity
                      key={cow.id}
                      style={[s.pickerItem, selectedCow?.id === cow.id && s.pickerItemSelected]}
                      onPress={() => selectCow(cow)}
                    >
                      {cow.foto_url ? (
                        <Image source={{ uri: cow.foto_url }} style={s.pickerThumb} resizeMode="cover" />
                      ) : (
                        <View style={[s.pickerThumb, s.pickerThumbPlaceholder]}>
                          <MaterialIcons name="agriculture" size={18} color={colors.primary} />
                        </View>
                      )}
                      <View style={s.pickerItemInfo}>
                        <Text style={[s.pickerItemText, selectedCow?.id === cow.id && s.pickerItemTextSelected]}>
                          {cow.nome}
                        </Text>
                        {(cow.raca || cow.idade) && (
                          <Text style={s.pickerItemSub}>
                            {[cow.raca, cow.idade ? `${cow.idade} anos` : null].filter(Boolean).join(' · ')}
                          </Text>
                        )}
                      </View>
                      {selectedCow?.id === cow.id && (
                        <MaterialIcons name="check" size={18} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {selectedCow && (
                <View style={s.verifiedBadge}>
                  <MaterialIcons name="verified" size={15} color={colors.primary} />
                  <Text style={s.verifiedText}>
                    Vaca verificada no seu rebanho
                    {selectedCow.peso ? ` · ${selectedCow.peso} kg` : ''}
                    {selectedCow.status_saude ? ` · ${selectedCow.status_saude}` : ''}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Fotos do anúncio */}
        <View style={s.field}>
          <Text style={s.label}>FOTOS DO ANIMAL ({images.length}/{MAX_IMAGES})</Text>
          <View style={s.imageGrid}>
            {images.map((uri, i) => (
              <View key={i} style={s.imageTile}>
                <Image source={{ uri }} style={s.imageTileImg} resizeMode="cover" />
                <TouchableOpacity style={s.removeBtn} onPress={() => removeImage(i)}>
                  <MaterialIcons name="close" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < MAX_IMAGES && (
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
          placeholder="Descreva o animal, condições, histórico de produção..."
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

        {/* Localização */}
        <View style={s.field}>
          <Text style={s.label}>LOCALIZAÇÃO (opcional)</Text>
          <TouchableOpacity
            style={s.locationRow}
            onPress={handleToggleLocation}
            activeOpacity={0.7}
            disabled={gettingLocation}
          >
            {gettingLocation ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <MaterialIcons
                name={location ? 'location-on' : 'location-off'}
                size={20}
                color={location ? colors.primary : colors.textTertiary}
              />
            )}
            <Text style={[s.locationText, !!location && s.locationTextOn]}>
              {gettingLocation
                ? 'Obtendo localização...'
                : location
                  ? 'Localização capturada — toque para remover'
                  : 'Incluir localização no anúncio'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Categoria fixa */}
        <View style={s.categoryRow}>
          <MaterialIcons name="agriculture" size={16} color={colors.primary} />
          <Text style={s.categoryText}>Categoria: <Text style={s.categoryValue}>Venda Bovina</Text></Text>
        </View>

        <TouchableOpacity style={s.btn} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
          {loading
            ? <ActivityIndicator color={colors.onPrimary} />
            : <Text style={s.btnText}>PUBLICAR ANÚNCIO</Text>
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

  emptyHerd: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 16, backgroundColor: colors.surfaceContainerLow,
    borderRadius: 8, borderWidth: 1, borderColor: colors.borderLight,
  },
  emptyHerdText: { fontSize: 14, color: colors.textSecondary, flex: 1 },

  selectRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    height: 56, backgroundColor: colors.surfaceContainerLow,
    borderBottomWidth: 2, borderBottomColor: colors.borderLight,
    borderTopLeftRadius: 8, borderTopRightRadius: 8,
    paddingHorizontal: 16,
  },
  selectValue: { fontSize: 16, color: colors.text },
  selectPlaceholder: { fontSize: 16, color: colors.textTertiary },

  pickerList: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 8, borderWidth: 1, borderColor: colors.borderLight,
    overflow: 'hidden', marginTop: 4,
  },
  pickerItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderBottomWidth: 1, borderBottomColor: colors.surfaceContainerLow,
  },
  pickerItemSelected: { backgroundColor: colors.onPrimaryContainer },
  pickerThumb: { width: 40, height: 40, borderRadius: 6, overflow: 'hidden' },
  pickerThumbPlaceholder: { backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  pickerItemInfo: { flex: 1 },
  pickerItemText: { fontSize: 15, color: colors.text },
  pickerItemTextSelected: { fontWeight: '700', color: colors.primaryContainer },
  pickerItemSub: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },

  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 4, paddingHorizontal: 2,
  },
  verifiedText: { fontSize: 12, color: colors.primary, flex: 1 },

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

  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 2 },
  categoryText: { fontSize: 13, color: colors.textSecondary },
  categoryValue: { fontWeight: '700', color: colors.primary },

  locationRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    height: 52, backgroundColor: colors.surfaceContainerLow,
    borderBottomWidth: 2, borderBottomColor: colors.borderLight,
    borderTopLeftRadius: 8, borderTopRightRadius: 8,
    paddingHorizontal: 16,
  },
  locationText: { flex: 1, fontSize: 15, color: colors.textTertiary },
  locationTextOn: { color: colors.primary, fontWeight: '600' },

  btn: {
    height: 56, backgroundColor: colors.primary, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 5,
  },
  btnText: { color: colors.onPrimary, fontSize: 18, fontWeight: '600', letterSpacing: 1 },
  cancelBtn: { alignItems: 'center', paddingVertical: 8 },
  cancelText: { fontSize: 16, color: colors.textSecondary },
});
