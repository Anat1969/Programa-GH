// צילומי מסך לבדיקה בעין: node tests/shots.cjs <base> <outDir>
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const MENU = fs.readFileSync(__dirname + '/ai-menu.local.js', 'utf8');
(async () => {
  const [base, out] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  for (const [n, w, h] of [['1440', 1440, 900], ['390', 390, 844]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    p.on('pageerror', (e) => console.log('ERR', e.message));
    await p.route('**/appofapp-gh.vercel.app/ai-menu.js', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: MENU }));
    await p.route('**/fonts.googleapis.com/**', (r) => r.abort());
    for (const hsh of (process.env.PAGES || '/,/program,/site,/method').split(',')) {
      await p.goto(base + '#' + hsh, { waitUntil: 'networkidle' });
      await p.waitForTimeout(3000);
      await p.screenshot({ path: `${out}/${n}-${hsh.replace(/\W/g, '') || 'home'}.png` });
    }
    await p.close();
  }
  await b.close();
})();
