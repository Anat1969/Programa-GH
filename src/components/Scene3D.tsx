// המודל: כל מבנה בפרוגרמה כנפח, על המגרש, בצבע השימוש. three.js נטען רק כשצריך.
import { useEffect, useRef, useState } from 'react';
import type { Layout } from '../lib/layout';
import PlanSVG from './PlanSVG';

export const USE_HEX: Record<string, number> = { res: 0x7f93a6, com: 0xc27a55, edu: 0xcfae5c, pub: 0x2f5fa7 };

export default function Scene3D({ layout, auto = false, focus = null }: { layout: Layout; auto?: boolean; focus?: string | null }) {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let stop = false, raf = 0;
    let dispose = () => {};
    (async () => {
      try {
        const THREE = await import('three');
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
        if (stop) return;
        const W = el.clientWidth || 600, H = el.clientHeight || 400;
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
        renderer.setPixelRatio(Math.min(2, devicePixelRatio));
        renderer.setSize(W, H);
        renderer.shadowMap.enabled = true;
        el.appendChild(renderer.domElement);
        const scene = new THREE.Scene();
        const S = layout.site;
        const span = Math.max(S.w, S.d);
        const cam = new THREE.PerspectiveCamera(32, W / H, 1, span * 10);
        // מרחק לפי יחס המסגרת: מסגרת צרה וגבוהה מרחיקה את המצלמה כדי שכל המגרש ייכנס
        const fit = Math.max(1, 1.45 / (W / H));
        cam.position.set(span * 0.55 * fit, span * 0.75 * fit, span * 1.05 * fit);
        const controls = new OrbitControls(cam, renderer.domElement);
        controls.target.set(0, 10, 0);
        controls.enableDamping = true;
        controls.maxPolarAngle = Math.PI / 2.1;
        controls.autoRotate = auto;
        controls.autoRotateSpeed = 0.6;
        scene.add(new THREE.HemisphereLight(0xffffff, 0xd9d7d0, 1.1));
        const sun = new THREE.DirectionalLight(0xffffff, 1.6);
        // שמש מדרום־מערב (אשדוד, אחר הצהריים): y למעלה, z = −צפון
        sun.position.set(-span * 0.6, span * 0.9, span * 0.7);
        sun.castShadow = true;
        sun.shadow.mapSize.set(2048, 2048);
        Object.assign(sun.shadow.camera, { left: -span, right: span, top: span, bottom: -span, far: span * 4 });
        scene.add(sun);
        // מערכת צירים: x מזרחה, z = −y (צפון אל תוך המסך), מרכז המגרש ב-0
        const X = (x: number) => x - S.w / 2, Z = (y: number) => -(y - S.d / 2);
        const flat = (r: { x: number; y: number; w: number; d: number }, color: number, h = 0.05) => {
          const m = new THREE.Mesh(new THREE.BoxGeometry(r.w, h, r.d), new THREE.MeshLambertMaterial({ color }));
          m.position.set(X(r.x + r.w / 2), h / 2, Z(r.y + r.d / 2));
          m.receiveShadow = true;
          scene.add(m);
        };
        flat({ x: -20, y: -20, w: S.w + 40, d: S.d + 40 }, 0xf4f3ef, 0.02);
        flat(S, 0xffffff, 0.04);
        layout.streets.forEach((r) => flat(r, 0xd9d7d0, 0.08));
        layout.plaza.forEach((r) => flat(r, 0xe9e2d4, 0.1));
        layout.courtyards.forEach((r) => flat(r, 0xdcebd9, 0.1));
        layout.parks.forEach((r) => flat(r, 0x9cc79a, 0.14));
        layout.surfaceParking.forEach((r) => flat(r, 0xb9b6ad, 0.12));
        const edge = new THREE.LineBasicMaterial({ color: 0x1a1a18, transparent: true, opacity: 0.35 });
        for (const b of layout.boxes) {
          const dim = focus && focus !== b.use;
          const add = (z0: number, h: number, use: string) => {
            const g = new THREE.BoxGeometry(b.w, h, b.d);
            const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: USE_HEX[use], transparent: !!dim, opacity: dim ? 0.18 : 1 }));
            m.position.set(X(b.x + b.w / 2), z0 + h / 2, Z(b.y + b.d / 2));
            m.castShadow = !dim; m.receiveShadow = true;
            scene.add(m);
            const e = new THREE.LineSegments(new THREE.EdgesGeometry(g), edge);
            e.position.copy(m.position);
            scene.add(e);
          };
          if (b.ground) { add(0, 4.5, b.ground); add(4.5, b.floors * b.fh - 4.5, b.use); }
          else add(0, b.floors * b.fh, b.use);
        }
        const onResize = () => { const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return; renderer.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix(); };
        const ro = new ResizeObserver(onResize); ro.observe(el);
        const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce) controls.autoRotate = false;
        const tick = () => { controls.update(); renderer.render(scene, cam); raf = requestAnimationFrame(tick); };
        tick();
        dispose = () => { cancelAnimationFrame(raf); ro.disconnect(); controls.dispose(); renderer.dispose(); scene.traverse((o) => { const m = o as unknown as { geometry?: { dispose: () => void }; material?: { dispose: () => void } }; m.geometry?.dispose(); m.material?.dispose(); }); renderer.domElement.remove(); };
      } catch {
        if (!stop) setFailed(true);
      }
    })();
    return () => { stop = true; dispose(); };
  }, [layout, auto, focus]);
  return (
    <div className="scene" ref={host} aria-label={`מודל תלת־ממדי, חלופה ${layout.name}`}>
      {failed && <PlanSVG layout={layout} />}
    </div>
  );
}
