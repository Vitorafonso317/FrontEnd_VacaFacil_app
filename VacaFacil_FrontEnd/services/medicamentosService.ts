import request from './api';
import type { Medicamento, MedicamentoInput } from '../types';

export function getMedicamentos(params?: { ativo?: boolean; vaca_id?: number }) {
  const query = new URLSearchParams();
  if (params?.ativo) query.set('ativo', 'true');
  if (params?.vaca_id) query.set('vaca_id', String(params.vaca_id));
  return request<{ success: boolean; data: Medicamento[] }>(`/medicamentos?${query.toString()}`);
}

export function createMedicamento(data: MedicamentoInput) {
  return request<{ success: boolean; data: Medicamento }>('/medicamentos', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function deleteMedicamento(id: number) {
  return request<{ success: boolean }>(`/medicamentos/${id}`, { method: 'DELETE' });
}
