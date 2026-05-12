import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

// Utilidad para escapar caracteres XML
const escapeXml = (unsafe: string) => {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '<';
      case '>': return '>';
      case '&': return '&';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
    return c;
  });
}

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Obtener últimos 20 artículos para el feed
    const { data: articles } = await supabase
      .from('articles')
      .select(`
        title, 
        slug, 
        excerpt, 
        content, 
        published_at, 
        featured_image,
        profiles:author_id (full_name),
        article_categories (
          categories (name)
        )
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(20)

    const baseUrl = 'https://debatechiapas.dockerapps.top'
    const buildDate = new Date().toUTCString();

    let rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/">
<channel>
  <title>Debate Chiapas</title>
  <link>${baseUrl}</link>
  <description>Debate y opinión desde Chiapas para el mundo.</description>
  <language>es-mx</language>
  <lastBuildDate>${buildDate}</lastBuildDate>
  <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
`

    articles?.forEach(article => {
      const link = `${baseUrl}/noticias/${article.slug}`;
      const pubDate = new Date(article.published_at).toUTCString();
      const author = article.profiles?.full_name || 'Redacción';
      
      // Categoría principal
      const category = article.article_categories?.[0]?.categories?.name || 'Noticias';
      
      // Imagen
      let mediaTag = '';
      if (article.featured_image) {
        let imgUrl = article.featured_image;
        if (imgUrl.startsWith('/')) imgUrl = `${baseUrl}${imgUrl}`;
        mediaTag = `<media:content url="${imgUrl}" medium="image" />`;
      }

      rss += `
  <item>
    <title>${escapeXml(article.title)}</title>
    <link>${link}</link>
    <guid isPermaLink="true">${link}</guid>
    <pubDate>${pubDate}</pubDate>
    <author>contacto@debatechiapas.dockerapps.top (${escapeXml(author)})</author>
    <category>${escapeXml(category)}</category>
    <description>${escapeXml(article.excerpt || '')}</description>
    ${mediaTag}
  </item>`
    })

    rss += `
</channel>
</rss>`

    return new Response(rss, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=1800, s-maxage=1800'
      }
    })

  } catch (error) {
    return new Response(String(error), { status: 500 })
  }
})