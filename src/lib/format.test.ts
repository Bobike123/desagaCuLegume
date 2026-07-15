import { describe, expect, it } from 'vitest';
import { formatDate, formatMoney, statusLabel } from './format';

describe('formatMoney', () => {
  it('formats integer value with default RON currency', () => {
    expect(formatMoney(10)).toBe('10.00 RON');
  });

  it('formats decimal value', () => {
    expect(formatMoney(9.5)).toBe('9.50 RON');
  });

  it('accepts explicit currency', () => {
    expect(formatMoney(5, 'EUR')).toBe('5.00 EUR');
  });

  it('falls back to RON when currency is empty string', () => {
    expect(formatMoney(1, '')).toBe('1.00 RON');
  });

  it('coerces null-ish to 0', () => {
    expect(formatMoney(0)).toBe('0.00 RON');
  });

  it('handles NaN-ish via ?? coercion', () => {
    // undefined would be NaN via Number(undefined); ?? 0 guards it
    expect(formatMoney(undefined as unknown as number)).toBe('0.00 RON');
  });
});

describe('formatDate', () => {
  it('formats a valid ISO string with ro-RO locale', () => {
    const result = formatDate('2024-03-15T10:30:00Z');
    // Locale output varies by environment; verify it is a non-empty string that is not the fallback
    expect(result).toBeTruthy();
    expect(result).not.toBe('Dată indisponibilă');
  });

  it('returns default fallback for null', () => {
    expect(formatDate(null)).toBe('Dată indisponibilă');
  });

  it('returns default fallback for undefined', () => {
    expect(formatDate(undefined)).toBe('Dată indisponibilă');
  });

  it('returns default fallback for empty string', () => {
    expect(formatDate('')).toBe('Dată indisponibilă');
  });

  it('returns default fallback for an invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('Dată indisponibilă');
  });

  it('accepts a custom fallback string', () => {
    expect(formatDate(null, '-')).toBe('-');
    expect(formatDate('bad', '-')).toBe('-');
  });
});

describe('statusLabel', () => {
  const cases: [string, string][] = [
    ['PLACED', 'Plasată'],
    ['PENDING', 'În așteptare'],
    ['PAID', 'Plătită'],
    ['PROCESSING', 'În pregătire'],
    ['SHIPPED', 'Expediată'],
    ['DELIVERED', 'Livrată'],
    ['COMPLETED', 'Finalizată'],
    ['CANCELLED', 'Anulată'],
    ['REFUNDED', 'Rambursată'],
    ['UNFULFILLED', 'Nepregătită'],
    ['FULFILLED', 'Livrată'],
    ['OPEN', 'Deschisă'],
    ['CLOSED', 'Închisă'],
    ['ARCHIVED', 'Arhivată'],
  ];

  for (const [input, expected] of cases) {
    it(`maps ${input} → ${expected}`, () => {
      expect(statusLabel(input)).toBe(expected);
    });
  }

  it('is case-insensitive', () => {
    expect(statusLabel('placed')).toBe('Plasată');
    expect(statusLabel('Cancelled')).toBe('Anulată');
  });

  it('replaces underscores for unknown statuses', () => {
    expect(statusLabel('SOME_STATUS')).toBe('SOME STATUS');
  });

  it('returns empty string for empty input', () => {
    expect(statusLabel('')).toBe('');
  });

  it('handles null and undefined', () => {
    expect(statusLabel(null)).toBe('');
    expect(statusLabel(undefined)).toBe('');
  });
});
