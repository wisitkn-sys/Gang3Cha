# USO Monitor shared import setup

The dashboard is public and currently imports without login.

## Required Vercel environment variable

Set this for Production:

- `GITHUB_TOKEN` — a fine-grained GitHub PAT with **Contents: Read and write** permission only for `wisitkn-sys/Gang3Cha`.

Never commit this token into GitHub or browser JavaScript.

## Shared data flow

Each accepted Excel import creates one Git commit containing:
- the original workbook under `Data/imports/YYYY-MM-DD/...`
- `Data/live/latest.json`, which points every dashboard viewer to the latest workbook

All viewers load the same latest workbook when opening the dashboard. Open dashboards check for a newer workbook every 60 seconds and when the browser tab regains focus.

## Temporary security status

Uploader login is intentionally disabled for now. Therefore anyone who can access the dashboard can use the Import button. Re-enable authentication before treating the site as a controlled production uploader.
