# BrieflyCH Production Preparation Notes

Dokumen ini bukan lagi map kode, tapi checklist ringkas untuk persiapan production deployment BrieflyCH.

## 1. Environment Production

Wajib disiapkan di platform hosting frontend:

```bash
API_BASE_URL=https://api.brieflych.com
NEXT_PUBLIC_API_BASE_URL=https://api.brieflych.com
NEXT_PUBLIC_SITE_URL=https://brieflych.com
```

Catatan:

- `API_BASE_URL` harus mengarah ke backend production, bukan `localhost:8080`.
- `NEXT_PUBLIC_API_BASE_URL` boleh disamakan untuk compatibility, tapi jangan taruh secret di variable `NEXT_PUBLIC_*`.
- `NEXT_PUBLIC_SITE_URL` dipakai untuk canonical URL, sitemap, robots, OpenGraph, Twitter image, dan structured data SEO.
- Jangan commit file `.env.local` atau secret apapun ke repository.

## 2. Backend Readiness

Backend production perlu memastikan endpoint berikut tersedia dan stabil:

- `POST /internal/auth/login`
- `GET /internal/auth/me`
- `GET /internal/jobs`
- `GET /internal/jobs/{id}`
- `GET /internal/jobs/slug/{slug}` atau endpoint detail job publik yang sesuai dengan frontend
- `GET /internal/jobs/categories`
- `GET /internal/worker/runs`
- `GET /internal/worker/scrape-health`
- `GET /internal/about`
- `POST /internal/about`
- `GET /internal/about/{id}`
- `PATCH /internal/about/{id}`
- `DELETE /internal/about/{id}`

Semua endpoint `/internal/*` wajib memakai format response:

```json
{
  "api_message": "message",
  "count": 0,
  "data": {}
}
```

Catatan penting:

- Endpoint admin membutuhkan header `Authorization: Bearer <token>`.
- Public page tetap harus bisa diakses tanpa login.
- Pagination job list harus memakai `limit`, `offset`, dan `count` dari backend.
- Jika data kosong, backend tetap return response sukses dengan `data` kosong dan `count: 0`.

## 3. Authentication Admin

Yang perlu dicek sebelum production:

- Login admin berhasil lewat `/admin/login`.
- Token dari backend tersimpan sebagai HttpOnly cookie.
- Refresh halaman admin tetap valid karena token dicek lewat `/internal/auth/me`.
- Jika backend return `401`, user otomatis logout dan diarahkan ke login.
- Public page seperti `/`, `/jobs`, `/jobs/[slug]`, dan `/about` tidak meminta login.

Smoke test auth:

1. Buka `/admin` tanpa login, harus redirect ke `/admin/login`.
2. Login dengan credential admin production.
3. Buka `/admin/jobs`, `/admin/pipeline`, `/admin/sources`, dan `/admin/settings`.
4. Hapus atau expire token, lalu refresh halaman admin, harus logout otomatis.

## 4. SEO Readiness

Sudah disiapkan di frontend:

- Metadata global.
- Canonical URL.
- OpenGraph metadata.
- Twitter Card metadata.
- Dynamic sitemap di `/sitemap.xml`.
- Robots file di `/robots.txt`.
- `JobPosting` structured data pada halaman detail job.
- `WebSite` structured data pada homepage.
- Admin routes dibuat `noindex`.

Yang perlu dilakukan setelah deploy:

- Pastikan `https://brieflych.com/robots.txt` bisa diakses.
- Pastikan `https://brieflych.com/sitemap.xml` bisa diakses.
- Submit sitemap ke Google Search Console.
- Cek beberapa halaman detail job dengan Rich Results Test.
- Pastikan title dan description tidak kosong saat backend mengirim data job.

## 5. Frontend Smoke Test

Jalankan sebelum deployment:

```bash
npm run lint
npm run build
```

Smoke test halaman publik:

- `/` homepage tampil dan categories terisi dari backend.
- Search dari homepage mengarah ke `/jobs`.
- `/jobs` menampilkan list job dengan pagination backend.
- Filter job mengirim query ke backend, bukan filter lokal.
- Empty state muncul jika tidak ada job, bukan 404 error.
- `/jobs/[slug]` tampil dengan detail job, company image, work type, employment type, description, requirements, dan benefits.
- `/about` tampil dari endpoint about.

Smoke test admin:

- `/admin` dashboard tampil setelah login.
- `/admin/jobs` list job dan pagination berjalan.
- `/admin/jobs/[id]` detail admin bisa diakses.
- `/admin/pipeline` mengambil data worker runs dan scrape health.
- `/admin/sources` menampilkan health 24 jam.
- `/admin/settings` bisa CRUD about hanya dengan field `title` dan `body`.

## 6. Deployment Checklist

Sebelum deploy:

- Pastikan branch `main` terbaru sudah push ke GitHub.
- Pastikan hosting tersambung ke repo `enylvia/brieflych.com`.
- Set environment production di hosting.
- Set backend CORS agar menerima origin `https://brieflych.com`.
- Pastikan cookie auth aman di HTTPS.
- Pastikan API production menggunakan HTTPS.
- Jalankan build production di hosting.

Setelah deploy:

- Buka homepage production.
- Login admin production.
- Test public job search dan detail job.
- Test admin jobs, pipeline, sources, settings.
- Cek browser console tidak ada error besar.
- Cek network request API mengarah ke backend production.
- Cek Lighthouse basic untuk SEO, accessibility, dan performance.

## 7. Known Follow-Up

Hal yang masih perlu disiapkan nanti:

- Endpoint newsletter subscription jika fitur subscribe sudah mau diaktifkan.
- Final copywriting homepage dan footer jika brand voice sudah dikunci.
- Production monitoring atau error tracking.
- Rate limiting untuk auth endpoint.
- Backup dan rollback strategy untuk backend dan database.
- Google Search Console dan analytics setup.

## 8. Quick Production Commands

Local verification:

```bash
npm run lint
npm run build
```

Git publish:

```bash
git status
git add .
git commit -m "chore: prepare production deployment"
git push origin main
```

Gunakan `git add .` hanya jika sudah yakin semua perubahan memang masuk scope deployment.
