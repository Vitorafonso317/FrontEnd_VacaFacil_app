import request from './api';
import type { ApiResponse } from '../types';

export type DashboardStats = {
  producao: {
    media_diaria: number;
    previsao_proximos_7_dias: number;
    base_registros: number;
  };
  financeiro: {
    previsao_receita_proximo_mes: number;
    previsao_despesa_proximo_mes: number;
  };
  rebanho: {
    total_vacas: number;
  };
  relatorio: {
    total_litros: number;
    registros: Array<{
      id: number;
      vaca_id: number;
      vaca_nome: string;
      data: string;
      litros: number;
    }>;
  };
};

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
