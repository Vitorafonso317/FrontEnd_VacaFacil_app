import { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import request from '../../services/api';
import type { PaginatedResponse } from '../../types';

type MarketplaceItem = {
  id: number;
  titulo: string;
  descricao?: string;
  preco: number;
  categoria?: string;
  user_id: number;
};

export default function Marketplace() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    request<PaginatedResponse<MarketplaceItem>>('/marketplace?page=1&limit=20')
      .then(res => setItems(res.data))
      .catch(e => Alert.alert('Erro', e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Marketplace</Text>
      <FlatList
        data={items}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/marketplace/${item.id}`)}>
            <Text style={styles.name}>{item.titulo}</Text>
            <Text style={styles.price}>R$ {item.preco.toFixed(2)}</Text>
            {item.categoria ? <Text style={styles.cat}>{item.categoria}</Text> : null}
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nenhum anúncio disponível.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  card: { padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 8 },
  name: { fontSize: 16, fontWeight: 'bold' },
  price: { color: '#2e7d32', marginTop: 4 },
  cat: { color: '#888', fontSize: 12, marginTop: 2 },
  empty: { textAlign: 'center', marginTop: 40, color: '#888' },
});
