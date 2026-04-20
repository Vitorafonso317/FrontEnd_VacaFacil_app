import request from './api';
import type { ApiResponse, PaginatedResponse, FinancialRecord, FinancialInput } from '../types';

export function getReceitas(page = 1, limit = 10) {
  return request<PaginatedResponse<FinancialRecord>>(`/financeiro/receitas?page=${page}&limit=${limit}`);
}

export function createReceita(data: FinancialInput) {
  return request<ApiResponse<FinancialRecord>>('/financeiro/receitas', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateReceita(id: number, data: Partial<FinancialInput>) {
  return request<ApiResponse<FinancialRecord>>(`/financeiro/receitas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteReceita(id: number) {
  return request<ApiResponse<null>>(`/financeiro/receitas/${id}`, { method: 'DELETE' });
}

export function getDespesas(page = 1, limit = 10) {
  return request<PaginatedResponse<FinancialRecord>>(`/financeiro/despesas?page=${page}&limit=${limit}`);
}

export function createDespesa(data: FinancialInput) {
  return request<ApiResponse<FinancialRecord>>('/financeiro/despesas', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateDespesa(id: number, data: Partial<FinancialInput>) {
  return request<ApiResponse<FinancialRecord>>(`/financeiro/despesas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteDespesa(id: number) {
  return request<ApiResponse<null>>(`/financeiro/despesas/${id}`, { method: 'DELETE' });
}
