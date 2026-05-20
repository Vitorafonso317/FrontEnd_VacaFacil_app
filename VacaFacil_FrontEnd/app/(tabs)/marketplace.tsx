import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, ActivityIndicator, Alert,
  StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import request from '../../services/api';
import type { PaginatedResponse, MarketplaceItem } from '../../types';
import { colors } from '../../constants/colors';
import { formatCurrency } from '../../utils';

export default function Marketplace() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await request<PaginatedResponse<MarketplaceItem>>('/marketplace?page=1&limit=20');
      setItems(res.data);
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <Text style={s.title}>Marketplace</Text>
        <Text style={s.subtitle}>Compre e venda produtos e animais</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.card}
            activeOpacity={0.8}
            onPress={() => router.push(`/marketplace/${item.id}`)}
          >
            <View style={s.cardIcon}>
              <MaterialIcons name="storefront" size={28} color={colors.primary} />
            </View>
            <View style={s.cardInfo}>
              <Text style={s.cardTitle}>{item.titulo}</Text>
              {item.categoria ? (
                <View style={s.badge}>
                  <Text style={s.badgeText}>{item.categoria.toUpperCase()}</Text>
                </View>
              ) : null}
            </View>
            <View style={s.cardRight}>
              <Text style={s.cardPrice}>{formatCurrency(item.preco)}</Text>
              <MaterialIcons name="chevron-right" size={20} color={colors.border} />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <MaterialIcons name="storefront" size={48} color={colors.borderLight} />
            <Text style={s.emptyText}>Nenhum anúncio disponível.</Text>
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

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, gap: 4 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 16, color: colors.textSecondary },

  list: { paddingHorizontal: 20, gap: 10 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 10, borderWidth: 1, borderColor: colors.borderLight,
    padding: 12,
  },
  cardIcon: {
    width: 52, height: 52, borderRadius: 8,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center', justifyContent: 'center',
  },
  cardInfo: { flex: 1, gap: 6 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.onPrimaryContainer,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: colors.primaryContainer },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  cardPrice: { fontSize: 16, fontWeight: '700', color: colors.primary },

  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 16, color: colors.textSecondary },

  fab: {
    position: 'absolute', bottom: 20, right: 20,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.primary, paddingHorizontal: 20, height: 56,
    borderRadius: 999, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  fabText: { color: colors.onPrimary, fontSize: 16, fontWeight: '600' },
});
