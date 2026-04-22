# BrieflyCH Frontend

Frontend production untuk BrieflyCH, berisi public job board dan admin panel internal.

## Stack

- Next.js App Router
- React
- Tailwind CSS
- shadcn-style UI primitives
- Server Actions untuk mutasi admin

## Environment

Siapkan environment berikut di local atau hosting production:

```bash
API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_SITE_URL=https://brieflych.com
```

`API_BASE_URL` dipakai oleh server-side frontend untuk memanggil backend.
`NEXT_PUBLIC_API_BASE_URL` bisa disamakan untuk development, tapi production sebaiknya tetap mengutamakan `API_BASE_URL` server-side.
`NEXT_PUBLIC_SITE_URL` dipakai untuk canonical URL, sitemap, robots, OpenGraph, dan structured data SEO.

## Development

```bash
npm install
npm run dev
```

## Production Checks

```bash
npm run lint
npm run build
```

## Routes

- `/` public homepage
- `/jobs` public job listing
- `/jobs/[slug]` public job detail
- `/about` public about page
- `/admin/login` admin login
- `/admin` admin dashboard
- `/admin/jobs` admin jobs management
- `/admin/pipeline` worker pipeline dashboard
- `/admin/sources` source health dashboard
- `/admin/settings` about page CRUD
