// Real-time Cloud Database Integration using JSONBlob API endpoint

export const CLOUD_DB_URL = "https://jsonblob.com/api/jsonBlob/019fc0a8-9aab-790f-8403-d850497e91dd";

export interface PostItem {
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
  views?: number;
  commentsCount?: number;
  tags?: string[];
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
}

export async function getCloudData() {
  try {
    const res = await fetch(CLOUD_DB_URL, {
      headers: { 'Accept': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (e) {
    console.error("Cloud DB Fetch Error:", e);
  }
  return { posts: [], categories: [{ id: 'cat-1', name: 'Article', slug: 'article' }] };
}

export async function saveCloudData(data: { posts: PostItem[]; categories: CategoryItem[] }) {
  try {
    const res = await fetch(CLOUD_DB_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch (e) {
    console.error("Cloud DB Save Error:", e);
    return false;
  }
}
