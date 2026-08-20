// Cloudflare Pages Function: /api/categories
// KV-backed category list (authoritative source for the site menu).

const CATEGORIES_KEY = 'tka_categories';
const DEFAULT_CATEGORIES = [{ id: 'cat-1', name: 'Article', slug: 'article' }];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
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

async function readCategories(context) {
  if (context.env && context.env.TKA_BLOG_KV) {
    const stored = await context.env.TKA_BLOG_KV.get(CATEGORIES_KEY, { type: 'json' });
    if (Array.isArray(stored) && stored.length > 0) return stored;
  }
  return DEFAULT_CATEGORIES;
}

export async function onRequestGet(context) {
  return json({ categories: await readCategories(context) });
}

export async function onRequestPost(context) {
  let body = null;
  try {
    body = await context.request.json();
  } catch (e) {}
  if (!isAdmin(context, body)) return json({ error: 'Unauthorized' }, 401);
  try {
    const name = body && body.name;
    if (!name || !String(name).trim()) return json({ error: 'Category name is required' }, 400);
    delete body.adminToken;
    delete body.token;
    const clean = String(name).trim();
    const cats = await readCategories(context);
    const slug = clean.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `cat-${Date.now()}`;
    if (cats.some((c) => c.name.toLowerCase() === clean.toLowerCase() || c.slug === slug)) {
      return json({ error: 'Category already exists' }, 409);
    }
    const newCat = { id: `cat-${Date.now()}`, name: clean, slug };
    cats.push(newCat);
    if (context.env && context.env.TKA_BLOG_KV) {
      await context.env.TKA_BLOG_KV.put(CATEGORIES_KEY, JSON.stringify(cats));
    }
    return json({ success: true, category: newCat, categories: cats }, 201);
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
    const id = body && body.id;
    if (!id) return json({ error: 'Category ID required' }, 400);
    const cats = await readCategories(context);
    const updated = cats.filter((c) => c.id !== id);
    if (context.env && context.env.TKA_BLOG_KV) {
      await context.env.TKA_BLOG_KV.put(CATEGORIES_KEY, JSON.stringify(updated));
    }
    return json({ success: true, categories: updated });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

export async function onRequestOptions() {
  return cors();
}
