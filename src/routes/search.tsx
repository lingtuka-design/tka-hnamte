import React, { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { PostCard } from '../components/PostCard';
import { Sidebar } from '../components/Sidebar';
import type { PostItem } from '../lib/cloudDb';

interface SearchParams {
  q?: string;
}

export const Route = createFileRoute('/search')({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: (search.q as string) || '',
  }),
  component: SearchComponent,
});

function SearchComponent() {
  const { q } = Route.useSearch();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = q ? `Search: "${q}" - ṬKA Hnamte` : `Search Articles - ṬKA Hnamte`;

    async function loadSearchPosts() {
      let allPosts: PostItem[] = [];
      try {
        const res = await fetch('/api/posts');
        if (res.ok) {
          const data = await res.json();
          allPosts = data.posts || data;
        }
      } catch (e) {}

      if (allPosts.length === 0) {
        const stored = localStorage.getItem('tka_posts');
        if (stored) {
          try { allPosts = JSON.parse(stored); } catch (e) {}
        }
      }

      const query = (q || '').toLowerCase().trim();
      const filtered = query
        ? allPosts.filter(
            (p) =>
              p.title?.toLowerCase().includes(query) ||
              p.content?.toLowerCase().includes(query) ||
              p.excerpt?.toLowerCase().includes(query) ||
              p.category?.toLowerCase().includes(query)
          )
        : allPosts;

      setPosts(filtered);
      setLoading(false);
    }

    loadSearchPosts();
  }, [q]);

  return (
    <div className="site-wrapper">
      <div className="mb-6 border-b border-gray-200 dark:border-slate-800 pb-3">
        <h1 className="text-xl font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100">
          Search Results: <span className="text-blue-600">"{q || ''}"</span>
        </h1>
      </div>

      <div className="main-layout">
        <section className="posts-feed flex flex-col gap-8">
          {loading ? (
            <div className="py-16 text-center text-gray-500">
              <p>Searching articles...</p>
            </div>
          ) : posts.length > 0 ? (
            posts.map((post) => <PostCard key={post.id || post.slug} post={post} />)
          ) : (
            <div className="py-16 text-center text-gray-500">
              <p>No articles match your search query.</p>
            </div>
          )}
        </section>

        <Sidebar />
      </div>
    </div>
  );
}
