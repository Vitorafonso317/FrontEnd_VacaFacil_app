export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Cow {
  id: number;
  name: string;
  tag: string;
  breed: string;
  birthdate: string;
  status: 'ativa' | 'inativa' | 'alerta';
}

export interface ProductionRecord {
  id: number;
  cow_id: number;
  date: string;
  liters: number;
  notes?: string;
}

export interface Revenue {
  id: number;
  description: string;
  amount: number;
  date: string;
  category?: string;
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
  date: string;
  category?: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface MarketplaceListing {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
