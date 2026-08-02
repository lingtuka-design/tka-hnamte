// Cloudflare Pages Function: /post/read
// Serves the static article page and injects per-post Open Graph meta tags so
// shares on Facebook, WhatsApp, etc. always show the right thumbnail + excerpt.

const SITE_URL = 'https://tka-blog.pages.dev';
const FALLBACK_IMAGE = `${SITE_URL}/images/tka_hnamte.jpg`;

function escapeHtml(text) {
  return String(text == null ? '' : text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripHtml(text) {
  if (!text) return '';
  const div = new String(text).replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return div;
}

function absoluteImage(src) {
  if (!src) return FALLBACK_IMAGE;
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith('/')) return `${SITE_URL}${src}`;
  if (src.startsWith('data:') || src.startsWith('blob:')) return FALLBACK_IMAGE;
  return FALLBACK_IMAGE;
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const slug = (url.searchParams.get('slug') || '').trim();

  let post = null;
  if (slug && context.env && context.env.TKA_BLOG_KV) {
    try {
      const stored = await context.env.TKA_BLOG_KV.get('tka_posts', { type: 'json' });
      if (Array.isArray(stored)) {
        post = stored.find((p) => p && (p.slug === slug || p.id === slug)) || null;
      }
    } catch (e) {}
  }

  const pageUrl = `${SITE_URL}/post/read?slug=${encodeURIComponent(slug)}`;

  let ogTitle = post && post.title ? post.title : 'ṬKA Hnamte - Personal Blog';
  let ogDesc = post && (post.excerpt || post.content) ? stripHtml(post.excerpt || post.content) : 'Personal Blog & Thoughts by ṬKA Hnamte';
  if (ogDesc.length > 180) ogDesc = ogDesc.slice(0, 177) + '...';
  const ogImage = absoluteImage(post && post.featuredImage);

  const metaTags = `
    <meta property="og:site_name" content="ṬKA Hnamte" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeHtml(ogTitle)}" />
    <meta property="og:description" content="${escapeHtml(ogDesc)}" />
    <meta property="og:image" content="${escapeHtml(ogImage)}" />
    <meta property="og:url" content="${escapeHtml(pageUrl)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(ogTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(ogDesc)}" />
    <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
    <link rel="canonical" href="${escapeHtml(pageUrl)}" />`;

  try {
    const assetRequest = new Request(`https://tka-blog.pages.dev/post/read/`, { headers: context.request.headers });
    const assetResponse = await context.env.ASSETS.fetch(assetRequest);
    const html = await assetResponse.text();

    // Remove build-time social tags so there are no duplicates, then inject.
    const stripped = html
      .replace(/<meta\s+(?:property|name)="(?:og:|twitter:)[^"]*"[^>]*\/?>/gi, '')
      .replace(/<link\s+rel="canonical"[^>]*\/?>/gi, '');
    const updated = stripped.replace('</head>', metaTags + '\n  </head>');
    return new Response(updated, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=0, must-revalidate',
      },
    });
  } catch (e) {
    return new Response(`<html><head>${metaTags}</head><body></body></html>`, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}
