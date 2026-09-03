/**
 * TEMPORAIRE — sink de log pour mesurer la latence de la première note.
 * NE PAS MERGER. Supprimer ce dossier + `lib/dlog-tmp.ts` + les appels `dlog()`.
 * Méthode décrite dans la mémoire projet `project_audio_init_latency`.
 */
import { appendFile } from 'node:fs/promises';
import { NextResponse } from 'next/server';

const LOG_PATH = '/tmp/typewav-latency.log';

export async function POST(request: Request): Promise<NextResponse> {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  try {
    const body: unknown = await request.json();
    await appendFile(LOG_PATH, `${JSON.stringify(body)}\n`, 'utf8');
  } catch {
    // best effort
  }
  return NextResponse.json({ ok: true });
}
