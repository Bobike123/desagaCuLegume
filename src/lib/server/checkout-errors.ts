export type CheckoutErrorMatch = { error: string; status: number };

type RpcErrorEntry = {
  fragments: string[];
  error: string;
  status: number;
};

// Each entry covers one logical failure. When the DB function gains structured
// error codes, add a `code` field and match on that first; fragments are the
// fallback for the current message-only API.
const RPC_ERRORS: RpcErrorEntry[] = [
  { fragments: ['Checkout requires an active user'], error: 'Autentificarea este necesară pentru checkout.', status: 401 },
  { fragments: ['Admins cannot place orders'], error: 'Adminii nu pot face comenzi.', status: 403 },
  { fragments: ['Checkout requires at least one item'], error: 'Coșul este gol.', status: 400 },
  { fragments: ['Product is not available'], error: 'Unul dintre produse nu mai este disponibil.', status: 400 },
  { fragments: ['Insufficient stock'], error: 'Stoc insuficient pentru unul dintre produse.', status: 409 },
  { fragments: ['Product no longer exists'], error: 'Unul dintre produse nu mai există.', status: 400 },
  { fragments: ['Delivery address is incomplete'], error: 'Adresa de livrare este incompletă.', status: 400 },
  {
    fragments: ['column reference "currency_code" is ambiguous'],
    error: 'Funcția de checkout din baza de date trebuie actualizată. Reaplică migrarea Supabase.',
    status: 500,
  },
  {
    fragments: [
      'Invalid checkout item',
      'Item quantity',
      'Checkout items',
      'Delivery method',
      'Country code',
      'Full name',
      'Phone',
      'Email',
    ],
    error: 'Datele pentru checkout sunt invalide.',
    status: 400,
  },
];

export function mapRpcError(error: unknown): CheckoutErrorMatch | null {
  if (typeof error !== 'object' || error === null || !('message' in error)) return null;
  const message = String((error as Record<string, unknown>).message);
  for (const entry of RPC_ERRORS) {
    if (entry.fragments.some((fragment) => message.includes(fragment))) {
      return { error: entry.error, status: entry.status };
    }
  }
  return null;
}
