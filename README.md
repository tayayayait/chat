<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1CxaHoAktMK-shXjPQUsjv72eIHGfxjV8

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create an `.env.local` file with your Gemini credentials (see below).
3. Run the Vite client dev server:
   `npm run dev`
4. (Optional) Start the standalone Express backend for local testing:
   `npm run server`

## Environment variables

| Name | Required | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | ✅ | API key that the server-side `@google/genai` client uses. |
| `GEMINI_MODEL` | Optional | Override the model ID (defaults to `gemini-2.0-flash`). |
| `GEMINI_SYSTEM_PROMPT` | Optional | Custom system prompt injected into every chat session. |
| `SERVER_PORT` | Optional | Port for `npm run server` (defaults to `8788`). |

Example `.env.local`:

```
GEMINI_API_KEY=your-key-here
GEMINI_MODEL=gemini-2.0-flash
SERVER_PORT=8788
```
