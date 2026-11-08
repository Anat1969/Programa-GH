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
import { skyskiperLink } from './lib/sky';
import { ranking } from './lib/insights';

const NAV: [string, string][] = [['/', 'בית'], ['/program', 'פרוגרמה'], ['/site', 'העמדה'], ['/method', 'שיטה']];
interface BIPEvent extends Event { prompt: () => Promise<void> }
const keep = () => Object.fromEntries(new URLSearchParams(location.hash.split('?')[1] ?? ''));

export default function App() {
  const { path, q } = useRoute();
  const plan = usePlan();
  // השרשרת בסרגל העליון, בכל דף: לתמהיל עם תמהיל השכונה, ולמגדל עם הבניין הגבוה של החלופה הנבחרת או המובילה
  const selKey = q.get('a') || ranking(plan.scores)[0].key;
  const selAlt = plan.alts.find((x) => x.key === selKey) ?? plan.alts[0];
  const chainLinks = { 2: tamhilLink(plan.inputs, plan.city.id), 3: skyskiperLink(selAlt) };
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
  const page = path.startsWith('/program') ? <ProgramPage /> : path.startsWith('/site') ? <SitePage /> : path.startsWith('/method') ? <Method /> : <Home />;
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
          <Chain step={1} links={chainLinks} />
          <AIMenu items={items} status="" />
        </div>
      </header>
      {page}
    </div>
  );
}
