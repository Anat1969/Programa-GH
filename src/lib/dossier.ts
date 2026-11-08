// תיק הפרויקט: התוכן שעובר בין האפליקציות. כל שלב מקבל את התיק, מציג מה הגיע, מוסיף את התוצאה שלו ומעביר הלאה.
// אותו קובץ בפרוגרמה בהעמדה (Programa-GH) ובאיזה תמהיל עדיף (Tamhil-GH). שינוי נעשה בשניהם.

export type Role = 'city' | 'dev';
export type StepId = 'taba' | 'program' | 'mix' | 'tower';

export interface Lot { id: string; areaM2: number; units: number; floors: number; res: number; com: number; emp: number; pub: number }
export interface Dossier {
  v: 1;
  role: Role;
  city: string;
  plan: { id: string; number: string; name: string };
  lot: Lot;
  planUnits: number;
  planPublic: number;  // מ"ר ציבור מבונה בכל התוכנית
  planOpen: number;    // מ"ר שצ"פ בתוכנית
  prog?: { residents: number; eduM2: number; pubM2: number; openM2: number; parking: number; alt: string; score: number; max: number };
  mix?: { winner: string; units: number; holds: boolean; marginPct: number; overM: number; floors: number; height: number; counts: number[] };
}

// התוכנית לדוגמה, מתוך "חלופה שעוברת בדיקה" (Chalufot-GH, src/data/plans.json, תמונת מצב 05.11.2026), שם מתוך טבלה 5 של התוכנית.
export const PLAN = { id: 'tml-2022', number: 'תמל/2022', name: 'פינוי-בינוי המעפילים, ציר הרצל', status: 'מאושרת', unitsExisting: 487, openSpaceM2: 7439 };
export const LOTS: Lot[] = [
  { id: '101', areaM2: 2241, units: 203, floors: 31, res: 25590, com: 343, emp: 3478, pub: 680 },
  { id: '102', areaM2: 6451, units: 517, floors: 32, res: 65304, com: 1855, emp: 12372, pub: 1029 },
  { id: '103', areaM2: 3727, units: 303, floors: 31, res: 36478, com: 540, emp: 3261, pub: 732 },
  { id: '104', areaM2: 2861, units: 250, floors: 31, res: 29675, com: 697, emp: 3011, pub: 557 },
  { id: '105', areaM2: 3894, units: 300, floors: 31, res: 35352, com: 783, emp: 1099, pub: 570 },
  { id: '106', areaM2: 4202, units: 301, floors: 31, res: 36212, com: 704, emp: 3155, pub: 886 },
  { id: '107', areaM2: 3538, units: 286, floors: 31, res: 33925, com: 539, emp: 2731, pub: 566 },
];
export const PLAN_UNITS = LOTS.reduce((a, l) => a + l.units, 0);
export const PLAN_PUBLIC = LOTS.reduce((a, l) => a + l.pub, 0); // מ"ר ציבור מבונה בטבלה 5

export const ROLES: Record<Role, { label: string; question: string; end: string }> = {
  city: { label: 'עירייה', question: 'האם התוכנית ראויה, ומה לדרוש מהיזם', end: 'החלטה לוועדה: לאשר, או לאשר בתנאים' },
  dev: { label: 'יזם', question: 'כמה אפשר לבנות, ומה משתלם', end: 'חלופה להגשה: עומדת בתב"ע, מחזיקה תקציב' },
};

export interface Step { id: StepId; app: string; short: string; q: string; gets: string; gives: string; decide: string }
// סדר השלבים לפי נקודת המבט. העירייה שואלת קודם מה השכונה צריכה, היזם שואל קודם מה משתלם.
export const PATHS: Record<Role, Step[]> = {
  city: [
    { id: 'taba', app: 'חלופה שעוברת בדיקה', short: 'תב"ע', q: 'מה התוכנית מתירה במגרש, ואיזו חלופת נפח עומדת בה', gets: 'מספר התוכנית והמגרש', gives: 'יח"ד, קומות, מסחר, תעסוקה ושטח ציבורי מטבלה 5', decide: 'איזו חלופת נפח עוברת את 12 הבדיקות' },
    { id: 'program', app: 'פרוגרמה בהעמדה', short: 'פרוגרמה', q: 'מה השכונה צריכה מכל יח"ד בתוכנית, ואיפה מעמידים', gets: 'כל יח"ד בתוכנית ועיר', gives: 'תושבים, חינוך, ציבור, שצ"פ וחניה, וחלופת העמדה עם ציון', decide: 'מה לדרוש: שטחי ציבור והעמדה' },
    { id: 'mix', app: 'איזה תמהיל עדיף', short: 'תמהיל', q: 'האם התמהיל שהעירייה דורשת עדיין מחזיק תקציב ליזם', gets: 'זכויות המגרש ודרישות הציבור', gives: 'תמהיל מחזיק או חורג, הפער, והתמהיל שמחזיק', decide: 'כמה אפשר לדרוש בלי להפיל את הפרויקט' },
    { id: 'tower', app: 'גורד שחקים', short: 'מגדל', q: 'איך המגדל נראה ברחוב', gets: 'התמהיל שנבחר כקומות', gives: 'מגדל בתלת־ממד, מול הגובה שהתב"ע מתירה', decide: 'נוסח לוועדה, עם תנאים' },
  ],
  dev: [
    { id: 'taba', app: 'חלופה שעוברת בדיקה', short: 'תב"ע', q: 'כמה זכויות יש במגרש, ואיזו חלופה ממצה אותן', gets: 'מספר התוכנית והמגרש', gives: 'יח"ד, קומות, מסחר ותעסוקה מטבלה 5', decide: 'איזו חלופה ממצה את הזכויות' },
    { id: 'mix', app: 'איזה תמהיל עדיף', short: 'תמהיל', q: 'איזה תמהיל דירות מחזיק תקציב ומרוויח', gets: 'זכויות המגרש', gives: 'התמהיל המנצח, רווח וגובה', decide: 'איזה תמהיל להגיש' },
    { id: 'program', app: 'פרוגרמה בהעמדה', short: 'פרוגרמה', q: 'מה התמהיל הזה ידרוש בשטחי ציבור וחניה', gets: 'התמהיל שנבחר', gives: 'מטלות ציבור וחניה, וציון ההעמדה', decide: 'מה להציע לעירייה מראש' },
    { id: 'tower', app: 'גורד שחקים', short: 'מגדל', q: 'איך להציג את המגדל', gets: 'התמהיל כקומות', gives: 'מגדל בתלת־ממד להגשה', decide: 'הגשה לעירייה' },
  ],
};
export const PHASE = ['התחלה', 'אמצע', 'אמצע', 'סוף'];

export const URLS = {
  taba: 'https://chalufot-gh.vercel.app/',
  program: 'https://programa-gh.vercel.app/',
  mix: 'https://tamhil-gh.vercel.app/',
  tower: 'https://anat1969.github.io/SkySkiper-GH/',
};

// קידוד קצר לכתובת: JSON ב-base64url, כדי שעברית ומספרים יעברו בלי שבירה.
export function encodeDossier(d: Dossier): string {
  const bytes = new TextEncoder().encode(JSON.stringify(d));
  let s = ''; bytes.forEach((b) => { s += String.fromCharCode(b); });
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function decodeDossier(s: string | null): Dossier | null {
  if (!s) return null;
  try {
    const b = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
    const d = JSON.parse(new TextDecoder().decode(Uint8Array.from(b, (c) => c.charCodeAt(0))));
    return d && d.v === 1 && d.lot && d.plan ? d as Dossier : null;
  } catch { return null; }
}

export function newDossier(role: Role, lotId = '101', city = 'ashdod'): Dossier {
  const lot = LOTS.find((l) => l.id === lotId) ?? LOTS[0];
  return { v: 1, role, city, plan: { id: PLAN.id, number: PLAN.number, name: PLAN.name }, lot, planUnits: PLAN_UNITS, planPublic: PLAN_PUBLIC, planOpen: PLAN.openSpaceM2 };
}

// מגרש לפרוגרמה: כל יח"ד בתוכנית, על מתחם בגודל שנגזר מהן (הנחה: 100 מ"ר מתחם ליח"ד, יחס צלעות 1.25).
export function compoundSite(units: number) {
  const area = units * 100;
  const d = Math.round(Math.sqrt(area / 1.25)), w = Math.round(d * 1.25);
  return `${Math.min(600, Math.max(160, w))}x${Math.min(600, Math.max(160, d))}`;
}

export function stepUrl(step: StepId, d: Dossier, extra: Record<string, string> = {}): string {
  const enc = encodeDossier(d);
  if (step === 'taba') return `${URLS.taba}#/studio?${new URLSearchParams({ plan: d.plan.id, lot: d.lot.id }).toString()}`;
  if (step === 'program') return `${URLS.program}#/site?${new URLSearchParams({ u: String(d.planUnits), c: d.city, s: compoundSite(d.planUnits), ...extra, d: enc }).toString()}`;
  if (step === 'mix') return `${URLS.mix}#/compare?${new URLSearchParams({ c: d.city, ...extra, d: enc }).toString()}`;
  return extra.href ?? URLS.tower;
}
export const stepIndex = (role: Role, id: StepId) => PATHS[role].findIndex((s) => s.id === id);

// שני התמהילים שכל צד מביא לשולחן, כספירת דירות למגרש (2, 3, 4, 5 חדרים), עם המסחר והתעסוקה של המגרש מטבלה 5.
// מדיניות אשדוד: לפחות 20% קטנות ו-10% עד 80 מ"ר (Chalufot-GH, R01). שוק: יותר דירות קטנות, כי הן נמכרות ביותר למ"ר (הנחה).
export const MIX_POLICY = [0.2, 0.25, 0.35, 0.2];
export const MIX_MARKET = [0.35, 0.35, 0.2, 0.1];
export function lotMix(lot: Lot, shares: number[]) {
  const c = shares.slice(0, 3).map((s) => Math.round(lot.units * s));
  c.push(Math.max(0, lot.units - c[0] - c[1] - c[2]));
  return [...c, lot.com, lot.emp].join('.');
}
// לתמהיל: העירייה שמה את המדיניות כתמהיל א, היזם את השוק. כך תמהיל א הוא תמיד של מי שמחזיק בתיק.
export function mixParams(d: Dossier) {
  const pol = { m: lotMix(d.lot, MIX_POLICY), n: 'תמהיל המדיניות' }, mar = { m: lotMix(d.lot, MIX_MARKET), n: 'תמהיל השוק' };
  const [A, B] = d.role === 'city' ? [pol, mar] : [mar, pol];
  return { a: A.m, an: A.n, b: B.m, bn: B.n };
}
