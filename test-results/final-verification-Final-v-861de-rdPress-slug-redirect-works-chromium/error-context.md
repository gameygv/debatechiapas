# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: final-verification.spec.ts >> Final verification on debatechiapas.com >> WordPress slug redirect works
- Location: tests/final-verification.spec.ts:45:3

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "/noticias/"
Received string:    "https://debatechiapas.com/"
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
        - heading "Últimas Noticias" [level=1] [ref=e66]
        - paragraph [ref=e67]: Mantente informado con las últimas noticias
      - generic [ref=e68]:
        - article [ref=e69]:
          - link "Elmer de Jesús celebra a las madres de Suchiate Elmer de Jesús celebra a las madres de Suchiate General may 13, 2026 Leer mas" [ref=e70] [cursor=pointer]:
            - /url: /noticias/elmer-de-jesus-celebra-a-las-madres-de-suchiate
            - img "Elmer de Jesús celebra a las madres de Suchiate" [ref=e72]
            - generic [ref=e73]:
              - heading "Elmer de Jesús celebra a las madres de Suchiate" [level=2] [ref=e74]
              - generic [ref=e75]:
                - generic [ref=e76]: General
                - generic [ref=e77]: may 13, 2026
              - generic [ref=e78]: Leer mas
        - article [ref=e79]:
          - link "Sheinbaum presenta el prototipo del minivehículo eléctrico mexicano Olinia Sheinbaum presenta el prototipo del minivehículo eléctrico mexicano Olinia General may 13, 2026 Leer mas" [ref=e80] [cursor=pointer]:
            - /url: /noticias/sheinbaum-presenta-el-prototipo-del-minivehiculo-electrico-mexicano-olinia
            - img "Sheinbaum presenta el prototipo del minivehículo eléctrico mexicano Olinia" [ref=e82]
            - generic [ref=e83]:
              - heading "Sheinbaum presenta el prototipo del minivehículo eléctrico mexicano Olinia" [level=2] [ref=e84]
              - generic [ref=e85]:
                - generic [ref=e86]: General
                - generic [ref=e87]: may 13, 2026
              - generic [ref=e88]: Leer mas
        - article [ref=e89]:
          - link "Secretario del Campo atestigua entrega de semilla de maíz en Villaflores Secretario del Campo atestigua entrega de semilla de maíz en Villaflores General may 13, 2026 Leer mas" [ref=e90] [cursor=pointer]:
            - /url: /noticias/secretario-del-campo-atestigua-entrega-de-semilla-de-maiz-en-villaflores
            - img "Secretario del Campo atestigua entrega de semilla de maíz en Villaflores" [ref=e92]
            - generic [ref=e93]:
              - heading "Secretario del Campo atestigua entrega de semilla de maíz en Villaflores" [level=2] [ref=e94]
              - generic [ref=e95]:
                - generic [ref=e96]: General
                - generic [ref=e97]: may 13, 2026
              - generic [ref=e98]: Leer mas
        - article [ref=e99]:
          - link "Federación y ONG reconocen unificación de la salud en Chiapas Federación y ONG reconocen unificación de la salud en Chiapas General may 13, 2026 Leer mas" [ref=e100] [cursor=pointer]:
            - /url: /noticias/federacion-y-ong-reconocen-unificacion-de-la-salud-en-chiapas
            - img "Federación y ONG reconocen unificación de la salud en Chiapas" [ref=e102]
            - generic [ref=e103]:
              - heading "Federación y ONG reconocen unificación de la salud en Chiapas" [level=2] [ref=e104]
              - generic [ref=e105]:
                - generic [ref=e106]: General
                - generic [ref=e107]: may 13, 2026
              - generic [ref=e108]: Leer mas
        - article [ref=e109]:
          - link "Entrega Enaproc Doctorado Honoris Causa a Enrique Guevara Ortiz Entrega Enaproc Doctorado Honoris Causa a Enrique Guevara Ortiz General may 13, 2026 Leer mas" [ref=e110] [cursor=pointer]:
            - /url: /noticias/entrega-enaproc-doctorado-honoris-causa-a-enrique-guevara-ortiz
            - img "Entrega Enaproc Doctorado Honoris Causa a Enrique Guevara Ortiz" [ref=e112]
            - generic [ref=e113]:
              - heading "Entrega Enaproc Doctorado Honoris Causa a Enrique Guevara Ortiz" [level=2] [ref=e114]
              - generic [ref=e115]:
                - generic [ref=e116]: General
                - generic [ref=e117]: may 13, 2026
              - generic [ref=e118]: Leer mas
        - article [ref=e119]:
          - link "IAP Chiapas fortalece cooperación y firma convenio con IAP Puebla IAP Chiapas fortalece cooperación y firma convenio con IAP Puebla General may 13, 2026 Leer mas" [ref=e120] [cursor=pointer]:
            - /url: /noticias/iap-chiapas-fortalece-cooperacion-y-firma-convenio-con-iap-puebla
            - img "IAP Chiapas fortalece cooperación y firma convenio con IAP Puebla" [ref=e122]
            - generic [ref=e123]:
              - heading "IAP Chiapas fortalece cooperación y firma convenio con IAP Puebla" [level=2] [ref=e124]
              - generic [ref=e125]:
                - generic [ref=e126]: General
                - generic [ref=e127]: may 13, 2026
              - generic [ref=e128]: Leer mas
        - article [ref=e129]:
          - link "CECyT 20 San Cristóbal conquista campeonato regional de fútbol CECyT 20 San Cristóbal conquista campeonato regional de fútbol General may 13, 2026 Leer mas" [ref=e130] [cursor=pointer]:
            - /url: /noticias/cecyt-20-san-cristobal-conquista-campeonato-regional-de-futbol
            - img "CECyT 20 San Cristóbal conquista campeonato regional de fútbol" [ref=e132]
            - generic [ref=e133]:
              - heading "CECyT 20 San Cristóbal conquista campeonato regional de fútbol" [level=2] [ref=e134]
              - generic [ref=e135]:
                - generic [ref=e136]: General
                - generic [ref=e137]: may 13, 2026
              - generic [ref=e138]: Leer mas
        - article [ref=e139]:
          - link "Aditech fortalece la ciberseguridad del Gobierno de Chiapas Aditech fortalece la ciberseguridad del Gobierno de Chiapas General may 13, 2026 Leer mas" [ref=e140] [cursor=pointer]:
            - /url: /noticias/aditech-fortalece-la-ciberseguridad-del-gobierno-de-chiapas
            - img "Aditech fortalece la ciberseguridad del Gobierno de Chiapas" [ref=e142]
            - generic [ref=e143]:
              - heading "Aditech fortalece la ciberseguridad del Gobierno de Chiapas" [level=2] [ref=e144]
              - generic [ref=e145]:
                - generic [ref=e146]: General
                - generic [ref=e147]: may 13, 2026
              - generic [ref=e148]: Leer mas
        - article [ref=e149]:
          - 'link "“Nuestro único compromiso es que Chiapas esté en paz”: Óscar Aparicio “Nuestro único compromiso es que Chiapas esté en paz”: Óscar Aparicio General may 13, 2026 Leer mas" [ref=e150] [cursor=pointer]':
            - /url: /noticias/nuestro-unico-compromiso-es-que-chiapas-este-en-paz-oscar-aparicio
            - 'img "“Nuestro único compromiso es que Chiapas esté en paz”: Óscar Aparicio" [ref=e152]'
            - generic [ref=e153]:
              - 'heading "“Nuestro único compromiso es que Chiapas esté en paz”: Óscar Aparicio" [level=2] [ref=e154]'
              - generic [ref=e155]:
                - generic [ref=e156]: General
                - generic [ref=e157]: may 13, 2026
              - generic [ref=e158]: Leer mas
        - article [ref=e159]:
          - link "Carlos Moreno Guillén celebra políticas públicas en favor de las mujeres Carlos Moreno Guillén celebra políticas públicas en favor de las mujeres General may 13, 2026 Leer mas" [ref=e160] [cursor=pointer]:
            - /url: /noticias/carlos-moreno-guillen-celebra-politicas-publicas-en-favor-de-las-mujeres
            - img "Carlos Moreno Guillén celebra políticas públicas en favor de las mujeres" [ref=e162]
            - generic [ref=e163]:
              - heading "Carlos Moreno Guillén celebra políticas públicas en favor de las mujeres" [level=2] [ref=e164]
              - generic [ref=e165]:
                - generic [ref=e166]: General
                - generic [ref=e167]: may 13, 2026
              - generic [ref=e168]: Leer mas
        - article [ref=e169]:
          - link "Eduardo Ramírez inaugura Centros LIBRE en Tuxtla Chico y Cacahoatán para fortalecer la protección de las mujeres Eduardo Ramírez inaugura Centros LIBRE en Tuxtla Chico y Cacahoatán para fortalecer la protección de las mujeres General may 13, 2026 Leer mas" [ref=e170] [cursor=pointer]:
            - /url: /noticias/eduardo-ramirez-inaugura-centros-libre-en-tuxtla-chico-y-cacahoatan-para-fortalecer-la-proteccion-de-las-mujeres
            - img "Eduardo Ramírez inaugura Centros LIBRE en Tuxtla Chico y Cacahoatán para fortalecer la protección de las mujeres" [ref=e172]
            - generic [ref=e173]:
              - heading "Eduardo Ramírez inaugura Centros LIBRE en Tuxtla Chico y Cacahoatán para fortalecer la protección de las mujeres" [level=2] [ref=e174]
              - generic [ref=e175]:
                - generic [ref=e176]: General
                - generic [ref=e177]: may 13, 2026
              - generic [ref=e178]: Leer mas
        - article [ref=e179]:
          - 'link "Huixtla: Trabajos de limpieza y desazolve en dren del Ejido Francisco I. Madero Huixtla: Trabajos de limpieza y desazolve en dren del Ejido Francisco I. Madero General may 13, 2026 Leer mas" [ref=e180] [cursor=pointer]':
            - /url: /noticias/huixtla-trabajos-de-limpieza-y-desazolve-en-dren-del-ejido-francisco-i-madero
            - 'img "Huixtla: Trabajos de limpieza y desazolve en dren del Ejido Francisco I. Madero" [ref=e182]'
            - generic [ref=e183]:
              - 'heading "Huixtla: Trabajos de limpieza y desazolve en dren del Ejido Francisco I. Madero" [level=2] [ref=e184]'
              - generic [ref=e185]:
                - generic [ref=e186]: General
                - generic [ref=e187]: may 13, 2026
              - generic [ref=e188]: Leer mas
        - article [ref=e189]:
          - link "PT Chiapas busca fortalecer su estructura rumbo a nuevos escenarios políticos PT Chiapas busca fortalecer su estructura rumbo a nuevos escenarios políticos General may 13, 2026 Leer mas" [ref=e190] [cursor=pointer]:
            - /url: /noticias/pt-chiapas-busca-fortalecer-su-estructura-rumbo-a-nuevos-escenarios-politicos
            - img "PT Chiapas busca fortalecer su estructura rumbo a nuevos escenarios políticos" [ref=e192]
            - generic [ref=e193]:
              - heading "PT Chiapas busca fortalecer su estructura rumbo a nuevos escenarios políticos" [level=2] [ref=e194]
              - generic [ref=e195]:
                - generic [ref=e196]: General
                - generic [ref=e197]: may 13, 2026
              - generic [ref=e198]: Leer mas
        - article [ref=e199]:
          - link "VC ¡Celebremos juntos el Día Internacional de la Familia! VC ¡Celebremos juntos el Día Internacional de la Familia! General may 13, 2026 Leer mas" [ref=e200] [cursor=pointer]:
            - /url: /noticias/vc-celebremos-juntos-el-dia-internacional-de-la-familia
            - img "VC ¡Celebremos juntos el Día Internacional de la Familia!" [ref=e202]
            - generic [ref=e203]:
              - heading "VC ¡Celebremos juntos el Día Internacional de la Familia!" [level=2] [ref=e204]
              - generic [ref=e205]:
                - generic [ref=e206]: General
                - generic [ref=e207]: may 13, 2026
              - generic [ref=e208]: Leer mas
        - article [ref=e209]:
          - link "Festival del Día de las Madres en Amatán Festival del Día de las Madres en Amatán General may 13, 2026 Leer mas" [ref=e210] [cursor=pointer]:
            - /url: /noticias/festival-del-dia-de-las-madres-en-amatan-3
            - img "Festival del Día de las Madres en Amatán" [ref=e212]
            - generic [ref=e213]:
              - heading "Festival del Día de las Madres en Amatán" [level=2] [ref=e214]
              - generic [ref=e215]:
                - generic [ref=e216]: General
                - generic [ref=e217]: may 13, 2026
              - generic [ref=e218]: Leer mas
      - generic [ref=e219]:
        - button "Anterior" [disabled]:
          - img
          - text: Anterior
        - generic [ref=e221]: Página 1 de 174
        - button "Siguiente" [ref=e222] [cursor=pointer]:
          - text: Siguiente
          - img
      - generic [ref=e225]:
        - img "Debate Chiapas jueves 13 de mayo del 2026" [ref=e227]
        - generic [ref=e228]:
          - generic [ref=e230]: Edicion del dia
          - heading "Debate Chiapas jueves 13 de mayo del 2026" [level=2] [ref=e231]
          - paragraph [ref=e232]: miércoles 13 de mayo, 2026
          - generic [ref=e233]:
            - link "Leer edicion completa" [ref=e234] [cursor=pointer]:
              - /url: /edicion/0c5aa715-6bf7-4d6c-a897-fb47b632882d
              - button "Leer edicion completa" [ref=e235]:
                - img
                - text: Leer edicion completa
            - link "Ver ediciones anteriores" [ref=e236] [cursor=pointer]:
              - /url: /ediciones
              - button "Ver ediciones anteriores" [ref=e237]:
                - text: Ver ediciones anteriores
                - img
    - generic [ref=e238]:
      - link:
        - /url: https://www.dyad.sh/
    - contentinfo [ref=e239]:
      - img "Debate Chiapas" [ref=e241]
      - generic [ref=e242]:
        - generic [ref=e243]:
          - generic [ref=e244]:
            - heading "Debate Chiapas" [level=2] [ref=e245]
            - paragraph [ref=e246]: Periodismo independiente, crítico y veraz desde el corazón del sureste mexicano. Debate Chiapas.
            - generic [ref=e247]:
              - link [ref=e248] [cursor=pointer]:
                - /url: https://www.facebook.com/MoyMontes
                - img [ref=e249]
              - link [ref=e251] [cursor=pointer]:
                - /url: https://www.instagram.com/moymontess/
                - img [ref=e252]
              - link [ref=e255] [cursor=pointer]:
                - /url: https://www.tiktok.com/@eldivodechiapas
                - img [ref=e256]
          - generic [ref=e258]:
            - heading "Secciones" [level=3] [ref=e259]
            - list [ref=e260]:
              - listitem [ref=e261]:
                - link "General" [ref=e262] [cursor=pointer]:
                  - /url: /categoria/general
          - generic [ref=e263]:
            - heading "Institucional" [level=3] [ref=e264]
            - list [ref=e265]:
              - listitem [ref=e266]: Quiénes Somos
              - listitem [ref=e267]: Contacto
              - listitem [ref=e268]: Publicidad
              - listitem [ref=e269]: Aviso de Privacidad
        - generic [ref=e270]: © 2026 - Debate Chiapas. Todos los derechos reservados.
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | const SITE = 'https://debatechiapas.com';
  4  | 
  5  | test.describe('Final verification on debatechiapas.com', () => {
  6  | 
  7  |   test('Homepage loads with articles', async ({ page }) => {
  8  |     await page.goto(SITE, { waitUntil: 'networkidle', timeout: 30000 });
  9  |     await page.waitForTimeout(5000);
  10 |     await page.screenshot({ path: 'tests/screenshots/final-home.png', fullPage: true });
  11 |     const articles = await page.locator('article').count();
  12 |     console.log('Articles on homepage:', articles);
  13 |     expect(articles).toBeGreaterThan(0);
  14 |   });
  15 | 
  16 |   test('Article detail shows full portrait image', async ({ page }) => {
  17 |     await page.goto(SITE, { waitUntil: 'networkidle', timeout: 30000 });
  18 |     await page.waitForTimeout(3000);
  19 |     await page.locator('article a').first().click();
  20 |     await page.waitForTimeout(3000);
  21 |     await page.screenshot({ path: 'tests/screenshots/final-article.png', fullPage: true });
  22 |     const img = page.locator('main img').first();
  23 |     expect(await img.isVisible()).toBeTruthy();
  24 |   });
  25 | 
  26 |   test('Ediciones PDF page loads with editions', async ({ page }) => {
  27 |     await page.goto(SITE + '/ediciones', { waitUntil: 'networkidle', timeout: 30000 });
  28 |     await page.waitForTimeout(3000);
  29 |     await page.screenshot({ path: 'tests/screenshots/final-ediciones.png' });
  30 |     const editions = await page.locator('a[href^="/edicion/"]').count();
  31 |     console.log('Editions:', editions);
  32 |     expect(editions).toBeGreaterThan(0);
  33 |   });
  34 | 
  35 |   test('PDF viewer loads with iframe', async ({ page }) => {
  36 |     await page.goto(SITE + '/ediciones', { waitUntil: 'networkidle', timeout: 30000 });
  37 |     await page.waitForTimeout(2000);
  38 |     await page.locator('a[href^="/edicion/"]').first().click();
  39 |     await page.waitForTimeout(3000);
  40 |     await page.screenshot({ path: 'tests/screenshots/final-pdf-viewer.png' });
  41 |     const iframe = page.locator('iframe');
  42 |     expect(await iframe.count()).toBeGreaterThan(0);
  43 |   });
  44 | 
  45 |   test('WordPress slug redirect works', async ({ page }) => {
  46 |     const resp = await page.goto(SITE + '/debate-chiapas-jueves-13-de-mayo-del-2026', { waitUntil: 'networkidle', timeout: 30000 });
  47 |     await page.waitForTimeout(2000);
  48 |     const url = page.url();
  49 |     console.log('Redirected to:', url);
> 50 |     expect(url).toContain('/noticias/');
     |                 ^ Error: expect(received).toContain(expected) // indexOf
  51 |   });
  52 | 
  53 |   test('Nav has Ediciones PDF link', async ({ page }) => {
  54 |     await page.goto(SITE, { waitUntil: 'networkidle', timeout: 30000 });
  55 |     await page.waitForTimeout(2000);
  56 |     const edLink = page.locator('nav >> text=EDICIONES PDF');
  57 |     expect(await edLink.count()).toBeGreaterThan(0);
  58 |   });
  59 | });
  60 | 
```