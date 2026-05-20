export function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}
