/**
 * Migración de WordPress (debatechiapas.com) → Supabase (debatechiapas)
 *
 * Uso: node scripts/migrate-wp.mjs
 *
 * Requisitos:
 * - scripts/migration-data/posts-2026.json (exportado via WP-CLI)
 * - scripts/migration-data/editions-2026.json (exportado via WP-CLI)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { randomUUID } from 'crypto';
import path from 'path';

const SUPABASE_URL = 'https://debatechiapas.supabase.poesis.net';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY env var');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const BATCH_SIZE = 50;
const IMAGE_CONCURRENCY = 5;
const PROGRESS_FILE = 'scripts/migration-data/progress.json';

function stripGutenberg(html) {
  return html
    .replace(/<!-- \/?wp:\w+[^>]*-->\n?/g, '')
    .replace(/\[real3dflipbook[^\]]*\]/g, '')
    .trim();
}

function extractExcerpt(content, maxLen = 200) {
  const text = content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen).replace(/\s\S*$/, '') + '...';
}

function isEditionPost(title) {
  const lower = title.toLowerCase();
  return lower.startsWith('debate chiapas') || lower.startsWith('periodico debate');
}

function extractDateFromEditionTitle(title) {
  // "Debate Chiapas jueves 13 de mayo del 2026" → 2026-05-13
  const months = {
    'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
    'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
    'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
  };
  const match = title.match(/(\d{1,2})\s+de\s+(\w+)\s+del?\s+(\d{4})/i);
  if (!match) return null;
  const [, day, monthName, year] = match;
  const month = months[monthName.toLowerCase()];
  if (!month) return null;
  return `${year}-${month}-${day.padStart(2, '0')}`;
}

async function uploadImage(url, folder) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await res.arrayBuffer());

    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
    const filename = `${folder}/${randomUUID()}.${ext}`;

    const { error } = await supabase.storage.from('media').upload(filename, buffer, {
      contentType,
      upsert: false
    });

    if (error) {
      console.error(`  Upload error for ${url}: ${error.message}`);
      return null;
    }

    const { data } = supabase.storage.from('media').getPublicUrl(filename);
    return data.publicUrl;
  } catch (err) {
    console.error(`  Fetch error for ${url}: ${err.message}`);
    return null;
  }
}

async function uploadBatch(items, folder) {
  const results = [];
  for (let i = 0; i < items.length; i += IMAGE_CONCURRENCY) {
    const chunk = items.slice(i, i + IMAGE_CONCURRENCY);
    const chunkResults = await Promise.all(
      chunk.map(item => item.url ? uploadImage(item.url, folder) : Promise.resolve(null))
    );
    results.push(...chunkResults);
    if (i + IMAGE_CONCURRENCY < items.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  return results;
}

function loadProgress() {
  if (existsSync(PROGRESS_FILE)) {
    return JSON.parse(readFileSync(PROGRESS_FILE, 'utf-8'));
  }
  return { migratedSlugs: [], migratedEditionDates: [], categoryId: null };
}

function saveProgress(progress) {
  writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

async function main() {
  console.log('=== Migración WordPress → Supabase ===\n');

  const posts = JSON.parse(readFileSync('scripts/migration-data/posts-2026.json', 'utf-8'));
  const editions = JSON.parse(readFileSync('scripts/migration-data/editions-2026.json', 'utf-8'));
  const progress = loadProgress();

  // 1. Create "General" category if needed
  console.log('1. Categorías...');
  let categoryId = progress.categoryId;
  if (!categoryId) {
    const { data: existing } = await supabase.from('categories').select('id').eq('slug', 'general').single();
    if (existing) {
      categoryId = existing.id;
    } else {
      const { data: created, error } = await supabase.from('categories')
        .insert({ name: 'General', slug: 'general', description: 'Noticias generales', display_order: 1 })
        .select('id').single();
      if (error) { console.error('Category error:', error); return; }
      categoryId = created.id;
    }
    progress.categoryId = categoryId;
    saveProgress(progress);
  }
  console.log(`  Category "General": ${categoryId}`);

  // 2. Separate edition posts from regular posts
  const regularPosts = posts.filter(p => !isEditionPost(p.title));
  const editionPosts = posts.filter(p => isEditionPost(p.title));

  console.log(`  Regular posts: ${regularPosts.length}`);
  console.log(`  Edition posts: ${editionPosts.length}`);
  console.log(`  R3D editions with PDF: ${editions.filter(e => e.pdf_url).length}`);

  // 3. Migrate regular articles in batches
  console.log('\n2. Migrando artículos...');
  const pendingPosts = regularPosts.filter(p => !progress.migratedSlugs.includes(p.slug));
  console.log(`  Pending: ${pendingPosts.length} (already done: ${progress.migratedSlugs.length})`);

  for (let i = 0; i < pendingPosts.length; i += BATCH_SIZE) {
    const batch = pendingPosts.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(pendingPosts.length / BATCH_SIZE);
    console.log(`  Batch ${batchNum}/${totalBatches} (${batch.length} posts)...`);

    // Upload images
    const imageUrls = await uploadBatch(
      batch.map(p => ({ url: p.featured_image })),
      'articles'
    );

    // Prepare article records
    const articles = batch.map((p, idx) => ({
      id: randomUUID(),
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt || extractExcerpt(stripGutenberg(p.content)),
      content: stripGutenberg(p.content),
      featured_image: imageUrls[idx] || p.featured_image || null,
      status: 'published',
      published_at: new Date(p.date).toISOString(),
      created_at: new Date(p.date).toISOString(),
      updated_at: new Date(p.date).toISOString(),
    }));

    // Insert articles
    const { error: artError } = await supabase.from('articles')
      .upsert(articles, { onConflict: 'slug', ignoreDuplicates: true });

    if (artError) {
      console.error(`  Article insert error: ${artError.message}`);
      continue;
    }

    // Insert article_categories
    const acRecords = articles.map(a => ({ article_id: a.id, category_id: categoryId }));
    await supabase.from('article_categories')
      .upsert(acRecords, { onConflict: 'article_id,category_id', ignoreDuplicates: true });

    // Track progress
    batch.forEach(p => progress.migratedSlugs.push(p.slug));
    saveProgress(progress);

    const uploaded = imageUrls.filter(u => u !== null).length;
    console.log(`    ✓ ${articles.length} articles, ${uploaded}/${batch.length} images uploaded`);
  }

  // 4. Migrate daily editions
  console.log('\n3. Migrando ediciones diarias...');

  // Build a map: edition date → { pdf_url, cover from post featured_image }
  const editionMap = new Map();

  // From R3D posts, get PDF URLs
  for (const e of editions) {
    if (!e.pdf_url) continue;
    const dateStr = extractDateFromEditionTitle(e.title);
    if (!dateStr) continue;
    editionMap.set(dateStr, { pdf_url: e.pdf_url, cover: '', title: e.title, date: e.date });
  }

  // From regular edition posts (type=post), get cover images
  for (const p of editionPosts) {
    const dateStr = extractDateFromEditionTitle(p.title);
    if (!dateStr) continue;
    const existing = editionMap.get(dateStr) || { pdf_url: '', title: p.title, date: p.date };
    existing.cover = p.featured_image || existing.cover;
    if (!existing.title) existing.title = p.title;
    editionMap.set(dateStr, existing);
  }

  const pendingEditions = [...editionMap.entries()]
    .filter(([date]) => !progress.migratedEditionDates.includes(date))
    .filter(([, val]) => val.pdf_url);

  console.log(`  Total editions with PDF: ${pendingEditions.length} (already done: ${progress.migratedEditionDates.length})`);

  for (let i = 0; i < pendingEditions.length; i += BATCH_SIZE) {
    const batch = pendingEditions.slice(i, i + BATCH_SIZE);
    console.log(`  Batch ${Math.floor(i/BATCH_SIZE)+1}/${Math.ceil(pendingEditions.length/BATCH_SIZE)}...`);

    // Upload cover images
    const coverUrls = await uploadBatch(
      batch.map(([, val]) => ({ url: val.cover })),
      'editions/covers'
    );

    // Upload PDFs
    const pdfUrls = [];
    for (const [, val] of batch) {
      try {
        const res = await fetch(val.pdf_url, { signal: AbortSignal.timeout(60000) });
        if (!res.ok) { pdfUrls.push(val.pdf_url); continue; }
        const buffer = Buffer.from(await res.arrayBuffer());
        const filename = `editions/${randomUUID()}.pdf`;
        const { error } = await supabase.storage.from('media').upload(filename, buffer, {
          contentType: 'application/pdf', upsert: false
        });
        if (error) { pdfUrls.push(val.pdf_url); continue; }
        const { data } = supabase.storage.from('media').getPublicUrl(filename);
        pdfUrls.push(data.publicUrl);
      } catch {
        pdfUrls.push(val.pdf_url);
      }
    }

    const records = batch.map(([dateStr, val], idx) => ({
      title: val.title,
      edition_date: dateStr,
      pdf_url: pdfUrls[idx],
      cover_image_url: coverUrls[idx] || null,
      is_active: true,
    }));

    const { error } = await supabase.from('daily_editions')
      .upsert(records, { onConflict: 'edition_date', ignoreDuplicates: true });

    if (error) {
      console.error(`  Edition insert error: ${error.message}`);
    } else {
      batch.forEach(([date]) => progress.migratedEditionDates.push(date));
      saveProgress(progress);
      console.log(`    ✓ ${records.length} editions migrated`);
    }
  }

  // 5. Summary
  console.log('\n=== Migración completada ===');
  const { count: artCount } = await supabase.from('articles').select('*', { count: 'exact', head: true });
  const { count: edCount } = await supabase.from('daily_editions').select('*', { count: 'exact', head: true });
  console.log(`Articles: ${artCount}`);
  console.log(`Daily editions: ${edCount}`);

  // Cleanup exports from WP
  console.log('\nRecuerda eliminar los exports del servidor WP:');
  console.log('  rm /home/debchis/public_html/export-2026.json');
  console.log('  rm /home/debchis/public_html/export-editions*.json');
}

main().catch(console.error);
