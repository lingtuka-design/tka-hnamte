// Cloudflare Pages Function: /api/posts

let memoryPosts = [];

export async function onRequestGet(context) {
  // If KV is bound to context.env.TKA_BLOG_KV
  if (context.env && context.env.TKA_BLOG_KV) {
    try {
      const stored = await context.env.TKA_BLOG_KV.get('tka_posts', { type: 'json' });
      if (stored) {
        return new Response(JSON.stringify(stored), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    } catch (e) {}
  }

  return new Response(JSON.stringify(memoryPosts), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}

export async function onRequestPost(context) {
  try {
    const postData = await context.request.json();
    if (context.env && context.env.TKA_BLOG_KV) {
      let current = (await context.env.TKA_BLOG_KV.get('tka_posts', { type: 'json' })) || [];
      current.unshift(postData);
      await context.env.TKA_BLOG_KV.put('tka_posts', JSON.stringify(current));
      return new Response(JSON.stringify({ success: true, posts: current }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    memoryPosts.unshift(postData);
    return new Response(JSON.stringify({ success: true, posts: memoryPosts }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
