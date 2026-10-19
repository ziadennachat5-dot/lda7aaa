const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('../dev/node_modules/puppeteer');

const ROOT = path.resolve(__dirname, '..');
const PORT = 8089;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';
  if (urlPath === '/collaborations' || urlPath === '/collaborations/') urlPath = '/collaborations/index.html';
  if (urlPath === '/admin' || urlPath === '/admin/') urlPath = '/admin/index.html';

  const filePath = path.join(ROOT, urlPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found: ' + urlPath);
  }
});

server.listen(PORT, async () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  let hadErrors = false;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    for (const testUrl of [`http://localhost:${PORT}/collaborations`, `http://localhost:${PORT}/collaborations/`]) {
      console.log(`\nTesting URL: ${testUrl}`);
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });
      
      const consoleErrors = [];
      const failedRequests = [];
      
      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      page.on('pageerror', err => consoleErrors.push(err.message));
      page.on('requestfailed', req => failedRequests.push(req.url()));

      const resp = await page.goto(testUrl, { waitUntil: 'networkidle0' });
      console.log('Status code:', resp.status());

      if (consoleErrors.length > 0) {
        console.error('Console errors:', consoleErrors);
        hadErrors = true;
      } else {
        console.log('No console errors.');
      }

      if (failedRequests.length > 0) {
        console.error('Failed requests (404/fail):', failedRequests);
        hadErrors = true;
      } else {
        console.log('No failed network requests.');
      }

      // Check title, canonical, OG tags
      const meta = await page.evaluate(() => {
        const title = document.title;
        const desc = document.querySelector('meta[name="description"]')?.getAttribute('content');
        const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
        const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
        const ogDesc = document.querySelector('meta[property="og:description"]')?.getAttribute('content');
        const introOverlay = document.getElementById('welcome-intro-overlay');
        const lang = document.documentElement.lang;
        const dir = document.documentElement.dir;
        const theme = document.documentElement.dataset.theme;
        return { title, desc, canonical, ogTitle, ogDesc, hasIntroOverlay: !!introOverlay, lang, dir, theme };
      });
      console.log('Extracted Metadata:', meta);

      if (meta.hasIntroOverlay) {
        console.error('Intro overlay should NOT be present on collaborations page!');
        hadErrors = true;
      }

      // Test theme toggle
      await page.click('#theme-toggle-desktop');
      const themeAfter = await page.evaluate(() => document.documentElement.dataset.theme);
      console.log('Theme after desktop toggle:', themeAfter);

      // Test lang toggle
      await page.click('#lang-toggle-desktop');
      const langAfter = await page.evaluate(() => ({
        lang: document.documentElement.lang,
        dir: document.documentElement.dir,
        title: document.title,
        desc: document.querySelector('meta[name="description"]')?.getAttribute('content'),
        ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
        ogDesc: document.querySelector('meta[property="og:description"]')?.getAttribute('content')
      }));
      console.log('Lang after toggle:', langAfter);

      // Mobile drawer test at 390x844
      console.log('Testing mobile viewport 390x844...');
      await page.setViewport({ width: 390, height: 844 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      if (overflow) {
        console.error('Horizontal overflow detected at 390px width!');
        hadErrors = true;
      } else {
        console.log('No horizontal overflow at 390px width.');
      }

      await page.click('#menu-toggle-mobile');
      const isDrawerActive = await page.evaluate(() => document.getElementById('menu-drawer').classList.contains('active'));
      console.log('Mobile drawer active after toggle:', isDrawerActive);
      if (!isDrawerActive) {
        console.error('Drawer did not activate on mobile menu toggle click!');
        hadErrors = true;
      }

      await page.close();
    }
  } catch (err) {
    console.error('Test execution failed:', err);
    hadErrors = true;
  } finally {
    await browser.close();
    server.close();
  }

  if (hadErrors) {
    console.error('\nTEST RESULT: FAIL');
    process.exit(1);
  } else {
    console.log('\nTEST RESULT: PASS');
    process.exit(0);
  }
});
