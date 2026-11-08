// בדיקת קצה לקצה: npm run build && node tests/e2e.cjs
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const PORT = 4391, BASE = `http://localhost:${PORT}/`;
const MENU = fs.readFileSync(__dirname + '/ai-menu.local.js', 'utf8');
const fails = [];
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
const BRIEF = {
  headline: { insight: 'חלופה ב **מובילה**.', detail: '**23.7** מתוך **28**.' },
  alternatives: [{ key: 'A', text: { insight: 'מגדלים **בלי חניה**.', detail: 'חסרים **442** מקומות.' } }, { key: 'B', text: { insight: '**רחוב פעיל**.', detail: '**3.4** מתוך **4**.' } }, { key: 'C', text: { insight: '**פארק** רציף.', detail: '**21,600** מ"ר.' } }],
  recommendation: { insight: 'להביא את **חלופה ב**.', detail: 'בתנאי השלמת **שצ"פ**.' },
  steps: ['לבדוק **חניה**', 'להשלים **שצ"פ**', 'לאשר **תמהיל**'], engine: 'gemini',
};
(async () => {
  const srv = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = []; p.on('pageerror', (e) => errors.push(e.message));
    await p.route('**/appofapp-gh.vercel.app/ai-menu.js', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: MENU }));
    await p.route('**/fonts.googleapis.com/**', (r) => r.abort());
    const calls = []; let mode = 'ok';
    await p.route('**/functions/v1/programa-brief', async (r) => { calls.push(JSON.parse(r.request().postData() || '{}')); await r.fulfill(mode === 'ok' ? { status: 200, contentType: 'application/json', body: JSON.stringify(BRIEF) } : { status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'אין מנוע זמין כרגע' }) }); });

    await p.goto(BASE, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
    const h1 = (await p.locator('h1').innerText()).replace(/\s+/g, ' ');
    ok(/23\.7/.test(h1) && /רחוב ראשי/.test(h1), 'בית: הציון המוביל 23.7, חלופה ב רחוב ראשי (' + h1 + ')');
    ok(await p.locator('.home canvas').count() === 1, 'בית: מודל תלת־ממדי');
    ok(await p.locator('ai-menu').evaluate((el) => !!el.shadowRoot?.querySelector('.logo')), 'כפתור הלוגו A&I');
    ok(!(await p.locator('header >> text=העתקת קישור').first().isVisible().catch(() => false)), 'אין כפתורי פיתוח חופשיים בסרגל');

    await p.goto(BASE + '#/program', { waitUntil: 'networkidle' });
    ok((await p.locator('.lens-h').innerText()).includes('1,750'), 'פרוגרמה: 500 יח"ד באשדוד = 1,750 תושבים, כמו במחשבון');
    ok(await p.locator('.psec').count() === 4, 'פרוגרמה: ארבע קבוצות עם מספר גדול');
    ok((await p.locator('.ps-open .ps-big').innerText()).includes('24,500'), 'פרוגרמה: שצ"פ 24,500 מ"ר (14 מ"ר לנפש)');
    await p.locator('.controls input').first().fill('1000');
    await p.waitForTimeout(300);
    ok((await p.locator('.lens-h').innerText()).includes('3,500'), 'פרוגרמה: 1,000 יח"ד = 3,500 תושבים, והמצב בכתובת');
    ok(/u=1000/.test(await p.evaluate(() => location.hash)), 'המצב נשמר בכתובת');
    ok((await p.locator('.psec li', { hasText: 'ספרייה' }).getAttribute('class')) !== 'off', 'פרוגרמה: מעל 3,000 נפש הספרייה נדרשת');

    await p.evaluate(() => localStorage.clear());
    await p.goto(BASE + '#/site?u=500', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
    ok(await p.locator('.alt').count() === 3, 'העמדה: שלוש חלופות');
    ok(await p.locator('.focus canvas').count() === 1, 'העמדה: מודל תלת־ממדי של החלופה הנבחרת');
    ok(await p.locator('.mtab tbody tr').count() === 9, 'העמדה: 9 מדדי שכונה 360');
    ok(await p.locator('.mtab tr.is-div').count() === 1, 'העמדה: המדד שמפריד מסומן במרקר');
    ok(await p.locator('.checks li').count() === 5, 'העמדה: 5 בדיקות');
    await p.locator('.alt').first().click(); await p.waitForTimeout(400);
    ok(/a=A/.test(await p.evaluate(() => location.hash)), 'העמדה: בחירת חלופה א נשמרת בכתובת');
    ok((await p.locator('.checks').innerText()).includes('חסרים'), 'העמדה: במגדלים חסרה חניה, וזה מוצג');
    const sky = await p.locator('a', { hasText: 'גורד שחקים' }).getAttribute('href');
    ok(sky.startsWith('https://anat1969.github.io/SkySkiper-GH/#patch=') && JSON.parse(decodeURIComponent(sky.split('#patch=')[1].split('&')[0]))['body.height.floors'] > 10, 'העמדה: הבניין הגבוה נפתח בגורד שחקים');

    const toTamhil = await p.locator('.chain-bar a', { hasText: 'תמהיל' }).getAttribute('href');
    ok(toTamhil.startsWith('https://tamhil-gh.vercel.app/#/compare?a=42.42.84.42.1200.0') && /c=ashdod/.test(toTamhil), 'שרשרת: לתמהיל עם תמהיל השכונה (' + toTamhil + ')');
    ok((await p.locator('.chain-bar a', { hasText: 'מגדל' }).getAttribute('href')).startsWith('https://anat1969.github.io/SkySkiper-GH/#patch='), 'שרשרת: למגדל הגבוה');
    await p.goto(BASE + '#/program?m=33.27.27.13&c=ashdod', { waitUntil: 'networkidle' });
    ok((await p.locator('.mixset input').first().inputValue()) === '33', 'שרשרת: התמהיל מהתמהיל נקלט בפרוגרמה');
    await p.goto(BASE + '#/site?u=500&a=A', { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
    await p.locator('.dock button', { hasText: 'מצגת' }).click(); await p.waitForTimeout(500);
    ok(await p.locator('.show .s-cover').isVisible(), 'מצגת: שקף פתיחה');
    await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(800);
    ok(await p.locator('.show .s-alt canvas').count() === 1, 'מצגת: שקף חלופה עם מודל');
    await p.keyboard.press('ArrowLeft'); await p.keyboard.press('ArrowLeft'); await p.keyboard.press('ArrowLeft');
    ok(await p.locator('.show .s-plans figure').count() === 3, 'מצגת: שקף השוואה');
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    ok(await p.locator('.show').count() === 0, 'מצגת: Escape סוגר');

    await p.locator('.dock .primary').click(); await p.waitForSelector('.brief');
    ok(calls.length === 1 && calls[0].alternatives?.length === 3 && typeof calls[0].alternatives[0].total === 'number', 'ניסוח: נשלחים ציוני המנוע לשלוש החלופות');
    ok((await p.locator('.brief-h').innerText()).includes('מובילה'), 'ניסוח: הכותרת מוצגת');
    await p.locator('.brief-x').click(); mode = 'fail';
    await p.locator('.dock .primary').click(); await p.waitForSelector('.brief .tone-problem');
    ok((await p.locator('.brief .tone-problem').innerText()).includes('הציונים במסך'), 'ניסוח: כשל מוצג בבירור');

    // מסלול: שתי נקודות מבט, ארבעה שלבים, ותיק שעובר
    await p.goto(BASE + '#/path?r=city&lot=101', { waitUntil: 'networkidle' });
    ok((await p.locator('.stage h2').allInnerTexts()).join('>') === 'תב"ע>פרוגרמה>תמהיל>מגדל', 'מסלול עירייה: תב"ע, פרוגרמה, תמהיל, מגדל');
    await p.locator('.role').nth(1).click(); await p.waitForTimeout(200);
    ok((await p.locator('.stage h2').allInnerTexts()).join('>') === 'תב"ע>תמהיל>פרוגרמה>מגדל', 'מסלול יזם: תב"ע, תמהיל, פרוגרמה, מגדל');
    const ph = await p.locator('.stage a').evaluateAll((as) => as.map((a) => a.href));
    ok(ph[0].includes('chalufot-gh.vercel.app/#/studio?plan=tml-2022&lot=101'), 'מסלול: התב"ע נפתחת בחלופה שעוברת בדיקה, על התוכנית והמגרש');
    const progHref = ph.find((h) => h.includes('programa-gh'));
    await p.goto(progHref.replace('https://programa-gh.vercel.app/', BASE), { waitUntil: 'networkidle' }); await p.waitForTimeout(500);
    const st = (await p.locator('.strip').innerText()).replace(/\s+/g, ' ');
    ok(/תמל\/2022, מגרש 101/.test(st) && /11,034/.test(st) && /חסרים 6,014/.test(st), 'תיק בפרוגרמה: 2,160 יח"ד, ציבור נדרש 11,034 מול 5,020 בתב"ע (' + st.slice(0, 120) + ')');
    ok(/d=/.test(await p.locator('.topbar .chain-bar a', { hasText: 'תמהיל' }).getAttribute('href')), 'תיק בפרוגרמה: הקישור לתמהיל נושא את התיק');

    await p.goto(BASE + '#/method', { waitUntil: 'networkidle' });
    ok(await p.locator('.notes tr').count() === 9, 'שיטה: כלל מדידה לכל מדד');
    ok(await p.locator('.museum blockquote').isVisible(), 'שיטה: ציטוט עם מקור');

    const m = await b.newPage({ viewport: { width: 390, height: 844 } });
    await m.route('**/appofapp-gh.vercel.app/ai-menu.js', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: MENU }));
    await m.route('**/fonts.googleapis.com/**', (r) => r.abort());
    for (const h of ['/', '/program', '/site', '/method']) {
      await m.goto(BASE + '#' + h, { waitUntil: 'networkidle' }); await m.waitForTimeout(500);
      ok(!(await m.evaluate(() => document.documentElement.scrollWidth > innerWidth)), `נייד ${h}: בלי גלילה אופקית`);
    }
    ok(errors.length === 0, 'בלי שגיאות JavaScript ' + errors.join(' | '));
  } finally { await b.close(); srv.kill(); }
  console.log(fails.length ? `\n${fails.length} FAILED` : '\nALL PASS');
  process.exit(fails.length ? 1 : 0);
})();
