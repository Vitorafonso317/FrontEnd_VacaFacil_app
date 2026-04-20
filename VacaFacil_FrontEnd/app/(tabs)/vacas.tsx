import { useState } from 'react';
import { View, Text, FlatList, Button, ActivityIndicator, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { getCows, deleteCow } from '../../services/cattleService';
import type { Cow } from '../../types';

export default function Vacas() {
  const [cows, setCows] = useState<Cow[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function load() {
    try {
      const res = await getCows();
      setCows(res.data);
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  async function handleDelete(id: number) {
    try {
      await deleteCow(id);
      setCows(prev => prev.filter(c => c.id !== id));
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    }
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <Button title="+ Nova vaca" onPress={() => router.push('/vacas/create')} />
      <FlatList
        data={cows}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity onPress={() => router.push(`/vacas/${item.id}`)}>
              <Text style={styles.name}>{item.nome}</Text>
              <Text>Raça: {item.raca ?? '—'} | Idade: {item.idade ?? '—'} | Status: {item.status_saude}</Text>
            </TouchableOpacity>
            <Button title="Excluir" color="red" onPress={() => handleDelete(item.id)} />
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma vaca cadastrada.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginVertical: 6 },
  name: { fontSize: 16, fontWeight: 'bold' },
  empty: { textAlign: 'center', marginTop: 40, color: '#888' },
});
