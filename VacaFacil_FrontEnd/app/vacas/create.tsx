import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { createCow } from '../../services/cattleService';
import CowForm, { DEFAULT_FORM, cowInputFromForm } from '../../components/CowForm';

export default function CriarVaca() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function onChange(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    if (!form.nome.trim()) return Alert.alert('Nome é obrigatório');
    setLoading(true);
    try {
      await createCow(cowInputFromForm(form));
      router.back();
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <CowForm
      title="Nova Vaca"
      subtitle="Preencha os dados para cadastrar no rebanho."
      submitLabel="SALVAR VACA"
      form={form}
      loading={loading}
      onChange={onChange}
      onSubmit={handleSubmit}
    />
  );
}
