import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  TextInput,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { getCows, deleteCow } from '../../services/cattleService';
import type { Cow } from '../../types';
import { colors } from '../../constants/colors';

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  saudavel: { bg: colors.onPrimaryContainer, text: colors.primaryContainer, label: 'Ativa' },
  ativa: { bg: colors.onPrimaryContainer, text: colors.primaryContainer, label: 'Ativa' },
  seca: { bg: colors.surfaceContainerHighest, text: colors.textSecondary, label: 'Seca' },
  tratamento: { bg: colors.errorContainer, text: colors.onErrorContainer, label: 'Tratamento' },
};

function getStatus(status: string) {
  return STATUS_STYLE[status?.toLowerCase()] ?? STATUS_STYLE.ativa;
}

export default function Vacas() {
  const [cows, setCows] = useState<Cow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const router = useRouter();

  async function load() {
    setLoading(true);
    try {
      const res = await getCows(1, 100);
      setCows(res.data);
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  async function handleDelete(id: number, nome: string) {
    async function remove() {
      try {
        await deleteCow(id);
        setCows(prev => prev.filter(cow => cow.id !== id));
      } catch (e: any) {
        Alert.alert('Erro ao excluir', e.message);
      }
    }

    if (Platform.OS === 'web') {
      if (window.confirm(`Excluir ${nome}? Esta acao tambem remove registros vinculados no backend.`)) {
        await remove();
      }
      return;
    }

    Alert.alert('Excluir vaca', `Deseja excluir ${nome}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: remove },
    ]);
  }

  const filtered = cows.filter(cow =>
    cow.nome?.toLowerCase().includes(search.toLowerCase()) ||
    cow.raca?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <Text style={s.title}>Minhas Vacas</Text>
        <Text style={s.subtitle}>Gerencie seu rebanho e monitore a produtividade individual.</Text>
      </View>

      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <MaterialIcons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={s.searchInput}
            placeholder="Buscar por nome ou raca..."
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={s.list}
        renderItem={({ item }) => {
          const st = getStatus(item.status_saude);
          return (
            <View style={s.card}>
              <TouchableOpacity style={s.cardMain} activeOpacity={0.8} onPress={() => router.push(`/vacas/${item.id}`)}>
                <View style={s.cowImage}>
                  {item.foto_url ? (
                    <Image source={{ uri: item.foto_url }} style={s.cowPhoto} />
                  ) : (
                    <MaterialIcons name="agriculture" size={32} color={colors.primary} />
                  )}
                </View>
                <View style={s.cardInfo}>
                  <View style={s.cardTop}>
                    <Text style={s.cowName}>{item.nome}</Text>
                    <View style={[s.badge, { backgroundColor: st.bg }]}>
                      <Text style={[s.badgeText, { color: st.text }]}>{st.label.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={s.cowMeta}><Text style={s.metaBold}>Raca:</Text> {item.raca ?? '-'}</Text>
                  <Text style={s.cowMeta}><Text style={s.metaBold}>Idade:</Text> {item.idade ?? '-'}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={colors.border} />
              </TouchableOpacity>

              <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(item.id, item.nome)}>
                <MaterialIcons name="delete-outline" size={20} color={colors.error} />
                <Text style={s.deleteText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={s.empty}>
            <MaterialIcons name="agriculture" size={48} color={colors.borderLight} />
            <Text style={s.emptyText}>Nenhuma vaca cadastrada.</Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: 100 }} />}
      />

      <TouchableOpacity style={s.addBtn} onPress={() => router.push('/vacas/create')} activeOpacity={0.85}>
        <MaterialIcons name="add" size={22} color={colors.onPrimary} />
        <Text style={s.addBtnText}>Adicionar Vaca</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, gap: 4 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 16, color: colors.textSecondary },
  searchRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 16 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: { flex: 1, fontSize: 16, color: colors.text },
  list: { paddingHorizontal: 20, gap: 12 },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  cardMain: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  cowImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cowPhoto: { width: '100%', height: '100%' },
  cardInfo: { flex: 1, gap: 4 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cowName: { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  cowMeta: { fontSize: 14, color: colors.textSecondary },
  metaBold: { fontWeight: '700' },
  deleteBtn: {
    height: 44,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.errorContainer,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: { color: colors.error, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 16, color: colors.textSecondary },
  addBtn: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addBtnText: { color: colors.onPrimary, fontSize: 18, fontWeight: '600' },
});
