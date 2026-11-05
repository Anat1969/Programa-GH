// תקני הפרוגרמה, אחד לאחד מהמחשבון ב-Lovable ("יועץ פרוגרמות", src/pages/Index.tsx, calculate()).
// https://pixel-perfect-clone-6624.lovable.app · https://lovable.dev/projects/43e34a1c-83a9-4cca-b624-4b6533172bc9
// המספרים והמקורות כמות שהם. מה שנוסף כאן מסומן "נוסף".

export interface City { id: string; name: string; coefficient: number }
export const CITIES: City[] = [
  { id: 'ashdod', name: 'אשדוד', coefficient: 3.5 },
  { id: 'tlv', name: 'תל אביב-יפו', coefficient: 2.5 },
  { id: 'jerusalem', name: 'ירושלים', coefficient: 3.4 },
  { id: 'haifa', name: 'חיפה', coefficient: 2.8 },
  { id: 'rishon', name: 'ראשון לציון', coefficient: 3.0 },
  { id: 'petah_tikva', name: 'פתח תקווה', coefficient: 3.0 },
  { id: 'netanya', name: 'נתניה', coefficient: 3.0 },
  { id: 'beersheba', name: 'באר שבע', coefficient: 3.2 },
  { id: 'holon', name: 'חולון', coefficient: 2.9 },
  { id: 'bnei_brak', name: 'בני ברק', coefficient: 4.2 },
  { id: 'ramat_gan', name: 'רמת גן', coefficient: 2.7 },
];

export type Use = 'res' | 'com' | 'edu' | 'pub' | 'open';
export interface Row { id: string; label: string; value: string; detail: string; source: string; area: number; use: Use; floors: number; count: number }
export interface Section { id: string; title: string; use: Use | 'park'; rows: Row[] }
export interface Program {
  units: number; residents: number; coefficient: number;
  sections: Section[];
  built: Row[];            // מה שהופך למבנה במודל
  openSpace: number;       // מ"ר
  parking: number;         // מקומות
  totals: { edu: number; pub: number; com: number; open: number };
}

const fmt = (n: number) => Math.round(n).toLocaleString('he-IL');

export function calculate(units: number, coeff: number): Program {
  const residents = Math.round(units * coeff);
  const daycareKids = Math.round(residents * 0.025);
  const kinderKids = Math.round(residents * 0.03);
  const elemKids = Math.round(residents * 0.05);
  const middleKids = Math.round(residents * 0.025);
  const highKids = Math.round(residents * 0.025);
  const daycareGroups = Math.ceil(daycareKids / 20);
  const kinderClasses = Math.ceil(kinderKids / 35);
  const elemClasses = Math.ceil(elemKids / 32);
  const middleClasses = Math.ceil(middleKids / 32);
  const highClasses = Math.ceil(highKids / 32);
  const daycareArea = Math.round(daycareKids * 8);
  const kinderArea = Math.round(kinderKids * 8);
  const elemArea = Math.round(elemKids * 6);
  const middleArea = Math.round(middleKids * 7);
  const highArea = Math.round(highKids * 7);
  const parkingRes = Math.ceil(units * 1.5);
  const parkingVis = Math.ceil(units * 0.25);
  const garden = Math.round(residents * 4);
  const park = Math.round(residents * 7);
  const sport = Math.round(residents * 3);
  const commCenterArea = Math.round(Math.max(500, residents * 0.1));
  const needsComm = residents >= 1000;
  const clinicArea = Math.round(Math.max(300, residents * 0.05));
  const needsClinic = residents >= 2000;
  const libArea = Math.round(Math.max(200, residents * 0.04));
  const needsLib = residents >= 3000;
  const synagogues = Math.ceil(residents / 2000);
  const synagogueArea = Math.round(synagogues * Math.max(150, (residents * 0.05) / synagogues));
  const retailArea = Math.round(residents * 0.5);
  const shelterArea = Math.round(residents / 10);

  const r = (id: string, label: string, value: string, detail: string, source: string, area: number, use: Use, floors = 1, count = 1): Row => ({ id, label, value, detail, source, area, use, floors, count });
  const edu: Row[] = [
    r('daycare', 'מעון יום (0–3)', `${daycareGroups} קבוצות · ${fmt(daycareArea)} מ"ר`, `2.5% מהתושבים = ${fmt(daycareKids)} ילדים · 20 לקבוצה · 8 מ"ר לילד`, 'משרד החינוך', daycareArea, 'edu', 1, Math.max(1, Math.ceil(daycareGroups / 3))),
    r('kinder', 'גן ילדים (3–6)', `${kinderClasses} כיתות · ${fmt(kinderArea)} מ"ר`, `3% מהתושבים = ${fmt(kinderKids)} ילדים · 35 לכיתה · 8 מ"ר לילד`, 'משרד החינוך', kinderArea, 'edu', 1, Math.max(1, Math.ceil(kinderClasses / 3))),
    r('elem', 'בית ספר יסודי (6–12)', `${elemClasses} כיתות · ${fmt(elemArea)} מ"ר`, `5% מהתושבים = ${fmt(elemKids)} תלמידים · 32 לכיתה · 6 מ"ר לתלמיד`, 'משרד החינוך', elemArea, 'edu', 2),
    r('middle', 'חטיבת ביניים (12–15)', `${middleClasses} כיתות · ${fmt(middleArea)} מ"ר`, `2.5% מהתושבים = ${fmt(middleKids)} תלמידים · 32 לכיתה · 7 מ"ר לתלמיד`, 'משרד החינוך', middleArea, 'edu', 3),
    r('high', 'תיכון (15–18)', `${highClasses} כיתות · ${fmt(highArea)} מ"ר`, `2.5% מהתושבים = ${fmt(highKids)} תלמידים · 32 לכיתה · 7 מ"ר לתלמיד`, 'משרד החינוך', highArea, 'edu', 3),
  ];
  const pub: Row[] = [
    r('comm', 'מרכז קהילתי', needsComm ? `${fmt(commCenterArea)} מ"ר` : 'מתחת לסף', needsComm ? `0.1 מ"ר לנפש · מינימום 500 · סף 1,000 נפש` : `סף 1,000 נפש טרם הושג`, 'משרד הפנים', needsComm ? commCenterArea : 0, 'pub', 2),
    r('clinic', 'מרפאה / קופת חולים', needsClinic ? `${fmt(clinicArea)} מ"ר` : 'מתחת לסף', needsClinic ? `0.05 מ"ר לנפש · מינימום 300 · סף 2,000 נפש` : `סף 2,000 נפש טרם הושג`, 'משרד הבריאות', needsClinic ? clinicArea : 0, 'pub', 2),
    r('lib', 'ספרייה ציבורית', needsLib ? `${fmt(libArea)} מ"ר` : 'מתחת לסף', needsLib ? `0.04 מ"ר לנפש · מינימום 200 · סף 3,000 נפש` : `סף 3,000 נפש טרם הושג`, 'משרד הפנים', needsLib ? libArea : 0, 'pub', 1),
    r('syn', `בית כנסת (×${synagogues})`, `${fmt(synagogueArea)} מ"ר`, `1 לכל 2,000 נפש · מינימום 150 מ"ר`, 'משרד הפנים', synagogueArea, 'pub', 1, synagogues),
    r('retail', 'מסחר שכונתי', `${fmt(retailArea)} מ"ר`, `0.5 מ"ר לנפש`, 'משרד השיכון', retailArea, 'com', 1),
    r('shelter', 'מרחב מוגן ציבורי', `${fmt(shelterArea)} מ"ר`, `1 מ"ר לכל 10 נפש`, 'פיקוד העורף', shelterArea, 'pub', 1),
  ];
  const open: Row[] = [
    r('garden', 'גינה שכונתית', `${fmt(garden)} מ"ר`, `4 מ"ר לנפש`, 'תמ"א 70', garden, 'open'),
    r('park', 'פארק שכונתי', `${fmt(park)} מ"ר`, `7 מ"ר לנפש`, 'תמ"א 70', park, 'open'),
    r('sport', 'מגרשי ספורט', `${fmt(sport)} מ"ר`, `3 מ"ר לנפש`, 'תמ"א 70', sport, 'open'),
  ];
  const parkingRows: Row[] = [
    r('parkRes', 'חניות דיירים', `${fmt(parkingRes)} מקומות`, `1.5 חניות לדירה`, 'משרד הפנים', 0, 'res'),
    r('parkVis', 'חניות אורחים', `${fmt(parkingVis)} מקומות`, `0.25 חניות לדירה`, 'משרד הפנים', 0, 'res'),
  ];
  const sections: Section[] = [
    { id: 'edu', title: 'חינוך', use: 'edu', rows: edu },
    { id: 'pub', title: 'מוסדות ציבור ומסחר', use: 'pub', rows: pub },
    { id: 'open', title: 'שטחים ציבוריים פתוחים', use: 'park', rows: open },
    { id: 'park', title: 'חניה', use: 'res', rows: parkingRows },
  ];
  // המקלט הציבורי נבנה בתוך מבני הציבור, ולכן לא נהיה מבנה נפרד במודל.
  const built = [...edu, ...pub].filter((x) => x.area > 0 && x.id !== 'shelter');
  return {
    units, residents, coefficient: coeff, sections, built,
    openSpace: garden + park + sport,
    parking: parkingRes + parkingVis,
    totals: {
      edu: edu.reduce((a, x) => a + x.area, 0),
      pub: pub.filter((x) => x.use === 'pub').reduce((a, x) => a + x.area, 0),
      com: retailArea,
      open: garden + park + sport,
    },
  };
}
