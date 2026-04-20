import { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Button, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { getProduction, createProduction } from '../../services/productionService';
import type { ProductionRecord } from '../../types';

export default function Producao() {
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ vaca_id: '', data: '', litros: '', observacoes: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const res = await getProduction();
      setRecords(res.data);
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleAdd() {
    if (!form.vaca_id || !form.data || !form.litros) return Alert.alert('Preencha os campos obrigatórios');
    setSaving(true);
    try {
      await createProduction({
        vaca_id: Number(form.vaca_id),
        data: form.data,
        litros: Number(form.litros),
        observacoes: form.observacoes || undefined,
      });
      setForm({ vaca_id: '', data: '', litros: '', observacoes: '' });
      load();
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registrar Produção</Text>
      <TextInput style={styles.input} placeholder="ID da vaca" value={form.vaca_id} onChangeText={v => setForm(p => ({ ...p, vaca_id: v }))} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Data (YYYY-MM-DD)" value={form.data} onChangeText={v => setForm(p => ({ ...p, data: v }))} />
      <TextInput style={styles.input} placeholder="Litros" value={form.litros} onChangeText={v => setForm(p => ({ ...p, litros: v }))} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Observações (opcional)" value={form.observacoes} onChangeText={v => setForm(p => ({ ...p, observacoes: v }))} />
      <Button title={saving ? 'Salvando...' : 'Registrar'} onPress={handleAdd} disabled={saving} />

      <Text style={styles.subtitle}>Histórico</Text>
      <FlatList
        data={records}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text>Vaca #{item.vaca_id} — {item.data} — {item.litros}L</Text>
            {item.observacoes ? <Text style={styles.obs}>{item.observacoes}</Text> : null}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nenhum registro.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  subtitle: { fontSize: 16, fontWeight: 'bold', marginTop: 20, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 6, marginBottom: 8 },
  card: { padding: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, marginBottom: 6 },
  obs: { color: '#666', fontSize: 12 },
  empty: { textAlign: 'center', marginTop: 20, color: '#888' },
});
