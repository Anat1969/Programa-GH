// דף הבית: התובנה עם המספר המרכזי, המודל של החלופה המובילה, בעיה־פתרון־תובנה, ומפת התוכן.
import Rich from '../components/Rich';
import Scene3D from '../components/Scene3D';
import { usePlan } from '../lib/state';
import { LET, divider, n0, ranking } from '../lib/insights';
import { go } from '../lib/route';

export default function Home() {
  const { program: p, alts, scores } = usePlan();
  const r = ranking(scores);
  const top = r[0], L = alts.find((a) => a.key === top.key)!;
  const d = divider(scores);
  const keep = () => Object.fromEntries(new URLSearchParams(location.hash.split('?')[1] ?? ''));
  return (
    <main className="home">
      <section className="home-text">
        <p className="label">החלטה · אדריכלות ועיצוב · מתחם חדש באשדוד (Ashdod)</p>
        <h1 className="home-h">
          <span className="big-row"><bdi className="num big">{top.total}</bdi><small>/ {top.max}</small></span>
          <Rich>{`**חלופה ${LET[top.key]}, ${L.name}**, מובילה מתוך שלוש העמדות.`}</Rich>
        </h1>
        <Rich as="p" className="home-s">{`אותה פרוגרמה: **${n0(p.units)}** יח"ד, **${n0(p.residents)}** תושבים, **${n0(p.totals.edu)}** מ"ר חינוך. ==מה שמכריע הוא ${d.title}==, לא כמות.`}</Rich>
        <div className="home-tones">
          <div className="tone tone-problem"><h4>הבעיה</h4><Rich as="p">{`הפרוגרמה מגיעה כ**טבלה**. איפה הגן, ומה הבית רואה מהחלון, מתגלה רק בתכנון.`}</Rich></div>
          <div className="tone tone-solution"><h4>הפתרון</h4><Rich as="p">{`אותה פרוגרמה ב**שלוש העמדות**, כמודל, עם **ציון** לפי מדדי שכונה 360.`}</Rich></div>
          <div className="tone tone-insight"><h4>התובנה</h4><Rich as="p">{`אותם מטרים, ציון שונה. **המיקום** של הציבור קובע יותר מגודלו.`}</Rich></div>
        </div>
        <div className="home-map">
          <button className="press map-card" onClick={() => go('/program', keep())}><span className="label">פרוגרמה</span><b>מה השכונה צריכה</b><span className="mc-n"><bdi className="num">{n0(p.openSpace)}</bdi> מ"ר שצ"פ</span></button>
          <button className="press map-card" onClick={() => go('/site', keep())}><span className="label">העמדה</span><b>שלוש חלופות בתלת־ממד</b><span className="mc-n"><bdi className="num">{r.map((x) => x.total).join(' · ')}</bdi></span></button>
          <button className="press map-card" onClick={() => go('/method', keep())}><span className="label">שיטה</span><b>על מה הציון נשען</b><span className="mc-n"><bdi className="num">9</bdi> מתוך 44 מדדים</span></button>
        </div>
        <Rich as="p" className="home-src">{`שדרוג של מחשבון הפרוגרמות. השראה: **יחידת השכונה** של קלרנס פרי (Clarence Perry), 1929: בית הספר במרכז, המסחר בפינות, הכול בהליכה.`}</Rich>
      </section>
      <section className="home-obj" aria-label="המודל של החלופה המובילה">
        <Scene3D layout={L} auto />
      </section>
    </main>
  );
}
