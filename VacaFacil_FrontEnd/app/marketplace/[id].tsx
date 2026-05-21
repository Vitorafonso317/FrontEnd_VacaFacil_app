import { useEffect, useRef, useState } from 'react';
import {
  View, Text, ActivityIndicator, Alert, StyleSheet,
  ScrollView, TouchableOpacity, Linking, Image,
  FlatList, Dimensions, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import request from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { ApiResponse, MarketplaceItem } from '../../types';
import { colors } from '../../constants/colors';
import { formatCurrency } from '../../utils';

const { width: SCREEN_W } = Dimensions.get('window');
const IMG_H = 260;

function detectContact(contato: string): { type: 'whatsapp' | 'email' | 'unknown'; url: string } {
  const clean = contato.trim();
  const digits = clean.replace(/\D/g, '');
  if (digits.length >= 10 && digits.length <= 15) {
    return { type: 'whatsapp', url: `https://wa.me/${digits}` };
  }
  if (clean.includes('@')) {
    return { type: 'email', url: `mailto:${clean}` };
  }
  return { type: 'unknown', url: '' };
}

export default function MarketplaceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [item, setItem] = useState<MarketplaceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    request<ApiResponse<MarketplaceItem>>(`/marketplace/${id}`)
      .then(res => setItem(res.data))
      .catch(e => Alert.alert('Erro', e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;
  if (!item) return (
    <View style={s.screen}>
      <TouchableOpacity style={s.backBtnSimple} onPress={() => router.back()}>
        <MaterialIcons name="arrow-back" size={28} color={colors.primary} />
      </TouchableOpacity>
      <Text style={s.notFound}>Anúncio não encontrado.</Text>
    </View>
  );

  const fotos = item.fotos ?? [];
  const hasImages = fotos.length > 0;
  const isOwner = !!user && Number(user.id) === Number(item.user_id);
  const contact = item.contato ? detectContact(item.contato) : null;

  function handleContact() {
    if (!contact || !item?.contato) {
      Alert.alert('Contato', 'O vendedor não informou dados de contato.');
      return;
    }
    if (contact.type === 'unknown') {
      Alert.alert('Contato', item.contato);
      return;
    }
    Linking.openURL(contact.url).catch(() =>
      Alert.alert('Erro', 'Não foi possível abrir o contato.')
    );
  }

  async function doDelete() {
    try {
      await request(`/marketplace/${id}`, { method: 'DELETE' });
      router.back();
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    }
  }

  function handleDelete() {
    if (Platform.OS === 'web') {
      // Alert.alert callbacks não disparam corretamente no browser
      if ((window as any).confirm('Deseja remover este anúncio? Esta ação não pode ser desfeita.')) {
        doDelete();
      }
      return;
    }
    Alert.alert('Excluir anúncio', 'Deseja remover este anúncio? Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: doDelete },
    ]);
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>

      {/* Galeria de fotos */}
      {hasImages ? (
        <View style={s.gallery}>
          <FlatList
            ref={flatRef}
            data={fotos}
            keyExtractor={(_, i) => String(i)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={e => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
              setActiveImg(idx);
            }}
            renderItem={({ item: uri }) => (
              <Image source={{ uri }} style={s.galleryImg} resizeMode="cover" />
            )}
          />
          <TouchableOpacity style={s.backBtnOverlay} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          {isOwner && (
            <TouchableOpacity
              style={s.editBtnOverlay}
              onPress={() => router.push(`/marketplace/edit/${id}`)}
            >
              <MaterialIcons name="edit" size={18} color="#fff" />
            </TouchableOpacity>
          )}
          {fotos.length > 1 && (
            <View style={s.dots}>
              {fotos.map((_, i) => (
                <View key={i} style={[s.dot, i === activeImg && s.dotActive]} />
              ))}
            </View>
          )}
        </View>
      ) : (
        <View style={s.headerBar}>
          <TouchableOpacity style={s.backBtnSimple} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={28} color={colors.primary} />
          </TouchableOpacity>
          {isOwner && (
            <View style={s.ownerActions}>
              <TouchableOpacity
                style={s.editBtn}
                onPress={() => router.push(`/marketplace/edit/${id}`)}
              >
                <MaterialIcons name="edit" size={18} color={colors.primary} />
                <Text style={s.editBtnText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.deleteBtn} onPress={handleDelete}>
                <MaterialIcons name="delete-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <View style={s.body}>
        {/* Título + ações do dono (quando tem foto, ficam no overlay) */}
        <View style={s.titleRow}>
          <Text style={s.title} numberOfLines={3}>{item.titulo}</Text>
          {hasImages && isOwner && (
            <TouchableOpacity style={s.deleteBtn} onPress={handleDelete}>
              <MaterialIcons name="delete-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>

        {item.categoria ? (
          <View style={s.badge}>
            <MaterialIcons name="agriculture" size={12} color={colors.primaryContainer} />
            <Text style={s.badgeText}>{item.categoria.toUpperCase()}</Text>
          </View>
        ) : null}

        {/* Preço */}
        <View style={s.priceCard}>
          <Text style={s.priceLabel}>VALOR</Text>
          <Text style={s.price}>{formatCurrency(item.preco)}</Text>
        </View>

        {/* Descrição */}
        {item.descricao ? (
          <View style={s.descCard}>
            <Text style={s.descLabel}>DESCRIÇÃO</Text>
            <Text style={s.desc}>{item.descricao}</Text>
          </View>
        ) : null}

        {/* Thumbnails */}
        {fotos.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {fotos.map((uri, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  setActiveImg(i);
                  flatRef.current?.scrollToIndex({ index: i, animated: true });
                }}
              >
                <Image
                  source={{ uri }}
                  style={[s.thumb, i === activeImg && s.thumbActive]}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Contato */}
        {contact && contact.type === 'whatsapp' ? (
          <TouchableOpacity style={s.whatsappBtn} activeOpacity={0.85} onPress={handleContact}>
            <MaterialIcons name="chat" size={22} color="#fff" />
            <Text style={s.whatsappBtnText}>Falar no WhatsApp</Text>
          </TouchableOpacity>
        ) : contact && contact.type === 'email' ? (
          <TouchableOpacity style={s.contactBtn} activeOpacity={0.85} onPress={handleContact}>
            <MaterialIcons name="email" size={22} color={colors.onPrimary} />
            <Text style={s.contactBtnText}>Enviar E-mail</Text>
          </TouchableOpacity>
        ) : contact && contact.type === 'unknown' ? (
          <TouchableOpacity style={s.contactBtn} activeOpacity={0.85} onPress={handleContact}>
            <MaterialIcons name="chat" size={22} color={colors.onPrimary} />
            <Text style={s.contactBtnText}>Ver Contato</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.noContact}>
            <MaterialIcons name="info-outline" size={16} color={colors.textSecondary} />
            <Text style={s.noContactText}>Vendedor não informou contato.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 40 },
  notFound: { padding: 24, fontSize: 16, color: colors.textSecondary },

  /* Header sem foto */
  headerBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 32, paddingBottom: 8,
  },
  backBtnSimple: { padding: 4, marginLeft: -4 },
  ownerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: colors.onPrimaryContainer, borderRadius: 8,
  },
  editBtnText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  deleteBtn: { padding: 6 },

  /* Galeria */
  gallery: { height: IMG_H, position: 'relative' },
  galleryImg: { width: SCREEN_W, height: IMG_H },
  backBtnOverlay: {
    position: 'absolute', top: 44, left: 16,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  editBtnOverlay: {
    position: 'absolute', top: 44, right: 16,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  dots: {
    position: 'absolute', bottom: 12,
    flexDirection: 'row', alignSelf: 'center', gap: 6,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#fff', width: 18 },

  body: { paddingHorizontal: 20, paddingTop: 20, gap: 14 },

  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  title: { flex: 1, fontSize: 24, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  badge: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.onPrimaryContainer,
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: colors.primaryContainer },

  priceCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight,
    padding: 16, gap: 4,
  },
  priceLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.5 },
  price: { fontSize: 30, fontWeight: '700', color: colors.primary, letterSpacing: -0.5 },

  descCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight,
    padding: 16, gap: 8,
  },
  descLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.5 },
  desc: { fontSize: 16, color: colors.text, lineHeight: 24 },

  thumb: { width: 64, height: 64, borderRadius: 8, borderWidth: 2, borderColor: 'transparent' },
  thumbActive: { borderColor: colors.primary },

  whatsappBtn: {
    height: 56, backgroundColor: '#25D366', borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#25D366', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
    marginTop: 8,
  },
  whatsappBtnText: { color: '#fff', fontSize: 18, fontWeight: '600' },

  contactBtn: {
    height: 56, backgroundColor: colors.primary, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
    marginTop: 8,
  },
  contactBtnText: { color: colors.onPrimary, fontSize: 18, fontWeight: '600' },

  noContact: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 4, marginTop: 4,
  },
  noContactText: { fontSize: 14, color: colors.textSecondary },
});
