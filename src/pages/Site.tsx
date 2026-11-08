// ההעמדה: שלוש חלופות לאותה פרוגרמה. המוקד הוא המודל של החלופה הנבחרת, ולצדו הציון והמדד שמפריד.
import { useEffect, useMemo, useRef, useState } from 'react';
import Rich from '../components/Rich';
import Scene3D from '../components/Scene3D';
import PlanSVG from '../components/PlanSVG';
import { usePlan } from '../lib/state';
import { useRoute, setParams } from '../lib/route';
import { LET, altInsight, divider, n0, programInsight, ranking, siteHeadline } from '../lib/insights';
import { skyskiperLink } from '../lib/sky';
import { tamhilLink } from '../lib/links';
import Chain from '../components/Chain';
import { requestBrief, type Brief } from '../lib/ai';

const USES: [string, string][] = [['res', 'מגורים'], ['com', 'מסחר'], ['edu', 'חינוך'], ['pub', 'ציבור'], ['park', 'שצ"פ'], ['lot', 'חניה על הקרקע']];

export default function SitePage() {
  const { program: p, alts, scores, inputs, city } = usePlan();
  const { q } = useRoute();
  const top = ranking(scores)[0].key;
  const sel = (q.get('a') as 'A' | 'B' | 'C') || top;
  const k = Math.max(0, alts.findIndex((x) => x.key === sel));
  const L = alts[k], S = scores[k];
  const [focus, setFocus] = useState<string | null>(null);
  const show = q.get('show') === '1';
  const h = siteHeadline(scores, alts);
  const d = divider(scores);
  const ai = altInsight(S, L, scores);
  const sky = useMemo(() => skyskiperLink(L), [L]);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [bState, setBState] = useState<'idle' | 'busy' | 'error'>('idle');
  const [bErr, setBErr] = useState('');
  const abort = useRef<AbortController | null>(null);
  useEffect(() => { setBrief(null); setBState('idle'); abort.current?.abort(); }, [scores]);
  const ask = async () => {
    abort.current?.abort(); const c = new AbortController(); abort.current = c;
    setBState('busy'); setBErr('');
    try { setBrief(await requestBrief(p, alts, scores, c.signal)); setBState('idle'); }
    catch (e) { if (!c.signal.aborted) { setBState('error'); setBErr((e as Error).message); } }
  };

  return (
    <main className="page-grid site">
      <section className="lens">
        <div>
          <div className="crumbs"><a href="#/">בית</a> / העמדה</div>
          <Rich as="h1" className="lens-h">{h.title}</Rich>
          <Rich as="p" className="lens-s">{h.sub}</Rich>
        </div>
        <div className="lens-prog"><span className="label">הפרוגרמה</span><Rich>{programInsight(p).title}</Rich></div>
      </section>

      <div className="site-grid">
        <aside className="alts" aria-label="שלוש החלופות">
          {alts.map((A, i) => {
            const s = scores[i];
            return (
              <button key={A.key} className={`alt press${A.key === sel ? ' is-sel' : ''}`} aria-pressed={A.key === sel} onClick={() => setParams({ a: A.key })}>
                <PlanSVG layout={A} small />
                <span className="alt-t"><b>חלופה {LET[A.key]}</b> {A.name}</span>
                <span className="alt-score"><bdi className="num">{s.total}</bdi><small>/ {s.max}</small>{A.key === top && <em>מובילה</em>}</span>
                <span className="alt-bar"><i style={{ width: `${(s.total / s.max) * 100}%` }} /></span>
              </button>
            );
          })}
        </aside>

        <section className="focus" aria-label="המודל">
          <div className="focus-head">
            <Rich as="p" className="ins-t">{`**חלופה ${LET[L.key]}, ${L.name}.** ${ai.idea}`}</Rich>
          </div>
          <Scene3D layout={L} focus={focus} />
          <div className="legend" aria-label="מקרא">
            {USES.map(([u, l]) => (
              <button key={u} className={`press chip lg${focus === u ? ' is-on' : ''}`} aria-pressed={focus === u} onMouseEnter={() => setFocus(u === 'park' || u === 'lot' ? null : u)} onMouseLeave={() => setFocus(null)}>
                <i className={`sw u-${u}`} />{l}
              </button>
            ))}
          </div>
          <div className="ins"><Rich as="p" className="ins-t">{ai.title}</Rich><Rich as="p" className="ins-s">{ai.sub}</Rich></div>
        </section>

        <aside className="measures" aria-label="הציון לפי מדדי שכונה 360">
          <h2 className="col-h">9 מדדים מתוך 44 של שכונה 360</h2>
          <table className="mtab">
            <thead><tr><th /><th>א</th><th>ב</th><th>ג</th></tr></thead>
            <tbody>
              {S.measures.map((m, j) => (
                <tr key={m.id} className={m.id === d.id ? 'is-div' : ''}>
                  <th scope="row" title={m.value}><span className="mn num">{m.n}</span>{m.title}</th>
                  {scores.map((s) => {
                    const v = s.measures[j];
                    return <td key={s.key} className={s.key === sel ? 'cur' : ''}><span className="mbar"><i style={{ width: `${(v.score / v.max) * 100}%` }} /></span><bdi className="num">{v.score}</bdi></td>;
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot><tr><th scope="row">סך הכול</th>{scores.map((s) => <td key={s.key} className={s.key === sel ? 'cur' : ''}><bdi className="num">{s.total}</bdi></td>)}</tr></tfoot>
          </table>
          <h2 className="col-h">בדיקות, חלופה {LET[L.key]}</h2>
          <ul className="checks">
            {S.checks.map((c) => <li key={c.id} className={c.pass ? 'ok' : 'bad'}><b>{c.pass ? 'עומדת' : 'לא עומדת'}</b> {c.title}<span>{c.value}</span></li>)}
          </ul>
        </aside>
      </div>

      <nav className="dock" aria-label="פעולות">
        <div className="dock-in">
          <Chain step={1} links={{ 2: tamhilLink(inputs, city.id), 3: sky }} />
          <span className="dock-sep" />
          <span className="label">חלופה</span>
          {alts.map((A) => <button key={A.key} className="press chip" aria-pressed={A.key === sel} onClick={() => setParams({ a: A.key })}>{LET[A.key]} · {A.name}</button>)}
          <span className="dock-gap" />
          {sky && <a className="press btn" href={sky} target="_blank" rel="noreferrer">הבניין הגבוה בגורד שחקים</a>}
          <button className="press btn" onClick={() => setParams({ show: '1' })}>מצגת</button>
          <button className="press btn primary" onClick={ask} disabled={bState === 'busy'}>{bState === 'busy' ? 'מנסח…' : 'ניסוח לוועדה'}</button>
        </div>
      </nav>

      {(brief || bState === 'error') && (
        <div className="brief" role="dialog" aria-label="ניסוח לוועדה">
          <div className="brief-in">
            <button className="press chip brief-x" onClick={() => { setBrief(null); setBState('idle'); }}>סגירה</button>
            {bState === 'error' && <p className="tone tone-problem">{bErr}. הציונים במסך מחושבים מהגיאומטריה ולא תלויים בניסוח.</p>}
            {brief && (
              <>
                <Rich as="h2" className="brief-h">{brief.headline.insight}</Rich>
                <Rich as="p" className="brief-s">{brief.headline.detail}</Rich>
                {brief.alternatives.map((a) => (
                  <div key={a.key} className={`tone ${a.key === top ? 'tone-solution' : 'tone-neutral'}`}>
                    <h4>חלופה {LET[a.key]}</h4><Rich as="p" className="b-ins">{a.text.insight}</Rich><Rich as="p">{a.text.detail}</Rich>
                  </div>
                ))}
                <div className="tone tone-insight"><h4>המלצה</h4><Rich as="p" className="b-ins">{brief.recommendation.insight}</Rich><Rich as="p">{brief.recommendation.detail}</Rich></div>
                <ol className="brief-steps">{brief.steps.map((s, i) => <Rich as="li" key={i}>{s}</Rich>)}</ol>
                <p className="label">ניסוח: {brief.engine === 'gemini' ? 'Gemini' : 'Claude'} · הציונים מהמנוע</p>
              </>
            )}
          </div>
        </div>
      )}

      {show && <Show />}
    </main>
  );
}

// מצגת: שקף פתיחה, שקף לכל חלופה, ושקף השוואה. חיצים ו-Escape.
function Show() {
  const { program: p, alts, scores } = usePlan();
  const [i, setI] = useState(0);
  const N = alts.length + 2;
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setParams({ show: null });
      if (e.key === 'ArrowLeft' || e.key === ' ') setI((x) => Math.min(N - 1, x + 1));
      if (e.key === 'ArrowRight') setI((x) => Math.max(0, x - 1));
    };
    addEventListener('keydown', on);
    return () => removeEventListener('keydown', on);
  }, [N]);
  const r = ranking(scores);
  const pi = programInsight(p);
  const h = siteHeadline(scores, alts);
  let body;
  if (i === 0) body = (
    <div className="slide s-cover">
      <p className="label">פרוגרמה בהעמדה · {n0(p.units)} יח"ד</p>
      <Rich as="h1">{pi.title}</Rich>
      <Rich as="p" className="s-sub">{pi.sub}</Rich>
      <Rich as="p" className="s-sub">{h.title}</Rich>
    </div>
  );
  else if (i <= alts.length) {
    const L = alts[i - 1], S = scores[i - 1], ai = altInsight(S, L, scores);
    body = (
      <div className="slide s-alt">
        <div className="s-model"><Scene3D layout={L} auto /></div>
        <div className="s-text">
          <p className="label">חלופה {LET[L.key]} · מקום {r.findIndex((x) => x.key === L.key) + 1} מתוך 3</p>
          <h1>{L.name}</h1>
          <div className="s-score"><bdi className="num">{S.total}</bdi><small>/ {S.max}</small></div>
          <p>{L.idea}</p>
          <Rich as="p" className="ins-t">{ai.title}</Rich>
          <Rich as="p" className="ins-s">{ai.sub}</Rich>
        </div>
      </div>
    );
  } else body = (
    <div className="slide s-sum">
      <Rich as="h1">{h.title}</Rich>
      <Rich as="p" className="s-sub">{h.sub}</Rich>
      <div className="s-plans">{alts.map((A, j) => <figure key={A.key}><PlanSVG layout={A} small /><figcaption><b>{LET[A.key]} · {A.name}</b> <bdi className="num">{scores[j].total}</bdi></figcaption></figure>)}</div>
    </div>
  );
  return (
    <div className="show" role="dialog" aria-label="מצגת">
      {body}
      <nav className="show-nav">
        <button className="press chip" onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0}>הקודם</button>
        <span className="num">{i + 1} / {N}</span>
        <button className="press chip" onClick={() => setI((x) => Math.min(N - 1, x + 1))} disabled={i === N - 1}>הבא</button>
        <button className="press chip" onClick={() => setParams({ show: null })}>יציאה</button>
      </nav>
    </div>
  );
}
