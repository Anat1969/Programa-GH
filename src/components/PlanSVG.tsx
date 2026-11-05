// תכנית מבט־על של חלופה: אותם מלבנים כמו במודל, בקנה מידה אחד. משמשת להשוואה בין החלופות ובנייד.
import type { Layout } from '../lib/layout';
import { height } from '../lib/layout';

export default function PlanSVG({ layout, small = false }: { layout: Layout; small?: boolean }) {
  const S = layout.site;
  const Y = (y: number, d: number) => S.d - y - d; // צפון למעלה
  const maxH = Math.max(1, ...layout.boxes.map(height));
  return (
    <svg className={`plan${small ? ' small' : ''}`} viewBox={`-6 -6 ${S.w + 12} ${S.d + 12}`} direction="ltr" aria-label={`תכנית, חלופה ${layout.name}`}>
      <rect x={0} y={0} width={S.w} height={S.d} className="p-site" />
      {layout.streets.map((r, i) => <rect key={'s' + i} x={r.x} y={Y(r.y, r.d)} width={r.w} height={r.d} className="p-street" />)}
      {layout.plaza.map((r, i) => <rect key={'z' + i} x={r.x} y={Y(r.y, r.d)} width={r.w} height={r.d} className="p-plaza" />)}
      {layout.courtyards.map((r, i) => <rect key={'c' + i} x={r.x} y={Y(r.y, r.d)} width={r.w} height={r.d} className="p-court" />)}
      {layout.parks.map((r, i) => <rect key={'p' + i} x={r.x} y={Y(r.y, r.d)} width={r.w} height={r.d} className="p-park" />)}
      {layout.surfaceParking.map((r, i) => <rect key={'l' + i} x={r.x} y={Y(r.y, r.d)} width={r.w} height={r.d} className="p-lot" />)}
      {layout.boxes.map((b) => (
        <rect key={b.id} x={b.x} y={Y(b.y, b.d)} width={b.w} height={b.d} className={`p-b u-${b.ground ?? b.use}`} style={{ opacity: 0.55 + 0.45 * (height(b) / maxH) }}>
          <title>{`${b.label} · ${b.floors} קומות`}</title>
        </rect>
      ))}
      {!small && <g className="p-north"><line x1={S.w - 8} x2={S.w - 8} y1={22} y2={6} /><text x={S.w - 8} y={32} textAnchor="middle">צ</text></g>}
    </svg>
  );
}
