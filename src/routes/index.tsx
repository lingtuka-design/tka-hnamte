import React, { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { PostCard } from '../components/PostCard';
import { Sidebar } from '../components/Sidebar';
import type { PostItem } from '../lib/cloudDb';

export const Route = createFileRoute('/')({
  component: HomeComponent,
});

function HomeComponent() {
  // Synchronous initial state from localStorage for ZERO latency instant paint!
  const [posts, setPosts] = useState<PostItem[]>(() => {
    const stored = localStorage.getItem('tka_posts');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [];
  });
  const [loading, setLoading] = useState(posts.length === 0);

  useEffect(() => {
    async function loadFeed() {
      let localPosts: PostItem[] = [];
      const stored = localStorage.getItem('tka_posts');
      if (stored) {
        try { localPosts = JSON.parse(stored); } catch (e) {}
      }

      let cloudPosts: PostItem[] = [];
      try {
        const res = await fetch('/api/posts');
        if (res.ok) {
          const data = await res.json();
          cloudPosts = data.posts || data;
        }
      } catch (e) {
        console.error('API fetch error', e);
      }

      const map = new Map<string, PostItem>();
      for (const p of localPosts) {
        if (p && p.id && p.slug !== 'tourist-destination-visit-vacation-india' && p.slug !== 'tours-visiting-classic-cars-charming-unique') {
          map.set(p.id, p);
        }
      }
      for (const p of cloudPosts) {
        if (p && p.id && !map.has(p.id)) {
          map.set(p.id, p);
        }
      }

      const merged = Array.from(map.values()).sort((a, b) => {
        return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
      });

      if (merged.length > 0) {
        setPosts(merged);
        localStorage.setItem('tka_posts', JSON.stringify(merged));
      }
      setLoading(false);
    }

    loadFeed();
  }, []);

  return (
    <div className="site-wrapper">
      <div className="main-layout">
        <section className="posts-feed flex flex-col gap-8">
          {loading ? (
            <div className="py-16 text-center text-gray-500">
              <p>Loading posts...</p>
            </div>
          ) : posts.length > 0 ? (
            posts.map((post) => <PostCard key={post.id || post.slug} post={post} />)
          ) : (
            <div className="py-16 text-center text-gray-500">
              <p>No blog posts published yet.</p>
            </div>
          )}
        </section>

        <Sidebar />
      </div>
    </div>
  );
}
