import { useEffect, useState } from 'react';
import { View, Text, Button, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getCow, deleteCow } from '../../services/cattleService';
import type { Cow } from '../../types';

export default function CowDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [cow, setCow] = useState<Cow | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    getCow(Number(id))
      .then(res => setCow(res.data))
      .catch(e => Alert.alert('Erro', e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    try {
      await deleteCow(Number(id));
      router.back();
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    }
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (!cow) return <Text style={{ padding: 24 }}>Vaca não encontrada.</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{cow.nome}</Text>
      <Text>Raça: {cow.raca ?? '—'}</Text>
      <Text>Idade: {cow.idade ?? '—'} anos</Text>
      <Text>Peso: {cow.peso ?? '—'} kg</Text>
      <Text>Status: {cow.status_saude}</Text>

      <View style={styles.actions}>
        <Button title="Editar" onPress={() => router.push(`/vacas/edit/${id}`)} />
        <Button title="Excluir" color="red" onPress={handleDelete} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
});
