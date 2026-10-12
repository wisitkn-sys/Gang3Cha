# USO Monitor shared import setup

The dashboard is public for viewers. Only registered uploaders can import a workbook.

## Required Vercel environment variables

Set these for **Production** (and Preview if needed):

- `GITHUB_TOKEN` — a fine-grained GitHub PAT with **Contents: Read and write** permission for `wisitkn-sys/Gang3Cha`.
- `AUTH_SECRET` — a random secret at least 24 characters long. It encrypts uploader records and signs sessions.
- `REGISTRATION_CODE` — the code trusted staff must enter when registering an uploader account.

Never commit these values to GitHub.

## Data written to Git

Each accepted import creates one Git commit containing:
- the original Excel file under `Data/imports/YYYY-MM-DD/...`
- `Data/live/latest.json`, which points all public viewers to the latest workbook

Uploader accounts are stored as an AES-256-GCM encrypted file at `System/users.enc.json`. Passwords are additionally protected with PBKDF2-SHA256 before encryption.

## Authentication behavior

- Viewers do not log in.
- Clicking **นำเข้าไฟล์** requires an uploader session.
- Staff can register with username/password plus the `REGISTRATION_CODE`.
- Session cookies are HttpOnly, Secure, SameSite=Lax and expire after 8 hours.
