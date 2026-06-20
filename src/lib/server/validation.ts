import { json } from '@sveltejs/kit';

export class RequestValidationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'RequestValidationError';
    this.status = status;
  }
}

type JsonBodyOptions = {
  maxBytes?: number;
  allowEmpty?: boolean;
};

type StringOptions = {
  required?: boolean;
  max?: number;
  min?: number;
  pattern?: RegExp;
  defaultValue?: string;
  fieldLabel?: string;
};

type NumberOptions = {
  required?: boolean;
  min?: number;
  max?: number;
  integer?: boolean;
  defaultValue?: number;
  fieldLabel?: string;
};

const DEFAULT_JSON_MAX_BYTES = 64 * 1024;
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export const LIMITS = {
  tinyJson: 8 * 1024,
  smallJson: 32 * 1024,
  json: DEFAULT_JSON_MAX_BYTES,
  largeJson: 128 * 1024,
  upload: 12 * 1024 * 1024,
  message: 2_000,
  longText: 5_000,
} as const;

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function validationErrorResponse(error: unknown) {
  if (!(error instanceof RequestValidationError)) return null;
  return json({ error: error.message }, { status: error.status });
}

export async function readJsonBody(request: Request, options: JsonBodyOptions = {}) {
  const maxBytes = options.maxBytes ?? DEFAULT_JSON_MAX_BYTES;
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? '';

  if (!contentType.includes('application/json')) {
    throw new RequestValidationError('Content-Type trebuie să fie application/json.', 415);
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new RequestValidationError('Payload prea mare.', 413);
  }

  const text = await request.text();
  const byteLength = new TextEncoder().encode(text).length;
  if (byteLength > maxBytes) {
    throw new RequestValidationError('Payload prea mare.', 413);
  }

  if (!text.trim()) {
    if (options.allowEmpty) return {};
    throw new RequestValidationError('Payload JSON lipsă.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new RequestValidationError('Payload JSON malformat.');
  }

  if (!isPlainObject(parsed)) {
    throw new RequestValidationError('Payload JSON invalid.');
  }

  return parsed;
}

export function cleanString(value: unknown) {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  return String(value).replace(CONTROL_CHARS, '').trim();
}

export function stringField(body: Record<string, unknown>, field: string, options: StringOptions = {}) {
  const label = options.fieldLabel ?? field;
  const raw = body[field];

  if (raw == null || raw === '') {
    if (options.required) throw new RequestValidationError(`${label} este obligatoriu.`);
    return options.defaultValue ?? '';
  }

  const value = cleanString(raw);
  const max = options.max ?? 255;

  if (options.required && !value) throw new RequestValidationError(`${label} este obligatoriu.`);
  if (options.min != null && value.length < options.min) {
    throw new RequestValidationError(`${label} este prea scurt.`);
  }
  if (value.length > max) throw new RequestValidationError(`${label} este prea lung.`);
  if (options.pattern && value && !options.pattern.test(value)) {
    throw new RequestValidationError(`${label} are un format invalid.`);
  }

  return value;
}

export function nullableStringField(body: Record<string, unknown>, field: string, options: StringOptions = {}) {
  const value = stringField(body, field, { ...options, required: false });
  return value || null;
}

export function numberField(body: Record<string, unknown>, field: string, options: NumberOptions = {}) {
  const label = options.fieldLabel ?? field;
  const raw = body[field];

  if (raw == null || raw === '') {
    if (options.required) throw new RequestValidationError(`${label} este obligatoriu.`);
    return options.defaultValue ?? 0;
  }

  const value = Number(raw);
  if (!Number.isFinite(value)) throw new RequestValidationError(`${label} trebuie să fie numeric.`);
  if (options.integer && !Number.isInteger(value)) {
    throw new RequestValidationError(`${label} trebuie să fie un număr întreg.`);
  }
  if (options.min != null && value < options.min) throw new RequestValidationError(`${label} este prea mic.`);
  if (options.max != null && value > options.max) throw new RequestValidationError(`${label} este prea mare.`);

  return value;
}

export function booleanField(body: Record<string, unknown>, field: string, defaultValue = false) {
  const raw = body[field];
  if (raw == null || raw === '') return defaultValue;
  if (typeof raw === 'boolean') return raw;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  throw new RequestValidationError(`${field} trebuie să fie boolean.`);
}

export function enumField<T extends string>(
  body: Record<string, unknown>,
  field: string,
  allowed: readonly T[],
  defaultValue: T
) {
  const value = cleanString(body[field] ?? defaultValue).toUpperCase();
  if (!allowed.includes(value as T)) {
    throw new RequestValidationError(`${field} are o valoare invalidă.`);
  }
  return value as T;
}

export function optionalEnumField<T extends string>(
  body: Record<string, unknown>,
  field: string,
  allowed: readonly T[]
) {
  if (!(field in body) || body[field] == null || body[field] === '') return undefined;
  const value = cleanString(body[field]).toUpperCase();
  if (!allowed.includes(value as T)) {
    throw new RequestValidationError(`${field} are o valoare invalidă.`);
  }
  return value as T;
}

export function requireNumericId(value: unknown, label = 'ID') {
  const id = cleanString(value);
  if (!/^\d+$/.test(id)) throw new RequestValidationError(`${label} invalid.`);
  return id;
}

export function requireRouteId(value: unknown, label = 'ID') {
  const id = cleanString(value);
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(id)) throw new RequestValidationError(`${label} invalid.`);
  return id;
}

export function parseIsoDate(value: unknown, label = 'Data') {
  const raw = cleanString(value);
  if (!raw) return null;

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw new RequestValidationError(`${label} are un format invalid.`);
  }

  return date.toISOString();
}

export function safeUrl(value: unknown, max = 2_000) {
  const url = cleanString(value);
  if (!url) return null;
  if (url.length > max) throw new RequestValidationError('URL-ul este prea lung.');
  if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) {
    throw new RequestValidationError('URL invalid.');
  }
  return url;
}

export function arrayField(body: Record<string, unknown>, field: string, maxItems: number) {
  const value = body[field];
  if (!Array.isArray(value)) throw new RequestValidationError(`${field} trebuie să fie listă.`);
  if (value.length > maxItems) throw new RequestValidationError(`${field} conține prea multe elemente.`);
  return value;
}
