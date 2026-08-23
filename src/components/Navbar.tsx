import React, { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { Sun, Moon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('tka_theme') as 'light' | 'dark' || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('tka_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  return (
    <nav className="border-t border-b border-gray-200 dark:border-slate-800 my-4 py-3">
      <div className="site-wrapper relative flex items-center justify-center">
        <ul className="flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
          <li>
            <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors [&.active]:text-blue-600">
              Home
            </Link>
          </li>
          <li>
            <Link to="/category/$category" params={{ category: 'article' }} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors [&.active]:text-blue-600">
              Article
            </Link>
          </li>
          <li>
            <Link to="/search" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors [&.active]:text-blue-600">
              Search
            </Link>
          </li>
          <li>
            <Link to="/admin" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors [&.active]:text-blue-600">
              Admin
            </Link>
          </li>
        </ul>

        {/* Dark / Light Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          className="absolute right-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border border-gray-300 dark:border-slate-700 hover:border-blue-500 text-gray-700 dark:text-gray-300 transition-all"
          title="Toggle Dark/Light Mode"
        >
          {theme === 'light' ? (
            <>
              <Moon className="w-3.5 h-3.5 text-indigo-600" />
              <span>Dark</span>
            </>
          ) : (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Light</span>
            </>
          )}
        </button>
      </div>
    </nav>
  );
};
