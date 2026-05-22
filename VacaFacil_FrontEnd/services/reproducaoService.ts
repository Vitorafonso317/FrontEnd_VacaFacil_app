import request from './api';
import type { PaginatedResponse, ReproducaoEvent, ReproducaoInput } from '../types';

export function getReproducao(page = 1, limit = 100) {
  return request<PaginatedResponse<ReproducaoEvent>>(`/reproducao?page=${page}&limit=${limit}`);
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
