# Luvidos — Media Gallery & Streaming

Upload, organize, share and stream images and videos — organized into **albums** that are shared by link only. Nothing is public or listed; a visitor needs the album link.

- **Next.js 16** (App Router, Server Components, Server Actions, Route Handlers)
- **Supabase** — PostgreSQL, Auth, Row Level Security (application data & media metadata)
- **Azure Blob Storage** — original files and thumbnails (binary media only)
- **shadcn/ui + Tailwind CSS v4**, dark theme only

> Supabase manages the application and metadata. Azure Blob Storage manages the actual media files. Next.js connects everything together.

## Setup

1. Install dependencies

   ```bash
   npm install
   ```

2. Create a Supabase project and run the migrations in
   [`supabase/migrations/`](supabase/migrations/) **in order** (SQL editor or `supabase db push`):
   `0001_init.sql`, `0002_albums.sql`, then `0003_link_only.sql`.
   They create tables, indexes, RLS policies, RPCs, the `album_cards` view and a trigger that creates a `profiles` row for each new auth user.

   In **Authentication → URL configuration**, add `http://localhost:3000/auth/callback` to the redirect URLs.

3. Create an Azure Storage account and a **private** container (e.g. `luvidos-media`).
   Add a CORS rule on the Blob service so browsers can upload directly:

   | Setting         | Value                                  |
   | --------------- | -------------------------------------- |
   | Allowed origins | `http://localhost:3000` (and prod URL) |
   | Allowed methods | `GET, HEAD, PUT, OPTIONS`              |
   | Allowed headers | `*`                                    |
   | Exposed headers | `*`                                    |
   | Max age         | `3600`                                 |

4. Copy `.env.example` to `.env.local` and fill in the values.

5. Run the dev server

   ```bash
   npm run dev
   ```

## Architecture

```
Browser ──request upload authorization──▶ Next.js (Route Handler)
        ◀──short-lived SAS URL───────────┘        │ creates media + upload_session rows (Supabase)
Browser ──PUT blocks directly─────────▶ Azure Blob Storage
Browser ──complete───────────────────▶ Next.js verifies blob, runs processing, marks media ready
Viewer  ──stream/range requests──────▶ Azure Blob Storage (read SAS, CDN-friendly)
```

| Layer            | Location                                     |
| ---------------- | -------------------------------------------- |
| Supabase clients | `lib/supabase/` (browser, server, proxy)     |
| Azure storage    | `lib/azure/storage.ts`                       |
| Services         | `lib/services/` (album, media, upload, user) |
| Processing       | `lib/processing/media-processor.ts`          |
| Validation       | `lib/validation/`                            |
| Limits & config  | `lib/config/media.ts`                        |
| DB types         | `types/database.ts`                          |
| Schema / RLS     | `supabase/migrations/`                       |

Blob naming: `{userId}/{mediaId}/original` and `{userId}/{mediaId}/thumbnail`.

### Albums & visibility

Every media item belongs to exactly one album. Visibility lives on the album and applies to all items in it. There is no public gallery, search, or profile page — table-level RLS is owner-only, and visitors reach content solely through `SECURITY DEFINER` RPCs keyed by the album/media id.

| Visibility | Listed anywhere | Direct link | Enforcement                                     |
| ---------- | --------------- | ----------- | ----------------------------------------------- |
| unlisted   | no              | yes         | `get_album_detail()` / `get_album_media()` RPCs |
| private    | no              | owner only  | RLS + RPC owner check                           |

## Scripts

```bash
npm run dev    # development
npm run lint   # eslint
npm run build  # production build (also type-checks)
```
# luvidos
