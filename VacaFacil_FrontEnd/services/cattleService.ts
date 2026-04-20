import request from './api';
import type { ApiResponse, PaginatedResponse, Cow, CowInput } from '../types';

export function getCows(page = 1, limit = 10) {
  return request<PaginatedResponse<Cow>>(`/vacas?page=${page}&limit=${limit}`);
}

export function getCow(id: number) {
  return request<ApiResponse<Cow>>(`/vacas/${id}`);
}

export function createCow(data: CowInput) {
  return request<ApiResponse<Cow>>('/vacas', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateCow(id: number, data: Partial<CowInput>) {
  return request<ApiResponse<Cow>>(`/vacas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteCow(id: number) {
  return request<ApiResponse<null>>(`/vacas/${id}`, { method: 'DELETE' });
}
