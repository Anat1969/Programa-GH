// טקסט מחושב: שורת תובנה עד 8 מילים, משפט הסבר עד 20 מילים. ** מודגש, == מרקר.
import type { Program } from '../data/program';
import type { Layout } from './layout';
import type { Score } from './score';

export const n0 = (n: number) => Math.round(n).toLocaleString('he-IL');
export const LET: Record<string, string> = { A: 'א', B: 'ב', C: 'ג' };

export function programInsight(p: Program) {
  const kinder = p.sections[0].rows.find((r) => r.id === 'kinder')!;
  const k = kinder.value.split(' ')[0];
  return {
    title: `**${n0(p.residents)}** תושבים צריכים **${k}** כיתות גן.`,
    sub: `ועוד **${n0(p.totals.edu)}** מ"ר חינוך, **${n0(p.openSpace)}** מ"ר שצ"פ ו-**${n0(p.parking)}** חניות.`,
  };
}

export function ranking(scores: Score[]) {
  return scores.slice().sort((a, b) => b.total - a.total);
}

// המדד שמפריד בין החלופות: הפער הגדול בין הגבוה לנמוך
export function divider(scores: Score[]) {
  const ids = scores[0].measures.map((m) => m.id);
  const spread = ids.map((id) => {
    const v = scores.map((s) => ({ k: s.key, v: s.measures.find((m) => m.id === id)! }));
    const hi = v.reduce((a, b) => (b.v.score > a.v.score ? b : a)), lo = v.reduce((a, b) => (b.v.score < a.v.score ? b : a));
    return { id, title: hi.v.title, hi, lo, gap: hi.v.score - lo.v.score };
  }).sort((a, b) => b.gap - a.gap);
  return spread[0];
}

export function siteHeadline(scores: Score[], alts: Layout[]) {
  const r = ranking(scores);
  const top = r[0], second = r[1];
  const d = divider(scores);
  const name = (k: string) => alts.find((a) => a.key === k)!.name;
  const tie = top.total - second.total < 0.5;
  return {
    title: tie ? `**${name(top.key)}** ו**${name(second.key)}** כמעט שוות.` : `**חלופה ${LET[top.key]}, ${name(top.key)}**, מובילה.`,
    sub: `**${top.total}** מתוך **${top.max}** נקודות. המדד שמפריד: **${d.title}**, ${LET[d.hi.k]} **${d.hi.v.score}** מול ${LET[d.lo.k]} **${d.lo.v.score}**.`,
  };
}

// חוזקה וחולשה ביחס לשתי החלופות האחרות, לא במוחלט: מדד שכולן שוות בו לא מספר דבר
export function altInsight(s: Score, L: Layout, all?: Score[]) {
  const others = (all ?? [s]).filter((x) => x.key !== s.key);
  const edge = (id: string) => {
    const mine = s.measures.find((m) => m.id === id)!;
    const avg = others.length ? others.reduce((a, o) => a + o.measures.find((m) => m.id === id)!.score, 0) / others.length : 0;
    return (mine.score - avg) / mine.max;
  };
  const strong = s.measures.slice().sort((a, b) => edge(b.id) - edge(a.id))[0];
  const weak = s.measures.slice().sort((a, b) => edge(a.id) - edge(b.id))[0];
  const failed = s.checks.filter((c) => !c.pass);
  return {
    title: `חזקה ב**${strong.title}**, חלשה ב**${weak.title}**.`,
    sub: failed.length ? `לא עומדת ב: ${failed.map((c) => c.title).join(', ')}.` : `עומדת בכל ${s.checks.length} הבדיקות מול מדיניות אשדוד והתקן.`,
    idea: L.idea,
  };
}
