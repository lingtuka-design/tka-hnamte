import React, { useEffect, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Sidebar } from '../components/Sidebar';
import { ThumbsUp, Share2, MessageSquare, Send, Calendar, Tag } from 'lucide-react';
import type { PostItem } from '../lib/cloudDb';

interface SearchParams {
  slug?: string;
}

export const Route = createFileRoute('/post/read')({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    slug: (search.slug as string) || '',
  }),
  component: PostReadComponent,
});

interface Comment {
  id: string;
  username: string;
  content: string;
  date: string;
}

function PostReadComponent() {
  const { slug } = Route.useSearch();

  // Instant 0ms synchronous initial state from local cache!
  const [post, setPost] = useState<PostItem | null>(() => {
    if (typeof window !== 'undefined' && slug) {
      const stored = localStorage.getItem('tka_posts');
      if (stored) {
        try {
          const posts: PostItem[] = JSON.parse(stored);
          const found = posts.find((p) => p.slug === slug || p.id === slug);
          if (found) return found;
        } catch (e) {}
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(!post);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [username, setUsername] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (!slug) return;

    async function fetchArticle() {
      let found: PostItem | null = null;
      try {
        const res = await fetch('/api/posts');
        if (res.ok) {
          const data = await res.json();
          const posts: PostItem[] = data.posts || data;
          found = posts.find((p) => p.slug === slug || p.id === slug) || null;
        }
      } catch (e) {
        console.error(e);
      }

      if (!found) {
        const stored = localStorage.getItem('tka_posts');
        if (stored) {
          try {
            const posts: PostItem[] = JSON.parse(stored);
            found = posts.find((p) => p.slug === slug || p.id === slug) || null;
          } catch (e) {}
        }
      }

      if (found) {
        setPost(found);
        document.title = `${found.title} - ṬKA Hnamte`;

        // Track View
        try {
          fetch('/api/views', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug: found.slug }),
          }).catch(() => {});
        } catch (e) {}

        // Load Likes & Comments
        try {
          const commentsRes = await fetch(`/api/comments?slug=${encodeURIComponent(found.slug)}`);
          if (commentsRes.ok) {
            const commentsData = await commentsRes.json();
            if (Array.isArray(commentsData)) setComments(commentsData);
          }
        } catch (e) {}
      }
      setLoading(false);
    }

    fetchArticle();
  }, [slug]);

  const handleLike = () => {
    if (!liked && post) {
      setLikes(likes + 1);
      setLiked(true);
      try {
        fetch('/api/likes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: post.slug }),
        }).catch(() => {});
      } catch (e) {}
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title || 'ṬKA Hnamte Blog',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !commentText.trim() || !post) return;

    setSubmittingComment(true);
    const newCommentObj: Comment = {
      id: `comment-${Date.now()}`,
      username: username.trim(),
      content: commentText.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: post.slug, comment: newCommentObj }),
      });

      if (res.ok) {
        setComments([newCommentObj, ...comments]);
        setCommentText('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="site-wrapper">
      <div className="main-layout">
        <article className="flex flex-col gap-6">
          {loading ? (
            <div className="py-16 text-center text-gray-500">
              <p>Loading article...</p>
            </div>
          ) : post ? (
            <>
              {/* Header */}
              <div className="flex flex-col gap-3 border-b border-gray-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                  <Link to="/category/$category" params={{ category: post.categorySlug || 'article' }} className="uppercase tracking-wider hover:underline">
                    {post.category || 'Article'}
                  </Link>
                  <span>•</span>
                  <span className="text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {post.day} {post.month}
                  </span>
                </div>
                <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 dark:text-gray-100 leading-tight">
                  {post.title}
                </h1>
              </div>

              {/* Featured Image */}
              {post.featuredImage && (
                <div className="rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-800 shadow-sm">
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-full max-h-[480px] object-cover"
                  />
                </div>
              )}

              {/* Post Content */}
              <div
                className="post-content text-gray-800 dark:text-gray-200 text-base md:text-lg leading-relaxed space-y-4"
                dangerouslySetInnerHTML={{ __html: post.content ? post.content.replace(/\n/g, '<br/>') : post.excerpt }}
              />

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-4 border-t border-gray-200 dark:border-slate-800">
                  <Tag className="w-4 h-4 text-gray-500" />
                  {post.tags.map((t) => (
                    <span
                      key={t}
                      className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 text-xs px-3 py-1 rounded-full border border-gray-200 dark:border-slate-700"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* Like & Share Bar */}
              <div className="flex items-center justify-between py-4 border-y border-gray-200 dark:border-slate-800 my-4">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full border transition-all ${
                    liked
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 dark:border-slate-700 hover:border-blue-500 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>{liked ? 'Liked' : 'Like'} ({likes})</span>
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full border border-gray-300 dark:border-slate-700 hover:border-blue-500 text-gray-700 dark:text-gray-300 transition-all"
                >
                  <Share2 className="w-4 h-4 text-blue-500" />
                  <span>Share Article</span>
                </button>
              </div>

              {/* Comments Section */}
              <section className="mt-8 flex flex-col gap-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  Comments ({comments.length})
                </h3>

                {/* Comment Form */}
                <form onSubmit={handleCommentSubmit} className="bg-gray-50 dark:bg-slate-800/60 p-4 rounded-lg border border-gray-200 dark:border-slate-700 flex flex-col gap-3">
                  <input
                    type="text"
                    placeholder="Your Name / Username..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
                  />
                  <textarea
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    required
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingComment}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Post Comment
                    </button>
                  </div>
                </form>

                {/* Comments List */}
                <div className="flex flex-col gap-4">
                  {comments.length > 0 ? (
                    comments.map((c) => (
                      <div key={c.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-100 dark:border-slate-700/50 shadow-sm flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{c.username}</span>
                          <span className="text-xs text-gray-400">{c.date}</span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{c.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 italic">No comments yet. Be the first to comment!</p>
                  )}
                </div>
              </section>
            </>
          ) : (
            <div className="py-16 text-center text-gray-500">
              <p>Article not found.</p>
              <Link to="/" className="text-blue-600 hover:underline text-sm font-semibold mt-2 inline-block">
                Back to Home
              </Link>
            </div>
          )}
        </article>

        <Sidebar />
      </div>
    </div>
  );
}
