# confidence.sh

My personal blog built with Astro

## Cloudflare Image Resizing

This site uses `imageService: 'cloudflare'` in `astro.config.mjs`, which relies on Cloudflare Image Resizing to transform images at the edge. You must enable Image Transformations on your Cloudflare zone for images to load correctly:

1. Go to the [Cloudflare dashboard](https://dash.cloudflare.com)
2. Select your zone
3. Navigate to **Images** > **Transformations**
4. Enable transformations for the zone

Without this, all images processed through Astro's `<Image>` component and markdown pipeline will return broken `/cdn-cgi/image/...` URLs.

## Converting Images To Webp

Install `cwebp` </br>

Then run this command to convert all images in the current directory to `webp`
with a quality of 50

```sh
for file in ./*; do cwebp -q 90 "$file" -o "${file%.*}.webp"; done
```
