// רצועת תיק הפרויקט, מתחת לסרגל העליון: מה הגיע מהשלבים הקודמים, ומה השלב הזה מצא. ** מודגש.
// אותו רכיב בפרוגרמה בהעמדה ובאיזה תמהיל עדיף.
import { PATHS, PHASE, ROLES, type Dossier, type StepId, stepIndex } from '../lib/dossier';
import Rich from './Rich';

export interface Fact { k: string; v: string; tone?: 'ok' | 'bad' | 'in' }
export default function Strip({ d, here, came, found, onRole }: { d: Dossier; here: StepId; came: Fact[]; found: Fact[]; onRole: (r: Dossier['role']) => void }) {
  const i = stepIndex(d.role, here);
  return (
    <section className="strip" aria-label="תיק הפרויקט">
      <div className="strip-head">
        <span className="label">תיק הפרויקט · {PHASE[i]} · שלב {i + 1} מתוך 4</span>
        <b>{d.plan.number}, מגרש {d.lot.id}</b>
        <span className="strip-roles" role="group" aria-label="נקודת מבט">
          {(['city', 'dev'] as const).map((r) => <button key={r} className="press chip" aria-pressed={d.role === r} onClick={() => onRole(r)}>{ROLES[r].label}</button>)}
        </span>
      </div>
      <div className="strip-q"><Rich>{`**${PATHS[d.role][i].q}?**`}</Rich></div>
      <dl className="strip-facts">
        {came.map((f) => <div key={'c' + f.k} className="in"><dt>{f.k}</dt><dd><Rich>{f.v}</Rich></dd></div>)}
        {found.map((f) => <div key={'f' + f.k} className={f.tone ?? ''}><dt>{f.k}</dt><dd><Rich>{f.v}</Rich></dd></div>)}
      </dl>
    </section>
  );
}
