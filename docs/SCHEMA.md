# MongoDB schema (Mongoose)

## User

- `email` (unique)
- `name`
- `passwordHash`
- `medicalHistoryEnc` (AES-256-GCM encrypted JSON)
- `refreshTokenHash` (sha256 of refresh token)
- `deviceTokens[]` (FCM tokens)

## Report

- `userId`
- `filename`, `mimeType`, `storageKey` (encrypted file on disk in dev)
- `status`: `uploaded | processing | ready | failed`
- `extractedTextEnc` (encrypted)
- `aiExplanationEnc` (encrypted)
- `abnormalFindingsEnc` (encrypted)

## Reminder

- `userId`
- `type`: `water | medicine | diet | exercise | disease | custom`
- `title`, `message`
- `frequency`: `daily | weekly | monthly`
- `times[]`: `["09:00","14:00"]`
- `enabled`

## MedicineSchedule

- `userId`
- `name`, `dosage`
- `times[]`
- `startDate` (YYYY-MM-DD), `durationDays`
- `enabled`

## MedicineLog

- `userId`, `scheduleId`
- `plannedAt`, `status` (`taken | skipped`), `loggedAt`

## ChatThread

- `userId` (unique)
- `messages[]`: `{ role, contentEnc }` (encrypted), timestamps

## WaterLog / WeightLog

- `userId`, `date` (YYYY-MM-DD)
- `glasses` / `weightKg`

