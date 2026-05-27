# Bundle Image Generator

A simple SaaS MVP that generates marketplace-ready 1:1 e-commerce bundle images from two product photos using the OpenAI Images API.

## Features

- Upload two product images (drag & drop or file picker)
- Generate a square bundle image with Product A on top, Product B on bottom, and a premium “+” symbol between them
- Download the result or generate again
- No database, no authentication (MVP)

## Tech stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- OpenAI SDK (`gpt-image-1` via `images.edit`)

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example env file and add your OpenAI API key:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
OPENAI_API_KEY=sk-your-key-here
```

The API key is only used on the server in `/api/generate-bundle`. It is never exposed to the browser.

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

1. Upload **Product A** and **Product B** (PNG, JPG, JPEG, or WEBP, max 10MB each).
2. Click **Generate Bundle**.
3. Download the generated image or click **Generate Again**.

## Changing the image model

Edit `IMAGE_MODEL` in `lib/constants.ts`:

```ts
export const IMAGE_MODEL = "gpt-image-1";
```

## Project structure

```
app/
  page.tsx                      # Main UI
  api/generate-bundle/route.ts  # Server API route
components/
  ImageUploadBox.tsx            # Upload zones with preview
  GeneratedResult.tsx           # Result display & actions
  LoadingSpinner.tsx
lib/
  openai.ts                     # OpenAI client & bundle generation
  constants.ts                  # Model, prompt, limits
  validation.ts                 # File validation
```

## Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start development server |
| `npm run build` | Production build         |
| `npm run start` | Start production server  |
| `npm run lint`  | Run ESLint               |

## Requirements

- Node.js 18+
- An OpenAI API key with access to GPT image models (`gpt-image-1` or compatible)

## License

MIT
