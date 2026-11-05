// ניסוח לוועדה: Gemini החינמי דרך פונקציית Edge, Claude רק כגיבוי. המפתחות לא מגיעים לדפדפן.
// תקן הזיקוק: https://github.com/Anat1969/Claude-GH/blob/main/docs/ai-text-standard.md
import type { Program } from '../data/program';
import type { Layout } from './layout';
import type { Score } from './score';

export const SUPABASE_URL = 'https://ktqmwpbzcnzkhjskqisy.supabase.co';
export const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0cW13cGJ6Y256a2hqc2txaXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxODM4OTgsImV4cCI6MjEwNTc1OTg5OH0.uPKn4hrLk16jhDoajMjPl4OmV5j1b3bMIECVmOdhWGI';
export const FN = `${SUPABASE_URL}/functions/v1/programa-brief`;

export interface Part { insight: string; detail: string }
export interface Brief { headline: Part; alternatives: { key: 'A' | 'B' | 'C'; text: Part }[]; recommendation: Part; steps: string[]; engine: 'gemini' | 'claude' }

export function briefPayload(p: Program, alts: Layout[], scores: Score[]) {
  return {
    program: { units: p.units, residents: p.residents, eduM2: p.totals.edu, publicM2: p.totals.pub, openSpaceM2: p.openSpace, parking: p.parking },
    alternatives: alts.map((L, k) => {
      const s = scores[k];
      return {
        key: L.key, letter: ({ A: 'א', B: 'ב', C: 'ג' } as const)[L.key], name: L.name, idea: L.idea,
        total: s.total, max: s.max, maxFloors: s.stats.maxFloors, openPlacedM2: Math.round(s.stats.openPlaced), parkingMissing: s.stats.parkingMissing,
        measures: s.measures.map((m) => ({ id: m.id, title: m.title, score: m.score, max: m.max, value: m.value })),
        checks: s.checks.map((c) => ({ id: c.id, title: c.title, pass: c.pass, value: c.value })),
      };
    }),
  };
}

export async function requestBrief(p: Program, alts: Layout[], scores: Score[], signal?: AbortSignal): Promise<Brief> {
  const r = await fetch(FN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
    body: JSON.stringify(briefPayload(p, alts, scores)),
    signal,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error ?? `השרת החזיר ${r.status}`);
  return j as Brief;
}
