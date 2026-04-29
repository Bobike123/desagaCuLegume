import type { RequestEvent } from '@sveltejs/kit';

export const isAuthenticated = (event: RequestEvent): boolean => {
  return Boolean(event.locals.isAuthenticated);
};

export const getCurrentUser = (event: RequestEvent) => {
  return event.locals.user;
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isStrongPassword = (password: string): boolean => {
  return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
};

export const handleApiError = (
  error: unknown,
  defaultMessage: string = 'An error occurred'
) => {
  if (error instanceof Error) {
    return { error: error.message, status: 500 };
  }
  return { error: defaultMessage, status: 500 };
};

export const validateRequired = (
  data: Record<string, any>,
  fields: string[]
): string[] => {
  const missingFields: string[] = [];
  fields.forEach((field) => {
    if (!data[field] || data[field].toString().trim() === '') {
      missingFields.push(field);
    }
  });
  return missingFields;
};

export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};
