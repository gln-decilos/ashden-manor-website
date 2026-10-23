# Ashden Manor

A one-page website for Ashden Manor, a fictional exclusive-use Georgian wedding venue in the English countryside. It was built as stage one of a website-builder trial for The Wedding Marketers.

The page is organised around one idea, that **for one day, the whole house is yours**, and answers the four questions engaged couples ask most: whether exclusive use is worth it, whether 100 guests is enough, whether it will feel too formal, and how it differs from a nice hotel. It ends with an enquiry form framed as arranging a visit.

## Stack

- [Astro 5](https://astro.build) with static output: plain HTML, one stylesheet, and two small vanilla TypeScript modules
- Cinzel and Cormorant Garamond from the brand kit, self-hosted through Fontsource
- Pre-optimised responsive WebP images in `public/img`
- Netlify Forms for the enquiry form, with AJAX submission, inline validation and a honeypot
- Hosted on Netlify. Because the output is static, it would deploy to Cloudflare Pages unchanged (the form would need a new endpoint there).

## Running locally

```bash
npm install
npm run dev      # http://localhost:4321
```

The form only submits for real on Netlify. Locally it shows its "didn't send" error state.

## What's next

- **Stage two, the MatchMaker:** a pricing tool placed between the hotel comparison and the enquiry form. The slot is marked with a comment in `src/pages/index.astro`.
- Replace the remaining copy assumptions (listed in `SUBMISSION.md`) with facts confirmed by the venue.
- A real photograph of a dog at Ashden. The page says dogs are welcome, but no photo shows one yet.
