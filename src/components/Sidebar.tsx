import React, { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Eye } from 'lucide-react';
import type { PostItem } from '../lib/cloudDb';

export const Sidebar: React.FC = () => {
  // Synchronous initial state from cached posts for instant 0ms paint!
  const [mostRead, setMostRead] = useState<PostItem[]>(() => {
    const stored = localStorage.getItem('tka_posts');
    if (stored) {
      try {
        const posts: PostItem[] = JSON.parse(stored);
        if (Array.isArray(posts) && posts.length > 0) {
          return [...posts].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
        }
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    async function loadMostRead() {
      try {
        const res = await fetch('/api/posts');
        if (res.ok) {
          const data = await res.json();
          const posts = data.posts || data;
          if (Array.isArray(posts)) {
            const sorted = [...posts].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
            setMostRead(sorted);
          }
        }
      } catch (e) {
        console.error('Sidebar fetch error', e);
      }
    }
    loadMostRead();
  }, []);

  return (
    <aside className="flex flex-col gap-8">
      {/* Profile Card Widget */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6 text-center shadow-sm">
        <img
          src="/images/tka_hnamte.jpg"
          alt="ṬKA HNAMTE"
          className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-2 border-blue-500 shadow"
        />
        <h3 className="text-sm font-extrabold tracking-wider uppercase text-gray-900 dark:text-gray-100 mb-2">
          ṬKA HNAMTE
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
          Ka chanchin sawi vak tur a awm mang lo hle a, Football hi ka ngaina viau a, a bik takin Arsenal inkhel hi ka en peih lehzual a. Tun thlengin 1980's Rock Music kha ka la tuipui deuh ber. Fiamthu ka duh hle a, inhmuamup hi ka peih zawng a ni lem lo.
        </p>
        <div className="flex justify-center gap-3 text-gray-600 dark:text-gray-400">
          <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-blue-600 transition-colors">
            <Facebook className="w-4 h-4" />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors">
            <Twitter className="w-4 h-4" />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-pink-600 transition-colors">
            <Instagram className="w-4 h-4" />
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-blue-700 transition-colors">
            <Linkedin className="w-4 h-4" />
          </a>
          <a href="https://youtube.com" target="_blank" rel="noreferrer" className="hover:text-red-600 transition-colors">
            <Youtube className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Most Read Widget */}
      {mostRead.length > 0 && (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6 shadow-sm">
          <div className="flex items-center mb-4 border-b border-gray-200 dark:border-slate-700 pb-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-900 dark:text-gray-100">
              Most Read
            </h4>
          </div>
          <div className="flex flex-col gap-4">
            {mostRead.map((item) => (
              <div key={item.id || item.slug} className="flex items-center gap-3">
                <img
                  src={item.featuredImage || '/images/tka_hnamte.jpg'}
                  alt={item.title}
                  className="w-16 h-12 object-cover rounded bg-gray-100 dark:bg-slate-700 flex-shrink-0"
                />
                <div className="flex flex-col gap-1">
                  <Link
                    to="/post/read"
                    search={{ slug: item.slug }}
                    className="text-xs font-bold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2 leading-snug"
                  >
                    {item.title}
                  </Link>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Eye className="w-3 h-3 text-blue-500" />
                    {item.views || 0} views
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};
