# Shilp Admin

Next.js 14 App Router dashboard for managing the project, project-tree, job-opening, and page-banner records served by `shilp_backend`.

## Setup

Copy `.env.example` to `.env.local`. Set `BACKEND_URL` to the backend server address and `NEXT_PUBLIC_SITE_URL` to the public site URL. Admin browser requests use the same-origin `/api` rewrite, so restart the admin dev server after changing `.env.local`. Install dependencies with `npm install`, then start with `npm run dev`.

For Vercel, set `BACKEND_URL=https://shilp-backend-dusky.vercel.app` and `NEXT_PUBLIC_SITE_URL=https://shilp-website.vercel.app` in this admin project's Production environment variables, then redeploy. The backend must allow this admin origin in its `ADMIN_ORIGIN` list.

The dashboard runs at `http://localhost:3001/admin/login`. Sign-in is verified by the backend; credentials and the signing secret belong only in the backend environment. Projects, Project Tree, Job Openings, and Page Banners are managed separately. Project Tree supports search, year/category filters, pagination, create/edit, active visibility, archive, and authenticated image upload. Job Openings supports search, pagination, create/edit, active visibility, and archive. Active openings are loaded from MongoDB on the public Careers page; add and publish openings in the admin to show them. Page Banners manages separate desktop/mobile images and accessibility alt text for the homepage and company pages. The Residential slot controls the Family Matters banner above the Residential section; the Plotted slot controls the Context Matters banner above the Plotted section. Residential and Plotted side images stay static. Each replacement image is saved immediately after upload; alt text is saved when its field loses focus. Individual project banners remain in the Projects editor.

Routes: `/admin/login`, `/admin/dashboard`, `/admin/projects`, `/admin/projects/new`, `/admin/projects/[id]`, `/admin/project-tree`, `/admin/job-openings`, `/admin/page-banners`.