import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import request from '../../services/api';
import type { ApiResponse } from '../../types';

type MarketplaceItem = {
  id: number;
  titulo: string;
  descricao?: string;
  preco: number;
  categoria?: string;
  user_id: number;
  created_at?: string;
};

export default function MarketplaceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<MarketplaceItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request<ApiResponse<MarketplaceItem>>(`/marketplace/${id}`)
      .then(res => setItem(res.data))
      .catch(e => Alert.alert('Erro', e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (!item) return <Text style={{ padding: 24 }}>Anúncio não encontrado.</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{item.titulo}</Text>
      <Text style={styles.price}>R$ {item.preco.toFixed(2)}</Text>
      {item.categoria ? <Text style={styles.cat}>Categoria: {item.categoria}</Text> : null}
      {item.descricao ? <Text style={styles.desc}>{item.descricao}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  price: { fontSize: 20, color: '#2e7d32', marginBottom: 8 },
  cat: { color: '#888', marginBottom: 12 },
  desc: { color: '#444', lineHeight: 22 },
});
