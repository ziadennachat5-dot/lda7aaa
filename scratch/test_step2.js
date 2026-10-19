const puppeteer = require('../dev/node_modules/puppeteer');

(async () => {
  console.log('Testing STEP 2 - PAGE CONTENT on http://localhost:8080/collaborations...');
  let hadErrors = false;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(err.message));

    // Desktop test
    await page.setViewport({ width: 1440, height: 900 });
    const resp = await page.goto('http://localhost:8080/collaborations', { waitUntil: 'networkidle0' });
    console.log('Response status:', resp.status());

    // Wait for creators cards to render
    await page.waitForSelector('#collab-grid .creator-card', { timeout: 10000 });

    if (consoleErrors.length > 0) {
      console.error('Console errors:', consoleErrors);
      hadErrors = true;
    } else {
      console.log('No console errors.');
    }

    // Inspect elements
    const initialData = await page.evaluate(() => {
      const heroTitle = document.querySelector('.collab-hero .section-title')?.textContent?.trim();
      const countNum = document.querySelector('#collab-count-number')?.textContent?.trim();
      const countTxt = document.querySelector('#collab-count-text')?.textContent?.trim();
      const tabs = Array.from(document.querySelectorAll('.collab-tab-pill')).map(b => b.textContent.trim());
      const cardsCount = document.querySelectorAll('#collab-grid .creator-card').length;
      const loadMoreVisible = document.querySelector('#collab-load-more')?.style.display !== 'none';
      const ctaWaHref = document.querySelector('#collab-cta-wa')?.getAttribute('href');
      const ctaTitle = document.querySelector('.collab-cta-title')?.textContent?.trim();
      return { heroTitle, countNum, countTxt, tabs, cardsCount, loadMoreVisible, ctaWaHref, ctaTitle };
    });
    console.log('Initial Render Data:', initialData);

    if (initialData.cardsCount !== 12) {
      console.error(`Expected 12 cards initially, but got ${initialData.cardsCount}`);
      hadErrors = true;
    }
    if (!initialData.loadMoreVisible) {
      console.error('Expected Load More button to be visible since total creators > 12');
      hadErrors = true;
    }

    // Test Load More
    console.log('Clicking Load More...');
    await page.click('#collab-load-more');
    await new Promise(r => setTimeout(r, 200));

    const afterLoadMore = await page.evaluate(() => {
      const cardsCount = document.querySelectorAll('#collab-grid .creator-card').length;
      const loadMoreVisible = document.querySelector('#collab-load-more')?.style.display !== 'none';
      return { cardsCount, loadMoreVisible };
    });
    console.log('After Load More:', afterLoadMore);
    if (afterLoadMore.cardsCount <= 12) {
      console.error('Cards count did not increase after Load More!');
      hadErrors = true;
    }

    // Test Search Box
    console.log('Testing search filter with "alaa"...');
    await page.type('#collab-search-input', 'alaa');
    await new Promise(r => setTimeout(r, 200));

    const searchResult = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('#collab-grid .creator-card'));
      const names = cards.map(c => c.querySelector('.creator-name')?.textContent?.trim());
      return { count: cards.length, names };
    });
    console.log('Search Result:', searchResult);
    if (searchResult.count === 0) {
      console.error('Expected search for "alaa" to find matching creator');
      hadErrors = true;
    }

    // Clear search
    await page.evaluate(() => {
      const inp = document.querySelector('#collab-search-input');
      inp.value = '';
      inp.dispatchEvent(new Event('input'));
    });
    await new Promise(r => setTimeout(r, 200));

    // Test Platform Filter Tabs
    console.log('Testing platform filter tabs...');
    const tabClicked = await page.evaluate(() => {
      const pills = Array.from(document.querySelectorAll('.collab-tab-pill'));
      const instagramPill = pills.find(p => p.getAttribute('data-platform') === 'instagram');
      if (instagramPill) {
        instagramPill.click();
        return true;
      }
      return false;
    });
    await new Promise(r => setTimeout(r, 200));
    console.log('Instagram tab clicked:', tabClicked);

    // Test Language switch to English
    console.log('Testing language switch to EN...');
    await page.click('#lang-toggle-desktop');
    await new Promise(r => setTimeout(r, 300));

    const enData = await page.evaluate(() => {
      const lang = document.documentElement.lang;
      const dir = document.documentElement.dir;
      const heroTitle = document.querySelector('.collab-hero .section-title')?.textContent?.trim();
      const countTxt = document.querySelector('#collab-count-text')?.textContent?.trim();
      const ctaWaHref = document.querySelector('#collab-cta-wa')?.getAttribute('href');
      const tabs = Array.from(document.querySelectorAll('.collab-tab-pill')).map(b => b.textContent.trim());
      return { lang, dir, heroTitle, countTxt, ctaWaHref, tabs };
    });
    console.log('English Render Data:', enData);

    if (enData.lang !== 'en' || enData.dir !== 'ltr') {
      console.error('Language switch did not set lang=en or dir=ltr');
      hadErrors = true;
    }

    // Mobile viewport & overflow check at 390x844
    console.log('Testing mobile viewport 390x844...');
    await page.setViewport({ width: 390, height: 844 });
    const overflow = await page.evaluate(() => {
      return {
        hasOverflow: document.documentElement.scrollWidth > window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth
      };
    });
    console.log('Mobile overflow check:', overflow);
    if (overflow.hasOverflow) {
      console.error('Horizontal overflow detected at 390px viewport!');
      hadErrors = true;
    }

    await page.close();
  } catch (e) {
    console.error('Error during test execution:', e);
    hadErrors = true;
  } finally {
    await browser.close();
  }

  if (hadErrors) {
    console.error('STEP 2 TEST RESULT: FAIL');
    process.exit(1);
  } else {
    console.log('STEP 2 TEST RESULT: PASS');
    process.exit(0);
  }
})();
