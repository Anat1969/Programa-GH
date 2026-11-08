// מסלול העבודה: ארבעה שלבים לפי נקודת המבט (עירייה או יזם). כל שלב הוא קישור שנושא את תיק הפרויקט.
// אותו רכיב בפרוגרמה בהעמדה (Programa-GH) ובאיזה תמהיל עדיף (Tamhil-GH). שינוי כאן נעשה בשניהם.
import { PATHS, ROLES, type Role, type StepId } from '../lib/dossier';

export default function Chain({ role, current, links }: { role: Role; current: StepId; links: Partial<Record<StepId, string | null>> }) {
  return (
    <nav className="chain-bar" aria-label={`מסלול העבודה, ${ROLES[role].label}`}>
      <span className="chain-role label">{ROLES[role].label}</span>
      {PATHS[role].map((s, i) => {
        const here = s.id === current;
        const href = links[s.id];
        return (
          <span key={s.id} className="chain-step">
            {i > 0 && <span className="chain-arrow" aria-hidden="true">←</span>}
            {here || !href
              ? <span className={`press chip${here ? ' is-on' : ' off'}`} aria-current={here ? 'step' : undefined} title={s.q}><b className="num">{i + 1}</b> <span className="lbl">{s.short}</span></span>
              : <a className="press chip" href={href} target={s.id === 'tower' || s.id === 'taba' ? '_blank' : undefined} rel="noreferrer" title={`${s.q}. ${s.app}, עם תיק הפרויקט`}><b className="num">{i + 1}</b> <span className="lbl">{s.short}</span></a>}
          </span>
        );
      })}
    </nav>
  );
}
