import React, { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { PostCard } from '../components/PostCard';
import { Sidebar } from '../components/Sidebar';
import type { PostItem } from '../lib/cloudDb';

export const Route = createFileRoute('/category/$category')({
  component: CategoryComponent,
});

function CategoryComponent() {
  const { category } = Route.useParams();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = `${category.toUpperCase()} - ṬKA Hnamte`;
    
    async function loadCategoryPosts() {
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

      const filtered = allPosts.filter(
        (p) =>
          p.categorySlug?.toLowerCase() === category.toLowerCase() ||
          p.category?.toLowerCase() === category.toLowerCase()
      );

      setPosts(filtered);
      setLoading(false);
    }

    loadCategoryPosts();
  }, [category]);

  return (
    <div className="site-wrapper">
      <div className="mb-6 border-b border-gray-200 dark:border-slate-800 pb-3">
        <h1 className="text-xl font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100">
          Category: <span className="text-blue-600">{category}</span>
        </h1>
      </div>

      <div className="main-layout">
        <section className="posts-feed flex flex-col gap-8">
          {loading ? (
            <div className="py-16 text-center text-gray-500">
              <p>Loading category posts...</p>
            </div>
          ) : posts.length > 0 ? (
            posts.map((post) => <PostCard key={post.id || post.slug} post={post} />)
          ) : (
            <div className="py-16 text-center text-gray-500">
              <p>No posts found in this category.</p>
            </div>
          )}
        </section>

        <Sidebar />
      </div>
    </div>
  );
}
