// הציון: 9 מתוך 44 מדדי שכונה 360 שאפשר למדוד מהעמדה עצמה, ועוד 3 בדיקות מול מדיניות אשדוד.
// כל מדד: המקור (מספר וניקוד מרבי מ-pro-metrics-vue-GH/src/data/indicators.ts), המדידה, וכלל הניקוד.
// כלל ניקוד שאינו בחוברת מסומן "הנחה", ומוצג כך בדף השיטה.
import type { Program } from '../data/program';
import { height, residentialGFA, type Box, type Inputs, type Layout, type Rect } from './layout';

export interface Measure { id: string; n: number; title: string; max: number; score: number; value: string; rule: string; ruleStatus: 'מדיניות אשדוד' | 'הנחה'; why: string }
export interface Check { id: string; title: string; pass: boolean; value: string; source: string }
export interface Score { key: string; total: number; max: number; measures: Measure[]; checks: Check[]; stats: Stats }
export interface Stats { maxFloors: number; resBuildings: number; openPlaced: number; openNeed: number; parkingMissing: number; frontage: number; sunShare: number; windShare: number; coverage: number }

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const area = (r: Rect) => r.w * r.d;
// מרחק מנקודה למלבן
const dist = (x: number, y: number, r: Rect) => Math.hypot(Math.max(r.x - x, 0, x - r.x - r.w), Math.max(r.y - y, 0, y - r.y - r.d));
// מרחק בין שני מלבנים, קצה לקצה
const gap = (a: Rect, b: Rect) => Math.hypot(Math.max(0, b.x - a.x - a.w, a.x - b.x - b.w), Math.max(0, b.y - a.y - a.d, a.y - b.y - b.d));
const near = (b: Rect, rs: Rect[]) => rs.length ? Math.min(...rs.map((r) => gap(b, r))) : Infinity;
const r1 = (v: number) => Math.round(v * 10) / 10;

// בינוי מלווה רחוב: נקודה כל 4 מ' על שפת כל רחוב, שאינה גבול המגרש. נחשבת אם יש מבנה בטווח 8 מ' ממנה, החוצה מהרחוב.
function frontage(L: Layout): number {
  let total = 0, lined = 0;
  const solid = L.boxes;
  const onSite = (x: number, y: number) => x > 0.5 && y > 0.5 && x < L.site.w - 0.5 && y < L.site.d - 0.5;
  const probe = (x: number, y: number, nx: number, ny: number) => {
    if (!onSite(x + nx * 3, y + ny * 3)) return;
    if (L.streets.some((s) => dist(x + nx * 3, y + ny * 3, s) === 0)) return; // צומת
    total++;
    for (let t = 1; t <= 8; t += 1) if (solid.some((b) => dist(x + nx * t, y + ny * t, b) === 0)) { lined++; return; }
  };
  for (const s of L.streets) {
    const horiz = s.w >= s.d;
    if (horiz) for (let x = s.x + 2; x < s.x + s.w; x += 4) { probe(x, s.y, 0, -1); probe(x, s.y + s.d, 0, 1); }
    else for (let y = s.y + 2; y < s.y + s.d; y += 4) { probe(s.x, y, -1, 0); probe(s.x + s.w, y, 1, 0); }
  }
  return total ? lined / total : 0;
}

// זכויות שמש: בניין מגורים מוצל אם מדרום לו, בחפיפה מזרח־מערב, יש מבנה במרחק קטן מגובהו (זווית 45°).
function sunShare(L: Layout): number {
  const res = L.boxes.filter((b) => b.use === 'res');
  if (!res.length) return 0;
  const ok = res.filter((b) => !L.boxes.some((s) => s !== b && s.x < b.x + b.w && b.x < s.x + s.w && s.y + s.d <= b.y + 0.01 && b.y - (s.y + s.d) < height(s)));
  return ok.length / res.length;
}

// אוורור: קרן מהמערב (רוח הים באשדוד) כל 4 מ'. פתוחה אם עוברת את כל המגרש בלי לפגוש מבנה גבוה מ-12 מ'.
function windShare(L: Layout): number {
  let open = 0, n = 0;
  for (let y = 2; y < L.site.d; y += 4) {
    n++;
    if (!L.boxes.some((b) => height(b) > 12 && y > b.y && y < b.y + b.d)) open++;
  }
  return n ? open / n : 0;
}

export function score(L: Layout, p: Program, i: Inputs): Score {
  const res = L.boxes.filter((b) => b.use === 'res');
  const pub = L.boxes.filter((b) => b.use === 'pub' || b.use === 'edu');
  const parksBig = L.parks.filter((r) => area(r) >= 300);
  const kinder = L.boxes.filter((b) => /^(kinder|daycare)/.test(b.id));
  const school = L.boxes.filter((b) => /^(elem|middle|high)/.test(b.id));
  const retail: Rect[] = [...L.boxes.filter((b) => b.use === 'com'), ...L.boxes.filter((b) => b.ground === 'com')];
  const civic = L.boxes.filter((b) => /^(comm|clinic|lib|syn)/.test(b.id));
  const services: [string, Rect[]][] = [['גן', kinder], ['בית ספר', school], ['מסחר', retail], ['מוסד קהילתי', civic], ['שצ"פ', parksBig]];

  // 1. a08 תמהיל: שלושת תנאי התמהיל של אשדוד
  const t = i.mix.small + i.mix.medium + i.mix.large + i.mix.xl || 1;
  const restAvg = (i.mix.large * 110 + i.mix.xl * 135) / Math.max(1, i.mix.large + i.mix.xl);
  const mixOk = [i.mix.small / t >= 0.2, i.mix.medium / t >= 0.1, restAvg <= 125];
  // 2. a10 נגישות: לכל בניין מגורים ולכל שירות, מלא עד 50 מ', אפס מ-300 מ'
  const acc = res.length ? res.reduce((a, b) => a + services.reduce((s, [, rs]) => s + clamp(1 - (near(b, rs) - 50) / 250), 0) / services.length, 0) / res.length : 0;
  const worst = services.map(([n, rs]) => [n, res.length ? res.reduce((a, b) => a + near(b, rs), 0) / res.length : 0] as const).sort((a, b) => b[1] - a[1])[0];
  // 3. a11 מבני ציבור: על רחוב (עד 10 מ'), וצמודים לשצ"פ או לכיכר (עד 30 מ')
  const onStreet = pub.length ? pub.filter((b) => near(b, L.streets) <= 10).length / pub.length : 0;
  const byOpen = pub.length ? pub.filter((b) => near(b, [...L.parks, ...L.plaza]) <= 30).length / pub.length : 0;
  // 4. a12 צפיפות: הצפיפות בגובה בינוני
  const maxFloors = Math.max(0, ...res.map((b) => b.floors));
  const dens = maxFloors <= 10 ? 4 : maxFloors <= 16 ? 3 : maxFloors <= 25 ? 2 : 1;
  // 5. a13 בינוי מלווה רחוב
  const front = frontage(L);
  // 6. b06 חניה: שטח חניה על הקרקע מהמגרש, וחניה שלא נכנסה
  const surf = L.surfaceParking.reduce((a, r) => a + area(r), 0) / area(L.site);
  const missing = Math.max(0, p.parking - L.parkingUnder - L.parkingSurface);
  const park = missing > 0 ? 0 : surf === 0 ? 3 : surf < 0.05 ? 2 : surf < 0.1 ? 1 : 0;
  // 7. b07 שצ"פ: מגורים עד 100 מ' משצ"פ של 300 מ"ר לפחות, ורציפות (הגדול ≥ 60% מכלל השצ"פ)
  const within = res.length ? res.filter((b) => near(b, parksBig) <= 100).length / res.length : 0;
  const biggest = Math.max(0, ...L.parks.map(area)) / Math.max(1, L.openPlaced);
  const openScore = 3 * within + (biggest >= 0.6 ? 1 : 0);
  // 8. b16 אוורור
  const wind = windShare(L);
  // 9. c03 זכויות שמש
  const sun = sunShare(L);

  const m = (id: string, n: number, title: string, max: number, sc: number, value: string, rule: string, ruleStatus: Measure['ruleStatus'], why: string): Measure => ({ id, n, title, max, score: r1(Math.min(max, sc)), value, rule, ruleStatus, why });
  const measures: Measure[] = [
    m('a08', 8, 'תמהיל הדיור', 3, mixOk.filter(Boolean).length, `${Math.round((i.mix.small / t) * 100)}% קטנות · ${Math.round((i.mix.medium / t) * 100)}% בינוניות · יתרה ${Math.round(restAvg)} מ"ר`, 'נקודה לכל תנאי: קטנות ≥ 20%, עד 80 מ"ר ≥ 10%, ממוצע היתרה ≤ 125 מ"ר', 'מדיניות אשדוד', 'תנאי התמהיל מהמדיניות של אשדוד, כפי שהם בחלופה שעוברת בדיקה.'),
    m('a10', 10, 'נגישות למגוון שירותים', 5, 5 * acc, `השירות הרחוק: ${worst[0]}, ${Math.round(worst[1])} מ' בממוצע`, 'לכל בניין מגורים ולכל שירות: מלא עד 50 מ\', אפס מ-300 מ\'', 'הנחה', 'חמישה שירותים יומיומיים: גן, בית ספר, מסחר, מוסד קהילתי ושצ"פ.'),
    m('a11', 11, 'מבני ציבור', 2, (onStreet >= 0.6 ? 1 : onStreet / 0.6) + (byOpen >= 0.5 ? 1 : byOpen / 0.5), `${Math.round(onStreet * 100)}% על רחוב · ${Math.round(byOpen * 100)}% ליד שצ"פ`, 'נקודה: 60% מהמבנים עד 10 מ\' מרחוב. נקודה: 50% עד 30 מ\' משצ"פ או מכיכר', 'הנחה', 'מבנה ציבור נגיש ופעיל כשהוא על הרחוב וליד המרחב הפתוח.'),
    m('a12', 12, 'צפיפות המגורים', 4, dens, `${maxFloors} קומות במבנה הגבוה`, '4 עד 10 קומות, 3 עד 16, 2 עד 25, 1 מעל', 'הנחה', 'אותה צפיפות בגובה בינוני, ולא במגדלים. החוברת: "צפיפות גבוהה מדי פוגעת באיכות החיים".'),
    m('a13', 13, 'בינוי מלווה רחוב', 4, 4 * clamp(front / 0.6), `${Math.round(front * 100)}% משפת הרחובות`, 'מלא כש-60% משפת הרחוב מלווה מבנה עד 8 מ\' ממנה', 'הנחה', 'נדגם כל 4 מ\' לאורך כל רחוב פנימי.'),
    m('b06', 21, 'צמצום השטח עבור חניה', 3, park, missing > 0 ? `${missing} מקומות לא נכנסו` : `${(surf * 100).toFixed(1)}% מהמגרש חניה על הקרקע`, '3 בלי חניה על הקרקע, 2 מתחת ל-5%, 1 מתחת ל-10%. אפס אם חניה לא נכנסה', 'הנחה', 'חניון בשתי קומות מתחת לבניינים ולחצרות, והשאר על הקרקע.'),
    m('b07', 22, 'מערך שטחים ציבוריים פתוחים', 4, openScore, `${Math.round(within * 100)}% מהמגורים עד 100 מ' · הגדול ${Math.round(biggest * 100)}%`, '3 לפי חלק המגורים עד 100 מ\' משצ"פ ≥ 300 מ"ר. 1 לרציפות: הגדול ≥ 60%', 'הנחה', 'שצ"פ קרוב לכל בית, ושצ"פ אחד גדול מספיק לפעילות.'),
    m('b16', 31, 'אוורור טבעי', 1, wind >= 0.35 ? 1 : wind / 0.35, `${Math.round(wind * 100)}% מרוחב המגרש פתוח לרוח מערבית`, 'נקודה כש-35% מהקרניים ממערב עוברות בלי מבנה מעל 12 מ\'', 'הנחה', 'באשדוד רוח הים נכנסת ממערב. קרן כל 4 מ\'.'),
    m('c03', 38, 'זכויות שמש', 2, 2 * sun, `${Math.round(sun * 100)}% מבנייני המגורים בלי הצללה מדרום`, 'בניין מוצל אם מבנה מדרום לו קרוב יותר מגובהו (45°)', 'הנחה', 'נבדק לכל בניין מגורים מול כל מבנה מדרום לו.'),
  ];
  const total = r1(measures.reduce((a, x) => a + x.score, 0));
  const max = measures.reduce((a, x) => a + x.max, 0);

  const yardNeed = p.residents * 3;
  const perc = (L.openPlaced + L.courtyards.reduce((a, c) => a + area(c), 0)) / area(L.site);
  const checks: Check[] = [
    { id: 'R01', title: 'תמהיל יח"ד', pass: mixOk.every(Boolean), value: `${mixOk.filter(Boolean).length} מתוך 3 תנאים`, source: 'מסמך מדיניות אשדוד, פרק 4' },
    { id: 'R05', title: 'סף-בית: 3 מ"ר לנפש', pass: L.openPlaced >= yardNeed, value: `${Math.round(L.openPlaced).toLocaleString('he-IL')} מתוך ${Math.round(yardNeed).toLocaleString('he-IL')} מ"ר`, source: 'מסמך מדיניות אשדוד, פרק 7' },
    { id: 'R07', title: 'חלחול ושטח מגונן 15%', pass: perc >= 0.15, value: `${Math.round(perc * 100)}% מהמגרש`, source: 'מסמך מדיניות אשדוד, פרק 4' },
    { id: 'P01', title: 'שצ"פ לפי התקן', pass: L.openPlaced >= p.openSpace * 0.999, value: `${Math.round((L.openPlaced / p.openSpace) * 100)}% מ-${p.openSpace.toLocaleString('he-IL')} מ"ר`, source: 'תמ"א 70, דרך מחשבון הפרוגרמות' },
    { id: 'P02', title: 'כל החניה נכנסת', pass: missing === 0, value: missing ? `חסרים ${missing}` : `${L.parkingUnder} תת־קרקעי · ${L.parkingSurface} על הקרקע`, source: 'משרד הפנים, דרך מחשבון הפרוגרמות' },
  ];
  const stats: Stats = {
    maxFloors, resBuildings: res.length, openPlaced: L.openPlaced, openNeed: p.openSpace, parkingMissing: missing,
    frontage: front, sunShare: sun, windShare: wind,
    coverage: L.boxes.reduce((a, b) => a + area(b), 0) / area(L.site),
  };
  void residentialGFA;
  return { key: L.key, total, max, measures, checks, stats };
}

export const resHeight = (L: Layout) => Math.max(0, ...L.boxes.filter((b: Box) => b.use === 'res').map(height));
