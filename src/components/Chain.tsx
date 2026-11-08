// מסלול העבודה: שלוש אפליקציות, שאלה אחת לכל שלב. הנתונים עוברים בכתובת, בלי להקליד שוב.
// אותו רכיב בפרוגרמה בהעמדה (Programa-GH) ובאיזה תמהיל עדיף (Tamhil-GH). שינוי כאן נעשה בשניהם.
export const CHAIN = [
  { n: 1, label: 'פרוגרמה', q: 'מה השכונה צריכה, ואיך מעמידים', home: 'https://programa-gh.vercel.app/' },
  { n: 2, label: 'תמהיל', q: 'איזה תמהיל מחזיק תקציב', home: 'https://tamhil-gh.vercel.app/' },
  { n: 3, label: 'מגדל', q: 'איך הבניין נראה', home: 'https://anat1969.github.io/SkySkiper-GH/' },
] as const;

export default function Chain({ step, links }: { step: 1 | 2 | 3; links: Partial<Record<1 | 2 | 3, string | null>> }) {
  return (
    <nav className="chain-bar" aria-label="מסלול העבודה בין שלוש האפליקציות">
      {CHAIN.map((c, i) => {
        const here = c.n === step;
        const href = links[c.n] ?? c.home;
        return (
          <span key={c.n} className="chain-step">
            {i > 0 && <span className="chain-arrow" aria-hidden="true">←</span>}
            {here
              ? <span className="press chip is-on" aria-current="step" title={c.q}><b className="num">{c.n}</b> {c.label}</span>
              : <a className="press chip" href={href} target={c.n === 3 ? '_blank' : undefined} rel="noreferrer" title={`${c.q}, עם הנתונים מכאן`}><b className="num">{c.n}</b> {c.label}</a>}
          </span>
        );
      })}
    </nav>
  );
}
