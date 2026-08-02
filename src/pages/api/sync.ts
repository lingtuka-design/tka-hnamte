import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { posts, categories } = body;

    const DB_PATH = path.resolve(process.cwd(), 'src/data/db.json');
    const raw = await fs.readFile(DB_PATH, 'utf-8');
    const db = JSON.parse(raw);

    if (Array.isArray(posts)) {
      db.posts = posts;
    }
    if (Array.isArray(categories)) {
      db.categories = categories;
    }

    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');

    return new Response(JSON.stringify({ success: true, message: 'Synced to db.json on disk successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Sync error:', err);
    return new Response(JSON.stringify({ success: false, error: 'Failed to write to db.json' }), { status: 500 });
  }
};
