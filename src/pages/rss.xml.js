import rss from '@astrojs/rss';
import { getPosts, getSiteData } from '../lib/data';

export async function GET(context) {
  const posts = await getPosts();
  const site = await getSiteData();

  return rss({
    title: site.title,
    description: site.bio,
    site: context.site || 'https://tkablog.pages.dev',
    items: posts.map((post) => ({
      title: post.title,
      pubDate: new Date(post.date),
      description: post.excerpt,
      link: `/post/${post.slug}/`,
    })),
  });
}
