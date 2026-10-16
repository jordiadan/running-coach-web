# Public image derivatives

`running-480.webp` and `running-960.webp` are responsive derivatives of the
repository's existing `src/assets/hero-running.jpg`. Its original creator,
location and acquisition provenance are not recorded in this repository. These
assets are used as running atmosphere, never as a customer endorsement or a
documentary claim. No new external photograph or generated image was introduced.

Created with the installed `cwebp`, preserving the source's aspect ratio:

```sh
cwebp -quiet -q 80 -resize 480 0 src/assets/hero-running.jpg -o src/assets/public/running-480.webp
cwebp -quiet -q 82 -resize 960 0 src/assets/hero-running.jpg -o src/assets/public/running-960.webp
```
