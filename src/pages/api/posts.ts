import type { APIRoute } from 'astro';
import { createPost, updatePost, deletePost } from '../../lib/data';

function checkAuth(cookies: any): boolean {
  const token = cookies.get('admin_session')?.value;
  return token === 'authenticated_token_admin_777';
}

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!checkAuth(cookies)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const postData = await request.json();
    const newPost = await createPost(postData);
    return new Response(JSON.stringify({ success: true, post: newPost }), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to create post' }), { status: 500 });
  }
};

export const PUT: APIRoute = async ({ request, cookies }) => {
  if (!checkAuth(cookies)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const { id, ...postData } = await request.json();
    if (!id) return new Response(JSON.stringify({ error: 'Post ID is required' }), { status: 400 });

    const updated = await updatePost(id, postData);
    if (!updated) return new Response(JSON.stringify({ error: 'Post not found' }), { status: 404 });

    return new Response(JSON.stringify({ success: true, post: updated }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to update post' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  if (!checkAuth(cookies)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const { id } = await request.json();
    if (!id) return new Response(JSON.stringify({ error: 'Post ID required' }), { status: 400 });

    const deleted = await deletePost(id);
    return new Response(JSON.stringify({ success: deleted }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to delete post' }), { status: 500 });
  }
};
