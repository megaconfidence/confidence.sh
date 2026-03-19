import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { YOUTUBE_CHANNEL_ID } from '../../consts';
import { fetchAllVideos } from '../../lib/youtube';

export const prerender = true;

export const GET: APIRoute = async () => {
	const [blog, talks, books, videos] = await Promise.all([
		getCollection('blog'),
		getCollection('talks'),
		getCollection('books'),
		fetchAllVideos(import.meta.env.YOUTUBE_API_KEY, YOUTUBE_CHANNEL_ID),
	]);

	const items = [
		...blog.map((p) => ({
			type: 'blog',
			slug: p.id,
			title: p.data.title,
			description: p.data.description,
			tags: p.data.tags || [],
			date: p.data.pubDate.toISOString(),
		})),
		...talks.map((p) => ({
			type: 'talks',
			slug: p.id,
			title: p.data.title,
			description: p.data.description,
			tags: p.data.tags || [],
			date: p.data.pubDate.toISOString(),
		})),
		...books.map((p) => ({
			type: 'books',
			slug: p.id,
			title: p.data.title,
			description: p.data.description,
			tags: p.data.tags || [],
			date: p.data.pubDate.toISOString(),
		})),
		...videos.map((v) => ({
			type: 'videos',
			slug: v.videoId,
			title: v.title,
			description: v.description,
			tags: [] as string[],
			date: v.publishedAt,
			url: v.url,
		})),
	];

	return new Response(JSON.stringify(items), {
		headers: { 'Content-Type': 'application/json' },
	});
};
