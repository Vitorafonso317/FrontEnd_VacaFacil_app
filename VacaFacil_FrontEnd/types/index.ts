export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type PaginatedResponse<T> = ApiResponse<T[]> & {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export type User = {
  id: number;
  nome: string;
  email: string;
  foto_url?: string;
  plano?: 'gratuito' | 'ouro' | 'diamante';
  created_at?: string;
  last_login?: string | null;
};

export type AuthPayload = {
  token: string;
  user: User;
};

export type Cow = {
  id: number;
  nome: string;
  raca?: string;
  idade?: number;
  peso?: number;
  status_saude: string;
  foto_url?: string;
  user_id: number;
  created_at?: string;
};

export type CowInput = {
  nome: string;
  raca?: string;
  idade?: number;
  peso?: number;
  status_saude?: string;
};

export type ProductionRecord = {
  id: number;
  vaca_id: number;
  data: string;
  litros: number;
  observacoes?: string;
  created_at?: string;
};

export type ProductionInput = {
  vaca_id: number;
  data: string;
  litros: number;
  observacoes?: string;
};

export type FinancialRecord = {
  id: number;
  tipo: 'receita' | 'despesa';
  descricao: string;
  valor: number;
  data: string;
  user_id: number;
  created_at?: string;
};

export type FinancialInput = {
  descricao: string;
  valor: number;
  data: string;
};

export type MarketplaceItem = {
  id: number;
  titulo: string;
  descricao?: string;
  preco: number;
  categoria?: string;
  contato?: string;
  user_id: number;
  created_at?: string;
};

export type MarketplaceInput = {
  titulo: string;
  descricao?: string;
  preco: number;
  categoria?: string;
  contato?: string;
};

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
