# API endpoints

Base: `/api`

## Auth

- `POST /auth/signup` → `{ user, tokens }`
- `POST /auth/login` → `{ user, tokens }`
- `POST /auth/refresh` → `{ tokens }`
- `GET /auth/me` (Bearer) → `{ user }`
- `POST /auth/logout` (Bearer)
- `POST /auth/device-token` (Bearer) → register FCM token

## Reports

- `GET /reports` (Bearer)
- `GET /reports/:id` (Bearer)
- `POST /reports/upload` (Bearer, multipart `file`) → `{ reportId }`

## Chat

- `GET /chat/history` (Bearer)
- `POST /chat/send` (Bearer) → `{ message }`

## Reminders

- `GET /reminders` (Bearer)
- `POST /reminders` (Bearer)
- `PATCH /reminders/:id` (Bearer) → enable/disable
- `DELETE /reminders/:id` (Bearer)

## Medicines

- `GET /meds/schedules` (Bearer)
- `POST /meds/schedules` (Bearer)
- `PATCH /meds/schedules/:id` (Bearer) → enable/disable
- `DELETE /meds/schedules/:id` (Bearer)
- `POST /meds/logs` (Bearer)
- `GET /meds/adherence?days=14` (Bearer)

## Dashboard

- `GET /dashboard/summary` (Bearer)

## Metrics

- `GET /metrics/water` / `POST /metrics/water` (Bearer)
- `GET /metrics/weight` / `POST /metrics/weight` (Bearer)

## Profile

- `GET /profile` (Bearer) → medical history (encrypted)
- `PUT /profile/medical-history` (Bearer)

## Admin (admin role)

- `GET /admin/users` (Bearer, admin)
- `GET /admin/reports` (Bearer, admin)
