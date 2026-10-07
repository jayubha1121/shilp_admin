# Shilp Admin

Next.js 14 App Router dashboard for managing the project records served by `shilp_backend`.

## Setup

Copy `.env.example` to `.env.local`. Set `BACKEND_URL` to the backend server address and `NEXT_PUBLIC_SITE_URL` to the public site URL. Admin browser requests use the same-origin `/api` rewrite, so restart the admin dev server after changing `.env.local`. Install dependencies with `npm install`, then start with `npm run dev`.

The dashboard runs at `http://localhost:3001/admin/login`. Sign-in is verified by the backend; credentials and the signing secret belong only in the backend environment. The dashboard supports category totals, search, pagination, create/edit, active visibility, archive, project details, and authenticated image upload.

Routes: `/admin/login`, `/admin/dashboard`, `/admin/projects`, `/admin/projects/new`, `/admin/projects/[id]`.