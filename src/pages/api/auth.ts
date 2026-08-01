import type { APIRoute } from 'astro';
import { verifyAdmin } from '../../lib/data';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { username, password } = body;

    const isValid = await verifyAdmin(username, password);
    if (isValid) {
      // Set session cookie valid for 7 days
      cookies.set('admin_session', 'authenticated_token_admin_777', {
        path: '/',
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7,
      });
      return new Response(JSON.stringify({ success: true, message: 'Logged in successfully' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ success: false, message: 'Invalid username or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: 'Server error' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ cookies }) => {
  cookies.delete('admin_session', { path: '/' });
  return new Response(JSON.stringify({ success: true, message: 'Logged out' }), { status: 200 });
};
