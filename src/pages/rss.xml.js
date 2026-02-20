import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';

export async function GET(context) {
  const blog = await getCollection('blog');
  const talks = await getCollection('talks');

  const allPosts = [...blog, ...talks].sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    items: allPosts.map((post) => {
      const collection = blog.includes(post) ? 'blog' : 'talks';
      return {
        title: post.data.title,
        pubDate: post.data.pubDate,
        description: post.data.description,
        link: `/${collection}/${post.id}/`,
      };
    }),
  });
}
