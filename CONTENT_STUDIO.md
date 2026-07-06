# AI Content Studio

This repository now includes a content storage and planning system for the user's four main brands:

- Vaughan Mortgage Group (VMG)
- eStack Canada
- eStack USA
- The Straight Cut

## Purpose

The Content Studio is the permanent publishing hub for articles, captions, social posts, affiliate notes, video scripts, prompts, and daily content packages. It is designed to keep every brand separated while allowing daily content to be reused across websites, Pinterest, Instagram, Facebook, LinkedIn, TikTok, and YouTube.

## Core Workflow

1. Choose the brand.
2. Use a template from `/templates`.
3. Save the content into the correct brand folder.
4. For daily publishing, save the full package under `/content/YYYY/MM-Month/YYYY-MM-DD/`.
5. Repurpose each article into social posts, pins, scripts, and newsletters.

## Brand Separation Rules

### Vaughan Mortgage Group
Mortgage lead generation only. Keep FSRA-compliant. Do not mix VMG with affiliate loan offers.

Required mortgage compliance footer for marketing materials:

Mortgage Agent Level 2 | FSRA #M25000307 | GNE Mortgages FSRA Brokerage #10394 | vaughanmortgages@gmail.com | 416-891-8684

### eStack Canada
Canadian finance publication. Keep Canadian products, laws, lenders, and affiliate links separate from U.S. content.

### eStack USA
U.S. finance publication. Keep U.S. products, networks, and articles separate from Canadian content.

### The Straight Cut
Canada-wide shopping and affiliate discovery brand. Focus on home, travel, tech, automotive, outdoor, seasonal deals, and buying guides.

## Folder Map

- `/content` — Daily content packages.
- `/brands` — Brand-specific content libraries.
- `/templates` — Reusable Markdown templates.
- `/affiliate-database` — Affiliate program tracking.
- `/prompts` — Prompt library for social, image, video, SEO, blog, and automation work.
- `/calendar` — Monthly planning templates.
- `/images` — Image planning and asset notes.
- `/videos` — Video scripts and publishing notes.

## Daily Package Format

Each daily folder should contain:

- `article.md`
- `instagram.md`
- `facebook.md`
- `linkedin.md`
- `pinterest.md`
- `tiktok.md`
- `youtube.md`
- `newsletter.md`
- `notes.md`

## Expansion

This system can scale to thousands of files. Keep filenames clean, use dates, avoid mixing brands, and keep affiliate tracking accurate.