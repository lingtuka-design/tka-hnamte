import React from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowRight, MessageSquare } from 'lucide-react';
import type { PostItem } from '../lib/cloudDb';

interface PostCardProps {
  post: PostItem;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  return (
    <article className="flex flex-col border-b border-dashed border-gray-200 dark:border-slate-800 pb-8 mb-8">
      {/* Header */}
      <div className="flex items-start gap-4 mb-3">
        <div className="bg-blue-600 text-white w-12 h-12 flex flex-col items-center justify-center flex-shrink-0 rounded-sm">
          <span className="text-base font-bold leading-none">{post.day || '01'}</span>
          <span className="text-[10px] font-semibold uppercase leading-none mt-1">{post.month || 'Aug'}</span>
        </div>
        <div className="flex-grow">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <Link to="/post/read" search={{ slug: post.slug }}>
              {post.title}
            </Link>
          </h2>
        </div>
      </div>

      {/* Featured Image */}
      {post.featuredImage && (
        <div className="mb-4 overflow-hidden rounded bg-gray-100 dark:bg-slate-800">
          <Link to="/post/read" search={{ slug: post.slug }}>
            <img
              src={post.featuredImage}
              alt={post.title}
              loading="lazy"
              className="w-full max-h-[420px] object-cover aspect-video hover:scale-[1.02] transition-transform duration-300"
            />
          </Link>
        </div>
      )}

      {/* Excerpt */}
      <p className="text-gray-700 dark:text-gray-300 text-sm md:text-base leading-relaxed mb-4">
        {post.excerpt || post.content?.substring(0, 160) + '...'}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-dashed border-gray-200 dark:border-slate-800 text-xs text-gray-500 dark:text-gray-400">
        <Link
          to="/post/read"
          search={{ slug: post.slug }}
          className="font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          Read more
        </Link>
        <span className="flex items-center gap-1">
          <MessageSquare className="w-3.5 h-3.5" />
          {post.commentsCount || 0} Comments
        </span>
      </div>
    </article>
  );
};
