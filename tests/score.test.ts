import { describe, it, expect } from 'vitest';
import { calculate } from '../src/data/program';
import { layouts } from '../src/lib/layout';
import { score } from '../src/lib/score';

const I = { siteW: 300, siteD: 240, units: 500, mix: { small: 20, medium: 20, large: 40, xl: 20 } };
describe('score', () => {
  it('prints and ranks', () => {
    const p = calculate(I.units, 3.5);
    const s = layouts(p, I).map((L) => score(L, p, I));
    for (const x of s) console.log(x.key, x.total, '/', x.max, x.measures.map((m) => `${m.id}:${m.score}`).join(' '), '|', x.checks.map((c) => `${c.id}:${c.pass ? 'v' : 'x'}`).join(' '));
    for (const x of s) { expect(x.max).toBe(28); expect(x.total).toBeGreaterThan(0); expect(x.total).toBeLessThanOrEqual(28); }
    expect(new Set(s.map((x) => x.total)).size).toBeGreaterThan(1);
  });
});
