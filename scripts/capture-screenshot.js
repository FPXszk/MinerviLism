const { chromium } = require('playwright');
const fs = require('fs');

async function capture(url, outDir) {
  await fs.promises.mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  const contextDesktop = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await contextDesktop.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${outDir}/desktop.png`, fullPage: true });

  const contextMobile = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true });
  const page2 = await contextMobile.newPage();
  await page2.goto(url, { waitUntil: 'networkidle' });
  await page2.screenshot({ path: `${outDir}/mobile.png`, fullPage: true });

  await browser.close();
}

const argv = require('minimist')(process.argv.slice(2));
const url = argv.url || argv.u || 'http://localhost:5173/dashboard';
const out = argv.out || argv.o || 'tests/screenshots';

capture(url, out).then(() => console.log('Screenshots saved to', out)).catch((e) => { console.error(e); process.exit(1); });
