// מסלול העבודה: תוכנית אחת, שתי נקודות מבט. לכל שלב שאלה, מה הוא מקבל, מה הוא מחזיר ומה מחליטים בו.
// הדוגמה היא תוכנית אמיתית (תמל/2022), והמספרים מחושבים כאן, מהזכויות ומנוסחאות המחשבון.
import { useMemo } from 'react';
import Rich from '../components/Rich';
import { useRoute, setParams } from '../lib/route';
import { calculate } from '../data/program';
import { LOTS, MIX_MARKET, MIX_POLICY, PATHS, PHASE, PLAN, PLAN_PUBLIC, PLAN_UNITS, ROLES, mixParams, newDossier, stepUrl, type Role, type StepId } from '../lib/dossier';
import { n0 } from '../lib/insights';

const pct = (s: number[]) => s.map((x) => Math.round(x * 100)).join(' · ');

export default function PathPage() {
  const { q } = useRoute();
  const role: Role = q.get('r') === 'dev' ? 'dev' : 'city';
  const lotId = q.get('lot') ?? '101';
  const d = newDossier(role, lotId);
  const lot = d.lot;
  const prog = useMemo(() => calculate(PLAN_UNITS, 3.5), []);
  const pubNeed = prog.totals.edu + prog.totals.pub;
  const openRatio = prog.openSpace / PLAN.openSpaceM2;
  const mp = mixParams(d);
  const href: Record<StepId, string> = {
    taba: stepUrl('taba', d),
    program: stepUrl('program', d),
    mix: stepUrl('mix', d, mp),
    tower: `https://anat1969.github.io/SkySkiper-GH/#patch=${encodeURIComponent(JSON.stringify({ 'site.width': Math.round(Math.sqrt(lot.areaM2)), 'site.depth': Math.round(Math.sqrt(lot.areaM2)), 'body.height.floors': lot.floors - 4, 'base.height.floors': 3 }))}&name=${encodeURIComponent(`${PLAN.number} מגרש ${lot.id}, ${lot.floors} קומות בתב"ע`)}`,
  };
  const live: Record<StepId, string[]> = {
    taba: [`**${n0(lot.units)}** יח"ד · **${lot.floors}** קומות`, `**${n0(lot.res)}** מ"ר מגורים · מגרש **${n0(lot.areaM2)}** מ"ר`, `מסחר **${n0(lot.com)}** · תעסוקה **${n0(lot.emp)}** · ציבור **${n0(lot.pub)}** מ"ר`],
    program: [`כל התוכנית: **${n0(PLAN_UNITS)}** יח"ד, **${n0(prog.residents)}** תושבים`, `ציבור נדרש **${n0(pubNeed)}** מ"ר, בתב"ע **${n0(PLAN_PUBLIC)}**`, `שצ"פ נדרש פי **${openRatio.toFixed(1)}** ממה שבתב"ע`],
    mix: [`תמהיל א: **${mp.an}** (${pct(role === 'city' ? MIX_POLICY : MIX_MARKET)}%)`, `תמהיל ב: **${mp.bn}** (${pct(role === 'city' ? MIX_MARKET : MIX_POLICY)}%)`, `על **${n0(lot.units)}** יח"ד המגרש, עם המסחר והתעסוקה שלו`],
    tower: [`התב"ע מתירה **${lot.floors}** קומות`, 'המגדל של התמהיל נבדק מול הגובה', 'ומוצג ברחוב, בגובה העיניים'],
  };
  return (
    <main className="path">
      <header className="path-head">
        <div className="crumbs"><a href="#/">בית</a> / מסלול</div>
        <Rich as="h1" className="m-h">{'**שני מסלולים**, אותה תוכנית, ארבעה שלבים.'}</Rich>
        <Rich as="p" className="m-s">{`**${PLAN.number}**, ${PLAN.name}: **${n0(PLAN_UNITS)}** יח"ד ב-**7** מגרשים, תוכנית מאושרת. העירייה שואלת מה לדרוש, היזם שואל מה משתלם. תיק הפרויקט עובר משלב לשלב, וכל שלב מוסיף לו.`}</Rich>
      </header>

      <div className="path-ctl">
        <div className="roles" role="group" aria-label="נקודת מבט">
          {(['city', 'dev'] as const).map((r) => (
            <button key={r} className="press role" aria-pressed={role === r} onClick={() => setParams({ r })}>
              <b>{ROLES[r].label}</b><span>{ROLES[r].question}</span>
            </button>
          ))}
        </div>
        <div className="lots" role="group" aria-label="מגרש בתוכנית">
          <span className="label">מגרש</span>
          {LOTS.map((l) => <button key={l.id} className="press chip" aria-pressed={l.id === lotId} onClick={() => setParams({ lot: l.id })} title={`${l.units} יח"ד, ${l.floors} קומות`}>{l.id}</button>)}
        </div>
      </div>

      <ol className="stages">
        {PATHS[role].map((s, i) => (
          <li key={s.id} className={`stage st-${s.id}`}>
            <span className="phase label">{PHASE[i]}</span>
            <div className="stage-h"><span className="q-n num">{i + 1}</span><h2>{s.short}</h2><span className="app">{s.app}</span></div>
            <Rich as="p" className="stage-q">{`**${s.q}?**`}</Rich>
            <dl>
              <dt>מקבל</dt><dd>{s.gets}</dd>
              <dt>מחזיר</dt><dd>{s.gives}</dd>
              <dt>מחליטים</dt><dd>{s.decide}</dd>
            </dl>
            <ul className="live">{live[s.id].map((t, k) => <Rich as="li" key={k}>{t}</Rich>)}</ul>
            <a className="press btn primary" href={href[s.id]} target={s.id === 'program' || s.id === 'mix' ? undefined : '_blank'} rel="noreferrer">פתיחה עם התיק</a>
          </li>
        ))}
      </ol>

      <section className="meet" aria-label="נקודת המפגש">
        <div className="tone tone-problem"><h4>העירייה דורשת</h4><Rich as="p">{`תמהיל לפי **מדיניות אשדוד**, **${n0(pubNeed)}** מ"ר ציבור לפי התקן (בתב"ע **${n0(PLAN_PUBLIC)}**), ושצ"פ.`}</Rich></div>
        <div className="tone tone-neutral"><h4>היזם צריך</h4><Rich as="p">{`רווח של **15%** לפחות, בתוך התקציב, ובלי לחרוג מ-**${lot.floors}** הקומות של התב"ע.`}</Rich></div>
        <div className="tone tone-solution"><h4>החלופה המשותפת</h4><Rich as="p">{`התמהיל שעומד במדיניות **וגם** מחזיק תקציב. נמצא בשלב התמהיל, ומשם חוזר לפרוגרמה ולמגדל.`}</Rich></div>
        <p className="label">{ROLES[role].label}: הסוף הוא {ROLES[role].end}</p>
      </section>
    </main>
  );
}
