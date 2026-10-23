# AGENTS.md

A one-page static Astro site for Ashden Manor, a fictional wedding venue (trial task). Stage two of the trial, the "MatchMaker" pricing tool, will be added to this same page.

## Layout

- `src/pages/index.astro`: the whole page. Repeating content (exclusive-use points, the day timeline, the hotel comparison) lives in arrays in the frontmatter.
- `src/components/Photo.astro`: responsive `<img>` for the pre-optimised photos. Its `photos` map must match the files in `public/img`.
- `src/styles/global.css`: every style. Brand tokens are at the top.
- `src/scripts/reveal.ts`: scroll reveals and the header hairline.
- `src/scripts/enquiry.ts`: enquiry form validation and the AJAX post to Netlify Forms.
- `public/img`: optimised WebP photos (`<name>-<width>.webp`), transparent logos in ink and chalk, and the OG image.
- `SUBMISSION.md`: the candidate's written answers and the list of copy assumptions.

## Brand rules (from the client's brand kit, do not drift)

- Colours: Ink #1E1E1C, Sage #8C9685, Deep Olive #3B4034, Antique Bronze #907B60, Warm Linen #E9D9C7, Soft Chalk #F5F1EA, Stone #C1B6AE.
- Headings in Cinzel, body in Cormorant Garamond (weight 500 or more on screen; 300 is too thin).
- Dark backgrounds take cream text. Bronze is for accents only and is never used for small body text, because its contrast on chalk is too low. Never use pure white.
- Recurring motifs: the arch (a Georgian fanlight), the notched panel (from the crest's shield) and the hairline-with-diamond ornament (from the logo lockup).

## Content rules

- Only claim what the brief supports: exclusive use, up to 100 guests, an indoor ceremony room, a Georgian dining room, gardens, in-house catering, a private dressing room, full-day weddings and a pet-friendly policy. No awards, reviews, prices, locations, bedrooms or curfews. Anything that goes beyond these is listed as an assumption in `SUBMISSION.md`.
- The client asked that images not be added to their asset folder. Use only their photographs, and do not generate images.
- Some photographs were deliberately left out: one has a third-party watermark, one is an Instagram screenshot with UI overlays, and several clearly show France, Italy or Spain rather than an English Georgian house.

## Images

The source photos are only 675 to 1080px wide, so none of them is shown full-bleed. Each is framed at a size where it stays sharp. Variants were generated once with sharp (480px plus the native width, or 800px for the 1080px sources). If you add a photo, generate its variants and add an entry to `Photo.astro`.

## Form

`form[name="enquiry"]` uses Netlify Forms (`data-netlify`, a `bot-field` honeypot and a hidden `form-name`). It posts URL-encoded data to `/`. If you rename a field, update both the markup and the validation `rules` in `enquiry.ts`. The guest limit of 100 is enforced with a friendly message, not a hard block on the input.

## Stage two

Put the MatchMaker where the `<!-- Stage two -->` comment sits in `index.astro`, between the hotel comparison and the enquiry form. Reuse the existing form field styles (`.field`, `.choice`).
