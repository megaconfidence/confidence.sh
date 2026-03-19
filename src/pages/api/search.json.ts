import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const prerender = true;

export const GET: APIRoute = async () => {
	const [blog, talks, books] = await Promise.all([
		getCollection('blog'),
		getCollection('talks'),
		getCollection('books'),
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
	];

	return new Response(JSON.stringify(items), {
		headers: { 'Content-Type': 'application/json' },
	});
};
