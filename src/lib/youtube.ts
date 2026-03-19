const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

export interface Video {
	videoId: string;
	title: string;
	description: string;
	thumbnail: string;
	publishedAt: string;
	duration: string;
	durationSeconds: number;
	viewCount: number;
	url: string;
}

interface PlaylistItemSnippet {
	publishedAt: string;
	title: string;
	description: string;
	thumbnails: Record<string, { url: string; width: number; height: number }>;
	resourceId: { videoId: string };
}

interface PlaylistItemsResponse {
	nextPageToken?: string;
	items: Array<{ snippet: PlaylistItemSnippet }>;
}

interface VideoDetailsResponse {
	items: Array<{
		id: string;
		contentDetails: { duration: string };
		statistics: { viewCount?: string };
	}>;
}

/**
 * Parse an ISO 8601 duration (e.g. "PT5M23S", "PT1H2M", "PT45S") into
 * a human-readable string and raw seconds.
 */
function parseDuration(iso: string): { formatted: string; seconds: number } {
	const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
	if (!match) return { formatted: '0:00', seconds: 0 };

	const hours = parseInt(match[1] || '0', 10);
	const minutes = parseInt(match[2] || '0', 10);
	const seconds = parseInt(match[3] || '0', 10);
	const totalSeconds = hours * 3600 + minutes * 60 + seconds;

	if (hours > 0) {
		return {
			formatted: `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
			seconds: totalSeconds,
		};
	}
	return {
		formatted: `${minutes}:${String(seconds).padStart(2, '0')}`,
		seconds: totalSeconds,
	};
}

/**
 * Fetch all video IDs and basic metadata from a channel's uploads playlist.
 * Handles pagination automatically.
 */
async function fetchPlaylistItems(
	apiKey: string,
	playlistId: string,
): Promise<Array<{ videoId: string; title: string; description: string; thumbnail: string; publishedAt: string }>> {
	const items: Array<{ videoId: string; title: string; description: string; thumbnail: string; publishedAt: string }> =
		[];
	let pageToken: string | undefined;

	do {
		const params = new URLSearchParams({
			part: 'snippet',
			playlistId,
			maxResults: '50',
			key: apiKey,
		});
		if (pageToken) params.set('pageToken', pageToken);

		const res = await fetch(`${YOUTUBE_API_BASE}/playlistItems?${params}`);
		if (!res.ok) {
			const text = await res.text();
			throw new Error(`playlistItems API error (${res.status}): ${text}`);
		}

		const data: PlaylistItemsResponse = await res.json();

		for (const item of data.items) {
			const s = item.snippet;
			// Deleted/private videos have a title of "Deleted video" or "Private video"
			if (s.title === 'Deleted video' || s.title === 'Private video') continue;

			const thumbnail =
				s.thumbnails.maxres?.url || s.thumbnails.high?.url || s.thumbnails.medium?.url || s.thumbnails.default?.url || '';

			items.push({
				videoId: s.resourceId.videoId,
				title: s.title,
				description: s.description,
				thumbnail,
				publishedAt: s.publishedAt,
			});
		}

		pageToken = data.nextPageToken;
	} while (pageToken);

	return items;
}

/**
 * Fetch duration and view count for a batch of video IDs (max 50 per call).
 */
async function fetchVideoDetails(
	apiKey: string,
	videoIds: string[],
): Promise<Map<string, { duration: string; durationSeconds: number; viewCount: number }>> {
	const details = new Map<string, { duration: string; durationSeconds: number; viewCount: number }>();

	// Process in batches of 50
	for (let i = 0; i < videoIds.length; i += 50) {
		const batch = videoIds.slice(i, i + 50);
		const params = new URLSearchParams({
			part: 'contentDetails,statistics',
			id: batch.join(','),
			key: apiKey,
		});

		const res = await fetch(`${YOUTUBE_API_BASE}/videos?${params}`);
		if (!res.ok) {
			const text = await res.text();
			throw new Error(`videos API error (${res.status}): ${text}`);
		}

		const data: VideoDetailsResponse = await res.json();
		for (const item of data.items) {
			const { formatted, seconds } = parseDuration(item.contentDetails.duration);
			details.set(item.id, {
				duration: formatted,
				durationSeconds: seconds,
				viewCount: parseInt(item.statistics.viewCount || '0', 10),
			});
		}
	}

	return details;
}

/**
 * Fetch all videos from a YouTube channel, enriched with duration and view counts.
 * Returns videos sorted by publish date (newest first).
 *
 * The uploads playlist ID is derived from the channel ID by replacing "UC" with "UU".
 */
export async function fetchAllVideos(apiKey: string, channelId: string): Promise<Video[]> {
	if (!apiKey) {
		console.warn('[youtube] No API key provided — skipping video fetch');
		return [];
	}

	try {
		// Derive uploads playlist ID from channel ID
		const playlistId = channelId.replace(/^UC/, 'UU');

		// Step 1: Get all video IDs and basic info
		const playlistItems = await fetchPlaylistItems(apiKey, playlistId);
		if (playlistItems.length === 0) return [];

		// Step 2: Enrich with duration and view counts
		const videoIds = playlistItems.map((v) => v.videoId);
		const details = await fetchVideoDetails(apiKey, videoIds);

		// Step 3: Merge and build final Video objects
		const videos: Video[] = playlistItems
			.map((item) => {
				const detail = details.get(item.videoId);
				const durationSeconds = detail?.durationSeconds ?? 0;
				const isShort = durationSeconds > 0 && durationSeconds <= 60;
				const url = isShort
					? `https://www.youtube.com/shorts/${item.videoId}`
					: `https://www.youtube.com/watch?v=${item.videoId}`;

				return {
					videoId: item.videoId,
					title: item.title,
					description: item.description.split('\n')[0], // First line only
					thumbnail: item.thumbnail,
					publishedAt: item.publishedAt,
					duration: detail?.duration ?? '0:00',
					durationSeconds,
					viewCount: detail?.viewCount ?? 0,
					url,
				};
			})
			.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

		console.log(`[youtube] Fetched ${videos.length} videos`);
		return videos;
	} catch (err) {
		console.error('[youtube] Failed to fetch videos:', err);
		return [];
	}
}
