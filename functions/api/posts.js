// Cloudflare Pages Function: /api/posts
// Durable post persistence backed by the TKA_BLOG_KV namespace.

const POSTS_KEY = 'tka_posts';
const CATEGORIES_KEY = 'tka_categories';

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
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

function isAdmin(context) {
  const cookie = context.request.headers.get('Cookie') || '';
  return cookie.includes('admin_session=authenticated_token_admin_777');
}

async function readPosts(context) {
  if (context.env && context.env.TKA_BLOG_KV) {
    const stored = await context.env.TKA_BLOG_KV.get(POSTS_KEY, { type: 'json' });
    if (Array.isArray(stored)) return stored;
  }
  return [];
}

async function writePosts(context, posts) {
  if (context.env && context.env.TKA_BLOG_KV) {
    await context.env.TKA_BLOG_KV.put(POSTS_KEY, JSON.stringify(posts));
    return true;
  }
  return false;
}

async function readCategories(context) {
  if (context.env && context.env.TKA_BLOG_KV) {
    const stored = await context.env.TKA_BLOG_KV.get(CATEGORIES_KEY, { type: 'json' });
    if (Array.isArray(stored) && stored.length > 0) return stored;
  }
  return [{ id: 'cat-1', name: 'Article', slug: 'article' }];
}

async function writeCategories(context, categories) {
  if (context.env && context.env.TKA_BLOG_KV) {
    await context.env.TKA_BLOG_KV.put(CATEGORIES_KEY, JSON.stringify(categories));
    return true;
  }
  return false;
}

async function readViews(context) {
  if (context.env && context.env.TKA_BLOG_KV) {
    const stored = await context.env.TKA_BLOG_KV.get('tka_views', { type: 'json' });
    if (stored && typeof stored === 'object') return stored;
  }
  return {};
}

async function readCommentCounts(context) {
  const counts = {};
  if (context.env && context.env.TKA_BLOG_KV) {
    const stored = await context.env.TKA_BLOG_KV.get('tka_comments', { type: 'json' });
    if (Array.isArray(stored)) {
      for (const c of stored) {
        if (c && c.slug) counts[c.slug] = (counts[c.slug] || 0) + 1;
      }
    }
  }
  return counts;
}

export async function onRequestGet(context) {
  const posts = await readPosts(context);
  const views = await readViews(context);
  const commentCounts = await readCommentCounts(context);
  const enriched = posts.map((p) => ({
    ...(p || {}),
    views: p && p.slug && views[p.slug] != null ? Number(views[p.slug]) : p && p.views,
    commentsCount: p && p.slug && commentCounts[p.slug] != null ? commentCounts[p.slug] : p && p.commentsCount || 0,
  }));
  return json({ posts: enriched, categories: await readCategories(context) });
}

export async function onRequestPost(context) {
  if (!isAdmin(context)) return json({ error: 'Unauthorized' }, 401);

  try {
    const postData = await context.request.json();
    if (!postData || !postData.title) return json({ error: 'Post title is required' }, 400);

    if (!postData.id) postData.id = `post-${Date.now()}`;

    const posts = await readPosts(context);
    const existing = posts.findIndex((p) => p && p.id === postData.id);
    if (existing !== -1) {
      posts[existing] = { ...posts[existing], ...postData };
    } else {
      posts.unshift(postData);
    }

    const saved = await writePosts(context, posts);
    return json({ success: true, saved, posts });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

export async function onRequestDelete(context) {
  if (!isAdmin(context)) return json({ error: 'Unauthorized' }, 401);

  try {
    const body = await context.request.json();
    const id = body && (body.id || body.slug);
    if (!id) return json({ error: 'Post ID required' }, 400);

    const posts = await readPosts(context);
    const updated = posts.filter((p) => p && p.id !== id && p.slug !== id);
    const saved = await writePosts(context, updated);
    return json({ success: true, saved, posts: updated });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

export async function onRequestOptions() {
  return cors();
}
