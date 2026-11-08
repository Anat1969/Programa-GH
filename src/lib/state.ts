// מצב התוכנית בכתובת (העתקת קישור פותחת אותו מצב) ובזיכרון המקומי.
import { useMemo } from 'react';
import { useRoute, setParams } from './route';
import { calculate, CITIES } from '../data/program';
import { layouts, type Inputs, type Mix } from './layout';
import { score } from './score';

const KEY = 'programa:v1';
const load = (): Record<string, string> => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
const save = (s: Record<string, string>) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* פרטי */ } };
export const DEF = { u: '500', c: 'ashdod', m: '20.20.40.20', s: '300x240' };
const clampN = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function usePlan() {
  const { q } = useRoute();
  const saved = load();
  const get = (k: keyof typeof DEF) => q.get(k) ?? saved[k] ?? DEF[k];
  const units = clampN(parseInt(get("u"), 10) || 500, 20, 5000);
  const city = CITIES.find((x) => x.id === get('c')) ?? CITIES[0];
  const mm = get('m').split('.').map((x) => clampN(parseInt(x, 10) || 0, 0, 100));
  const mix: Mix = { small: mm[0] ?? 20, medium: mm[1] ?? 20, large: mm[2] ?? 40, xl: mm[3] ?? 20 };
  const [sw, sd] = get('s').split('x').map((x) => clampN(parseInt(x, 10) || 0, 160, 600));
  const inputs: Inputs = { siteW: sw || 300, siteD: sd || 240, units, mix };
  const key = [units, city.id, get('m'), get('s')].join('|');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const data = useMemo(() => {
    const program = calculate(units, city.coefficient);
    const alts = layouts(program, inputs);
    const scores = alts.map((L) => score(L, program, inputs));
    return { program, alts, scores };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (patch: Partial<Record<keyof typeof DEF, string>>) => {
    const next = { u: String(units), c: city.id, m: get('m'), s: get('s'), ...patch };
    save(next);
    setParams(next);
  };
  return { inputs, city, ...data, set };
}
