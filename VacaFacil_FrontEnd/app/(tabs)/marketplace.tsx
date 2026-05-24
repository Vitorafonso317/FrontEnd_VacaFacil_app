import { useState, useMemo, useEffect } from 'react';
import {
  View, Text, FlatList, ActivityIndicator,
  StyleSheet, TouchableOpacity, RefreshControl,
  TextInput, Image, Linking, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useMarketplace, useRefreshOnFocus, QK } from '../../hooks/queries';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { formatCurrency } from '../../utils';
import type { MarketplaceItem } from '../../types';

type QuickFilter = 'todos' | 'verificado' | 'com_foto' | 'perto';

const QUICK_FILTERS: { key: QuickFilter; label: string }[] = [
  { key: 'verificado', label: 'Verificado' },
  { key: 'com_foto',   label: 'Com Foto'   },
  { key: 'perto',      label: 'Perto de Mim' },
];

function isPhoneContact(contato?: string | null): boolean {
  if (!contato) return false;
  const digits = contato.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 100) return `${km.toFixed(0)} km`;
  return `${Math.round(km)} km`;
}

function applyFilters(
  items: MarketplaceItem[],
  search: string,
  quick: QuickFilter,
  priceMin: string,
  priceMax: string,
  userCoords: { latitude: number; longitude: number } | null,
): MarketplaceItem[] {
  let result = items;
  if (quick === 'verificado') result = result.filter(i => !!i.vaca_id);
  if (quick === 'com_foto')   result = result.filter(i => i.fotos && i.fotos.length > 0);
  if (quick === 'perto' && userCoords) {
    result = result
      .filter(i => i.latitude != null && i.longitude != null)
      .sort((a, b) =>
        distanceKm(userCoords.latitude, userCoords.longitude, a.latitude!, a.longitude!) -
        distanceKm(userCoords.latitude, userCoords.longitude, b.latitude!, b.longitude!)
      );
  }
  const min = priceMin ? Number(priceMin) : null;
  const max = priceMax ? Number(priceMax) : null;
  if (min != null && !isNaN(min)) result = result.filter(i => i.preco >= min);
  if (max != null && !isNaN(max)) result = result.filter(i => i.preco <= max);
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    result = result.filter(i =>
      i.titulo.toLowerCase().includes(q) ||
      (i.descricao ?? '').toLowerCase().includes(q)
    );
  }
  return result;
}

function fmtRelative(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (diff === 0) return 'hoje';
  if (diff === 1) return 'ontem';
  if (diff < 30) return `há ${diff} dias`;
  const months = Math.floor(diff / 30);
  return `há ${months} ${months === 1 ? 'mês' : 'meses'}`;
}

export default function Marketplace() {
  const router = useRouter();
  const { data: items = [], isLoading, isFetching, refetch } = useMarketplace();

  const [search, setSearch]           = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('todos');
  const [priceMin, setPriceMin]       = useState('');
  const [priceMax, setPriceMax]       = useState('');
  const [showPrice, setShowPrice]     = useState(false);
  const [userCoords, setUserCoords]   = useState<{ latitude: number; longitude: number } | null>(null);

  useRefreshOnFocus(QK.marketplace);

  useEffect(() => {
    Location.getForegroundPermissionsAsync().then(({ status }) => {
      if (status === 'granted') {
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
          .then(pos => setUserCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }))
          .catch(() => {});
      }
    });
  }, []);

  async function requestAndSetLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita o acesso à localização para usar este filtro.');
      return;
    }
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    } catch {
      Alert.alert('Erro', 'Não foi possível obter sua localização.');
    }
  }

  const filtered = useMemo(
    () => applyFilters(items, search, quickFilter, priceMin, priceMax, userCoords),
    [items, search, quickFilter, priceMin, priceMax, userCoords],
  );

  const hasPriceFilter  = priceMin !== '' || priceMax !== '';
  const hasActiveFilter = quickFilter !== 'todos' || hasPriceFilter || search !== '';

  function clearAll() {
    setSearch('');
    setQuickFilter('todos');
    setPriceMin('');
    setPriceMax('');
    setShowPrice(false);
  }

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;

  return (
    <View style={s.screen}>

      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Marketplace</Text>
        <Text style={s.subtitle}>Compre e venda animais e produtos</Text>
      </View>

      {/* Busca */}
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <MaterialIcons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar anúncios..."
            placeholderTextColor={colors.textTertiary}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialIcons name="close" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Quick filters + Preço */}
      <View style={s.filtersRow}>
        {QUICK_FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[s.chip, quickFilter === f.key && s.chipActive]}
            onPress={async () => {
              if (f.key === 'perto' && !userCoords && quickFilter !== 'perto') {
                await requestAndSetLocation();
              }
              setQuickFilter(prev => prev === f.key ? 'todos' : f.key);
            }}
            activeOpacity={0.7}
          >
            <Text style={[s.chipText, quickFilter === f.key && s.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[s.chip, s.chipRow, hasPriceFilter && s.chipActive]}
          onPress={() => setShowPrice(p => !p)}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="attach-money"
            size={14}
            color={hasPriceFilter ? colors.onPrimary : colors.textSecondary}
          />
          <Text style={[s.chipText, hasPriceFilter && s.chipTextActive]}>
            {hasPriceFilter ? `R$${priceMin || '0'}–${priceMax || '∞'}` : 'Preço'}
          </Text>
        </TouchableOpacity>

        {hasActiveFilter && (
          <TouchableOpacity style={s.clearBtn} onPress={clearAll} activeOpacity={0.7}>
            <MaterialIcons name="close" size={14} color={colors.error} />
            <Text style={s.clearBtnText}>Limpar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Painel de faixa de preço */}
      {showPrice && (
        <View style={s.pricePanel}>
          <View style={s.priceInputWrap}>
            <Text style={s.priceLbl}>Mín. R$</Text>
            <TextInput
              style={s.priceField}
              value={priceMin}
              onChangeText={setPriceMin}
              placeholder="0"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
            />
          </View>
          <MaterialIcons name="remove" size={16} color={colors.textTertiary} style={{ marginTop: 18 }} />
          <View style={s.priceInputWrap}>
            <Text style={s.priceLbl}>Máx. R$</Text>
            <TextInput
              style={s.priceField}
              value={priceMax}
              onChangeText={setPriceMax}
              placeholder="sem limite"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
            />
          </View>
        </View>
      )}

      {/* Lista */}
      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={s.list}
        numColumns={2}
        columnWrapperStyle={s.row}
        removeClippedSubviews
        maxToRenderPerBatch={10}
        windowSize={7}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => (
          <MarketplaceCard
            item={item}
            userCoords={userCoords}
            onPress={() => router.push(`/marketplace/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <MaterialIcons name="storefront" size={48} color={colors.borderLight} />
            <Text style={s.emptyText}>
              {hasActiveFilter
                ? 'Nenhum anúncio encontrado para este filtro.'
                : 'Nenhum anúncio disponível.'}
            </Text>
            {hasActiveFilter && (
              <TouchableOpacity onPress={clearAll}>
                <Text style={s.clearFilters}>Limpar filtros</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        ListFooterComponent={<View style={{ height: 100 }} />}
      />

      <TouchableOpacity
        style={s.fab}
        activeOpacity={0.85}
        onPress={() => router.push('/marketplace/create')}
      >
        <MaterialIcons name="add" size={22} color={colors.onPrimary} />
        <Text style={s.fabText}>Anunciar</Text>
      </TouchableOpacity>
    </View>
  );
}

function MarketplaceCard({
  item,
  onPress,
  userCoords,
}: {
  item: MarketplaceItem;
  onPress: () => void;
  userCoords: { latitude: number; longitude: number } | null;
}) {
  const foto       = item.fotos?.[0];
  const isVerified = !!item.vaca_id;
  const priceStr   = formatCurrency(item.preco);
  const when       = fmtRelative(item.created_at);
  const hasWA      = isPhoneContact(item.contato);
  const dist =
    userCoords && item.latitude != null && item.longitude != null
      ? fmtDistance(distanceKm(userCoords.latitude, userCoords.longitude, item.latitude, item.longitude))
      : null;

  function handleWhatsApp() {
    const digits = item.contato!.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/${digits}`).catch(() =>
      Alert.alert('Erro', 'Não foi possível abrir o WhatsApp.')
    );
  }

  return (
    <TouchableOpacity style={c.card} activeOpacity={0.85} onPress={onPress}>

      {/* Imagem */}
      <View style={c.imageBox}>
        {foto ? (
          <Image source={{ uri: foto }} style={c.image} resizeMode="cover" />
        ) : (
          <View style={c.imagePlaceholder}>
            <MaterialIcons name="agriculture" size={36} color={colors.borderLight} />
          </View>
        )}
        <View style={c.priceBadge}>
          <Text style={c.priceText} numberOfLines={1}>{priceStr}</Text>
        </View>
        {isVerified && (
          <View style={c.verifiedBadge}>
            <MaterialIcons name="verified" size={11} color={colors.onPrimary} />
            <Text style={c.verifiedText}>Verificada</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={c.info}>
        <Text style={c.cardTitle} numberOfLines={2}>{item.titulo}</Text>

        <View style={c.meta}>
          {item.categoria ? (
            <View style={c.catBadge}>
              <Text style={c.catText}>{item.categoria.toUpperCase()}</Text>
            </View>
          ) : null}
          {dist ? (
            <View style={c.distBadge}>
              <MaterialIcons name="place" size={10} color={colors.primary} />
              <Text style={c.distText}>{dist}</Text>
            </View>
          ) : when ? <Text style={c.when}>{when}</Text> : null}
        </View>

        {/* Botão WhatsApp rápido */}
        {hasWA && (
          <TouchableOpacity style={c.waBtn} onPress={handleWhatsApp} activeOpacity={0.8}>
            <MaterialIcons name="chat" size={12} color="#fff" />
            <Text style={c.waBtnText}>WhatsApp</Text>
          </TouchableOpacity>
        )}
      </View>

    </TouchableOpacity>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, gap: 2 },
  title: { fontSize: 24, fontWeight: '700', fontFamily: fonts.bold, color: colors.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 14, color: colors.textSecondary },

  searchRow: { paddingHorizontal: 20, marginBottom: 10 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 10, borderWidth: 1, borderColor: colors.borderLight,
    paddingHorizontal: 12, height: 44,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.text },

  catRow: { paddingHorizontal: 20, gap: 8, marginBottom: 8 },

  filtersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginBottom: 8 },

  chip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999,
    borderWidth: 1, borderColor: colors.borderLight,
    backgroundColor: colors.surfaceContainerLow,
  },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', fontFamily: fonts.semiBold, color: colors.textSecondary },
  chipTextActive: { color: colors.onPrimary },

  clearBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
    borderWidth: 1, borderColor: colors.error,
    backgroundColor: colors.errorContainer,
  },
  clearBtnText: { fontSize: 13, fontWeight: '600', fontFamily: fonts.semiBold, color: colors.error },

  pricePanel: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    marginHorizontal: 20, marginBottom: 10,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 10, borderWidth: 1, borderColor: colors.borderLight,
    padding: 12,
  },
  priceInputWrap: { flex: 1, gap: 4 },
  priceLbl: { fontSize: 11, fontWeight: '700', fontFamily: fonts.bold, color: colors.textSecondary, letterSpacing: 0.3 },
  priceField: {
    height: 38, backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 8, borderWidth: 1, borderColor: colors.borderLight,
    paddingHorizontal: 10, fontSize: 14, color: colors.text,
  },

  list: { paddingHorizontal: 16, paddingBottom: 16 },
  row: { gap: 10, marginBottom: 10 },

  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
  clearFilters: { fontSize: 14, color: colors.primary, fontWeight: '600', fontFamily: fonts.semiBold },

  fab: {
    position: 'absolute', bottom: 20, left: 20, right: 20,
    height: 56, backgroundColor: colors.primary, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  fabText: { color: colors.onPrimary, fontSize: 18, fontWeight: '600', fontFamily: fonts.semiBold },
});

const CARD_IMAGE_H = 140;

const c = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight,
    overflow: 'hidden',
  },

  imageBox: { height: CARD_IMAGE_H, position: 'relative' },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: {
    width: '100%', height: '100%',
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
  },

  priceBadge: {
    position: 'absolute', bottom: 8, right: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, maxWidth: 110,
  },
  priceText: {
    fontSize: 13, fontWeight: '700', fontFamily: fonts.bold,
    color: colors.onPrimary, letterSpacing: -0.2,
  },

  verifiedBadge: {
    position: 'absolute', bottom: 8, left: 8,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6,
  },
  verifiedText: {
    fontSize: 10, fontWeight: '700', fontFamily: fonts.bold,
    color: colors.onPrimary,
  },

  info: { padding: 10, gap: 6 },
  cardTitle: {
    fontSize: 13, fontWeight: '600', fontFamily: fonts.semiBold,
    color: colors.text, lineHeight: 18,
  },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  catBadge: {
    backgroundColor: colors.onPrimaryContainer,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  catText: { fontSize: 9, fontWeight: '700', fontFamily: fonts.bold, color: colors.primaryContainer },
  when: { fontSize: 11, color: colors.textTertiary },

  waBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: '#25D366', borderRadius: 6,
    paddingVertical: 5, marginTop: 2,
  },
  waBtnText: { fontSize: 11, fontWeight: '700', fontFamily: fonts.bold, color: '#fff' },

  distBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: colors.onPrimaryContainer,
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4,
  },
  distText: { fontSize: 10, fontWeight: '700', fontFamily: fonts.bold, color: colors.primary },
});
