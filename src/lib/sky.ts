// הבניין הגבוה בחלופה, נפתח בגורד שחקים (#patch= בפורמט הטיפולוגיות שלו).
import type { Layout } from './layout';
export function skyskiperLink(L: Layout) {
  const b = L.boxes.filter((x) => x.use === 'res').sort((a, c) => c.floors - a.floors)[0];
  if (!b) return null;
  const patch = {
    'enabled.base': false,
    'site.width': Math.round(b.w + 30), 'site.depth': Math.round(b.d + 30),
    'body.footprint.width': Math.round(b.w), 'body.footprint.depth': Math.round(b.d),
    'body.height.floors': b.floors, 'body.height.floorHeight': b.fh,
  };
  return `https://anat1969.github.io/SkySkiper-GH/#patch=${encodeURIComponent(JSON.stringify(patch))}&name=${encodeURIComponent(`${L.name} · ${b.label}`)}`;
}
