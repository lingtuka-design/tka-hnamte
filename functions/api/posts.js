// Cloudflare Pages Function: /api/posts
// Dual persistence backed by Cloudflare D1 SQL Database & TKA_BLOG_KV namespace.

const POSTS_KEY = 'tka_posts';
const CATEGORIES_KEY = 'tka_categories';

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
      'Access-Control-Allow-Headers': 'Content-Type, x-admin-token',
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

async function readPosts(context) {
  // Query Cloudflare D1 SQL if bound
  if (context.env && context.env.DB) {
    try {
      const { results } = await context.env.DB.prepare('SELECT * FROM posts ORDER BY date DESC').all();
      if (Array.isArray(results) && results.length > 0) {
        return results.map(r => ({
          ...r,
          categorySlug: r.category_slug || r.categorySlug,
          featuredImage: r.featured_image || r.featuredImage,
          tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags
        }));
      }
    } catch (e) {}
  }

  // Fallback to Cloudflare KV
  if (context.env && context.env.TKA_BLOG_KV) {
    const stored = await context.env.TKA_BLOG_KV.get(POSTS_KEY, { type: 'json' });
    if (Array.isArray(stored)) return stored;
  }
  return [];
}

async function writePosts(context, posts) {
  let saved = false;

  // Persist to Cloudflare KV
  if (context.env && context.env.TKA_BLOG_KV) {
    await context.env.TKA_BLOG_KV.put(POSTS_KEY, JSON.stringify(posts));
    saved = true;
  }

  return saved;
}

async function writePostToD1(context, post) {
  if (context.env && context.env.DB) {
    try {
      await context.env.DB.prepare(`
        INSERT INTO posts (id, slug, title, date, day, month, category, category_slug, featured_image, excerpt, content, trending, views)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title=excluded.title,
          excerpt=excluded.excerpt,
          content=excluded.content,
          featured_image=excluded.featured_image,
          category=excluded.category,
          trending=excluded.trending
      `).bind(
        post.id,
        post.slug,
        post.title,
        post.date || new Date().toISOString(),
        post.day || '01',
        post.month || 'Aug',
        post.category || 'Article',
        post.categorySlug || 'article',
        post.featuredImage || '',
        post.excerpt || '',
        post.content || '',
        post.trending ? 1 : 0,
        post.views || 0
      ).run();
    } catch (e) {}
  }
}

async function deletePostFromD1(context, id) {
  if (context.env && context.env.DB) {
    try {
      await context.env.DB.prepare('DELETE FROM posts WHERE id = ? OR slug = ?').bind(id, id).run();
    } catch (e) {}
  }
}

async function readCategories(context) {
  if (context.env && context.env.TKA_BLOG_KV) {
    const stored = await context.env.TKA_BLOG_KV.get(CATEGORIES_KEY, { type: 'json' });
    if (Array.isArray(stored) && stored.length > 0) return stored;
  }
  return [{ id: 'cat-1', name: 'Article', slug: 'article' }];
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
  let postData = null;
  try {
    postData = await context.request.json();
  } catch (e) {}
  if (!isAdmin(context, postData)) return json({ error: 'Unauthorized' }, 401);

  try {
    if (!postData || !postData.title) return json({ error: 'Post title is required' }, 400);

    delete postData.adminToken;
    delete postData.token;

    if (!postData.id) postData.id = `post-${Date.now()}`;

    const posts = await readPosts(context);
    const existing = posts.findIndex((p) => p && p.id === postData.id);
    if (existing !== -1) {
      posts[existing] = { ...posts[existing], ...postData };
    } else {
      posts.unshift(postData);
    }

    await writePostToD1(context, postData);
    const saved = await writePosts(context, posts);
    return json({ success: true, saved, posts });
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
    const id = body && (body.id || body.slug);
    if (!id) return json({ error: 'Post ID required' }, 400);

    await deletePostFromD1(context, id);
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
