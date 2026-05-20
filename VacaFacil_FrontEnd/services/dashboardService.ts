import request from './api';
import type { ApiResponse, DashboardStats } from '../types';

export type { DashboardStats };

export async function getDashboardStats(): Promise<DashboardStats> {
  const [producao, financeiro, rebanho, relatorio] = await Promise.all([
    request<ApiResponse<DashboardStats['producao']>>('/ml/predict-production', { method: 'POST', body: JSON.stringify({}) }),
    request<ApiResponse<DashboardStats['financeiro']>>('/ml/financial-forecast'),
    request<ApiResponse<DashboardStats['rebanho']>>('/ml/analyze-performance'),
    request<ApiResponse<DashboardStats['relatorio']>>('/relatorios/producao/json'),
  ]);

  return {
    producao: producao.data,
    financeiro: financeiro.data,
    rebanho: rebanho.data,
    relatorio: relatorio.data,
  };
}
