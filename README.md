# Non Uyi operator assistant

Small, privacy-conscious web app for reviewing bakery messages. It classifies Uzbek, Russian and mixed-language messages, extracts order details as validated JSON, and prepares a same-language reply draft for an operator to review. Complaints and spam are escalated without a reply.

## Run locally

Requires Node.js 22 or newer. Copy `.env.example` to `.env` and add a Gemini API key on the server machine. Keep `.env` private; it is ignored by Git and the browser never receives the key.

```powershell
Copy-Item .env.example .env
# Set GEMINI_API_KEY in .env
npm start
```

Open http://127.0.0.1:3000. The server calls Gemini from the backend, limits request size, validates the model's exact response schema, rejects cross-origin requests, and returns safe errors. The dashboard stores reviewed message history in the current browser only.

## Checks

```powershell
npm test
npm run check
```

## Privacy and review

Do not enter payment card details or unnecessary personal information. AI drafts are suggestions; an operator must review them before sending. Complaint and spam messages never receive automated reply drafts.
