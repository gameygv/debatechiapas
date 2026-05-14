import { test, expect } from '@playwright/test';

test('PDF edition viewer loads', async ({ page }) => {
  // Go to editions archive
  await page.goto('https://debatechiapas.dockerapps.top/ediciones', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Click the first edition
  const firstEdition = page.locator('a[href^="/edicion/"]').first();
  const href = await firstEdition.getAttribute('href');
  console.log('First edition link:', href);

  await firstEdition.click();
  await page.waitForTimeout(8000);

  // Screenshot the viewer
  await page.screenshot({ path: 'tests/screenshots/pdf-viewer-test.png', fullPage: true });

  // Check for errors
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  // Check if "Cargando" is still showing (means PDF failed)
  const loadingText = await page.locator('text=Cargando edicion').count();
  const errorText = await page.locator('text=Error').count();
  const pdfDownload = await page.locator('text=Descargar PDF directamente').count();

  console.log('Loading visible:', loadingText);
  console.log('Error visible:', errorText);
  console.log('Download fallback visible:', pdfDownload);
  console.log('Console errors:', errors);

  await page.screenshot({ path: 'tests/screenshots/pdf-viewer-result.png' });
});
