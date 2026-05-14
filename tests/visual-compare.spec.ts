import { test } from '@playwright/test';

const ORIGINAL = 'https://debatechiapas.com';
const NEW_SITE = 'https://debatechiapas.dockerapps.top';

test.describe('Visual comparison: original vs new site', () => {

  test('Original site - homepage full page', async ({ page }) => {
    await page.goto(ORIGINAL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'tests/screenshots/original-home-full.png', fullPage: true });
    await page.screenshot({ path: 'tests/screenshots/original-home-viewport.png' });
  });

  test('Original site - header close-up', async ({ page }) => {
    await page.goto(ORIGINAL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/screenshots/original-header.png', clip: { x: 0, y: 0, width: 1440, height: 500 } });
  });

  test('New site - homepage full page', async ({ page }) => {
    await page.goto(NEW_SITE, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'tests/screenshots/new-home-full.png', fullPage: true });
    await page.screenshot({ path: 'tests/screenshots/new-home-viewport.png' });
  });

  test('New site - header close-up', async ({ page }) => {
    await page.goto(NEW_SITE, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'tests/screenshots/new-header.png', clip: { x: 0, y: 0, width: 1440, height: 500 } });
  });

  test('New site - article card area', async ({ page }) => {
    await page.goto(NEW_SITE, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'tests/screenshots/new-articles.png', clip: { x: 0, y: 400, width: 1440, height: 900 } });
  });

  test('New site - footer', async ({ page }) => {
    await page.goto(NEW_SITE, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'tests/screenshots/new-footer.png' });
  });

  test('New site - edition viewer', async ({ page }) => {
    await page.goto(NEW_SITE + '/ediciones', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'tests/screenshots/new-ediciones.png', fullPage: true });
  });

  test('New site - mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(NEW_SITE, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'tests/screenshots/new-mobile.png', fullPage: true });
  });
});
