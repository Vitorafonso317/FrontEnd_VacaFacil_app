import request from './api';
import type { PaginatedResponse, ReproducaoEvent, ReproducaoInput } from '../types';

export function getReproducao(page = 1, limit = 100, vacaId?: number) {
  const params = vacaId
    ? `/reproducao?page=${page}&limit=${limit}&vaca_id=${vacaId}`
    : `/reproducao?page=${page}&limit=${limit}`;
  return request<PaginatedResponse<ReproducaoEvent>>(params);
}

export function updateReproducao(id: number, data: Partial<ReproducaoInput>) {
  return request<{ success: boolean }>(`/reproducao/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function createReproducao(data: ReproducaoInput) {
  return request<{ success: boolean; data: ReproducaoEvent }>('/reproducao', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function deleteReproducao(id: number) {
  return request<{ success: boolean }>(`/reproducao/${id}`, { method: 'DELETE' });
}
