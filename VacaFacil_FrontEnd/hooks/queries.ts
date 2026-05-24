import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getCows } from '../services/cattleService';
import { getProduction, getProductionByCow } from '../services/productionService';
import { getReproducao } from '../services/reproducaoService';
import { getReceitas, getDespesas } from '../services/financialService';
import { getDashboardStats } from '../services/dashboardService';
import request from '../services/api';
import { getMedicamentos } from '../services/medicamentosService';
import type { PaginatedResponse, MarketplaceItem, Medicamento } from '../types';

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
  partosProx:   ['partos-proximos'] as const,
  anomalias:    ['anomalias']       as const,
  carencia:     ['carencia']        as const,
} as const;

// ─── Hook auxiliar: revalida a query ao focar na tela ────────────────────────
// Respeita staleTime: só faz request se o dado estiver de fato expirado
export function useRefreshOnFocus(queryKey: readonly string[]) {
  const queryClient = useQueryClient();
  useFocusEffect(
    useCallback(() => {
      queryClient.refetchQueries({ queryKey, type: 'active', stale: true });
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
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
  });
}

// ─── Produção ─────────────────────────────────────────────────────────────────
export function useProducao(page = 1, limit = 50) {
  return useQuery({
    queryKey: [...QK.producao, page, limit],
    queryFn: () => getProduction(page, limit).then(r => ({ data: r.data, pagination: r.pagination })),
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
  });
}

// ─── Financeiro ───────────────────────────────────────────────────────────────
export function useReceitas(page = 1, limit = 50) {
  return useQuery({
    queryKey: [...QK.receitas, page, limit],
    queryFn: () => getReceitas(page, limit).then(r => ({ data: r.data, pagination: r.pagination })),
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
  });
}

export function useDespesas(page = 1, limit = 50) {
  return useQuery({
    queryKey: [...QK.despesas, page, limit],
    queryFn: () => getDespesas(page, limit).then(r => ({ data: r.data, pagination: r.pagination })),
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
  });
}

// ─── Marketplace ──────────────────────────────────────────────────────────────
export function useMarketplace(page = 1, limit = 20) {
  return useQuery({
    queryKey: [...QK.marketplace, page, limit],
    queryFn: () =>
      request<PaginatedResponse<MarketplaceItem>>(`/marketplace?page=${page}&limit=${limit}`)
        .then(r => r.data),
    staleTime: 3 * 60_000,
    gcTime: 15 * 60_000,
  });
}

// ─── Produção por vaca (timeline) ────────────────────────────────────────────
export function useProducaoByCow(cowId: number) {
  return useQuery({
    queryKey: [...QK.producaoCow, cowId],
    queryFn: () => getProductionByCow(cowId, 1, 30).then(r => r.data),
    enabled: cowId > 0,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });
}

// ─── Eventos reprodutivos ─────────────────────────────────────────────────────
export function useReproducao(vacaId?: number) {
  return useQuery({
    queryKey: vacaId ? [...QK.reproducao, vacaId] : QK.reproducao,
    queryFn: () => getReproducao(1, 100, vacaId).then(r => r.data),
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

// ─── Partos previstos (inseminação + 283 dias) ────────────────────────────────
// Calcula partos esperados e retorna os que caem nos próximos 30 dias
export function usePartosProximos(vacaMap: Record<number, string> = {}) {
  return useQuery({
    queryKey: QK.partosProx,
    queryFn: async () => {
      const res = await request<{ success: boolean; data: any[] }>(
        '/reproducao?page=1&limit=200'
      );
      const inseminacoes = (res.data ?? []).filter(
        (e: any) => e.tipo_evento?.toLowerCase().includes('insemina')
      );

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const limite = new Date(hoje);
      limite.setDate(hoje.getDate() + 30);

      return inseminacoes
        .map((e: any) => {
          const [y, m, d] = (e.data as string).split('-').map(Number);
          const partoDate = new Date(y, m - 1, d + 283);
          const dias = Math.ceil((partoDate.getTime() - hoje.getTime()) / 86_400_000);
          return { id: e.id, vaca_id: e.vaca_id, insemData: e.data, partoDate, dias };
        })
        .filter(p => p.dias >= 0 && p.partoDate <= limite)
        .sort((a, b) => a.dias - b.dias);
    },
    staleTime: 5 * 60_000,
  });
}

// ─── Anomalias de produção ────────────────────────────────────────────────────
export type Anomalia = {
  vaca_id: number;
  vaca_nome: string;
  ultimo_registro: number;
  media_7_dias: number;
  queda_pct: number;
  mensagem: string;
  severidade: 'alta' | 'media';
  sugestao: string;
};

export function useAnomalias() {
  return useQuery({
    queryKey: QK.anomalias,
    queryFn: () =>
      request<{ success: boolean; data: { anomalias: Anomalia[]; total: number } }>(
        '/ml/detect-anomalies'
      ).then(r => r.data.anomalias ?? []),
    staleTime: 10 * 60_000,
  });
}

// ─── Carência ativa de medicamentos ──────────────────────────────────────────
// vacaId: filtra por vaca específica; sem parâmetro retorna todas ativas
export function useCarencia(vacaId?: number) {
  return useQuery({
    queryKey: vacaId ? [...QK.carencia, vacaId] : QK.carencia,
    queryFn: () =>
      getMedicamentos({ ativo: true, ...(vacaId ? { vaca_id: vacaId } : {}) })
        .then(r => r.data ?? []),
    staleTime: 5 * 60_000,
  });
}

// Hook para verificar se uma vaca específica está em carência (boolean + detalhes)
export function useEstaEmCarencia(vacaId: number) {
  const { data = [], ...rest } = useCarencia(vacaId);
  return { emCarencia: data.length > 0, tratamento: data[0] ?? null, ...rest };
}
