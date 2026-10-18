// scratch/check_site.js
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('pageerror', err => console.error('PAGE ERROR:', err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') console.error('CONSOLE ERROR:', msg.text());
  });
  try {
    await page.goto('http://localhost:8080/', { waitUntil: 'networkidle0' });
    console.log('PAGE LOADED');
  } catch (e) {
    console.error('NAVIGATION FAIL', e.message);
  }
  await browser.close();
})();
