/**
 * Structured error logging for route catch blocks. Generates a requestId that
 * the route should return in its JSON error body, so a user-reported error
 * can be matched to the server log line (mirrors handleError in
 * hooks.server.ts, which does the same for uncaught errors).
 */
export function logRouteError(scope: string, error: unknown) {
  const requestId = crypto.randomUUID();
  console.error(`[${scope}] request failed`, { requestId, error });
  return requestId;
}
