import { useEffect, useState } from 'react';
import { Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getCow, updateCow } from '../../../services/cattleService';
import { colors } from '../../../constants/colors';
import CowForm, { DEFAULT_FORM, cowInputFromForm } from '../../../components/CowForm';

export default function EditarVaca() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [form, setForm] = useState(DEFAULT_FORM);
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
        status_saude: res.data.status_saude === 'ativa' ? 'saudavel' : (res.data.status_saude ?? 'saudavel'),
      }))
      .catch(e => Alert.alert('Erro', e.message))
      .finally(() => setLoading(false));
  }, [id]);

  function onChange(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!form.nome.trim()) return Alert.alert('Nome é obrigatório');
    setSaving(true);
    try {
      await updateCow(Number(id), cowInputFromForm(form));
      router.back();
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;

  return (
    <CowForm
      title="Editar Vaca"
      subtitle={`Atualize os dados de ${form.nome || 'esta vaca'}.`}
      submitLabel="SALVAR ALTERAÇÕES"
      form={form}
      loading={saving}
      onChange={onChange}
      onSubmit={handleSave}
    />
  );
}
