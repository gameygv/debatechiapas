import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { keyword } = await req.json()

    if (!keyword) {
      throw new Error('Keyword is required');
    }

    console.log('[search-news] Searching for:', keyword)

    // Use Google News RSS (Mexico/Spanish edition)
    const encodedKeyword = encodeURIComponent(keyword);
    const rssUrl = `https://news.google.com/rss/search?q=${encodedKeyword}&hl=es-419&gl=MX&ceid=MX:es-419`;
    
    const response = await fetch(rssUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch news RSS: ${response.statusText}`);
    }
    const xmlText = await response.text();

    // Simple XML parsing using Regex
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null) {
      if (items.length >= 10) break; // Limit to 10 results

      const itemContent = match[1];
      
      const titleMatch = /<title>([\s\S]*?)<\/title>/.exec(itemContent);
      const linkMatch = /<link>([\s\S]*?)<\/link>/.exec(itemContent);
      const pubDateMatch = /<pubDate>([\s\S]*?)<\/pubDate>/.exec(itemContent);
      const sourceMatch = /<source.*?>([\s\S]*?)<\/source>/.exec(itemContent);
      
      const descMatch = /<description>([\s\S]*?)<\/description>/.exec(itemContent);
      let snippet = descMatch ? descMatch[1] : '';
      
      // Clean HTML from snippet
      snippet = snippet.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

      if (titleMatch && linkMatch) {
        items.push({
          title: titleMatch[1].replace(' - ' + (sourceMatch ? sourceMatch[1] : ''), ''),
          url: linkMatch[1],
          snippet: snippet || titleMatch[1],
          source: sourceMatch ? sourceMatch[1] : 'Google News',
          date: pubDateMatch ? pubDateMatch[1] : new Date().toISOString()
        });
      }
    }

    console.log(`[search-news] Found ${items.length} results`);

    return new Response(
      JSON.stringify({ results: items }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[search-news] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})