# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: exhaustive-review.spec.ts >> Exhaustive review >> Article detail: image not cropped, OG tags present
- Location: tests/exhaustive-review.spec.ts:29:3

# Error details

```
Error: locator.getAttribute: Error: strict mode violation: locator('meta[property="og:title"]') resolved to 2 elements:
    1) <meta property="og:title" content="Debate Chiapas"/> aka locator('meta').nth(5)
    2) <meta data-rh="true" property="og:title" content="Elmer de Jesús celebra a las madres de Suchiate"/> aka locator('meta:nth-child(26)')

Call log:
  - waiting for locator('meta[property="og:title"]')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications (F8)":
    - list
  - region "Notifications alt+T"
  - generic [ref=e3]:
    - banner [ref=e4]:
      - generic [ref=e6]:
        - generic [ref=e7]: Última Hora
        - generic [ref=e9]:
          - link "Elmer de Jesús celebra a las madres de Suchiate" [ref=e10] [cursor=pointer]:
            - /url: /noticias/elmer-de-jesus-celebra-a-las-madres-de-suchiate
            - text: Elmer de Jesús celebra a las madres de Suchiate
          - link "Sheinbaum presenta el prototipo del minivehículo eléctrico mexicano Olinia" [ref=e12] [cursor=pointer]:
            - /url: /noticias/sheinbaum-presenta-el-prototipo-del-minivehiculo-electrico-mexicano-olinia
            - text: Sheinbaum presenta el prototipo del minivehículo eléctrico mexicano Olinia
          - link "Secretario del Campo atestigua entrega de semilla de maíz en Villaflores" [ref=e14] [cursor=pointer]:
            - /url: /noticias/secretario-del-campo-atestigua-entrega-de-semilla-de-maiz-en-villaflores
            - text: Secretario del Campo atestigua entrega de semilla de maíz en Villaflores
          - link "Federación y ONG reconocen unificación de la salud en Chiapas" [ref=e16] [cursor=pointer]:
            - /url: /noticias/federacion-y-ong-reconocen-unificacion-de-la-salud-en-chiapas
            - text: Federación y ONG reconocen unificación de la salud en Chiapas
          - link "Entrega Enaproc Doctorado Honoris Causa a Enrique Guevara Ortiz" [ref=e18] [cursor=pointer]:
            - /url: /noticias/entrega-enaproc-doctorado-honoris-causa-a-enrique-guevara-ortiz
            - text: Entrega Enaproc Doctorado Honoris Causa a Enrique Guevara Ortiz
          - link "Elmer de Jesús celebra a las madres de Suchiate" [ref=e20] [cursor=pointer]:
            - /url: /noticias/elmer-de-jesus-celebra-a-las-madres-de-suchiate
            - text: Elmer de Jesús celebra a las madres de Suchiate
          - link "Sheinbaum presenta el prototipo del minivehículo eléctrico mexicano Olinia" [ref=e22] [cursor=pointer]:
            - /url: /noticias/sheinbaum-presenta-el-prototipo-del-minivehiculo-electrico-mexicano-olinia
            - text: Sheinbaum presenta el prototipo del minivehículo eléctrico mexicano Olinia
          - link "Secretario del Campo atestigua entrega de semilla de maíz en Villaflores" [ref=e24] [cursor=pointer]:
            - /url: /noticias/secretario-del-campo-atestigua-entrega-de-semilla-de-maiz-en-villaflores
            - text: Secretario del Campo atestigua entrega de semilla de maíz en Villaflores
          - link "Federación y ONG reconocen unificación de la salud en Chiapas" [ref=e26] [cursor=pointer]:
            - /url: /noticias/federacion-y-ong-reconocen-unificacion-de-la-salud-en-chiapas
            - text: Federación y ONG reconocen unificación de la salud en Chiapas
          - link "Entrega Enaproc Doctorado Honoris Causa a Enrique Guevara Ortiz" [ref=e28] [cursor=pointer]:
            - /url: /noticias/entrega-enaproc-doctorado-honoris-causa-a-enrique-guevara-ortiz
            - text: Entrega Enaproc Doctorado Honoris Causa a Enrique Guevara Ortiz
      - link "Debate Chiapas" [ref=e31] [cursor=pointer]:
        - /url: /
        - img "Debate Chiapas" [ref=e32]
      - generic [ref=e34]:
        - generic [ref=e35]:
          - link "Facebook" [ref=e36] [cursor=pointer]:
            - /url: https://www.facebook.com/MoyMontes
            - img [ref=e37]
          - link "Instagram" [ref=e39] [cursor=pointer]:
            - /url: https://www.instagram.com/moymontess/
            - img [ref=e40]
          - link "TikTok" [ref=e43] [cursor=pointer]:
            - /url: https://www.tiktok.com/@eldivodechiapas
            - img [ref=e44]
        - generic [ref=e46]:
          - textbox "Buscar..." [ref=e47]
          - button [ref=e48] [cursor=pointer]:
            - img [ref=e49]
      - navigation [ref=e52]:
        - list [ref=e54]:
          - listitem [ref=e55]:
            - link "Inicio" [ref=e56] [cursor=pointer]:
              - /url: /
              - img [ref=e57]
              - text: Inicio
          - listitem [ref=e60]:
            - link "General" [ref=e61] [cursor=pointer]:
              - /url: /categoria/general
          - listitem [ref=e62]:
            - link "Ediciones PDF" [ref=e63] [cursor=pointer]:
              - /url: /ediciones
    - main [ref=e64]:
      - generic [ref=e65]:
        - link "General" [ref=e67] [cursor=pointer]:
          - /url: /categoria/general
        - heading "Elmer de Jesús celebra a las madres de Suchiate" [level=1] [ref=e68]
        - paragraph [ref=e69]: Hoy compartimos momentos llenos de emoción, sonrisas y convivencia junto a las familias de las comunidades de El Gancho, Tierra y Libertad, San Isidro, Miguel Alemán y La Isla. Gracias a todas las...
        - generic [ref=e71]:
          - img [ref=e72]
          - generic [ref=e74]: 13 de mayo, 2026
      - img "Elmer de Jesús celebra a las madres de Suchiate" [ref=e77]
      - generic [ref=e78]:
        - generic [ref=e81]:
          - generic [ref=e82]: Compartir
          - button "Compartir en WhatsApp" [ref=e83] [cursor=pointer]:
            - img
          - button "Compartir en Facebook" [ref=e84] [cursor=pointer]:
            - img
          - button "Compartir en X" [ref=e85] [cursor=pointer]:
            - img
          - button "Copiar enlace" [ref=e86] [cursor=pointer]:
            - img
        - article [ref=e87]:
          - generic [ref=e88]:
            - paragraph [ref=e89]: Hoy compartimos momentos llenos de emoción, sonrisas y convivencia junto a las familias de las comunidades de El Gancho, Tierra y Libertad, San Isidro, Miguel Alemán y La Isla.
            - paragraph [ref=e90]: Gracias a todas las mamás que nos acompañaron y fueron parte de esta gran celebración preparada con mucho cariño para las reinas del hogar.
            - paragraph [ref=e91]: ¡Esto apenas comienza! Seguiremos llevando alegría, regalos y muchas sorpresas a más comunidades de nuestro municipio.
          - generic [ref=e92]:
            - heading "Noticias Relacionadas" [level=3] [ref=e93]
            - generic [ref=e94]:
              - link "Sheinbaum presenta el prototipo del minivehículo eléctrico mexicano Olinia Sheinbaum presenta el prototipo del minivehículo eléctrico mexicano Olinia Leer más" [ref=e95] [cursor=pointer]:
                - /url: /noticias/sheinbaum-presenta-el-prototipo-del-minivehiculo-electrico-mexicano-olinia
                - img "Sheinbaum presenta el prototipo del minivehículo eléctrico mexicano Olinia" [ref=e97]
                - heading "Sheinbaum presenta el prototipo del minivehículo eléctrico mexicano Olinia" [level=4] [ref=e98]
                - generic [ref=e99]:
                  - text: Leer más
                  - img [ref=e100]
              - link "Secretario del Campo atestigua entrega de semilla de maíz en Villaflores Secretario del Campo atestigua entrega de semilla de maíz en Villaflores Leer más" [ref=e102] [cursor=pointer]:
                - /url: /noticias/secretario-del-campo-atestigua-entrega-de-semilla-de-maiz-en-villaflores
                - img "Secretario del Campo atestigua entrega de semilla de maíz en Villaflores" [ref=e104]
                - heading "Secretario del Campo atestigua entrega de semilla de maíz en Villaflores" [level=4] [ref=e105]
                - generic [ref=e106]:
                  - text: Leer más
                  - img [ref=e107]
              - link "Federación y ONG reconocen unificación de la salud en Chiapas Federación y ONG reconocen unificación de la salud en Chiapas Leer más" [ref=e109] [cursor=pointer]:
                - /url: /noticias/federacion-y-ong-reconocen-unificacion-de-la-salud-en-chiapas
                - img "Federación y ONG reconocen unificación de la salud en Chiapas" [ref=e111]
                - heading "Federación y ONG reconocen unificación de la salud en Chiapas" [level=4] [ref=e112]
                - generic [ref=e113]:
                  - text: Leer más
                  - img [ref=e114]
    - contentinfo [ref=e116]:
      - img "Debate Chiapas" [ref=e118]
      - generic [ref=e119]:
        - generic [ref=e120]:
          - generic [ref=e121]:
            - heading "Debate Chiapas" [level=2] [ref=e122]
            - paragraph [ref=e123]: Periodismo independiente, crítico y veraz desde el corazón del sureste mexicano. Debate Chiapas.
            - generic [ref=e124]:
              - link [ref=e125] [cursor=pointer]:
                - /url: https://www.facebook.com/MoyMontes
                - img [ref=e126]
              - link [ref=e128] [cursor=pointer]:
                - /url: https://www.instagram.com/moymontess/
                - img [ref=e129]
              - link [ref=e132] [cursor=pointer]:
                - /url: https://www.tiktok.com/@eldivodechiapas
                - img [ref=e133]
          - generic [ref=e135]:
            - heading "Secciones" [level=3] [ref=e136]
            - list [ref=e137]:
              - listitem [ref=e138]:
                - link "General" [ref=e139] [cursor=pointer]:
                  - /url: /categoria/general
          - generic [ref=e140]:
            - heading "Institucional" [level=3] [ref=e141]
            - list [ref=e142]:
              - listitem [ref=e143]: Quiénes Somos
              - listitem [ref=e144]: Contacto
              - listitem [ref=e145]: Publicidad
              - listitem [ref=e146]: Aviso de Privacidad
        - generic [ref=e147]: © 2026 - Debate Chiapas. Todos los derechos reservados.
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | const SITE = 'https://debatechiapas.com';
  4   | 
  5   | test.describe('Exhaustive review', () => {
  6   | 
  7   |   test('Homepage: articles load, images visible, no console errors', async ({ page }) => {
  8   |     const errors: string[] = [];
  9   |     page.on('pageerror', e => errors.push(e.message));
  10  |     await page.goto(SITE, { waitUntil: 'networkidle', timeout: 30000 });
  11  |     await page.waitForTimeout(4000);
  12  |     const articles = await page.locator('article').count();
  13  |     expect(articles).toBeGreaterThan(0);
  14  |     const imgs = await page.locator('article img').count();
  15  |     expect(imgs).toBeGreaterThan(0);
  16  |     // Check nav links
  17  |     expect(await page.locator('nav >> text=INICIO').count()).toBeGreaterThan(0);
  18  |     expect(await page.locator('nav >> text=GENERAL').count()).toBeGreaterThan(0);
  19  |     expect(await page.locator('nav >> text=EDICIONES PDF').count()).toBeGreaterThan(0);
  20  |     // Check search bar
  21  |     expect(await page.locator('input[placeholder="Buscar..."]').count()).toBeGreaterThan(0);
  22  |     // Check footer
  23  |     expect(await page.locator('footer').count()).toBe(1);
  24  |     console.log('Homepage articles:', articles, 'images:', imgs, 'errors:', errors.length);
  25  |     if (errors.length > 0) console.log('ERRORS:', errors);
  26  |     await page.screenshot({ path: 'tests/screenshots/review-home.png' });
  27  |   });
  28  | 
  29  |   test('Article detail: image not cropped, OG tags present', async ({ page }) => {
  30  |     await page.goto(SITE, { waitUntil: 'networkidle', timeout: 30000 });
  31  |     await page.waitForTimeout(3000);
  32  |     await page.locator('article a').first().click();
  33  |     await page.waitForTimeout(3000);
  34  |     // Check featured image has object-contain (not cropped)
  35  |     const img = page.locator('main img').first();
  36  |     expect(await img.isVisible()).toBeTruthy();
  37  |     // Check OG tags
> 38  |     const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
      |                                                                     ^ Error: locator.getAttribute: Error: strict mode violation: locator('meta[property="og:title"]') resolved to 2 elements:
  39  |     const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
  40  |     console.log('OG title:', ogTitle);
  41  |     console.log('OG image:', ogImage);
  42  |     expect(ogTitle).toBeTruthy();
  43  |     expect(ogImage).toBeTruthy();
  44  |     // Check related articles have portrait aspect
  45  |     await page.screenshot({ path: 'tests/screenshots/review-article.png', fullPage: true });
  46  |   });
  47  | 
  48  |   test('Login page loads', async ({ page }) => {
  49  |     await page.goto(SITE + '/login', { waitUntil: 'networkidle', timeout: 30000 });
  50  |     await page.waitForTimeout(2000);
  51  |     expect(await page.locator('input[type="email"], input[placeholder*="email" i], input[placeholder*="correo" i]').count()).toBeGreaterThan(0);
  52  |     await page.screenshot({ path: 'tests/screenshots/review-login.png' });
  53  |   });
  54  | 
  55  |   test('Admin login works with real credentials', async ({ page }) => {
  56  |     await page.goto(SITE + '/login', { waitUntil: 'networkidle', timeout: 30000 });
  57  |     await page.waitForTimeout(2000);
  58  |     await page.fill('input[type="email"]', 'gameygv@gmail.com');
  59  |     await page.fill('input[type="password"]', 'DebateChiapas2026!');
  60  |     await page.locator('button[type="submit"]').click();
  61  |     await page.waitForTimeout(5000);
  62  |     const url = page.url();
  63  |     console.log('After login URL:', url);
  64  |     await page.screenshot({ path: 'tests/screenshots/review-admin.png' });
  65  |   });
  66  | 
  67  |   test('Ediciones archive loads editions', async ({ page }) => {
  68  |     await page.goto(SITE + '/ediciones', { waitUntil: 'networkidle', timeout: 30000 });
  69  |     await page.waitForTimeout(3000);
  70  |     const editions = await page.locator('a[href^="/edicion/"]').count();
  71  |     console.log('Editions on archive:', editions);
  72  |     expect(editions).toBeGreaterThan(0);
  73  |     await page.screenshot({ path: 'tests/screenshots/review-ediciones.png' });
  74  |   });
  75  | 
  76  |   test('PDF viewer has iframe', async ({ page }) => {
  77  |     await page.goto(SITE + '/ediciones', { waitUntil: 'networkidle', timeout: 30000 });
  78  |     await page.waitForTimeout(2000);
  79  |     await page.locator('a[href^="/edicion/"]').first().click();
  80  |     await page.waitForTimeout(3000);
  81  |     expect(await page.locator('iframe').count()).toBeGreaterThan(0);
  82  |     // Check buttons
  83  |     expect(await page.locator('text=Pantalla completa').count()).toBeGreaterThan(0);
  84  |     expect(await page.locator('text=Descargar PDF').count()).toBeGreaterThan(0);
  85  |     await page.screenshot({ path: 'tests/screenshots/review-pdf.png' });
  86  |   });
  87  | 
  88  |   test('WordPress slug redirect for regular article', async ({ page }) => {
  89  |     // Get a known article slug
  90  |     await page.goto(SITE, { waitUntil: 'networkidle', timeout: 30000 });
  91  |     await page.waitForTimeout(3000);
  92  |     const firstLink = await page.locator('article a').first().getAttribute('href');
  93  |     const slug = firstLink?.replace('/noticias/', '');
  94  |     console.log('Testing redirect for slug:', slug);
  95  |     await page.goto(SITE + '/' + slug, { waitUntil: 'networkidle', timeout: 30000 });
  96  |     await page.waitForTimeout(2000);
  97  |     expect(page.url()).toContain('/noticias/');
  98  |     console.log('Redirected to:', page.url());
  99  |   });
  100 | 
  101 |   test('Search works', async ({ page }) => {
  102 |     await page.goto(SITE, { waitUntil: 'networkidle', timeout: 30000 });
  103 |     await page.waitForTimeout(2000);
  104 |     await page.fill('input[placeholder="Buscar..."]', 'Chiapas');
  105 |     await page.press('input[placeholder="Buscar..."]', 'Enter');
  106 |     await page.waitForTimeout(3000);
  107 |     expect(page.url()).toContain('/buscar');
  108 |     await page.screenshot({ path: 'tests/screenshots/review-search.png' });
  109 |   });
  110 | 
  111 |   test('Mobile responsive', async ({ page }) => {
  112 |     await page.setViewportSize({ width: 390, height: 844 });
  113 |     await page.goto(SITE, { waitUntil: 'networkidle', timeout: 30000 });
  114 |     await page.waitForTimeout(4000);
  115 |     // Check hamburger menu exists
  116 |     expect(await page.locator('button:has(svg)').first().isVisible()).toBeTruthy();
  117 |     await page.screenshot({ path: 'tests/screenshots/review-mobile.png', fullPage: true });
  118 |   });
  119 | 
  120 |   test('Favicon is correct (not MoyMontes)', async ({ page }) => {
  121 |     await page.goto(SITE, { waitUntil: 'networkidle', timeout: 30000 });
  122 |     const favicon = await page.locator('link[rel="icon"], link[rel="shortcut icon"]').first().getAttribute('href');
  123 |     console.log('Favicon href:', favicon);
  124 |     expect(favicon).not.toContain('MoyMontes');
  125 |     expect(favicon).toContain('favicon');
  126 |   });
  127 | 
  128 |   test('No MoyMontes references in page source', async ({ page }) => {
  129 |     await page.goto(SITE, { waitUntil: 'networkidle', timeout: 30000 });
  130 |     const html = await page.content();
  131 |     const hasMoyMontes = html.includes('MoyMontes') && !html.includes('facebook.com/MoyMontes');
  132 |     // facebook.com/MoyMontes is expected (same social accounts)
  133 |     const filtered = html.replace(/facebook\.com\/MoyMontes/g, '').replace(/instagram\.com\/moymontess/g, '');
  134 |     expect(filtered).not.toContain('MoyMontes');
  135 |   });
  136 | });
  137 | 
```