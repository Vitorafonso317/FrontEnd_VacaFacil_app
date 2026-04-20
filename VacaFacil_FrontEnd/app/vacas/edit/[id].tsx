import { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getCow, updateCow } from '../../../services/cattleService';

export default function EditCow() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [form, setForm] = useState({ nome: '', raca: '', idade: '', peso: '', status_saude: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    getCow(Number(id))
      .then(res => setForm({
        nome: res.data.nome,
        raca: res.data.raca ?? '',
        idade: res.data.idade != null ? String(res.data.idade) : '',
        peso: res.data.peso != null ? String(res.data.peso) : '',
        status_saude: res.data.status_saude,
      }))
      .catch(e => Alert.alert('Erro', e.message))
      .finally(() => setLoading(false));
  }, [id]);

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!form.nome) return Alert.alert('Nome é obrigatório');
    setSaving(true);
    try {
      await updateCow(Number(id), {
        nome: form.nome,
        raca: form.raca || undefined,
        idade: form.idade ? Number(form.idade) : undefined,
        peso: form.peso ? Number(form.peso) : undefined,
        status_saude: form.status_saude || undefined,
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Editar Vaca</Text>

      <Text>Nome *</Text>
      <TextInput style={styles.input} value={form.nome} onChangeText={v => set('nome', v)} />

      <Text>Raça</Text>
      <TextInput style={styles.input} value={form.raca} onChangeText={v => set('raca', v)} />

      <Text>Idade (anos)</Text>
      <TextInput style={styles.input} value={form.idade} onChangeText={v => set('idade', v)} keyboardType="numeric" />

      <Text>Peso (kg)</Text>
      <TextInput style={styles.input} value={form.peso} onChangeText={v => set('peso', v)} keyboardType="numeric" />

      <Text>Status de saúde</Text>
      <TextInput style={styles.input} value={form.status_saude} onChangeText={v => set('status_saude', v)} />

      <Button title={saving ? 'Salvando...' : 'Salvar'} onPress={handleSave} disabled={saving} />
      <Button title="Cancelar" onPress={() => router.back()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 8 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 6, marginBottom: 8 },
});
