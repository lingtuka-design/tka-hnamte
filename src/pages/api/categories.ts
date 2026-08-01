import type { APIRoute } from 'astro';
import { addCategory, deleteCategory } from '../../lib/data';

function checkAuth(cookies: any): boolean {
  const token = cookies.get('admin_session')?.value;
  return token === 'authenticated_token_admin_777';
}

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!checkAuth(cookies)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const { name } = await request.json();
    if (!name) return new Response(JSON.stringify({ error: 'Category name is required' }), { status: 400 });

    const newCat = await addCategory(name);
    return new Response(JSON.stringify({ success: true, category: newCat }), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to add category' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  if (!checkAuth(cookies)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const { id } = await request.json();
    if (!id) return new Response(JSON.stringify({ error: 'Category ID is required' }), { status: 400 });

    const deleted = await deleteCategory(id);
    return new Response(JSON.stringify({ success: deleted }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to delete category' }), { status: 500 });
  }
};
