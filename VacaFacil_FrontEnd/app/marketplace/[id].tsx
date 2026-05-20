import { useEffect, useState } from 'react';
import {
  View, Text, ActivityIndicator, Alert, StyleSheet,
  ScrollView, TouchableOpacity, Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import request from '../../services/api';
import type { ApiResponse, MarketplaceItem } from '../../types';
import { colors } from '../../constants/colors';
import { formatCurrency } from '../../utils';

export default function MarketplaceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<MarketplaceItem | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      {/* Cabeçalho */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Ícone do produto */}
      <View style={s.iconBox}>
        <MaterialIcons name="storefront" size={56} color={colors.primary} />
      </View>

      {/* Título e categoria */}
      <Text style={s.title}>{item.titulo}</Text>
      {item.categoria ? (
        <View style={s.badge}>
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

      {/* Botão de contato */}
      <TouchableOpacity
        style={s.contactBtn}
        activeOpacity={0.85}
        onPress={() => {
          const c = item.contato?.trim();
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
        }}
      >
        <MaterialIcons name="chat" size={22} color={colors.onPrimary} />
        <Text style={s.contactBtnText}>Entrar em Contato</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { paddingTop: 32, paddingBottom: 8 },
  backBtn: { padding: 4, marginLeft: -4, alignSelf: 'flex-start' },
  notFound: { padding: 24, fontSize: 16, color: colors.textSecondary },

  iconBox: {
    width: 96, height: 96, borderRadius: 16,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 16,
  },

  title: {
    fontSize: 26, fontWeight: '700', color: colors.text,
    letterSpacing: -0.3, textAlign: 'center', marginBottom: 8,
  },
  badge: {
    alignSelf: 'center', backgroundColor: colors.onPrimaryContainer,
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, marginBottom: 20,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: colors.primaryContainer },

  priceCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight,
    padding: 16, marginBottom: 12, gap: 4,
  },
  priceLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.5 },
  price: { fontSize: 28, fontWeight: '700', color: colors.primary, letterSpacing: -0.3 },

  descCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight,
    padding: 16, marginBottom: 24, gap: 8,
  },
  descLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.5 },
  desc: { fontSize: 16, color: colors.text, lineHeight: 24 },

  contactBtn: {
    height: 56, backgroundColor: colors.primary, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  contactBtnText: { color: colors.onPrimary, fontSize: 18, fontWeight: '600' },
});
