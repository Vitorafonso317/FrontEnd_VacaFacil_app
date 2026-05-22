import { useState, useMemo } from 'react';
import {
  View, Text, FlatList, ActivityIndicator,
  StyleSheet, TouchableOpacity, RefreshControl,
  TextInput, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useMarketplace, useRefreshOnFocus, QK } from '../../hooks/queries';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { formatCurrency } from '../../utils';
import type { MarketplaceItem } from '../../types';

type FilterKey = 'todos' | 'verificado' | 'com_foto';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'todos',      label: 'Todos'      },
  { key: 'verificado', label: 'Verificado' },
  { key: 'com_foto',   label: 'Com Foto'   },
];

function applyFilters(
  items: MarketplaceItem[],
  search: string,
  filter: FilterKey,
): MarketplaceItem[] {
  let result = items;
  if (filter === 'verificado') result = result.filter(i => !!i.vaca_id);
  if (filter === 'com_foto')   result = result.filter(i => i.fotos && i.fotos.length > 0);
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
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('todos');

  useRefreshOnFocus(QK.marketplace);

  const filtered = useMemo(
    () => applyFilters(items, search, activeFilter),
    [items, search, activeFilter],
  );

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

      {/* Filtros */}
      <View style={s.filtersRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[s.chip, activeFilter === f.key && s.chipActive]}
            onPress={() => setActiveFilter(f.key)}
            activeOpacity={0.7}
          >
            <Text style={[s.chipText, activeFilter === f.key && s.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
        renderItem={({ item }) => <MarketplaceCard item={item} onPress={() => router.push(`/marketplace/${item.id}`)} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <MaterialIcons name="storefront" size={48} color={colors.borderLight} />
            <Text style={s.emptyText}>
              {search || activeFilter !== 'todos'
                ? 'Nenhum anúncio encontrado para este filtro.'
                : 'Nenhum anúncio disponível.'}
            </Text>
            {(search || activeFilter !== 'todos') && (
              <TouchableOpacity onPress={() => { setSearch(''); setActiveFilter('todos'); }}>
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

function MarketplaceCard({ item, onPress }: { item: MarketplaceItem; onPress: () => void }) {
  const foto = item.fotos?.[0];
  const isVerified = !!item.vaca_id;
  const priceStr = formatCurrency(item.preco);
  const when = fmtRelative(item.created_at);

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

        {/* Preço sobre a imagem */}
        <View style={c.priceBadge}>
          <Text style={c.priceText} numberOfLines={1}>{priceStr}</Text>
        </View>

        {/* Selo verificado */}
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
          {when ? <Text style={c.when}>{when}</Text> : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

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

  filtersRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 12 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999,
    borderWidth: 1, borderColor: colors.borderLight,
    backgroundColor: colors.surfaceContainerLow,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', fontFamily: fonts.semiBold, color: colors.textSecondary },
  chipTextActive: { color: colors.onPrimary },

  list: { paddingHorizontal: 16, paddingBottom: 16 },
  row: { gap: 10, marginBottom: 10 },

  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
  clearFilters: { fontSize: 14, color: colors.primary, fontWeight: '600', fontFamily: fonts.semiBold },

  fab: {
    position: 'absolute', bottom: 20, right: 20,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.primary, paddingHorizontal: 20, height: 52,
    borderRadius: 999, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  fabText: { color: colors.onPrimary, fontSize: 15, fontWeight: '600', fontFamily: fonts.semiBold },
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
    borderRadius: 8,
    maxWidth: 110,
  },
  priceText: {
    fontSize: 13, fontWeight: '700', fontFamily: fonts.bold,
    color: colors.onPrimary, letterSpacing: -0.2,
  },

  verifiedBadge: {
    position: 'absolute', bottom: 8, left: 8,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 6, paddingVertical: 3,
    borderRadius: 6,
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
});
