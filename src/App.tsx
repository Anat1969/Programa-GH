import { useEffect, useMemo, useState } from 'react';
import AIMenu, { type MenuItem } from './components/AIMenu';
import { go, useRoute } from './lib/route';
import Home from './pages/Home';
import ProgramPage from './pages/Program';
import SitePage from './pages/Site';
import Method from './pages/Method';
import Chain from './components/Chain';
import { usePlan } from './lib/state';
import { tamhilLink } from './lib/links';
import Strip from './components/Strip';
import PathPage from './pages/Path';
import { decodeDossier, encodeDossier, mixParams, newDossier, stepUrl, type Dossier } from './lib/dossier';
import { n0 } from './lib/insights';
import { setParams } from './lib/route';
import { skyskiperLink } from './lib/sky';
import { ranking } from './lib/insights';

const NAV: [string, string][] = [['/', 'בית'], ['/path', 'מסלול'], ['/program', 'פרוגרמה'], ['/site', 'העמדה'], ['/method', 'שיטה']];
interface BIPEvent extends Event { prompt: () => Promise<void> }
const keep = () => Object.fromEntries(new URLSearchParams(location.hash.split('?')[1] ?? ''));

export default function App() {
  const { path, q } = useRoute();
  const plan = usePlan();
  // השרשרת בסרגל העליון, בכל דף: לתמהיל עם תמהיל השכונה, ולמגדל עם הבניין הגבוה של החלופה הנבחרת או המובילה
  const selKey = q.get('a') || ranking(plan.scores)[0].key;
  const selAlt = plan.alts.find((x) => x.key === selKey) ?? plan.alts[0];
  // תיק הפרויקט: מגיע בכתובת (d). הפרוגרמה מוסיפה לו את מה שמצאה, ומעבירה הלאה.
  const d0 = decodeDossier(q.get('d'));
  const top = ranking(plan.scores)[0];
  const pubNeed = plan.program.totals.edu + plan.program.totals.pub;
  const d: Dossier | null = d0 && { ...d0, prog: { residents: plan.program.residents, eduM2: plan.program.totals.edu, pubM2: pubNeed, openM2: plan.program.openSpace, parking: plan.program.parking, alt: plan.alts.find((x) => x.key === top.key)!.name, score: top.total, max: top.max } };
  const sky = skyskiperLink(selAlt);
  const chainLinks = d
    ? { taba: stepUrl('taba', d), mix: stepUrl('mix', d, mixParams(d)), tower: sky }
    : { taba: stepUrl('taba', newDossier('city')), mix: tamhilLink(plan.inputs, plan.city.id), tower: sky };
  const setRole = (r: Dossier['role']) => d && setParams({ d: encodeDossier({ ...d, role: r }) });
  const strip = d && (
    <Strip d={d} here="program" onRole={setRole}
      came={[
        { k: 'בתב"ע', v: `**${n0(d.planUnits)}** יח"ד ב-${7} מגרשים` },
        { k: 'ציבור בתב"ע', v: `**${n0(d.planPublic)}** מ"ר` },
        { k: 'שצ"פ בתב"ע', v: `**${n0(d.planOpen)}** מ"ר` },
        ...(d.mix ? [{ k: 'מהתמהיל', v: `${d.mix.winner} ${d.mix.holds ? 'מחזיק' : 'חורג'}, רווח **${d.mix.marginPct}%**` }] : []),
      ]}
      found={[
        { k: 'ציבור נדרש', v: pubNeed > d.planPublic ? `**${n0(pubNeed)}** מ"ר, חסרים **${n0(pubNeed - d.planPublic)}**` : `**${n0(pubNeed)}** מ"ר, מכוסה`, tone: pubNeed > d.planPublic ? 'bad' : 'ok' },
        { k: 'שצ"פ נדרש', v: plan.program.openSpace > d.planOpen ? `**${n0(plan.program.openSpace)}** מ"ר, פי **${(plan.program.openSpace / d.planOpen).toFixed(1)}**` : `**${n0(plan.program.openSpace)}** מ"ר, מכוסה`, tone: plan.program.openSpace > d.planOpen ? 'bad' : 'ok' },
        { k: 'העמדה מובילה', v: `${d.prog!.alt}, **${top.total}**/${top.max}` },
      ]} />
  );
  const [install, setInstall] = useState<BIPEvent | null>(null);
  useEffect(() => {
    const on = (e: Event) => { e.preventDefault(); setInstall(e as BIPEvent); };
    addEventListener('beforeinstallprompt', on);
    return () => removeEventListener('beforeinstallprompt', on);
  }, []);
  const items = useMemo<MenuItem[]>(() => [
    { label: 'מצגת לוועדה', hint: 'שלוש החלופות, שקף לכל אחת', onSelect: () => go('/site', { ...keep(), show: '1' }) },
    { label: 'מקור: המחשבון ב-Lovable', hint: 'הגרסה הקודמת', onSelect: () => open('https://pixel-perfect-clone-6624.lovable.app', '_blank') },
    { label: 'מקור: שכונה 360', hint: '44 המדדים', onSelect: () => open('https://shchuna-360.vercel.app', '_blank') },
    { label: 'גורד שחקים', hint: 'מגדל בודד בתלת־ממד', onSelect: () => open('https://anat1969.github.io/SkySkiper-GH/', '_blank') },
    { label: 'הדפסה', hint: 'A4 או PDF', onSelect: () => print() },
    ...(install ? [{ label: 'התקנת האפליקציה', onSelect: () => install.prompt() }] : []),
    { label: 'איפוס', hint: 'חזרה לברירת המחדל', onSelect: () => { try { localStorage.removeItem('programa:v1'); } catch { /* */ } location.hash = '#/'; location.reload(); } },
  ], [install]);
  const page = path.startsWith('/path') ? <PathPage /> : path.startsWith('/program') ? <ProgramPage /> : path.startsWith('/site') ? <SitePage /> : path.startsWith('/method') ? <Method /> : <Home />;
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-in">
          <a className="brand" href="#/" aria-label="פרוגרמה בהעמדה, לדף הבית">
            <img src="/icon.svg" alt="" width={26} height={26} />
            <span>פרוגרמה בהעמדה</span>
          </a>
          <nav className="tabs" aria-label="ניווט">
            {NAV.map(([p, l]) => (
              <button key={p} className="tab" aria-current={(p === '/' ? path === '/' : path.startsWith(p)) ? 'page' : undefined} onClick={() => go(p, keep())}>{l}</button>
            ))}
          </nav>
          <Chain role={d?.role ?? 'city'} current="program" links={chainLinks} />
          <AIMenu items={items} status="" />
        </div>
        {path.startsWith('/path') ? null : strip}
      </header>
      {page}
    </div>
  );
}
