# VT Wardrobes prototype

This directory is a self-contained Next.js app. Publish this directory, not the parent workspace containing supplier documents and internal costing scripts.

## Local commands

Use the committed `pnpm-lock.yaml` with pnpm. Scripts: `dev`, `build`, `start`, `typecheck`, `test:planner`.

If the GitHub repository contains the contents of this folder directly, the app is at the repository root. If it contains a `frontend` folder, that folder is the app root.

## Prototype limitations to tell the reviewer

- Quote form and assistant are prototypes; no real lead delivery/email integration.
- Saved designs are local to the browser, not an account or shareable saved-design service.
- Phone/contact placeholders still need real details.
- Planner pricing is awaiting approved component and retail rules. Some marketing sections still contain illustrative price figures and claims; these require a separate content approval before public launch.
- This is a client-review prototype, not a production launch. Restrict access and indexing appropriately in the chosen hosting environment.
- Never add supplier documents, private cost reports, `.env` secrets, or internal costing scripts to `public`.
- `.gitignore` prevents new untracked files from being added; it does not remove files already committed to Git.

## Responsive check — 24 October 2026

Checked home, quote and planner Layout at widths 375, 430, 768, 1024 and 1440 px in Chromium viewport emulation: document scroll width does not exceed client width. Also checked planner Finish at 812 × 375 landscape.

Visually checked mobile hero/menu, planner scene/controls/Finish, and tablet planner. Fixed white-on-light mobile menu links, final-step summary overlay, mobile controls and safe-area bottom spacing. These are browser viewport checks, not physical iPhone/Safari or Android device tests.
