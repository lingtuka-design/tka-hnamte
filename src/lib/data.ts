import fs from 'node:fs/promises';
import path from 'node:path';

const DB_PATH = path.resolve(process.cwd(), 'src/data/db.json');

export interface SiteInfo {
  title: string;
  logoText: string;
  tagline: string;
  authorName: string;
  bio: string;
  avatarUrl: string;
  social: {
    facebook: string;
    twitter: string;
    instagram: string;
    linkedin: string;
    youtube: string;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  date: string;
  day: string;
  month: string;
  category: string;
  categorySlug: string;
  featuredImage: string;
  excerpt: string;
  content: string;
  trending?: boolean;
  commentsCount?: number;
  tags?: string[];
}

export interface GalleryItem {
  id: string;
  title: string;
  url: string;
}

export interface DBData {
  site: SiteInfo;
  categories: Category[];
  posts: BlogPost[];
  gallery: GalleryItem[];
  admin: {
    username: string;
    password: string;
  };
}

async function readDB(): Promise<DBData> {
  try {
    const raw = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading db.json, returning empty structure', err);
    return {
      site: {
        title: "James Lim",
        logoText: "James Lim",
        tagline: "Personal Blog",
        authorName: "JAMES LIM",
        bio: "Hi, my name James.",
        avatarUrl: "",
        social: { facebook: "", twitter: "", instagram: "", linkedin: "", youtube: "" }
      },
      categories: [],
      posts: [],
      gallery: [],
      admin: { username: "admin", password: "adminpassword123" }
    };
  }
}

async function writeDB(data: DBData): Promise<void> {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getDB(): Promise<DBData> {
  return await readDB();
}

export async function getSiteData(): Promise<SiteInfo> {
  const db = await readDB();
  return db.site;
}

export async function updateSiteData(site: Partial<SiteInfo>): Promise<SiteInfo> {
  const db = await readDB();
  db.site = { ...db.site, ...site };
  await writeDB(db);
  return db.site;
}

export async function getCategories(): Promise<Category[]> {
  const db = await readDB();
  return db.categories;
}

export async function addCategory(name: string): Promise<Category> {
  const db = await readDB();
  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
  const newCat: Category = {
    id: `cat-${Date.now()}`,
    name: name.trim(),
    slug: slug || `cat-${Date.now()}`
  };
  db.categories.push(newCat);
  await writeDB(db);
  return newCat;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const db = await readDB();
  const initialLen = db.categories.length;
  db.categories = db.categories.filter(c => c.id !== id);
  if (db.categories.length !== initialLen) {
    await writeDB(db);
    return true;
  }
  return false;
}

export async function getPosts(): Promise<BlogPost[]> {
  const db = await readDB();
  return db.posts;
}

export async function getPostBySlug(slug: string): Promise<BlogPost | undefined> {
  const db = await readDB();
  return db.posts.find(p => p.slug === slug);
}

export async function createPost(post: Partial<BlogPost>): Promise<BlogPost> {
  const db = await readDB();
  const dateObj = new Date(post.date || Date.now());
  const dayStr = String(dateObj.getDate()).padStart(2, '0');
  const monthStr = dateObj.toLocaleString('en-US', { month: 'short' });

  const title = post.title || 'Untitled Post';
  const slug = post.slug || title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
  const categoryName = post.category || 'General';
  const categorySlug = categoryName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');

  const newPost: BlogPost = {
    id: `post-${Date.now()}`,
    slug,
    title,
    date: dateObj.toISOString().split('T')[0],
    day: dayStr,
    month: monthStr,
    category: categoryName,
    categorySlug,
    featuredImage: post.featuredImage || 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1200&q=80',
    excerpt: post.excerpt || (post.content ? post.content.substring(0, 150) + '...' : ''),
    content: post.content || '',
    trending: post.trending ?? false,
    commentsCount: 0,
    tags: post.tags || [categoryName]
  };

  db.posts.unshift(newPost);
  await writeDB(db);
  return newPost;
}

export async function updatePost(id: string, update: Partial<BlogPost>): Promise<BlogPost | null> {
  const db = await readDB();
  const idx = db.posts.findIndex(p => p.id === id);
  if (idx === -1) return null;

  db.posts[idx] = { ...db.posts[idx], ...update };
  await writeDB(db);
  return db.posts[idx];
}

export async function deletePost(id: string): Promise<boolean> {
  const db = await readDB();
  const initialLen = db.posts.length;
  db.posts = db.posts.filter(p => p.id !== id);
  if (db.posts.length !== initialLen) {
    await writeDB(db);
    return true;
  }
  return false;
}

export async function getTrendingPosts(): Promise<BlogPost[]> {
  const db = await readDB();
  return db.posts.filter(p => p.trending).slice(0, 5);
}

export async function getGallery(): Promise<GalleryItem[]> {
  const db = await readDB();
  return db.gallery;
}

export async function verifyAdmin(username: string, password: string): Promise<boolean> {
  const db = await readDB();
  return username === db.admin.username && password === db.admin.password;
}
