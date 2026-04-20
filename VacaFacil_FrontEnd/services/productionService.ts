import request from './api';
import type { ApiResponse, PaginatedResponse, ProductionRecord, ProductionInput } from '../types';

export function getProduction(page = 1, limit = 10) {
  return request<PaginatedResponse<ProductionRecord>>(`/producao?page=${page}&limit=${limit}`);
}

export function createProduction(data: ProductionInput) {
  return request<ApiResponse<ProductionRecord>>('/producao', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateProduction(id: number, data: Partial<ProductionInput>) {
  return request<ApiResponse<ProductionRecord>>(`/producao/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteProduction(id: number) {
  return request<ApiResponse<null>>(`/producao/${id}`, { method: 'DELETE' });
}
