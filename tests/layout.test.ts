import { describe, it, expect } from 'vitest';
import { calculate } from '../src/data/program';
import { layouts, residentialGFA, type Rect } from '../src/lib/layout';

const I = { siteW: 300, siteD: 240, units: 500, mix: { small: 20, medium: 20, large: 40, xl: 20 } };
const hit = (a: Rect, b: Rect) => a.x < b.x + b.w - 0.01 && b.x < a.x + a.w - 0.01 && a.y < b.y + b.d - 0.01 && b.y < a.y + a.d - 0.01;
const inside = (a: Rect, s: Rect) => a.x >= s.x - 0.01 && a.y >= s.y - 0.01 && a.x + a.w <= s.x + s.w + 0.01 && a.y + a.d <= s.y + s.d + 0.01;

describe('layouts', () => {
  for (const [units, W, D] of [[200, 300, 240], [500, 300, 240], [900, 300, 240], [2160, 520, 416]]) {
    const p = calculate(units, 3.5), i = { ...I, units, siteW: W, siteD: D };
    for (const L of layouts(p, i)) {
      it(`${L.key} ${units} units: no overlaps, inside site, all public placed, GFA covered`, () => {
        const solids: (Rect & { id: string })[] = [...L.boxes, ...L.parks.map((r, k) => ({ ...r, id: 'park' + k })), ...L.streets.map((r, k) => ({ ...r, id: 'st' + k })), ...L.plaza.map((r) => ({ ...r, id: 'plaza' })), ...L.surfaceParking.map((r, k) => ({ ...r, id: 'lot' + k }))];
        const bad: string[] = [];
        for (let a = 0; a < solids.length; a++) for (let b = a + 1; b < solids.length; b++) {
          if (solids[a].id.startsWith('st') && solids[b].id.startsWith('st')) continue;
          if (hit(solids[a], solids[b])) bad.push(`${solids[a].id}×${solids[b].id}`);
        }
        expect(bad).toEqual([]);
        for (const s of solids) expect(inside(s, L.site), s.id).toBe(true);
        const pubIds = p.built.filter((r) => r.use !== 'com').reduce((a, r) => a + Math.max(1, r.count), 0);
        expect(L.boxes.filter((b) => b.use === 'edu' || b.use === 'pub').length).toBe(pubIds);
        const res = L.boxes.filter((b) => b.use === 'res');
        expect(res.reduce((a, b) => a + b.w * b.d * b.floors, 0)).toBeGreaterThanOrEqual(residentialGFA(i) * 0.999);
        console.log(L.key, units, 'res', res.length, 'floors', res[0]?.floors, 'open', Math.round(L.openPlaced), '/', p.openSpace, 'park u/s', L.parkingUnder, L.parkingSurface, '/', p.parking);
      });
    }
  }
});
