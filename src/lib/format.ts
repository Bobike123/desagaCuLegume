export type ProductMeasureUnit = 'PER_KG' | 'PER_BUC';
export type ProductPromotionLabel = 'NONE' | 'NOU' | 'PROMOTIE' | 'NOU_PROMOTIE';

const PRODUCT_MEASURE_UNIT_LABELS: Record<ProductMeasureUnit, string> = {
  PER_KG: 'per kg',
  PER_BUC: 'pe buc.',
};

const PRODUCT_MEASURE_UNIT_SUFFIXES: Record<ProductMeasureUnit, string> = {
  PER_KG: 'kg',
  PER_BUC: 'buc.',
};

const PRODUCT_PROMOTION_LABELS: Record<ProductPromotionLabel, string> = {
  NONE: 'Fără promoție',
  NOU: 'NOU',
  PROMOTIE: 'PROMOȚIE',
  NOU_PROMOTIE: 'NOU + PROMOȚIE',
};

export function normalizeProductMeasureUnit(value: unknown): ProductMeasureUnit {
  const normalized = String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

  if (normalized === 'PER_BUC' || normalized === 'BUC' || normalized === 'BUCATA' || normalized === 'PE_BUCATA') {
    return 'PER_BUC';
  }

  return 'PER_KG';
}

export function productMeasureUnitLabel(value: unknown): string {
  return PRODUCT_MEASURE_UNIT_LABELS[normalizeProductMeasureUnit(value)];
}

export function productMeasureUnitSuffix(value: unknown): string {
  return PRODUCT_MEASURE_UNIT_SUFFIXES[normalizeProductMeasureUnit(value)];
}

export function normalizeProductPromotionLabel(value: unknown): ProductPromotionLabel {
  const normalized = String(value ?? '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_');

  if (normalized === 'NOU') return 'NOU';
  if (normalized === 'PROMOTIE' || normalized === 'PROMO' || normalized === 'REDUCERE') return 'PROMOTIE';
  if (
    normalized === 'BOTH' ||
    normalized === 'AMBELE' ||
    normalized === 'NOU_PROMOTIE' ||
    normalized === 'NOU_SI_PROMOTIE' ||
    normalized === 'NOU_PROMO'
  ) {
    return 'NOU_PROMOTIE';
  }

  return 'NONE';
}

export function productPromotionLabel(value: unknown): string {
  return PRODUCT_PROMOTION_LABELS[normalizeProductPromotionLabel(value)];
}

export function productPromotionBadges(value: unknown): string[] {
  const normalized = normalizeProductPromotionLabel(value);
  if (normalized === 'NOU') return ['NOU'];
  if (normalized === 'PROMOTIE') return ['PROMOȚIE'];
  if (normalized === 'NOU_PROMOTIE') return ['NOU', 'PROMOȚIE'];
  return [];
}

export function isPromotedProduct(value: unknown): boolean {
  return normalizeProductPromotionLabel(value) !== 'NONE';
}

export function formatMoney(value: number, currency = 'RON'): string {
  return `${Number(value ?? 0).toFixed(2)} ${currency || 'RON'}`;
}

export function formatProductPrice(value: number, currency = 'RON', measureUnit: unknown = 'PER_KG'): string {
  return `${formatMoney(value, currency)} / ${productMeasureUnitSuffix(measureUnit)}`;
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
