import request from './api';
import type { ApiResponse, User } from '../types';

export type UpdateUserInput = {
  nome?: string;
  email?: string;
  password?: string;
};

export function getMe() {
  return request<ApiResponse<User>>('/users/me');
}

export function updateMe(data: UpdateUserInput) {
  return request<ApiResponse<null>>('/users/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
