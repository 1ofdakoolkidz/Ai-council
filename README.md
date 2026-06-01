# AI Council App Builder

This is an app starter for your idea:

> Type an app idea once. ChatGPT, Gemini, Grok, and Claude each give advice. The app shows the combined answer.

Think of it like four AI advisors sitting at one table.

## What you see now

The main page is a guided graphic interface. It has:

- a big box for your app idea
- simple cards for ChatGPT, Gemini, Grok, and Claude
- direct "Get key" buttons for each AI company
- a copy-ready key template
- a results area where the final app plan appears

## If you do not know code

That is okay. The setup still has a few annoying steps, but you do not need to understand programming to do them.

The only thing you are really doing is:

1. Getting four passwords from four AI companies.
2. Pasting those passwords into one file called `.env`.
3. Starting the app.

The web page now has a "No-Code Setup Helper" section with the links and copy-ready template.

## How to run it

Open `index.html` directly for demo mode.

To use the real AIs, run the local backend:

```powershell
node server.js
```

Then open:

```txt
http://localhost:8787
```

## How to publish it

Read [DEPLOY.md](DEPLOY.md).

Plain English version:

1. Put this folder on GitHub.
2. Connect the GitHub project to a Node.js host like Render or Railway.
3. Add your API keys in the host's environment variable screen.
4. Deploy.

Do not upload your real `.env` file.

## How to connect the real AIs

Create a file named `.env` in this folder.

Add your API keys and the model names you want to use:

```txt
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=your_openai_model

GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=your_gemini_model

XAI_API_KEY=your_xai_key
XAI_MODEL=your_grok_model

ANTHROPIC_API_KEY=your_anthropic_key
ANTHROPIC_MODEL=your_claude_model
```

Restart `node server.js` after editing `.env`.

## How to get the API keys

You have to make these keys yourself because they are tied to your own accounts and billing.

### ChatGPT / OpenAI

1. Go to the OpenAI API keys page:
   `https://platform.openai.com/api-keys`
2. Sign in.
3. Create a new secret key.
4. Copy it right away. OpenAI only shows the full key when you create it.
5. Paste it into `.env`:

```txt
OPENAI_API_KEY=paste_key_here
OPENAI_MODEL=gpt-5-mini
```

### Gemini / Google

1. Go to Google AI Studio API keys:
   `https://aistudio.google.com/app/apikey`
2. Sign in with Google.
3. Create an API key.
4. Copy the key.
5. Paste it into `.env`:

```txt
GEMINI_API_KEY=paste_key_here
GEMINI_MODEL=gemini-2.5-flash
```

### Grok / xAI

1. Go to the xAI Console:
   `https://console.x.ai`
2. Sign in or create an xAI account.
3. Add credits/billing if xAI asks for it.
4. Create an API key from the API Keys page.
5. Paste it into `.env`:

```txt
XAI_API_KEY=paste_key_here
XAI_MODEL=grok-4.20
```

### Claude / Anthropic

1. Go to the Anthropic Console:
   `https://console.anthropic.com`
2. Sign in.
3. Find API Keys in settings.
4. Create a key.
5. Copy it and paste it into `.env`:

```txt
ANTHROPIC_API_KEY=paste_key_here
ANTHROPIC_MODEL=claude-sonnet-4-5
```

## What I can and cannot do for you

I can:

- Build the app.
- Show exactly where the keys go.
- Make the backend use the keys.
- Help fix errors when a provider rejects a key or model name.

I cannot:

- Create accounts for you.
- See your private API keys.
- Add payment methods for you.
- Promise the example model names will always be available on your account.

## What each file does

- `index.html`: the page you see.
- `styles.css`: how the page looks.
- `app.js`: the button logic.
- `server.js`: the real AI caller.

## Important

Never put API keys in `app.js` or `index.html`.

API keys belong in `.env`, because `.env` is read only by the backend.

## Next upgrade

Right now the backend asks each AI separately and shows their answers.

The next best upgrade is a final “judge” step:

1. Ask ChatGPT.
2. Ask Gemini.
3. Ask Grok.
4. Ask Claude.
5. Send all four answers to one final model.
6. Ask it to make one clean build plan.
