# confidence.sh

My personal blog built with Hugo and Congo

## Updating Modules

To download any module update, please run:

```sh
 hugo mod get -u
```

## Converting Images TO Webp

Install `cwebp`

```sh
sudo apt install webp #Ubuntu
sudo dnf install libwebp-tools #Fedora
```

Then run this command to convert all images in the current directory to `webp`
with a quality of 50

```sh
for file in ./*; do cwebp -q 50 "$file" -o "${file%.*}.webp"; done
```

## Notes

### Thumbnails

Resolution: `1600x840px` Icon: `512x512px`
