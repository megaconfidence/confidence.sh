# confidence.sh

My personal blog built with Astro

## Converting Images To Webp

Install `cwebp` </br>

Then run this command to convert all images in the current directory to `webp`
with a quality of 50

```sh
for file in ./*; do cwebp -q 90 "$file" -o "${file%.*}.webp"; done
```
