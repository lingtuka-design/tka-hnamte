// Cloudflare Pages Function: /api/comments
// Durable comments backed by the TKA_BLOG_KV namespace. Anyone can post a
// comment with just a username; only the admin can delete them.

const COMMENTS_KEY = 'tka_comments';
const RATE_LIMIT_MS = 30000;

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
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

function isAdmin(context, body) {
  const cookie = context.request.headers.get('Cookie') || '';
  const headerToken = context.request.headers.get('x-admin-token') || '';
  if (cookie.includes('admin_session=authenticated_token_admin_777') ||
      headerToken === 'authenticated_token_admin_777') return true;
  return !!(body && (body.adminToken === 'authenticated_token_admin_777' || body.token === 'authenticated_token_admin_777'));
}

function getClientIp(context) {
  return context.request.headers.get('CF-Connecting-IP') || 'unknown';
}

async function readComments(context) {
  if (context.env && context.env.TKA_BLOG_KV) {
    const stored = await context.env.TKA_BLOG_KV.get(COMMENTS_KEY, { type: 'json' });
    if (Array.isArray(stored)) return stored;
  }
  return [];
}

async function writeComments(context, comments) {
  if (context.env && context.env.TKA_BLOG_KV) {
    await context.env.TKA_BLOG_KV.put(COMMENTS_KEY, JSON.stringify(comments));
    return true;
  }
  return false;
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const slug = url.searchParams.get('slug');

  let comments = await readComments(context);
  if (slug) comments = comments.filter((c) => c && c.slug === slug);
  comments.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));

  return json({ success: true, comments });
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const slug = (body && body.slug ? String(body.slug) : '').trim();
    const username = (body && body.username ? String(body.username) : '').trim();
    const content = (body && body.content ? String(body.content) : '').trim();

    if (!slug) return json({ error: 'Post slug is required' }, 400);
    if (username.length < 2 || username.length > 30) {
      return json({ error: 'Username must be 2-30 characters' }, 400);
    }
    if (content.length < 1 || content.length > 2000) {
      return json({ error: 'Comment must be 1-2000 characters' }, 400);
    }

    // Simple spam guard: one comment per 30s per visitor.
    if (context.env && context.env.TKA_BLOG_KV) {
      const rateKey = `tka_comment_ratelimit_${getClientIp(context)}`;
      const last = await context.env.TKA_BLOG_KV.get(rateKey);
      if (last) {
        const lastTime = parseInt(last, 10);
        if (!isNaN(lastTime) && Date.now() - lastTime < RATE_LIMIT_MS) {
          return json({ error: 'Please wait a moment before posting another comment.' }, 429);
        }
      }
      await context.env.TKA_BLOG_KV.put(rateKey, String(Date.now()), { expirationTtl: 120 });
    }

    const now = new Date();
    const comment = {
      id: `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      slug,
      username,
      content,
      date: now.toISOString().split('T')[0],
      day: String(now.getDate()).padStart(2, '0'),
      month: now.toLocaleString('en-US', { month: 'short' }),
      createdAt: now.toISOString(),
    };

    const comments = await readComments(context);
    comments.unshift(comment);
    await writeComments(context, comments);

    return json({ success: true, saved: true, comments, comment });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

export async function onRequestDelete(context) {
  let body = null;
  try {
    body = await context.request.json();
  } catch (e) {}
  if (!isAdmin(context, body)) return json({ error: 'Unauthorized' }, 401);

  try {
    const id = body && (body.id || body.commentId);
    if (!id) return json({ error: 'Comment ID required' }, 400);

    const comments = await readComments(context);
    const updated = comments.filter((c) => c && c.id !== id);
    await writeComments(context, updated);

    return json({ success: true, saved: true, comments: updated });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

export async function onRequestOptions() {
  return cors();
}
