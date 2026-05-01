import request from './api';
import type { ApiResponse, AuthPayload } from '../types';

type RegisterResponse = { id: number; nome: string; email: string };

export function login(email: string, password: string) {
  return request<ApiResponse<AuthPayload>>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function register(nome: string, email: string, password: string) {
  return request<ApiResponse<RegisterResponse>>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ nome, email, password }),
  });
}
