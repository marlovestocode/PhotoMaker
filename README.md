# Photo Maker

A private, mobile-friendly family photo book built with Next.js, Neon Postgres, Managed Better Auth, and Neon Object Storage.

## Current foundation

- `/auth/sign-in` starts passwordless email-link or Google sign-in.
- `/gallery` is a public, read-only exhibition of only the photos explicitly published by the owner. It uses an editorial hero collage, featured photograph, responsive collection grid or masonry, stored image thumbnails, and native lazy loading.
- `/upload` is an owner-only photo library with multi-file upload, search, sorting, bulk selection and deletion, photo detail editing, centered crop presets, rotation, downloads, private share links, and per-photo public-gallery controls.
- `/settings/design` is an owner-only design studio for global site defaults and route-specific overrides, with live previews of the actual app routes at desktop, tablet, and mobile sizes.
- Uploads accept JPEG, PNG, or WebP up to 15 MB per photo. The server validates each image, rotates it using EXIF orientation, resizes it to at most 2000 by 2000, writes WebP display and thumbnail objects to the private Neon `images` bucket, then stores their keys and metadata in Postgres. Photos stay private unless the owner publishes them; `/gallery` streams thumbnails through an endpoint that rechecks public visibility on every request and uses private conditional caching to avoid redundant object reads. Owner-only photo routes support updating titles and captions, visibility, centered crop ratios, rotation, and deleting individual or selected photos.
- Private photo URLs are short-lived signed URLs. The database stores object keys, never image bytes or storage credentials.
- The former individual editor demos are grouped under `/dev`.

The design studio provides Victorian, Medieval, Draconian, and Minimal Editorial layout presets; route profiles with dynamic path segments; actual-route live previews; and click-to-select controls for resizing, dragging, and removing individual elements. Controls are scoped to the selected page: `/gallery` shows gallery copy, section visibility/layout, individual section and photo-card colors, typography, spacing, and frame styling; `/upload` shows the palette, type, and panel controls used by its forms and photo library; global defaults and other routes expose the shared design controls. Gallery profile edits update the live preview without restyling the design editor itself. Ctrl-click (or Cmd-click on Mac) selects multiple elements so shared sizing, positioning, removal, alignment, and distribution actions can apply to all selected elements. Quick actions align to a container or selection, center a selection in the page, distribute three or more elements, or reset positions. Removed elements have restore controls, and position fields support precise X/Y offsets; horizontal offsets fall back to the responsive layout and custom widths stay within their container at widths of 760px or less. Element adjustments are route-specific and can be reset, undone, or redone. The studio also includes reset-to-saved and reset-to-default actions, and custom presets saved to Neon. Unconfigured and newly-added routes inherit the global design automatically. Site settings are stored in the existing `sites.theme` JSONB field, and saved presets use the `presets` table.

The auth users and sessions live in Neon's managed `neon_auth` schema. The app schema in `src/db/schema.ts` defines the site, section, photo, and preset data. Photo ownership is checked against the signed-in user's ID, and the current editor additionally requires `OWNER_EMAIL` to match the signed-in account.

## Local setup

1. Install dependencies with `npm install`.
2. The Neon CLI links this repo to the `production` branch. Run `neon env pull` if the root `.env.local` file is missing or the Neon settings are stale.
3. Keep `.env.local` private; it is ignored by Git. It contains Neon-managed `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_JWKS_URL`, and `AWS_*` settings.
4. Set `OWNER_EMAIL` in `.env.local` to the exact email address that should own the photo book. A local `NEON_AUTH_COOKIE_SECRET` is also required; generate a unique 32+ character secret for each deployed app environment.
5. Generate and apply the Drizzle schema:

   ```bash
   npm run db:generate
   npm run db:migrate
   ```

   The application uses pooled `DATABASE_URL`; Drizzle migrations use direct `DATABASE_URL_UNPOOLED`.
6. Verify Postgres and the private object bucket end-to-end:

   ```bash
   npm run test:neon
   ```

7. Start the app with `npm run dev`. `/api/db-check` verifies the app tables, `/api/auth/get-session` verifies the auth proxy, `/upload` redirects to sign-in until an owner session exists, and `/settings/design` opens the site design studio for the owner.

## Neon Auth notes

Managed Better Auth is enabled on the linked branch. Magic Link is enabled with five-minute links. The branch currently has Neon's shared Google OAuth provider, which is for development only and displays Neon branding. Before public production use, add your own Google OAuth credentials and configure production email delivery in Neon Auth. OAuth redirect URLs must use the Auth URL shown by `neon neon-auth status`; the app callback is `/upload`.

## Architecture

```text
src/
  app/             Next.js routes and route handlers
  components/      Reusable UI, including upload and design studios
  db/              Drizzle schema
  features/        Shared feature contracts and validation
  scripts/         Local service verification
  server/          Auth, database, storage, design, and data-access code
  theme/           Shared design tokens, presets, and style schemas
drizzle/           Generated SQL migrations
neon.ts            Branch services and bucket configuration
```

The landing-page section builder can build on the `sections` table: each section has its own type, order, visibility, content, and style JSON. The public gallery is a lightweight album rather than a section-builder page; section reordering, member invites, and comments are not implemented.
