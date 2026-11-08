// הפרוגרמה: המחשבון המקורי, אותן נוסחאות, בשפה של ענת. כל קבוצה עם מספר גדול ותובנה, והקרקע שהפרוגרמה צורכת.
import Rich from '../components/Rich';
import Controls from '../components/Controls';
import { usePlan } from '../lib/state';
import { n0, programInsight } from '../lib/insights';
import { go } from '../lib/route';
import type { Section } from '../data/program';

const HEAD: Record<string, string> = { edu: 'מ"ר חינוך', pub: 'מ"ר ציבור ומסחר', open: 'מ"ר שצ"פ', park: 'חניות' };

export default function ProgramPage() {
  const { inputs, city, program: p, set } = usePlan();
  const ins = programInsight(p);
  const site = inputs.siteW * inputs.siteD;
  const pubFoot = p.built.reduce((a, r) => a + r.area / r.floors, 0);
  const land = [
    { id: 'open', label: 'שצ"פ', v: p.openSpace },
    { id: 'pub', label: 'מבני ציבור, טביעת רגל', v: pubFoot },
    { id: 'street', label: 'רחובות (הערכה)', v: 2 * (inputs.siteW + inputs.siteD) * 12 },
  ];
  const used = land.reduce((a, x) => a + x.v, 0);
  const total = (s: Section) => (s.id === 'park' ? p.parking : s.rows.reduce((a, r) => a + r.area, 0));
  const share = p.openSpace / site;
  return (
    <main className="page-grid prog">
      <section className="lens">
        <div>
          <div className="crumbs"><a href="#/">בית</a> / פרוגרמה</div>
          <Rich as="h1" className="lens-h">{ins.title}</Rich>
          <Rich as="p" className="lens-s">{ins.sub}</Rich>
        </div>
        <Controls inputs={inputs} city={city} set={set} />
      </section>

      <div className="prog-grid">
        {p.sections.map((s) => (
          <article key={s.id} className={`psec ps-${s.id}`} data-info>
            <header>
              <h2>{s.title}</h2>
              <div className="ps-big"><bdi className="num">{n0(total(s))}</bdi><span>{HEAD[s.id]}</span></div>
            </header>
            <ul>
              {s.rows.map((r) => (
                <li key={r.id} className={r.area === 0 && s.id !== 'park' ? 'off' : ''}>
                  <b>{r.label}</b>
                  <span className="pv">{r.value}</span>
                  <span className="pd">{r.detail}</span>
                  <span className="src">{r.source}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <section className="land" aria-label="כמה קרקע הפרוגרמה צורכת">
        <div className="land-bar">
          {land.map((x) => <span key={x.id} className={`lb-${x.id}`} style={{ width: `${Math.min(100, (x.v / site) * 100)}%` }} title={`${x.label}: ${n0(x.v)} מ"ר`} />)}
        </div>
        <div className="land-legend">
          {land.map((x) => <span key={x.id}><i className={`sw lb-${x.id}`} />{x.label} <bdi className="num">{Math.round((x.v / site) * 100)}%</bdi></span>)}
          <span className="label">מגרש {n0(site / 1000)} דונם</span>
        </div>
        <Rich as="p" className="ins-t">{share > 0.4 ? `השצ"פ לבדו דורש **${Math.round(share * 100)}%** מהמגרש.` : `השצ"פ דורש **${Math.round(share * 100)}%** מהמגרש, והשאר פנוי לבינוי.`}</Rich>
        <Rich as="p" className="ins-s">{used > site * 0.85 ? `יחד עם הרחובות ומבני הציבור, **${Math.round((used / site) * 100)}%** מהקרקע תפוסה לפני הדירה הראשונה. ההעמדה תכריע איפה מוותרים.` : `יחד עם הרחובות ומבני הציבור, **${Math.round((used / site) * 100)}%** מהקרקע. נשאר מקום לבינוי בגובה בינוני.`}</Rich>
      </section>

      <nav className="dock" aria-label="פעולות">
        <div className="dock-in">
          <span className="label">הלמ"ס 2023 · {city.name} · {city.coefficient} נפש ליח"ד</span>
          <span className="dock-gap" />
          <button className="press btn primary" onClick={() => go('/site', Object.fromEntries(new URLSearchParams(location.hash.split('?')[1] ?? '')))}>להעמדה בשלוש חלופות</button>
        </div>
      </nav>
    </main>
  );
}
