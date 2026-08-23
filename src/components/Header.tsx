import React, { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Search, Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';

export const Header: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate({ to: '/search', search: { q: searchQuery.trim() } });
    }
  };

  return (
    <header className="py-6 border-b border-gray-200 dark:border-slate-800">
      <div className="site-wrapper grid grid-cols-1 md:grid-cols-3 items-center gap-4">
        {/* Social Icons Left */}
        <div className="flex items-center gap-3 justify-center md:justify-start">
          <a href="https://facebook.com" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-blue-600 transition-colors">
            <Facebook className="w-4 h-4" />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-blue-400 transition-colors">
            <Twitter className="w-4 h-4" />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-pink-600 transition-colors">
            <Instagram className="w-4 h-4" />
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-blue-700 transition-colors">
            <Linkedin className="w-4 h-4" />
          </a>
          <a href="https://youtube.com" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-red-600 transition-colors">
            <Youtube className="w-4 h-4" />
          </a>
        </div>

        {/* Brand Logo Title Center */}
        <div className="text-center">
          <Link to="/" className="inline-block">
            <h1 className="font-extrabold text-3xl md:text-4xl tracking-wider text-gray-900 dark:text-gray-100 uppercase font-sans">
              ṬKA HNAMTE
            </h1>
          </Link>
        </div>

        {/* Search Bar Right */}
        <div className="flex justify-center md:justify-end">
          <form onSubmit={handleSearch} className="flex items-center w-full max-w-[240px]">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-r-0 border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 rounded-l focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-sm font-semibold rounded-r transition-colors flex items-center justify-center"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
};
