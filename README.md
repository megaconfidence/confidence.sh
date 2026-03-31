# confidence.sh

My personal blog built with Astro

## Cloudflare Image Resizing

This site uses `imageService: 'cloudflare'` in `astro.config.mjs`, which relies on Cloudflare Image Resizing to transform images at the edge. You must enable Image Transformations on your Cloudflare zone for images to load correctly:

1. Go to the [Cloudflare dashboard](https://dash.cloudflare.com)
2. Select your zone
3. Navigate to **Images** > **Transformations**
4. Enable transformations for the zone

Without this, all images processed through Astro's `<Image>` component and markdown pipeline will return broken `/cdn-cgi/image/...` URLs.

## GitHub Actions (Automated Deploys)

A workflow at `.github/workflows/deploy.yml` builds and deploys the site on every push to `main`, on a 12-hour cron (to pick up new YouTube videos), and via manual trigger.

Add these three secrets in your repo's **Settings > Secrets and variables > Actions**:

| Secret                  | Value                                                     |
| ----------------------- | --------------------------------------------------------- |
| `YOUTUBE_API_KEY`       | YouTube Data API v3 key                                   |
| `CLOUDFLARE_API_TOKEN`  | Cloudflare API token with Workers Scripts Edit permission |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID                                |

## Static Tweet Embeds

Tweets embedded in blog posts and talks are rendered at build time using a custom rehype plugin (`src/lib/rehype-static-tweets.js`). The plugin calls Twitter's oEmbed API during the Astro build to fetch static HTML for each `<blockquote class="twitter-tweet">` block in markdown files.

If the oEmbed request fails for a given tweet (e.g. deleted tweet, network error), the original blockquote is left intact and the client-side `widgets.js` loader in `BaseHead.astro` handles it as a fallback. The oEmbed API is unauthenticated and not rate-limited, so frequent CI builds are not a concern.

## Converting Images To Webp

Install `cwebp` </br>

Then run this command to convert all images in the current directory to `webp`
with a quality of 50

```sh
for file in ./*; do cwebp -q 90 "$file" -o "${file%.*}.webp"; done
```

## Thumbnail Dimensions

Resolution: 1600x840px Icon: 512x512px
