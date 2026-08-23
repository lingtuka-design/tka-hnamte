-- Cloudflare D1 SQL Schema for TKA Blog

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  day TEXT,
  month TEXT,
  category TEXT,
  category_slug TEXT,
  featured_image TEXT,
  excerpt TEXT,
  content TEXT,
  trending INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  post_slug TEXT NOT NULL,
  username TEXT NOT NULL,
  content TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS likes (
  slug TEXT PRIMARY KEY,
  count INTEGER DEFAULT 0
);
