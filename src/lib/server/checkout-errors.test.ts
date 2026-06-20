import { describe, expect, it } from 'vitest';
import { mapRpcError } from './checkout-errors';

function err(message: string) {
  return { message };
}

describe('mapRpcError', () => {
  it('returns null for null input', () => {
    expect(mapRpcError(null)).toBeNull();
  });

  it('returns null for non-object input', () => {
    expect(mapRpcError('string error')).toBeNull();
    expect(mapRpcError(42)).toBeNull();
  });

  it('returns null for object without message', () => {
    expect(mapRpcError({ code: 'P0001' })).toBeNull();
  });

  it('returns null for unknown message', () => {
    expect(mapRpcError(err('An unexpected internal error occurred'))).toBeNull();
  });

  it('maps auth required error → 401', () => {
    const result = mapRpcError(err('Checkout requires an active user in session'));
    expect(result).toEqual({ error: 'Autentificarea este necesară pentru checkout.', status: 401 });
  });

  it('maps admin order error → 403', () => {
    const result = mapRpcError(err('Admins cannot place orders'));
    expect(result).toEqual({ error: 'Adminii nu pot face comenzi.', status: 403 });
  });

  it('maps empty cart error → 400', () => {
    const result = mapRpcError(err('Checkout requires at least one item'));
    expect(result).toEqual({ error: 'Coșul este gol.', status: 400 });
  });

  it('maps product unavailable error → 400', () => {
    const result = mapRpcError(err('Product is not available for sale'));
    expect(result).toEqual({ error: 'Unul dintre produse nu mai este disponibil.', status: 400 });
  });

  it('maps insufficient stock error → 409', () => {
    const result = mapRpcError(err('Insufficient stock for product 42'));
    expect(result).toEqual({ error: 'Stoc insuficient pentru unul dintre produse.', status: 409 });
  });

  it('maps product not found error → 400', () => {
    const result = mapRpcError(err('Product no longer exists'));
    expect(result).toEqual({ error: 'Unul dintre produse nu mai există.', status: 400 });
  });

  it('maps incomplete address error → 400', () => {
    const result = mapRpcError(err('Delivery address is incomplete'));
    expect(result).toEqual({ error: 'Adresa de livrare este incompletă.', status: 400 });
  });

  it('maps stale checkout SQL ambiguity to an actionable server error', () => {
    const result = mapRpcError(err('column reference "currency_code" is ambiguous'));
    expect(result).toEqual({
      error: 'Funcția de checkout din baza de date trebuie actualizată. Reaplică migrarea Supabase.',
      status: 500,
    });
  });

  it.each([
    'Invalid checkout item at index 0',
    'Item quantity must be positive',
    'Checkout items cannot be empty',
    'Delivery method is not recognized',
    'Country code must be 2 chars',
    'Full name is required',
    'Phone is required',
  ])('maps validation error "%s" → 400 invalid data', (message) => {
    const result = mapRpcError(err(message));
    expect(result).toEqual({ error: 'Datele pentru checkout sunt invalide.', status: 400 });
  });

  it('coerces non-string message to string', () => {
    const result = mapRpcError({ message: 42 });
    expect(result).toBeNull();
  });
});
