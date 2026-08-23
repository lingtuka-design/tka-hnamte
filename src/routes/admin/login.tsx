import React, { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Lock, User, KeyRound } from 'lucide-react';

export const Route = createFileRoute('/admin/login')({
  component: AdminLoginComponent,
});

function AdminLoginComponent() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'adminpassword123') {
      localStorage.setItem('tka_admin_auth', 'true');
      document.cookie = 'admin_session=authenticated_token_admin_777; path=/';
      navigate({ to: '/admin' });
    } else {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="site-wrapper py-16 flex justify-center">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 p-8 rounded-lg border border-gray-200 dark:border-slate-700 shadow-md">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">Admin Login</h2>
          <p className="text-xs text-gray-500 mt-1">Sign in to access ṬKA Hnamte Blog Admin Dashboard</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Username</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
              />
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                placeholder="Password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
              />
              <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-2.5 rounded transition-colors mt-2"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
