/**
 * TEMPORAIRE — helper de log pour mesurer la latence de la première note.
 * NE PAS MERGER. Supprimer avec `app/api/dev-latency-tmp/` et les appels `dlog()`.
 */

let _session = '';
function sessionId(): string {
  if (!_session) {
    _session =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID().slice(0, 8)
        : String(Math.random()).slice(2, 10);
  }
  return _session;
}

export function dlog(event: string, data?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  const payload = {
    session: sessionId(),
    t: Math.round(performance.now()),
    event,
    prime: !window.location.search.includes('noprime'),
    ...(data ?? {}),
  };
  try {
    void fetch('/api/dev-latency-tmp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // best effort
  }
}
