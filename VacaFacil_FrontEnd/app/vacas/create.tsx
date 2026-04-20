import { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { createCow } from '../../services/cattleService';

export default function CreateCow() {
  const [form, setForm] = useState({ nome: '', raca: '', idade: '', peso: '', status_saude: 'saudavel' });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    if (!form.nome) return Alert.alert('Nome é obrigatório');
    setLoading(true);
    try {
      await createCow({
        nome: form.nome,
        raca: form.raca || undefined,
        idade: form.idade ? Number(form.idade) : undefined,
        peso: form.peso ? Number(form.peso) : undefined,
        status_saude: form.status_saude,
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Nova Vaca</Text>

      <Text>Nome *</Text>
      <TextInput style={styles.input} value={form.nome} onChangeText={v => set('nome', v)} />

      <Text>Raça</Text>
      <TextInput style={styles.input} value={form.raca} onChangeText={v => set('raca', v)} />

      <Text>Idade (anos)</Text>
      <TextInput style={styles.input} value={form.idade} onChangeText={v => set('idade', v)} keyboardType="numeric" />

      <Text>Peso (kg)</Text>
      <TextInput style={styles.input} value={form.peso} onChangeText={v => set('peso', v)} keyboardType="numeric" />

      <Text>Status de saúde</Text>
      <TextInput style={styles.input} value={form.status_saude} onChangeText={v => set('status_saude', v)} placeholder="saudavel / doente / em_tratamento" />

      <Button title={loading ? 'Salvando...' : 'Salvar'} onPress={handleSubmit} disabled={loading} />
      <Button title="Cancelar" onPress={() => router.back()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 8 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 6, marginBottom: 8 },
});
