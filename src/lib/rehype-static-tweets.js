/**
 * Rehype plugin that replaces Twitter/X blockquote embeds with static HTML
 * fetched from Twitter's oEmbed API at build time.
 *
 * If the oEmbed request fails for a given tweet, the original blockquote is
 * left intact so the client-side widgets.js loader in BaseHead.astro can
 * still upgrade it on the client.
 */

const TWEET_BLOCKQUOTE_RE =
  /<blockquote class="twitter-tweet">\s*<a href="(https?:\/\/(?:twitter\.com|x\.com)\/[^"]+\/status\/\d+)">[^<]*<\/a>\s*<\/blockquote>/g;

/**
 * Walk the hast tree and collect every `raw` node whose value contains a
 * twitter-tweet blockquote.  At this stage of Astro's markdown pipeline
 * (user rehype plugins run before rehype-raw), inline HTML from .md files
 * is still in raw string form.
 */
function collectRawNodes(node, result = []) {
  if (node.type === 'raw' && node.value?.includes('twitter-tweet')) {
    result.push(node);
  }
  if (node.children) {
    for (const child of node.children) {
      collectRawNodes(child, result);
    }
  }
  return result;
}

export function rehypeStaticTweets() {
  return async function transformer(tree) {
    const rawNodes = collectRawNodes(tree);
    if (rawNodes.length === 0) return;

    // Collect every unique tweet URL across all raw nodes
    const urlToHtml = new Map();
    for (const node of rawNodes) {
      for (const [, url] of node.value.matchAll(TWEET_BLOCKQUOTE_RE)) {
        urlToHtml.set(url, null);
      }
    }
    if (urlToHtml.size === 0) return;

    // Fetch all oEmbed responses in parallel
    await Promise.all(
      [...urlToHtml.keys()].map(async (url) => {
        try {
          const endpoint = `https://publish.x.com/oembed?url=${encodeURIComponent(url)}&omit_script=1`;
          const res = await fetch(endpoint);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const { html } = await res.json();
          urlToHtml.set(url, html);
        } catch (err) {
          console.warn(
            `[rehype-static-tweets] Failed to fetch ${url} – keeping original blockquote for client-side fallback (${err.message})`,
          );
        }
      }),
    );

    // Swap each blockquote for its oEmbed HTML, or keep the original on failure
    for (const node of rawNodes) {
      node.value = node.value.replace(
        TWEET_BLOCKQUOTE_RE,
        (original, tweetUrl) => urlToHtml.get(tweetUrl) ?? original,
      );
    }

    const fetched = [...urlToHtml.values()].filter(Boolean).length;
    console.log(
      `[rehype-static-tweets] ${fetched}/${urlToHtml.size} tweet(s) rendered at build time`,
    );
  };
}
