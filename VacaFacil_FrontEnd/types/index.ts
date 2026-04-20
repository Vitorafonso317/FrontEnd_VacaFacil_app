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
