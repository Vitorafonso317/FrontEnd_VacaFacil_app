import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getCows } from '../services/cattleService';
import { getProduction, getProductionByCow } from '../services/productionService';
import { getReproducao } from '../services/reproducaoService';
import { getReceitas, getDespesas } from '../services/financialService';
import { getDashboardStats } from '../services/dashboardService';
import request from '../services/api';
import type { PaginatedResponse, MarketplaceItem } from '../types';

// ─── Chaves de cache ────────────────────────────────────────────────────────
export const QK = {
  dashboard:    ['dashboard']       as const,
  vacas:        ['vacas']           as const,
  producao:     ['producao']        as const,
  producaoCow:  ['producao-cow']    as const,
  reproducao:   ['reproducao']      as const,
  receitas:     ['receitas']        as const,
  despesas:     ['despesas']        as const,
  marketplace:  ['marketplace']     as const,
  reproProx:    ['repro-proximas']  as const,
} as const;

// ─── Hook auxiliar: invalida a query ao focar na tela ───────────────────────
// Exibe dados em cache instantaneamente e revalida em background
export function useRefreshOnFocus(queryKey: readonly string[]) {
  const queryClient = useQueryClient();
  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey });
    }, [queryClient, queryKey])
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export function useDashboard(enabled = true) {
  return useQuery({
    queryKey: QK.dashboard,
    queryFn: getDashboardStats,
    staleTime: 60_000,
    enabled,
  });
}

// ─── Rebanho ──────────────────────────────────────────────────────────────────
export function useVacas(page = 1, limit = 50) {
  return useQuery({
    queryKey: [...QK.vacas, page, limit],
    queryFn: () => getCows(page, limit).then(r => r.data),
  });
}

// ─── Produção ─────────────────────────────────────────────────────────────────
export function useProducao(page = 1, limit = 50) {
  return useQuery({
    queryKey: [...QK.producao, page, limit],
    queryFn: () => getProduction(page, limit).then(r => ({ data: r.data, pagination: r.pagination })),
  });
}

// ─── Financeiro ───────────────────────────────────────────────────────────────
export function useReceitas(page = 1, limit = 50) {
  return useQuery({
    queryKey: [...QK.receitas, page, limit],
    queryFn: () => getReceitas(page, limit).then(r => ({ data: r.data, pagination: r.pagination })),
  });
}

export function useDespesas(page = 1, limit = 50) {
  return useQuery({
    queryKey: [...QK.despesas, page, limit],
    queryFn: () => getDespesas(page, limit).then(r => ({ data: r.data, pagination: r.pagination })),
  });
}

// ─── Marketplace ──────────────────────────────────────────────────────────────
export function useMarketplace(page = 1, limit = 20) {
  return useQuery({
    queryKey: [...QK.marketplace, page, limit],
    queryFn: () =>
      request<PaginatedResponse<MarketplaceItem>>(`/marketplace?page=${page}&limit=${limit}`)
        .then(r => r.data),
  });
}

// ─── Produção por vaca (timeline) ────────────────────────────────────────────
export function useProducaoByCow(cowId: number) {
  return useQuery({
    queryKey: [...QK.producaoCow, cowId],
    queryFn: () => getProductionByCow(cowId, 1, 30).then(r => r.data),
    enabled: cowId > 0,
  });
}

// ─── Eventos reprodutivos ─────────────────────────────────────────────────────
export function useReproducao() {
  return useQuery({
    queryKey: QK.reproducao,
    queryFn: () => getReproducao(1, 100).then(r => r.data),
    staleTime: 5 * 60_000,
  });
}

// ─── Próximas tarefas (reprodução) ───────────────────────────────────────────
// Busca eventos dos próximos 60 dias para o card de tarefas do Dashboard
export function useProximasTarefas() {
  return useQuery({
    queryKey: QK.reproProx,
    queryFn: async () => {
      const res = await request<{ success: boolean; data: any[]; pagination?: any }>(
        '/reproducao?page=1&limit=100'
      );
      const hoje = new Date();
      const limite = new Date();
      limite.setDate(hoje.getDate() + 60);
      const hojeStr = hoje.toISOString().split('T')[0];
      const limiteStr = limite.toISOString().split('T')[0];

      return (res.data ?? []).filter((e: any) => {
        const d = e.data ?? '';
        return d >= hojeStr && d <= limiteStr;
      }).sort((a: any, b: any) => a.data.localeCompare(b.data));
    },
    staleTime: 5 * 60_000,
  });
}
