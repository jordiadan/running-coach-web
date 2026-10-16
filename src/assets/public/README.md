# Public photography and type

The public pages use licensed photographs of running. They are atmosphere and
editorial context, never testimonials, Running Coach customers or proof of a
training outcome. No generated photograph ships in the application.

| Files                                     | Photographer and source                                                         | License                                          | Treatment                                                               |
| ----------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------- |
| `training-900.webp`, `training-1800.webp` | [Fitsum Admasu, three runners](https://unsplash.com/photos/oGv9xIl7DkY)         | [Unsplash License](https://unsplash.com/license) | Responsive resize; monochrome and neutral contrast scrim applied in CSS |
| `runner-900.webp`                         | [Filip Mroz, running beside the water](https://unsplash.com/photos/XCkRGOX2VgM) | Unsplash License                                 | Responsive resize; intentional portrait and mobile crops                |
| `stride-1000.webp`                        | [Jakob Owens, running track](https://unsplash.com/photos/j5kEQ1JLqZk)           | Unsplash License                                 | Responsive resize; crops retain the runner’s stride                     |

Source pages and their free-use license notices were checked on 2026-10-16.
Credits link to the photographers’ source images in the public footer. Origin
records are stored in `.webp.json` sidecars, the provenance tool’s supported
fallback for WebP. Superseded mountain derivatives have been removed.

Original image endpoints:

- `https://images.unsplash.com/photo-1552674605-db6ffd4facb5`
- `https://images.unsplash.com/photo-1480179087180-d9f0ec044897`
- `https://images.unsplash.com/photo-1547941126-3d5322b218b0`

WebP derivatives were created using the installed `cwebp` at qualities 82–84.
Source photographs stay outside tracked source; only shipped derivatives remain.

`fonts/barlow-condensed-semibold.ttf` is Barlow Condensed, weight 600, served
locally as **RC Display**. The Google Fonts distribution source is
`https://fonts.gstatic.com/s/barlowcondensed/v13/HTxwL3I-JCGChYJ8VI-L6OO_au7B4873_3E.ttf`.
Its SIL Open Font License is preserved in [fonts/OFL.txt](fonts/OFL.txt).
DM Sans remains the shared reading and control face. No font dependency or
third-party font runtime was added for the display face.
