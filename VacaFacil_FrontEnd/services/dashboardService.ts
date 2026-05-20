import request from './api';
import type { ApiResponse, DashboardStats } from '../types';

export type { DashboardStats };

const FALLBACK_PRODUCAO: DashboardStats['producao'] = {
  media_diaria: 0,
  previsao_proximos_7_dias: 0,
  base_registros: 0,
};

const FALLBACK_FINANCEIRO: DashboardStats['financeiro'] = {
  previsao_receita_proximo_mes: 0,
  previsao_despesa_proximo_mes: 0,
  saldo: 0,
};

const FALLBACK_REBANHO: DashboardStats['rebanho'] = { total_vacas: 0 };

const FALLBACK_RELATORIO: DashboardStats['relatorio'] = { total_litros: 0, registros: [] };

function settled<T>(result: PromiseSettledResult<ApiResponse<T>>, fallback: T): T {
  return result.status === 'fulfilled' ? result.value.data : fallback;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [producao, financeiro, rebanho, relatorio] = await Promise.allSettled([
    request<ApiResponse<DashboardStats['producao']>>('/ml/predict-production', { method: 'POST', body: JSON.stringify({}) }),
    request<ApiResponse<DashboardStats['financeiro']>>('/ml/financial-forecast'),
    request<ApiResponse<DashboardStats['rebanho']>>('/ml/analyze-performance'),
    request<ApiResponse<DashboardStats['relatorio']>>('/relatorios/producao/json'),
  ]);

  return {
    producao: settled(producao, FALLBACK_PRODUCAO),
    financeiro: settled(financeiro, FALLBACK_FINANCEIRO),
    rebanho: settled(rebanho, FALLBACK_REBANHO),
    relatorio: settled(relatorio, FALLBACK_RELATORIO),
  };
}
