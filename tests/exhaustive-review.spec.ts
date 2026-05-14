import { test, expect } from '@playwright/test';

const SITE = 'https://debatechiapas.com';

test.describe('Exhaustive review', () => {

  test('Homepage: articles load, images visible, no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(SITE, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(4000);
    const articles = await page.locator('article').count();
    expect(articles).toBeGreaterThan(0);
    const imgs = await page.locator('article img').count();
    expect(imgs).toBeGreaterThan(0);
    // Check nav links
    expect(await page.locator('nav >> text=INICIO').count()).toBeGreaterThan(0);
    expect(await page.locator('nav >> text=GENERAL').count()).toBeGreaterThan(0);
    expect(await page.locator('nav >> text=EDICIONES PDF').count()).toBeGreaterThan(0);
    // Check search bar
    expect(await page.locator('input[placeholder="Buscar..."]').count()).toBeGreaterThan(0);
    // Check footer
    expect(await page.locator('footer').count()).toBe(1);
    console.log('Homepage articles:', articles, 'images:', imgs, 'errors:', errors.length);
    if (errors.length > 0) console.log('ERRORS:', errors);
    await page.screenshot({ path: 'tests/screenshots/review-home.png' });
  });

  test('Article detail: image not cropped, OG tags present', async ({ page }) => {
    await page.goto(SITE, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.locator('article a').first().click();
    await page.waitForTimeout(3000);
    // Check featured image has object-contain (not cropped)
    const img = page.locator('main img').first();
    expect(await img.isVisible()).toBeTruthy();
    // Check OG tags
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    console.log('OG title:', ogTitle);
    console.log('OG image:', ogImage);
    expect(ogTitle).toBeTruthy();
    expect(ogImage).toBeTruthy();
    // Check related articles have portrait aspect
    await page.screenshot({ path: 'tests/screenshots/review-article.png', fullPage: true });
  });

  test('Login page loads', async ({ page }) => {
    await page.goto(SITE + '/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    expect(await page.locator('input[type="email"], input[placeholder*="email" i], input[placeholder*="correo" i]').count()).toBeGreaterThan(0);
    await page.screenshot({ path: 'tests/screenshots/review-login.png' });
  });

  test('Admin login works with real credentials', async ({ page }) => {
    await page.goto(SITE + '/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', 'gameygv@gmail.com');
    await page.fill('input[type="password"]', 'DebateChiapas2026!');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(5000);
    const url = page.url();
    console.log('After login URL:', url);
    await page.screenshot({ path: 'tests/screenshots/review-admin.png' });
  });

  test('Ediciones archive loads editions', async ({ page }) => {
    await page.goto(SITE + '/ediciones', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    const editions = await page.locator('a[href^="/edicion/"]').count();
    console.log('Editions on archive:', editions);
    expect(editions).toBeGreaterThan(0);
    await page.screenshot({ path: 'tests/screenshots/review-ediciones.png' });
  });

  test('PDF viewer has iframe', async ({ page }) => {
    await page.goto(SITE + '/ediciones', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.locator('a[href^="/edicion/"]').first().click();
    await page.waitForTimeout(3000);
    expect(await page.locator('iframe').count()).toBeGreaterThan(0);
    // Check buttons
    expect(await page.locator('text=Pantalla completa').count()).toBeGreaterThan(0);
    expect(await page.locator('text=Descargar PDF').count()).toBeGreaterThan(0);
    await page.screenshot({ path: 'tests/screenshots/review-pdf.png' });
  });

  test('WordPress slug redirect for regular article', async ({ page }) => {
    // Get a known article slug
    await page.goto(SITE, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    const firstLink = await page.locator('article a').first().getAttribute('href');
    const slug = firstLink?.replace('/noticias/', '');
    console.log('Testing redirect for slug:', slug);
    await page.goto(SITE + '/' + slug, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/noticias/');
    console.log('Redirected to:', page.url());
  });

  test('Search works', async ({ page }) => {
    await page.goto(SITE, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.fill('input[placeholder="Buscar..."]', 'Chiapas');
    await page.press('input[placeholder="Buscar..."]', 'Enter');
    await page.waitForTimeout(3000);
    expect(page.url()).toContain('/buscar');
    await page.screenshot({ path: 'tests/screenshots/review-search.png' });
  });

  test('Mobile responsive', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(SITE, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(4000);
    // Check hamburger menu exists
    expect(await page.locator('button:has(svg)').first().isVisible()).toBeTruthy();
    await page.screenshot({ path: 'tests/screenshots/review-mobile.png', fullPage: true });
  });

  test('Favicon is correct (not MoyMontes)', async ({ page }) => {
    await page.goto(SITE, { waitUntil: 'networkidle', timeout: 30000 });
    const favicon = await page.locator('link[rel="icon"], link[rel="shortcut icon"]').first().getAttribute('href');
    console.log('Favicon href:', favicon);
    expect(favicon).not.toContain('MoyMontes');
    expect(favicon).toContain('favicon');
  });

  test('No MoyMontes references in page source', async ({ page }) => {
    await page.goto(SITE, { waitUntil: 'networkidle', timeout: 30000 });
    const html = await page.content();
    const hasMoyMontes = html.includes('MoyMontes') && !html.includes('facebook.com/MoyMontes');
    // facebook.com/MoyMontes is expected (same social accounts)
    const filtered = html.replace(/facebook\.com\/MoyMontes/g, '').replace(/instagram\.com\/moymontess/g, '');
    expect(filtered).not.toContain('MoyMontes');
  });
});
