# AI Medical Report Interpreter – Your 24/7 Virtual Doctor

Mobile-first, fully responsive web app that lets users upload medical reports (PDF/JPG/PNG), extract text (OCR), and get a safety-first AI explanation, reminders, medicine scheduling, and a 24/7 chat experience.

## Tech stack

- **Frontend:** Next.js (App Router) + Tailwind + React Query + Chart.js
- **Backend:** Node.js + Express + MongoDB (Mongoose)
- **AI:** OpenAI API (Responses API)
- **OCR:** `pdf-parse` (digital PDFs) + `tesseract.js` (images)
- **Notifications:** Email via SendGrid (optional) + Push via Firebase Cloud Messaging (optional)

## Security / HIPAA-style structure (practical)

- JWT auth (access + refresh rotation)
- Encrypted PHI in MongoDB (**AES-256-GCM**) for report text, AI output, chat messages, and medical history
- Encrypted-at-rest uploads stored on disk in dev (`apps/api/.data/uploads/*.enc`)
- Optional S3/S3-compatible storage for uploads (`STORAGE_DRIVER=s3`)
- Protected routes + rate limiting + Helmet + CORS allowlist

> Disclaimer: This app is informational only and not a substitute for professional medical advice.

---

## Folder structure

```
apps/
  api/        # Express API + MongoDB + AI + OCR + scheduler
  web/        # Next.js responsive UI + dashboard
packages/
  shared/     # Shared Zod schemas + types
```

## Reference docs

- `docs/API.md` – backend endpoints
- `docs/SCHEMA.md` – MongoDB schema overview

---

## Local development

### 1) Install dependencies

From repo root:

```bash
npm install --cache .npm-cache
```

### 2) Configure environment variables

- Copy `apps/api/.env.example` → `apps/api/.env`
- Copy `apps/web/.env.example` → `apps/web/.env.local`

If you don’t have OpenAI credits/quota right now: set `AI_MODE=demo` in `apps/api/.env` to make uploads + chat work without external AI calls.

Alternative: use HuggingFace Router (OpenAI-compatible) by setting `AI_MODE=huggingface`, `HF_API_KEY`, and `HF_MODEL` (see `apps/api/.env.example`). Recommended model: `Qwen/Qwen2.5-7B-Instruct`.

### 3) Start MongoDB

Use a local MongoDB instance (or MongoDB Atlas).

### 4) Run both apps

```bash
npm run dev
```

- Web: `http://localhost:3000`
- API: `http://localhost:8090/health`
  - If you see timeouts using `localhost`, use `http://127.0.0.1:8090/health` and set `NEXT_PUBLIC_API_BASE_URL` accordingly.
  - Readiness endpoint: `http://127.0.0.1:8090/health/ready`

---

## Deployment

### Frontend on Vercel

1. Import the repo in Vercel.
2. Set **Root Directory** to `apps/web`.
3. Set environment variables from `apps/web/.env.example`.
4. Build command: `npm run build`
5. Output: default (Next.js)
6. Set `NEXT_PUBLIC_API_BASE_URL` to your backend URL (Render/Railway).

### Backend on Render / Railway

1. Create a Node service from `apps/api`.
2. Add environment variables from `apps/api/.env.example`:
   - `MONGODB_URI`, `DATA_ENCRYPTION_KEY_BASE64`, JWT secrets, `CORS_ORIGIN` (set to your Vercel URL)
   - AI (pick one):
     - HuggingFace: `AI_MODE=huggingface`, `HF_API_KEY`, `HF_MODEL`
     - OpenAI: `AI_MODE=openai`, `OPENAI_API_KEY`
3. Build command:

```bash
npm install --cache .npm-cache && npm -w @ami/shared run build && npm -w @ami/api run build
```

4. Start command:

```bash
npm -w @ami/api run start
```

> Note: Render’s filesystem is ephemeral. For production uploads, use `STORAGE_DRIVER=s3`. If you prefer local storage, attach a Render Disk and set `LOCAL_UPLOAD_DIR=/data/uploads` + `ALLOW_LOCAL_STORAGE_IN_PROD=true`.

---

## Push notifications setup (optional)

- Web app uses FCM; it registers a service worker at `/firebase-messaging-sw.js`.
- Backend can send pushes if `FIREBASE_SERVICE_ACCOUNT_JSON` is configured.
- The browser token is registered by clicking **Enable Push Notifications** on the Reminders page.

### Required env vars

**Frontend (Vercel):** set the Firebase web config + VAPID key (see `apps/web/.env.example`).

**Backend (Render):** set:
- `FIREBASE_SERVICE_ACCOUNT_JSON` (service account JSON in a single line)

### Quick test

Go to **Dashboard → Reminders**:
- Click **Enable** under Push notifications
- Click **Send test** to verify delivery

---

## Notes / limitations (MVP)

- Scanned PDFs: if `pdf-parse` finds no text, the API OCRs the first `PDF_OCR_MAX_PAGES` pages (can be slow).
- “Disease prediction / risk scoring” is not enabled by default (keep outputs conservative and clinician-directed).
