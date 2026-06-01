# Publish The App

This app needs a hosting service that can run Node.js.

That is because the real AI keys must stay private. A plain website host is not enough.

## Easiest Path

Use Render, Railway, Fly.io, or another Node.js web app host.

The app is ready for a host that runs:

```txt
node server.js
```

## What You Need Before Publishing

You need:

1. A GitHub account.
2. A hosting account, such as Render or Railway.
3. API keys for the AI companies you want to connect.

You can publish with just one AI key first. You do not need all four on day one.

## Files That Matter

- `package.json`: tells the host how to start the app.
- `server.js`: runs the app and calls the real AIs.
- `.env.example`: shows which private keys are needed.
- `render.yaml`: optional Render setup file.

## Simple Render Steps

1. Put this folder on GitHub.
2. Go to Render.
3. Create a new Web Service.
4. Choose the GitHub repo for this app.
5. Use these settings:

```txt
Runtime: Node
Build Command: leave blank
Start Command: node server.js
```

6. Add environment variables from `.env.example`.
7. Press Deploy.

## Environment Variables To Add

Add these in the hosting service dashboard, not in the public website:

```txt
OPENAI_API_KEY
OPENAI_MODEL
GEMINI_API_KEY
GEMINI_MODEL
XAI_API_KEY
XAI_MODEL
ANTHROPIC_API_KEY
ANTHROPIC_MODEL
```

## Important

Do not publish your real `.env` file.

The `.gitignore` file now blocks `.env` so your private keys do not get uploaded by accident.
