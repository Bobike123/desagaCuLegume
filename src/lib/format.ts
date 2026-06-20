export function formatMoney(value: number, currency = 'RON'): string {
  return `${Number(value ?? 0).toFixed(2)} ${currency || 'RON'}`;
}

export function formatDate(value: string | null | undefined, fallback = 'Dată indisponibilă'): string {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString('ro-RO', { dateStyle: 'medium', timeStyle: 'short' });
}

const STATUS_LABELS: Record<string, string> = {
  PLACED: 'Plasată',
  PENDING: 'În așteptare',
  PAID: 'Plătită',
  PROCESSING: 'În pregătire',
  SHIPPED: 'Expediată',
  DELIVERED: 'Livrată',
  COMPLETED: 'Finalizată',
  CANCELLED: 'Anulată',
  REFUNDED: 'Rambursată',
  UNFULFILLED: 'Nepregătită',
  FULFILLED: 'Livrată',
  OPEN: 'Deschisă',
  CLOSED: 'Închisă',
  ARCHIVED: 'Arhivată',
};

export function statusLabel(value: string | null | undefined): string {
  const normalized = String(value ?? '').trim().toUpperCase();
  return STATUS_LABELS[normalized] ?? normalized.replaceAll('_', ' ');
}
