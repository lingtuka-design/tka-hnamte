import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';

function checkAuth(cookies: any): boolean {
  const token = cookies.get('admin_session')?.value;
  return token === 'authenticated_token_admin_777';
}

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!checkAuth(cookies)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No image file provided' }), { status: 400 });
    }

    const uploadsDir = path.resolve(process.cwd(), 'public/uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    const ext = path.extname(file.name) || '.jpg';
    const filename = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(filePath, buffer);

    const fileUrl = `/uploads/${filename}`;
    return new Response(JSON.stringify({ success: true, url: fileUrl }), { status: 200 });
  } catch (err) {
    console.error('Upload error:', err);
    return new Response(JSON.stringify({ error: 'File upload failed' }), { status: 500 });
  }
};
