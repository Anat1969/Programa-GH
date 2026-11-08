// הקישורים לשלבים הבאים בשרשרת. הנתונים עוברים בכתובת, באותם שמות פרמטרים כמו באפליקציה המקבלת.
import type { Inputs } from './layout';

// לתמהיל: תמהיל השכונה כתמהיל א של בניין אחד (210 דירות, כמו ברירת המחדל שם), מול התמהיל המשפחתי שם.
// הסוגים מותאמים לפי הסדר: עד 55 ← 2 חדרים, עד 80 ← 3, 110 ← 4, 135 ← 5.
export const TAMHIL_URL = 'https://tamhil-gh.vercel.app/';
export function tamhilLink(i: Inputs, cityId: string, total = 210) {
  const m = i.mix, t = m.small + m.medium + m.large + m.xl || 1;
  const r2 = Math.round((total * m.small) / t), r3 = Math.round((total * m.medium) / t), r4 = Math.round((total * m.large) / t);
  const r5 = Math.max(0, total - r2 - r3 - r4);
  const q = new URLSearchParams({ a: [r2, r3, r4, r5, 1200, 0].join('.'), an: 'התמהיל של השכונה', c: cityId });
  return `${TAMHIL_URL}#/compare?${q.toString()}`;
}
