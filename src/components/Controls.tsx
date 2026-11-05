// הקלט: עיר, יחידות דיור, תמהיל ומגרש. אותו רכיב בפרוגרמה ובהעמדה.
import { CITIES } from '../data/program';
import type { Inputs } from '../lib/layout';
import type { City } from '../data/program';

type Set = (p: Partial<Record<'u' | 'c' | 'm' | 's', string>>) => void;
const MIX: [keyof Inputs['mix'], string][] = [['small', 'עד 55'], ['medium', 'עד 80'], ['large', '110'], ['xl', '135']];

export default function Controls({ inputs, city, set, compact = false }: { inputs: Inputs; city: City; set: Set; compact?: boolean }) {
  const num = (v: string) => v.replace(/\D/g, '');
  const mix = (k: keyof Inputs['mix'], v: number) => set({ m: MIX.map(([kk]) => (kk === k ? v : inputs.mix[kk])).join('.') });
  return (
    <div className={`controls${compact ? ' compact' : ''}`}>
      <label className="ctl"><span className="label">עיר</span>
        <select className="field" value={city.id} onChange={(e) => set({ c: e.target.value })}>
          {CITIES.map((x) => <option key={x.id} value={x.id}>{x.name} · {x.coefficient} נפש</option>)}
        </select>
      </label>
      <label className="ctl"><span className="label">יחידות דיור</span>
        <input className="field num" inputMode="numeric" value={inputs.units} onChange={(e) => set({ u: num(e.target.value) || '20' })} />
      </label>
      <fieldset className="ctl mixset"><legend className="label">תמהיל, % לפי מ"ר</legend>
        {MIX.map(([k, l]) => (
          <label key={k} className="mixf"><span>{l}</span>
            <input className="field num" inputMode="numeric" aria-label={`תמהיל ${l} מ"ר, אחוזים`} value={inputs.mix[k]} onChange={(e) => mix(k, Number(num(e.target.value)) || 0)} />
          </label>
        ))}
      </fieldset>
      <label className="ctl"><span className="label">מגרש, מ'</span>
        <span className="sitef">
          <input className="field num" inputMode="numeric" aria-label="רוחב המגרש" value={inputs.siteW} onChange={(e) => set({ s: `${num(e.target.value) || 160}x${inputs.siteD}` })} />
          <span>×</span>
          <input className="field num" inputMode="numeric" aria-label="עומק המגרש" value={inputs.siteD} onChange={(e) => set({ s: `${inputs.siteW}x${num(e.target.value) || 160}` })} />
        </span>
      </label>
    </div>
  );
}
