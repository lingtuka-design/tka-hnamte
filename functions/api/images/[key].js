// Cloudflare Pages Function: /api/images/[key]
// Serves image binaries directly from Cloudflare R2 bucket

export async function onRequestGet(context) {
  const key = context.params.key;
  if (!key) return new Response('Not found', { status: 404 });

  const fullKey = key.startsWith('uploads/') ? key : `uploads/${key}`;

  if (context.env && context.env.R2) {
    try {
      const object = await context.env.R2.get(fullKey);
      if (object) {
        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        headers.set('Cache-Control', 'public, max-age=31536000');
        headers.set('Access-Control-Allow-Origin', '*');
        return new Response(object.body, { headers });
      }
    } catch (e) {}
  }

  return new Response('Image not found', { status: 404 });
}
