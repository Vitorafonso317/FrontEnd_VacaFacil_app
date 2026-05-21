import { useEffect, useRef, useState } from 'react';
import {
  View, Text, ActivityIndicator, Alert, StyleSheet,
  ScrollView, TouchableOpacity, Linking, Image,
  FlatList, Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import request from '../../services/api';
import type { ApiResponse, MarketplaceItem } from '../../types';
import { colors } from '../../constants/colors';
import { formatCurrency } from '../../utils';

const { width: SCREEN_W } = Dimensions.get('window');
const IMG_H = 260;

export default function MarketplaceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
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
      <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
        <MaterialIcons name="arrow-back" size={28} color={colors.primary} />
      </TouchableOpacity>
      <Text style={s.notFound}>Anúncio não encontrado.</Text>
    </View>
  );

  const fotos = item.fotos ?? [];
  const hasImages = fotos.length > 0;

  function handleContact() {
    const c = item!.contato?.trim();
    if (!c) {
      Alert.alert('Contato', 'O vendedor não informou dados de contato.');
      return;
    }
    const isWhatsApp = /^\d{10,15}$/.test(c.replace(/\D/g, ''));
    const url = isWhatsApp
      ? `https://wa.me/${c.replace(/\D/g, '')}`
      : `mailto:${c}`;
    Linking.openURL(url).catch(() =>
      Alert.alert('Erro', 'Não foi possível abrir o contato.')
    );
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
          {/* Back button sobre imagem */}
          <TouchableOpacity style={s.backBtnOverlay} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          {/* Dots */}
          {fotos.length > 1 && (
            <View style={s.dots}>
              {fotos.map((_, i) => (
                <View key={i} style={[s.dot, i === activeImg && s.dotActive]} />
              ))}
            </View>
          )}
        </View>
      ) : (
        /* Sem foto — header simples */
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={28} color={colors.primary} />
          </TouchableOpacity>
          <View style={s.iconBox}>
            <MaterialIcons name="storefront" size={52} color={colors.primary} />
          </View>
        </View>
      )}

      <View style={s.body}>
        {/* Título e categoria */}
        <View style={s.titleRow}>
          <Text style={s.title}>{item.titulo}</Text>
          {item.categoria ? (
            <View style={s.badge}>
              <Text style={s.badgeText}>{item.categoria.toUpperCase()}</Text>
            </View>
          ) : null}
        </View>

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

        {/* Thumbnails se tiver mais de 1 foto */}
        {fotos.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.thumbRow} contentContainerStyle={{ gap: 8 }}>
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

        {/* Botão de contato */}
        <TouchableOpacity style={s.contactBtn} activeOpacity={0.85} onPress={handleContact}>
          <MaterialIcons name="chat" size={22} color={colors.onPrimary} />
          <Text style={s.contactBtnText}>Entrar em Contato</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 40 },

  /* Sem foto */
  header: { paddingTop: 32, paddingHorizontal: 20, paddingBottom: 8 },
  backBtn: { padding: 4, marginLeft: -4, alignSelf: 'flex-start' },
  notFound: { padding: 24, fontSize: 16, color: colors.textSecondary },
  iconBox: {
    width: 96, height: 96, borderRadius: 16,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginTop: 16,
  },

  /* Galeria */
  gallery: { height: IMG_H, position: 'relative' },
  galleryImg: { width: SCREEN_W, height: IMG_H },
  backBtnOverlay: {
    position: 'absolute', top: 44, left: 16,
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

  titleRow: { gap: 8 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  badge: {
    alignSelf: 'flex-start', backgroundColor: colors.onPrimaryContainer,
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

  thumbRow: { marginHorizontal: -4 },
  thumb: { width: 64, height: 64, borderRadius: 8, borderWidth: 2, borderColor: 'transparent' },
  thumbActive: { borderColor: colors.primary },

  contactBtn: {
    height: 56, backgroundColor: colors.primary, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
    marginTop: 8,
  },
  contactBtnText: { color: colors.onPrimary, fontSize: 18, fontWeight: '600' },
});
