// Cloudflare Pages Function: /api/upload
// Direct image upload to Cloudflare R2 Bucket (R2 binding)

export async function onRequestPost(context) {
  try {
    const formData = await context.request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const filename = file.name || 'image.jpg';
    const ext = filename.split('.').pop() || 'jpg';
    const key = `uploads/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    // Upload binary stream to R2 Bucket
    if (context.env && context.env.R2) {
      await context.env.R2.put(key, file.stream(), {
        httpMetadata: { contentType: file.type || 'image/jpeg' },
      });
    }

    const imageUrl = `/api/images/${encodeURIComponent(key)}`;
    return new Response(JSON.stringify({ success: true, url: imageUrl, key }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
