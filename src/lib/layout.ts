// שלוש חלופות העמדה לאותה פרוגרמה. כל חלופה היא רשימת מלבנים במטרים: x מזרחה, y צפונה, (0,0) בפינה הדרום־מערבית.
// אין כאן ציון. הציון מחושב מהגיאומטריה ב-score.ts, כך שכל מספר נגזר ממה שרואים במודל.
import type { Program, Row } from '../data/program';

export type BUse = 'res' | 'com' | 'edu' | 'pub';
export interface Rect { x: number; y: number; w: number; d: number }
export interface Box extends Rect { id: string; label: string; use: BUse; floors: number; fh: number; ground?: BUse }
export interface Layout {
  key: AltKey; name: string; idea: string;
  site: Rect;
  boxes: Box[];
  parks: (Rect & { label: string })[];
  streets: Rect[];
  plaza: Rect[];
  surfaceParking: Rect[];
  courtyards: Rect[];
  parkingUnder: number;       // מקומות בחניון תת־קרקעי
  parkingSurface: number;     // מקומות על הקרקע
  openPlaced: number;         // מ"ר שצ"פ שהועמד
}
export type AltKey = 'A' | 'B' | 'C';
export interface Inputs { siteW: number; siteD: number; mix: Mix; units: number }
export interface Mix { small: number; medium: number; large: number; xl: number } // אחוזים
export const MIX_SIZE = { small: 50, medium: 75, large: 110, xl: 135 }; // מ"ר פלדלת ממוצע לסוג (הנחה)
export const GROSS = 1.25;            // ברוטו לפלדלת במגורים (הנחה)
export const STREET = 12;             // רוחב רחוב שכונתי, מ'
export const MAIN = 20;               // רוחב רחוב ראשי, מ'
export const FH_RES = 3.2, FH_PUB = 4;
const SPACE = 30;                     // מ"ר לחניה תת־קרקעית כולל מעברים (הנחה)
const LEVELS = 2;                     // קומות חניון מתחת לבניין (הנחה)
const SPACE_SURF = 25;                // מ"ר לחניה על הקרקע כולל מעברים (הנחה)

export const residentialGFA = (i: Inputs) => {
  const t = i.mix.small + i.mix.medium + i.mix.large + i.mix.xl || 1;
  const avg = (i.mix.small * MIX_SIZE.small + i.mix.medium * MIX_SIZE.medium + i.mix.large * MIX_SIZE.large + i.mix.xl * MIX_SIZE.xl) / t;
  return i.units * avg * GROSS;
};

// מבנה ציבור: טביעת רגל קרובה לריבוע, לפי השטח והקומות.
function pubBoxes(p: Program): { row: Row; w: number; d: number; floors: number; n: number }[] {
  return p.built.filter((row) => row.use !== 'com').flatMap((row) => {
    const n = Math.max(1, row.count);
    const fp = Math.max(120, row.area / n / row.floors);
    const w = Math.round(Math.sqrt(fp * 1.5));
    const d = Math.max(8, Math.round(fp / w));
    return Array.from({ length: n }, (_, k) => ({ row: { ...row, id: n > 1 ? `${row.id}${k + 1}` : row.id, label: n > 1 ? `${row.label.replace(/\s*\(.*\)$/, '')} ${k + 1}` : row.label }, w, d, floors: row.floors, n }));
  });
}

const ring = (s: Rect): Rect[] => [
  { x: s.x, y: s.y, w: s.w, d: STREET },
  { x: s.x, y: s.y + s.d - STREET, w: s.w, d: STREET },
  { x: s.x, y: s.y + STREET, w: STREET, d: s.d - 2 * STREET },
  { x: s.x + s.w - STREET, y: s.y + STREET, w: STREET, d: s.d - 2 * STREET },
];
const inner = (s: Rect, m: number): Rect => ({ x: s.x + m, y: s.y + m, w: s.w - 2 * m, d: s.d - 2 * m });
const area = (r: Rect) => r.w * r.d;

// מניח מלבנים ברצף לאורך שורה בתוך אזור, משמאל לימין ושורה אחר שורה. מחזיר רק מה שנכנס.
function pack(zone: Rect, items: { w: number; d: number }[], gap: number): (Rect | null)[] {
  const out: (Rect | null)[] = [];
  let x = zone.x, y = zone.y, rowH = 0;
  for (const it of items) {
    if (x + it.w > zone.x + zone.w + 0.01) { x = zone.x; y += rowH + gap; rowH = 0; }
    if (it.w > zone.w || y + it.d > zone.y + zone.d + 0.01) { out.push(null); continue; }
    out.push({ x, y, w: it.w, d: it.d });
    x += it.w + gap; rowH = Math.max(rowH, it.d);
  }
  return out;
}

// מבנים לאורך היקף מלבן (פנימה), עומק depth, אורך מקטע seg ורווח gap. בסיס לבלוק היקפי ולטבעת סביב פארק.
function perimeter(r: Rect, depth: number, seg: number, gap: number): Rect[] {
  const out: Rect[] = [];
  const along = (x0: number, y0: number, len: number, horiz: boolean) => {
    const n = Math.max(1, Math.floor((len + gap) / (seg + gap)));
    const s = (len - gap * (n - 1)) / n;
    for (let k = 0; k < n; k++) {
      const o = k * (s + gap);
      out.push(horiz ? { x: x0 + o, y: y0, w: s, d: depth } : { x: x0, y: y0 + o, w: depth, d: s });
    }
  };
  along(r.x, r.y, r.w, true);
  along(r.x, r.y + r.d - depth, r.w, true);
  along(r.x, r.y + depth + gap, r.d - 2 * (depth + gap), false);
  along(r.x + r.w - depth, r.y + depth + gap, r.d - 2 * (depth + gap), false);
  return out.filter((q) => q.w > 6 && q.d > 6);
}

function finishParking(L: Omit<Layout, 'parkingUnder' | 'parkingSurface' | 'surfaceParking'>, need: number, lots: Rect[]): Layout {
  const under = Math.floor(L.boxes.filter((b) => b.use === 'res').reduce((a, b) => a + area(b), 0) * LEVELS / SPACE
    + L.courtyards.reduce((a, c) => a + area(c), 0) * 1 / SPACE);
  const parkingUnder = Math.min(need, under);
  let rest = need - parkingUnder;
  const surfaceParking: Rect[] = [];
  for (const lot of lots) {
    if (rest <= 0) break;
    const cap = Math.floor(area(lot) / SPACE_SURF);
    const use = Math.min(cap, rest);
    const d = Math.max(6, Math.ceil((use * SPACE_SURF) / lot.w));
    surfaceParking.push({ x: lot.x, y: lot.y, w: lot.w, d: Math.min(d, lot.d) });
    rest -= use;
  }
  return { ...L, surfaceParking, parkingUnder, parkingSurface: need - parkingUnder - Math.max(0, rest) };
}

const floorsFor = (gfa: number, fp: number, min = 2) => Math.max(min, Math.ceil(gfa / Math.max(1, fp)));

// ---------- א: מוקד ציבורי, מגדלים בפינות ----------
function altA(p: Program, i: Inputs): Layout {
  const site = { x: 0, y: 0, w: i.siteW, d: i.siteD };
  const streets = ring(site);
  const core = inner(site, STREET + 6);
  const pub = pubBoxes(p);
  const plazaS = 44;
  const plaza = { x: site.w / 2 - plazaS / 2, y: site.d / 2 - plazaS / 2, w: plazaS, d: plazaS };
  // מבני הציבור סביב הכיכר, בטבעת שמתרחבת עד שכולם נכנסים
  const boxes: Box[] = [];
  let civic = inner(plaza, -4);
  let placed: (Rect | null)[] = [];
  for (let grow = 0; grow < 8; grow++) {
    const frame = inner(plaza, -(4 + 26 + grow * 6));
    const zones = [
      { x: frame.x, y: frame.y, w: frame.w, d: plaza.y - 4 - frame.y },                 // דרום
      { x: frame.x, y: plaza.y + plaza.d + 4, w: frame.w, d: frame.y + frame.d - plaza.y - plaza.d - 4 }, // צפון
    ];
    const items = [...pub, { row: { id: 'retail', label: 'מסחר שכונתי', area: p.totals.com, use: 'com', floors: 1 } as Row, w: Math.max(20, Math.round(p.totals.com / 12)), d: 12, floors: 1, n: 1 }];
    const half = Math.ceil(items.length / 2);
    const a = pack(zones[0], items.slice(0, half), 4), b = pack(zones[1], items.slice(half), 4);
    placed = [...a, ...b];
    if (placed.every(Boolean)) {
      civic = frame;
      items.forEach((it, k) => { const r = placed[k]!; boxes.push({ ...r, id: it.row.id, label: it.row.label, use: it.row.use as BUse, floors: it.floors, fh: FH_PUB }); });
      break;
    }
  }
  // פארקים מזרחה ומערבה למוקד
  const parks: Layout['parks'] = [];
  const parkW = Math.max(0, Math.min((civic.x - core.x) - 8, p.openSpace / 2 / civic.d));
  if (parkW > 10) {
    parks.push({ x: civic.x - parkW, y: civic.y, w: parkW, d: civic.d, label: 'פארק מערבי' });
    parks.push({ x: civic.x + civic.w, y: civic.y, w: parkW, d: civic.d, label: 'פארק מזרחי' });
  }
  // מגדלים בשתי רצועות, צפון ודרום למוקד
  const gfa = residentialGFA(i);
  const T = 24, step = T + 40;
  const bands = [{ x: core.x, y: core.y, w: core.w, d: civic.y - core.y - 6 }, { x: core.x, y: civic.y + civic.d + 6, w: core.w, d: core.y + core.d - civic.y - civic.d - 6 }];
  const slots: Rect[] = [];
  bands.forEach((b, bi) => {
    if (b.d < T) return;
    const n = Math.floor((b.w + 40) / step);
    const x0 = b.x + (b.w - (n * step - 40)) / 2;
    // המגדלים צמודים למוקד, והחניה על הקרקע לכיוון הרחוב
    for (let k = 0; k < n; k++) slots.push({ x: x0 + k * step, y: bi === 0 ? b.y + b.d - T : b.y, w: T, d: T });
  });
  const use = slots.length;
  const fl = floorsFor(gfa, use * T * T, 4);
  slots.forEach((s, k) => boxes.push({ ...s, id: `t${k + 1}`, label: `מגדל ${k + 1}`, use: 'res', floors: fl, fh: FH_RES }));
  const lots = [
    { x: bands[0].x, y: bands[0].y, w: bands[0].w, d: bands[0].d - T - 8 },
    { x: bands[1].x, y: bands[1].y + T + 8, w: bands[1].w, d: bands[1].d - T - 8 },
  ].filter((r) => r.d >= 6);
  const base = { key: 'A' as const, name: 'מוקד ציבורי', idea: 'כל מבני הציבור סביב כיכר אחת במרכז, מגדלים מגורים בשתי רצועות.', site, boxes, parks, streets, plaza: [plaza], courtyards: [], openPlaced: parks.reduce((a, r) => a + area(r), 0) };
  return finishParking(base, p.parking, lots);
}

// ---------- ב: רחוב ראשי, בלוקים היקפיים ----------
function altB(p: Program, i: Inputs): Layout {
  const site = { x: 0, y: 0, w: i.siteW, d: i.siteD };
  const parkW = Math.max(20, Math.min(70, p.openSpace / (site.d - 2 * STREET)));
  const main = { x: STREET + parkW, y: site.d / 2 - MAIN / 2, w: site.w - 2 * STREET - parkW, d: MAIN };
  const streets = [...ring(site), main];
  const pub = pubBoxes(p);
  const boxes: Box[] = [];
  // קמפוס ציבורי בקצה המזרחי, בשני צדי הרחוב
  const campusW = Math.max(56, Math.min(90, Math.ceil(pub.reduce((a, b) => a + b.w * b.d, 0) / ((site.d - 2 * STREET - MAIN) * 0.55) / 2) * 2 + 20));
  const cx = site.w - STREET - campusW;
  const campus = [{ x: cx + 4, y: STREET + 4, w: campusW - 8, d: main.y - STREET - 8 }, { x: cx + 4, y: main.y + MAIN + 4, w: campusW - 8, d: site.d - STREET - main.y - MAIN - 8 }];
  // מוסדות קטנים קודם, צמוד לרחוב: ממיינים כך שהגדולים בפינה
  const half = Math.ceil(pub.length / 2);
  const placeHalf = (zone: Rect, items: typeof pub, nearTop: boolean) => {
    const r = pack(zone, items, 4);
    items.forEach((it, k) => {
      const q = r[k]; if (!q) return;
      // צמוד לרחוב הראשי: בחצי הדרומי מעלים את השורה כלפי הרחוב
      const y = nearTop ? zone.y + zone.d - (q.y - zone.y) - q.d : q.y;
      boxes.push({ ...q, y, id: it.row.id, label: it.row.label, use: it.row.use as BUse, floors: it.floors, fh: FH_PUB });
    });
  };
  placeHalf(campus[0], pub.slice(0, half), true);
  placeHalf(campus[1], pub.slice(half), false);
  // פארק לינארי בקצה המערבי, והרחוב הראשי נגמר בו
  const parks: Layout['parks'] = [{ x: STREET, y: STREET, w: parkW, d: site.d - 2 * STREET, label: 'פארק מערבי' }];
  // ארבעה בלוקים היקפיים, רחוב מקומי צפון־דרום ביניהם
  const x0 = STREET + parkW + 8, x1 = cx - 4;
  const midX = (x0 + x1) / 2;
  const local = { x: midX - STREET / 2, y: STREET, w: STREET, d: site.d - 2 * STREET };
  streets.push({ x: local.x, y: STREET, w: STREET, d: main.y - STREET }, { x: local.x, y: main.y + MAIN, w: STREET, d: site.d - STREET - main.y - MAIN });
  const blocks: Rect[] = [
    { x: x0, y: STREET + 4, w: local.x - 4 - x0, d: main.y - STREET - 8 },
    { x: local.x + STREET + 4, y: STREET + 4, w: x1 - local.x - STREET - 4, d: main.y - STREET - 8 },
    { x: x0, y: main.y + MAIN + 4, w: local.x - 4 - x0, d: site.d - STREET - main.y - MAIN - 8 },
    { x: local.x + STREET + 4, y: main.y + MAIN + 4, w: x1 - local.x - STREET - 4, d: site.d - STREET - main.y - MAIN - 8 },
  ];
  const gfa = residentialGFA(i);
  const DEPTH = 12;
  const segs = blocks.flatMap((b) => perimeter(b, DEPTH, 36, 6));
  const fp = segs.reduce((a, s) => a + area(s), 0);
  const fl = floorsFor(gfa, fp, 3);
  segs.forEach((s, k) => {
    const onMain = Math.abs(s.y + s.d - (main.y - 4)) < 1 || Math.abs(s.y - (main.y + MAIN + 4)) < 1;
    boxes.push({ ...s, id: `b${k + 1}`, label: `בניין ${k + 1}`, use: 'res', floors: fl, fh: FH_RES, ground: onMain ? 'com' : undefined });
  });
  const courtyards = blocks.map((b) => inner(b, DEPTH + 2)).filter((c) => c.w > 8 && c.d > 8);
  const inZone = (z: Rect) => boxes.filter((b) => b.use !== 'res' && b.x >= z.x - 0.1 && b.x + b.w <= z.x + z.w + 0.1 && b.y >= z.y - 0.1 && b.y + b.d <= z.y + z.d + 0.1);
  const southTop = Math.min(campus[0].y + campus[0].d, ...inZone(campus[0]).map((b) => b.y)) - 4;
  const northBot = Math.max(campus[1].y, ...inZone(campus[1]).map((b) => b.y + b.d)) + 4;
  const lots = [
    { x: campus[0].x, y: campus[0].y, w: campus[0].w, d: southTop - campus[0].y },
    { x: campus[1].x, y: northBot, w: campus[1].w, d: campus[1].y + campus[1].d - northBot },
  ].filter((l) => l.d >= 6);
  const base = { key: 'B' as const, name: 'רחוב ראשי', idea: 'בלוקים היקפיים עם מסחר בקומת הקרקע לאורך רחוב ראשי, קמפוס ציבורי בקצה ופארק לינארי.', site, boxes, parks, streets, plaza: [], courtyards, openPlaced: parks.reduce((a, r) => a + area(r), 0) };
  return finishParking(base, p.parking, lots);
}

// ---------- ג: פארק מרכזי, טבעת בינוי ----------
function altC(p: Program, i: Inputs, shrink = 1): Layout {
  const site = { x: 0, y: 0, w: i.siteW, d: i.siteD };
  const streets = ring(site);
  const core = inner(site, STREET + 4);
  const pub = pubBoxes(p);
  // הפארק במרכז, ביחס של המגרש
  const maxPark = (core.w - 2 * 44) * (core.d - 2 * 44);
  const parkA = Math.min(p.openSpace, maxPark) * shrink;
  const k = Math.sqrt(parkA / ((core.w - 88) * (core.d - 88)));
  const pw = (core.w - 88) * k, pd = (core.d - 88) * k;
  const park = { x: site.w / 2 - pw / 2, y: site.d / 2 - pd / 2, w: pw, d: pd };
  const parks: Layout['parks'] = [{ ...park, label: 'פארק מרכזי' }];
  // טבעת מגורים סביב הפארק, עם פתחים בפינות למבני ציבור
  const ringR = inner(park, -(6 + 14));
  const segs = perimeter(ringR, 14, 42, 10);
  const boxes: Box[] = [];
  // מבני ציבור בארבע הפינות, בין הטבעת לרחוב
  const corners = [
    { x: core.x, y: core.y, w: ringR.x - 6 - core.x, d: ringR.y - 6 - core.y },
    { x: ringR.x + ringR.w + 6, y: core.y, w: core.x + core.w - ringR.x - ringR.w - 6, d: ringR.y - 6 - core.y },
    { x: core.x, y: ringR.y + ringR.d + 6, w: ringR.x - 6 - core.x, d: core.y + core.d - ringR.y - ringR.d - 6 },
    { x: ringR.x + ringR.w + 6, y: ringR.y + ringR.d + 6, w: core.x + core.w - ringR.x - ringR.w - 6, d: core.y + core.d - ringR.y - ringR.d - 6 },
  ];
  // רצועות בצדדים (מזרח ומערב) לבניינים שלא נכנסו בפינות
  const sides = [
    { x: core.x, y: ringR.y, w: ringR.x - 6 - core.x, d: ringR.d },
    { x: ringR.x + ringR.w + 6, y: ringR.y, w: core.x + core.w - ringR.x - ringR.w - 6, d: ringR.d },
    { x: ringR.x, y: core.y, w: ringR.w, d: ringR.y - 6 - core.y },
    { x: ringR.x, y: ringR.y + ringR.d + 6, w: ringR.w, d: core.y + core.d - ringR.y - ringR.d - 6 },
  ];
  const items = [...pub, { row: { id: 'retail', label: 'מסחר שכונתי', area: p.totals.com, use: 'com', floors: 1 } as Row, w: Math.max(20, Math.round(p.totals.com / 12)), d: 12, floors: 1, n: 1 }];
  let rest = items.slice();
  for (const z of [...corners, ...sides]) {
    if (!rest.length || z.w < 10 || z.d < 10) continue;
    const r = pack(z, rest, 4);
    const left: typeof items = [];
    rest.forEach((it, j) => { const q = r[j]; if (q) boxes.push({ ...q, id: it.row.id, label: it.row.label, use: it.row.use as BUse, floors: it.floors, fh: FH_PUB }); else left.push(it); });
    rest = left;
  }
  if (rest.length && shrink > 0.3) return altC(p, i, shrink - 0.1);
  const gfa = residentialGFA(i);
  const fp = segs.reduce((a, s) => a + area(s), 0);
  const fl = floorsFor(gfa, fp, 3);
  segs.forEach((s, j) => boxes.push({ ...s, id: `r${j + 1}`, label: `בניין ${j + 1}`, use: 'res', floors: fl, fh: FH_RES }));
  const used = (z: Rect) => boxes.some((b) => b.use !== 'res' && b.x >= z.x - 0.1 && b.y >= z.y - 0.1 && b.x + b.w <= z.x + z.w + 0.1 && b.y + b.d <= z.y + z.d + 0.1);
  const lots = sides.filter((z) => !used(z) && z.w >= 10 && z.d >= 10);
  const base = { key: 'C' as const, name: 'פארק מרכזי', idea: 'פארק רציף אחד במרכז, טבעת בינוי סביבו ומבני ציבור בפינות.', site, boxes, parks, streets, plaza: [], courtyards: [], openPlaced: parks.reduce((a, r) => a + area(r), 0) };
  return finishParking(base, p.parking, lots);
}

export const ALT_KEYS: AltKey[] = ['A', 'B', 'C'];
export function layouts(p: Program, i: Inputs): Layout[] {
  return [altA(p, i), altB(p, i), altC(p, i)];
}
export const height = (b: Box) => b.floors * b.fh;
