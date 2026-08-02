// Cloud Database Integration for real-time post & category persistence across all devices

const CLOUD_DB_ID = "679d20c5ad19ca34f8d55a30"; // Dedicated Cloud DB Bin ID
const CLOUD_DB_URL = `https://api.jsonbin.io/v3/b/${CLOUD_DB_ID}`;
const CLOUD_API_KEY = "$2a$10$v7gS7ZgB/zL3uQ5vX6K7UeX9b5J9k4M8P7L6n5o4p3q2r1s0t"; // Live Access Key

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

export async function fetchCloudData() {
  try {
    const res = await fetch(`${CLOUD_DB_URL}/latest`, {
      headers: {
        'X-Master-Key': CLOUD_API_KEY,
      },
    });
    if (res.ok) {
      const json = await res.json();
      return json.record;
    }
  } catch (e) {
    console.error("Cloud DB Fetch Error:", e);
  }
  return null;
}

export async function saveCloudData(record: { posts: PostItem[]; categories: CategoryItem[] }) {
  try {
    const res = await fetch(CLOUD_DB_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': CLOUD_API_KEY,
      },
      body: JSON.stringify(record),
    });
    return res.ok;
  } catch (e) {
    console.error("Cloud DB Save Error:", e);
    return false;
  }
}
