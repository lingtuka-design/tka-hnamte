// Cloudflare Pages Function: /api/likes
// Durable like counts backed by the TKA_BLOG_KV namespace. Likes are tracked
// per visitor IP so the same visitor can only like a post once.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
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

async function readLikes(context, slug) {
  if (context.env && context.env.TKA_BLOG_KV) {
    const stored = await context.env.TKA_BLOG_KV.get(`tka_likes_${slug}`, { type: 'json' });
    if (stored && typeof stored === 'object') {
      return { count: Number(stored.count) || 0, voters: Array.isArray(stored.voters) ? stored.voters : [] };
    }
  }
  return { count: 0, voters: [] };
}

async function writeLikes(context, slug, likes) {
  if (context.env && context.env.TKA_BLOG_KV) {
    await context.env.TKA_BLOG_KV.put(`tka_likes_${slug}`, JSON.stringify(likes));
    return true;
  }
  return false;
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const slug = url.searchParams.get('slug');
  if (!slug) return json({ error: 'Post slug is required' }, 400);

  const likes = await readLikes(context, slug);
  const ip = getClientIp(context);
  return json({ success: true, slug, count: likes.count, liked: likes.voters.includes(ip) });
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const slug = (body && body.slug ? String(body.slug) : '').trim();
    if (!slug) return json({ error: 'Post slug is required' }, 400);

    const likes = await readLikes(context, slug);
    const ip = getClientIp(context);

    if (!likes.voters.includes(ip)) {
      likes.voters.push(ip);
      likes.count += 1;
      await writeLikes(context, slug, likes);
      return json({ success: true, slug, count: likes.count, liked: true });
    }

    return json({ success: true, slug, count: likes.count, liked: false });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

export async function onRequestOptions() {
  return cors();
}
