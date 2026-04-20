import { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Button, Alert, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { getReceitas, getDespesas, createReceita, createDespesa, deleteReceita, deleteDespesa } from '../../services/financialService';
import type { FinancialRecord } from '../../types';

type Tab = 'receitas' | 'despesas';

export default function Financeiro() {
  const [tab, setTab] = useState<Tab>('receitas');
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ descricao: '', valor: '', data: '' });
  const [saving, setSaving] = useState(false);

  async function load(t: Tab = tab) {
    setLoading(true);
    try {
      const res = t === 'receitas' ? await getReceitas() : await getDespesas();
      setRecords(res.data);
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(tab); }, [tab]);

  async function handleAdd() {
    if (!form.descricao || !form.valor || !form.data) return Alert.alert('Preencha todos os campos');
    setSaving(true);
    try {
      const data = { descricao: form.descricao, valor: Number(form.valor), data: form.data };
      tab === 'receitas' ? await createReceita(data) : await createDespesa(data);
      setForm({ descricao: '', valor: '', data: '' });
      load(tab);
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      tab === 'receitas' ? await deleteReceita(id) : await deleteDespesa(id);
      setRecords(prev => prev.filter(r => r.id !== id));
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'receitas' && styles.tabActive]} onPress={() => setTab('receitas')}>
          <Text style={tab === 'receitas' ? styles.tabTextActive : styles.tabText}>Receitas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'despesas' && styles.tabActive]} onPress={() => setTab('despesas')}>
          <Text style={tab === 'despesas' ? styles.tabTextActive : styles.tabText}>Despesas</Text>
        </TouchableOpacity>
      </View>

      <TextInput style={styles.input} placeholder="Descrição" value={form.descricao} onChangeText={v => setForm(p => ({ ...p, descricao: v }))} />
      <TextInput style={styles.input} placeholder="Valor" value={form.valor} onChangeText={v => setForm(p => ({ ...p, valor: v }))} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Data (YYYY-MM-DD)" value={form.data} onChangeText={v => setForm(p => ({ ...p, data: v }))} />
      <Button title={saving ? 'Salvando...' : `Adicionar ${tab === 'receitas' ? 'receita' : 'despesa'}`} onPress={handleAdd} disabled={saving} />

      {loading ? <ActivityIndicator style={{ marginTop: 20 }} /> : (
        <FlatList
          data={records}
          keyExtractor={item => String(item.id)}
          style={{ marginTop: 16 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.desc}>{item.descricao}</Text>
                <Text>R$ {item.valor.toFixed(2)} — {item.data}</Text>
              </View>
              <Button title="X" color="red" onPress={() => handleDelete(item.id)} />
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Nenhum registro.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  tabs: { flexDirection: 'row', marginBottom: 16 },
  tab: { flex: 1, padding: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#ddd' },
  tabActive: { borderBottomColor: '#2e7d32' },
  tabText: { color: '#888' },
  tabTextActive: { color: '#2e7d32', fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 6, marginBottom: 8 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, marginBottom: 6 },
  desc: { fontWeight: 'bold' },
  empty: { textAlign: 'center', marginTop: 20, color: '#888' },
});
