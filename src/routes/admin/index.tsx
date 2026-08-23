import React, { useEffect, useState, useRef } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  FileText,
  PlusCircle,
  FolderTree,
  BarChart3,
  LogOut,
  Edit,
  Trash2,
  Image as ImageIcon,
  Eye,
  MessageSquare,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import type { PostItem, CategoryItem } from '../../lib/cloudDb';

export const Route = createFileRoute('/admin/')({
  component: AdminDashboardComponent,
});

type AdminTab = 'posts' | 'new-post' | 'categories' | 'overview';

export function AdminDashboardComponent() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('posts');

  // State
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([
    { id: 'cat-1', name: 'Article', slug: 'article' },
  ]);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Article');
  const [imageUrl, setImageUrl] = useState('');
  const [tags, setTags] = useState('Article, Mizoram');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [trending, setTrending] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Category Manager State
  const [newCatName, setNewCatName] = useState('');
  const [catError, setCatError] = useState('');
  const [catSuccess, setCatSuccess] = useState('');

  useEffect(() => {
    const isAuth = localStorage.getItem('tka_admin_auth') === 'true';
    if (!isAuth) {
      navigate({ to: '/admin/login', replace: true });
      return;
    }

    loadData();
  }, [navigate]);

  const loadData = async () => {
    // Load Posts
    try {
      const res = await fetch('/api/posts');
      if (res.ok) {
        const data = await res.json();
        const list: PostItem[] = data.posts || data;
        if (Array.isArray(list)) setPosts(list);
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(data.categories);
        }
      }
    } catch (e) {
      const stored = localStorage.getItem('tka_posts');
      if (stored) {
        try { setPosts(JSON.parse(stored)); } catch (err) {}
      }
    }

    // Load Categories from KV /api/categories
    try {
      const catRes = await fetch('/api/categories');
      if (catRes.ok) {
        const catData = await catRes.json();
        if (Array.isArray(catData.categories) && catData.categories.length > 0) {
          setCategories(catData.categories);
        }
      }
    } catch (e) {}
  };

  const handleLogout = () => {
    localStorage.removeItem('tka_admin_auth');
    document.cookie = 'admin_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    navigate({ to: '/admin/login', replace: true });
  };

  const handleFormat = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) setContent(editorRef.current.innerHTML);
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const editorHtml = editorRef.current ? editorRef.current.innerHTML : content;
    const dateObj = new Date();
    const dayStr = String(dateObj.getDate()).padStart(2, '0');
    const monthStr = dateObj.toLocaleString('en-US', { month: 'short' });
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();

    const postObj: PostItem = {
      id: editingId || `post-${Date.now()}`,
      slug: editingId ? (posts.find(p => p.id === editingId)?.slug || slug) : slug,
      title: title.trim(),
      date: dateObj.toISOString().split('T')[0],
      day: dayStr,
      month: monthStr,
      category,
      categorySlug: category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      featuredImage: imageUrl || '/images/hnathawh_zak_suh.jpg',
      excerpt: excerpt.trim() || editorHtml.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...',
      content: editorHtml,
      trending,
      commentsCount: 0,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    };

    try {
      await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postObj),
      });
    } catch (e) {}

    const updated = [postObj, ...posts.filter(p => p.id !== postObj.id)];
    setPosts(updated);
    localStorage.setItem('tka_posts', JSON.stringify(updated));

    alert(editingId ? '✓ Post updated successfully!' : '✓ Post published live to Cloudflare!');
    resetForm();
    setActiveTab('posts');
  };

  const resetForm = () => {
    setTitle('');
    setCategory('Article');
    setImageUrl('');
    setTags('Article, Mizoram');
    setExcerpt('');
    setContent('');
    setTrending(true);
    setEditingId(null);
    if (editorRef.current) editorRef.current.innerHTML = '';
  };

  const handleEdit = (p: PostItem) => {
    setEditingId(p.id);
    setTitle(p.title);
    setCategory(p.category || 'Article');
    setImageUrl(p.featuredImage || '');
    setTags(p.tags ? p.tags.join(', ') : 'Article');
    setExcerpt(p.excerpt || '');
    setContent(p.content || '');
    setTrending(p.trending ?? true);
    if (editorRef.current) editorRef.current.innerHTML = p.content || '';
    setActiveTab('new-post');
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await fetch('/api/posts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch (e) {}

    const updated = posts.filter(p => p.id !== id);
    setPosts(updated);
    localStorage.setItem('tka_posts', JSON.stringify(updated));
  };

  // Create Category Handler
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatError('');
    setCatSuccess('');
    if (!newCatName.trim()) return;

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.categories) {
        setCategories(data.categories);
        setCatSuccess(`✓ Category "${newCatName.trim()}" created successfully!`);
        setNewCatName('');
      } else {
        setCatError(data.error || 'Failed to create category.');
      }
    } catch (e) {
      setCatError('Network error creating category.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      const res = await fetch('/api/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok && data.categories) {
        setCategories(data.categories);
      }
    } catch (e) {}
  };

  // Stats Metrics
  const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
  const totalComments = posts.reduce((sum, p) => sum + (p.commentsCount || 0), 0);

  return (
    <div className="site-wrapper py-8">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-600" />
            ṬKA Hnamte Admin
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Control panel & Cloudflare KV DB persistence</p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      {/* Main Sidebar + Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Left Sidebar Menu */}
        <aside className="md:col-span-1 flex flex-col gap-2">
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-3 shadow-sm flex flex-col gap-1">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex items-center justify-between text-xs font-bold px-3.5 py-2.5 rounded transition-all ${
                activeTab === 'posts'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>All Posts</span>
              </div>
              <span className="bg-blue-100 dark:bg-slate-900 text-blue-800 dark:text-blue-300 text-[10px] px-2 py-0.5 rounded-full">
                {posts.length}
              </span>
            </button>

            <button
              onClick={() => {
                resetForm();
                setActiveTab('new-post');
              }}
              className={`flex items-center gap-2 text-xs font-bold px-3.5 py-2.5 rounded transition-all ${
                activeTab === 'new-post'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700/50'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>{editingId ? 'Edit Post' : 'New Post'}</span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`flex items-center justify-between text-xs font-bold px-3.5 py-2.5 rounded transition-all ${
                activeTab === 'categories'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <FolderTree className="w-4 h-4" />
                <span>Categories</span>
              </div>
              <span className="bg-gray-200 dark:bg-slate-900 text-gray-800 dark:text-gray-200 text-[10px] px-2 py-0.5 rounded-full">
                {categories.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 text-xs font-bold px-3.5 py-2.5 rounded transition-all ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Overview & Stats</span>
            </button>
          </div>
        </aside>

        {/* Right Main Content Area */}
        <main className="md:col-span-3">
          {/* TAB 1: ALL POSTS TABLE */}
          {activeTab === 'posts' && (
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-slate-700 pb-3">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Published Posts ({posts.length})
                </h2>
                <button
                  onClick={() => {
                    resetForm();
                    setActiveTab('new-post');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded transition-colors flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  New Post
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 uppercase">
                      <th className="p-3">Date</th>
                      <th className="p-3">Title</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Views</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {posts.map((p) => (
                      <tr key={p.id || p.slug} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="p-3 font-semibold text-gray-500 whitespace-nowrap">{p.month || 'Aug'} {p.day || '01'}</td>
                        <td className="p-3 font-bold text-gray-900 dark:text-gray-100 max-w-xs truncate">{p.title}</td>
                        <td className="p-3"><span className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded text-[11px] font-semibold">{p.category || 'Article'}</span></td>
                        <td className="p-3 text-gray-500">{p.views || 0}</td>
                        <td className="p-3 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => handleEdit(p)}
                            className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded hover:bg-blue-200 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5 inline mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePost(p.id)}
                            className="bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-2.5 py-1 rounded hover:bg-red-200 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: NEW / EDIT POST FORM */}
          {activeTab === 'new-post' && (
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-3">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                {editingId ? 'Edit Post' : 'Publish New Blog Post'}
              </h2>

              <form onSubmit={handleSubmitPost} className="flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase text-gray-700 dark:text-gray-300 mb-1">Post Title *</label>
                    <input
                      type="text"
                      placeholder="Enter post title..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-700 dark:text-gray-300 mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
                    >
                      {categories.map((c) => (
                        <option key={c.id || c.slug} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-700 dark:text-gray-300 mb-1">
                      Featured Image URL / Upload to R2
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="https://images.unsplash.com/..."
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
                      />
                      <label className="cursor-pointer bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 text-gray-800 dark:text-gray-200 text-xs font-bold px-3 py-2.5 rounded flex items-center gap-1.5 border border-gray-300 dark:border-slate-600 whitespace-nowrap">
                        <ImageIcon className="w-4 h-4 text-blue-500" />
                        <span>Upload R2</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const formData = new FormData();
                            formData.append('file', file);
                            try {
                              const res = await fetch('/api/upload', { method: 'POST', body: formData });
                              if (res.ok) {
                                const data = await res.json();
                                if (data.url) setImageUrl(data.url);
                              }
                            } catch (err) {
                              console.error('R2 Upload error', err);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-700 dark:text-gray-300 mb-1">Tags (Comma Separated)</label>
                    <input
                      type="text"
                      placeholder="Article, Mizoram, Work"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 dark:text-gray-300 mb-1">Short Excerpt</label>
                  <input
                    type="text"
                    placeholder="Brief summary of the article..."
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Rich Text Editor */}
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 dark:text-gray-300 mb-1">Article Content *</label>
                  
                  {/* Toolbar */}
                  <div className="flex items-center gap-1 p-2 bg-gray-100 dark:bg-slate-700 border border-b-0 border-gray-300 dark:border-slate-600 rounded-t text-xs font-bold">
                    <button type="button" onClick={() => handleFormat('bold')} className="px-2 py-1 bg-white dark:bg-slate-800 rounded hover:bg-gray-200">B</button>
                    <button type="button" onClick={() => handleFormat('italic')} className="px-2 py-1 bg-white dark:bg-slate-800 rounded hover:bg-gray-200 italic">I</button>
                    <button type="button" onClick={() => handleFormat('underline')} className="px-2 py-1 bg-white dark:bg-slate-800 rounded hover:bg-gray-200 underline">U</button>
                    <span className="w-px h-4 bg-gray-300 dark:bg-slate-600 mx-1" />
                    <button type="button" onClick={() => handleFormat('formatBlock', '<h2>')} className="px-2 py-1 bg-white dark:bg-slate-800 rounded hover:bg-gray-200">H2</button>
                    <button type="button" onClick={() => handleFormat('formatBlock', '<h3>')} className="px-2 py-1 bg-white dark:bg-slate-800 rounded hover:bg-gray-200">H3</button>
                    <span className="w-px h-4 bg-gray-300 dark:bg-slate-600 mx-1" />
                    <button type="button" onClick={() => handleFormat('insertUnorderedList')} className="px-2 py-1 bg-white dark:bg-slate-800 rounded hover:bg-gray-200">• Bullet</button>
                    <button type="button" onClick={() => handleFormat('insertOrderedList')} className="px-2 py-1 bg-white dark:bg-slate-800 rounded hover:bg-gray-200">1. Number</button>
                  </div>

                  <div
                    ref={editorRef}
                    contentEditable
                    onInput={() => {
                      if (editorRef.current) setContent(editorRef.current.innerHTML);
                    }}
                    className="min-h-[280px] p-4 border border-gray-300 dark:border-slate-700 rounded-b bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 overflow-y-auto leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between pt-3">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={trending}
                      onChange={(e) => setTrending(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    Show in Trending / Most Read Widget
                  </label>

                  <div className="flex items-center gap-3">
                    {editingId && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 text-gray-800 dark:text-gray-200 font-bold text-xs px-4 py-2.5 rounded transition-colors"
                      >
                        Cancel Edit
                      </button>
                    )}
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded transition-colors"
                    >
                      {editingId ? 'Update Post' : 'Publish Blog Post'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: CATEGORIES MANAGER */}
          {activeTab === 'categories' && (
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6 shadow-sm flex flex-col gap-6">
              <div className="border-b border-gray-100 dark:border-slate-700 pb-3">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <FolderTree className="w-5 h-5 text-blue-600" />
                  Category Management
                </h2>
                <p className="text-xs text-gray-500 mt-1">Create & manage categories stored in Cloudflare KV</p>
              </div>

              {catSuccess && (
                <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-xs rounded flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  {catSuccess}
                </div>
              )}

              {catError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs rounded">
                  {catError}
                </div>
              )}

              {/* Create Category Form */}
              <form onSubmit={handleCreateCategory} className="flex items-center gap-3 bg-gray-50 dark:bg-slate-900/60 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                <input
                  type="text"
                  placeholder="New Category Name (e.g. Sports, Music, Tech)..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                  className="flex-grow px-3.5 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded transition-colors flex items-center gap-1.5 whitespace-nowrap"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add Category
                </button>
              </form>

              {/* Categories Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 uppercase">
                      <th className="p-3">Category Name</th>
                      <th className="p-3">Slug</th>
                      <th className="p-3">Posts Count</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {categories.map((c) => {
                      const postCount = posts.filter(
                        (p) =>
                          p.category?.toLowerCase() === c.name.toLowerCase() ||
                          p.categorySlug?.toLowerCase() === c.slug.toLowerCase()
                      ).length;

                      return (
                        <tr key={c.id || c.slug} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="p-3 font-bold text-gray-900 dark:text-gray-100">{c.name}</td>
                          <td className="p-3 text-gray-500 font-mono">/category/{c.slug}</td>
                          <td className="p-3"><span className="bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-semibold">{postCount} posts</span></td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDeleteCategory(c.id)}
                              className="bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-2.5 py-1 rounded hover:bg-red-200 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: OVERVIEW & STATS */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">{posts.length}</span>
                    <p className="text-xs text-gray-500 font-semibold">Total Posts</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center">
                    <FolderTree className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">{categories.length}</span>
                    <p className="text-xs text-gray-500 font-semibold">Categories</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center">
                    <Eye className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">{totalViews}</span>
                    <p className="text-xs text-gray-500 font-semibold">Total Views</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">{totalComments}</span>
                    <p className="text-xs text-gray-500 font-semibold">Comments</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
