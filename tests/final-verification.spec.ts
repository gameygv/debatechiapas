import { test, expect } from '@playwright/test';

const SITE = 'https://debatechiapas.com';

test.describe('Final verification on debatechiapas.com', () => {

  test('Homepage loads with articles', async ({ page }) => {
    await page.goto(SITE, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'tests/screenshots/final-home.png', fullPage: true });
    const articles = await page.locator('article').count();
    console.log('Articles on homepage:', articles);
    expect(articles).toBeGreaterThan(0);
  });

  test('Article detail shows full portrait image', async ({ page }) => {
    await page.goto(SITE, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.locator('article a').first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'tests/screenshots/final-article.png', fullPage: true });
    const img = page.locator('main img').first();
    expect(await img.isVisible()).toBeTruthy();
  });

  test('Ediciones PDF page loads with editions', async ({ page }) => {
    await page.goto(SITE + '/ediciones', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'tests/screenshots/final-ediciones.png' });
    const editions = await page.locator('a[href^="/edicion/"]').count();
    console.log('Editions:', editions);
    expect(editions).toBeGreaterThan(0);
  });

  test('PDF viewer loads with iframe', async ({ page }) => {
    await page.goto(SITE + '/ediciones', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.locator('a[href^="/edicion/"]').first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'tests/screenshots/final-pdf-viewer.png' });
    const iframe = page.locator('iframe');
    expect(await iframe.count()).toBeGreaterThan(0);
  });

  test('WordPress slug redirect works', async ({ page }) => {
    const resp = await page.goto(SITE + '/debate-chiapas-jueves-13-de-mayo-del-2026', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    const url = page.url();
    console.log('Redirected to:', url);
    expect(url).toContain('/noticias/');
  });

  test('Nav has Ediciones PDF link', async ({ page }) => {
    await page.goto(SITE, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    const edLink = page.locator('nav >> text=EDICIONES PDF');
    expect(await edLink.count()).toBeGreaterThan(0);
  });
});
