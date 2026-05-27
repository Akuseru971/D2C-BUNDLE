# Bundle Image Composer

Compose marketplace-ready 1:1 e-commerce bundle images from your own product photos. Upload images, arrange them on a canvas with drag/zoom, add an optional logo, and download a PNG — all in the browser, no AI API required.

## Features

- Upload Product A, B, and optional Product C
- Optional logo overlay (your exact file)
- WYSIWYG canvas editor with undo/redo
- Click elements to select, drag to move, scroll to zoom
- Download 1500×1500 PNG
- No database, no authentication (MVP)

## Tech stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- HTML Canvas (client-side composition)

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

1. Upload **Product A** and **Product B** (PNG, JPG, JPEG, or WEBP, max 10MB each).
2. Optionally upload **Product C** and a **Logo**.
3. The editor and preview appear automatically.
4. Adjust layout, then **Download PNG**.

## Project structure

```
app/
  page.tsx                 # Upload UI + workspace
components/
  ImageUploadBox.tsx       # Upload zones with preview
  BundleWorkspace.tsx      # Editor + preview + download
  BundleEditor.tsx         # Layer controls
  BundleCanvasView.tsx     # Interactive canvas
lib/
  bundle-editor.ts         # Transforms & defaults
  bundle-layout.ts         # Bounds & hit-testing
  export-bundle-canvas.ts  # Render & export
  remove-white-background.ts
  validation.ts            # File validation
```

## Deploy on Vercel

Push to GitHub and import the repo in Vercel. No API keys are required.
