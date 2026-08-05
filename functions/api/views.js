// Cloudflare Pages Function: /api/views
// Durable view counters backed by the TKA_BLOG_KV namespace. A visitor's view
// is only counted once per hour per post to keep counts honest.

const VIEWS_KEY = 'tka_views';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' },
  });
}

function cors() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

function getClientIp(context) {
  return context.request.headers.get('CF-Connecting-IP') || 'unknown';
}

async function readViews(context) {
  if (context.env && context.env.TKA_BLOG_KV) {
    const stored = await context.env.TKA_BLOG_KV.get(VIEWS_KEY, { type: 'json' });
    if (stored && typeof stored === 'object') return stored;
  }
  return {};
}

async function writeViews(context, views) {
  if (context.env && context.env.TKA_BLOG_KV) {
    await context.env.TKA_BLOG_KV.put(VIEWS_KEY, JSON.stringify(views));
    return true;
  }
  return false;
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const slug = url.searchParams.get('slug');
  const views = await readViews(context);

  if (slug) return json({ success: true, slug, views: Number(views[slug]) || 0 });
  return json({ success: true, views });
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const slug = (body && body.slug ? String(body.slug) : '').trim();
    if (!slug) return json({ error: 'Post slug is required' }, 400);

    const ip = getClientIp(context);

    if (context.env && context.env.TKA_BLOG_KV) {
      // Only count a view once per hour per visitor per post.
      const seenKey = `tka_viewed_${slug}_${ip}`;
      const seen = await context.env.TKA_BLOG_KV.get(seenKey);
      if (!seen) {
        const views = await readViews(context);
        views[slug] = (Number(views[slug]) || 0) + 1;
        await writeViews(context, views);
        await context.env.TKA_BLOG_KV.put(seenKey, '1', { expirationTtl: 3600 });
      }
      const views = await readViews(context);
      return json({ success: true, slug, views: Number(views[slug]) || 0 });
    }

    return json({ error: 'View tracking unavailable' }, 500);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

export async function onRequestOptions() {
  return cors();
}
