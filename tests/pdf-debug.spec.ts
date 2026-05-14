import { test } from '@playwright/test';

test('Debug PDF loading', async ({ page }) => {
  const logs: string[] = [];
  const errors: string[] = [];

  page.on('console', msg => {
    const text = `[${msg.type()}] ${msg.text()}`;
    logs.push(text);
    if (msg.type() === 'error') errors.push(msg.text());
  });

  page.on('pageerror', err => {
    errors.push(`PAGE ERROR: ${err.message}`);
  });

  page.on('requestfailed', req => {
    errors.push(`REQUEST FAILED: ${req.url()} - ${req.failure()?.errorText}`);
  });

  await page.goto('https://debatechiapas.dockerapps.top/edicion/0c5aa715-6bf7-4d6c-a897-fb47b632882d', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });

  await page.waitForTimeout(15000);

  console.log('\n=== ALL CONSOLE LOGS ===');
  logs.forEach(l => console.log(l));
  console.log('\n=== ERRORS ===');
  errors.forEach(e => console.log(e));

  await page.screenshot({ path: 'tests/screenshots/pdf-debug.png' });
});
