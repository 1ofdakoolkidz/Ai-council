const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const port = Number(process.env.PORT || 8787);
const root = __dirname;

loadDotEnv();

const providers = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    enabled: () => Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL),
    call: callOpenAI,
  },
  {
    id: "gemini",
    name: "Gemini",
    enabled: () => Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_MODEL),
    call: callGemini,
  },
  {
    id: "grok",
    name: "Grok",
    enabled: () => Boolean(process.env.XAI_API_KEY && process.env.XAI_MODEL),
    call: callXAI,
  },
  {
    id: "claude",
    name: "Claude",
    enabled: () => Boolean(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_MODEL),
    call: callAnthropic,
  },
];

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/api/health") {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === "GET" && req.url === "/api/status") {
      sendJson(res, 200, {
        providers: providers.map((provider) => ({
          id: provider.id,
          name: provider.name,
          connected: provider.enabled(),
        })),
      });
      return;
    }

    if (req.method === "POST" && req.url === "/api/council") {
      const body = await readJson(req);
      const result = await runCouncil(body.brief || "", body.settings || {});
      sendJson(res, 200, result);
      return;
    }

    serveStatic(req, res);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Something went wrong." });
  }
});

server.listen(port, () => {
  console.log(`AI Council app running at http://localhost:${port}`);
});

async function runCouncil(brief, settings) {
  const activeProviders = providers.filter((provider) => provider.enabled());

  if (!activeProviders.length) {
    return {
      mode: "setup-needed",
      report: "No real AI keys are set yet. Add API keys and model names to .env, then restart the server.",
    };
  }

  const prompt = makeCouncilPrompt(brief, settings);
  const responses = await Promise.allSettled(
    activeProviders.map(async (provider) => ({
      provider: provider.name,
      text: await provider.call(prompt),
    })),
  );

  const successful = responses
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);

  const failed = responses
    .filter((result) => result.status === "rejected")
    .map((result, index) => `${activeProviders[index].name}: ${result.reason.message}`);

  if (!successful.length) {
    return {
      mode: "real",
      report: `The backend tried the real AIs, but none answered.\n\nProblems:\n${failed.join("\n")}`,
    };
  }

  let finalConsensus = "";
  const openAiProvider = providers.find((provider) => provider.id === "chatgpt" && provider.enabled());

  if (openAiProvider && successful.length > 1) {
    finalConsensus = await callOpenAI(makeFinalPrompt(successful));
  }

  const report = makeReport(successful, failed, finalConsensus);
  return { mode: "real", report };
}

function makeCouncilPrompt(brief, settings) {
  return [
    "You are one member of an AI council helping design an app.",
    "Explain plainly. Avoid hype.",
    "Give: best app idea, must-have features, risks, build steps, and questions.",
    `Consensus style: ${settings.agreementLevel || "majority"}.`,
    `Risk depth from 1 to 5: ${settings.riskDepth || 4}.`,
    "User's app idea:",
    brief,
  ].join("\n");
}

function makeFinalPrompt(successful) {
  return [
    "You are the final judge for an AI council.",
    "Combine these AI answers into one plain-English app build plan.",
    "Include: short summary, must-have features, risks, step-by-step build plan, and open questions.",
    "Do not pretend every AI agreed if they did not.",
    "",
    successful.map((item) => `## ${item.provider}\n${item.text}`).join("\n\n"),
  ].join("\n");
}

function makeReport(successful, failed, finalConsensus) {
  const sections = successful
    .map((item) => `## ${item.provider}\n${item.text.trim()}`)
    .join("\n\n");

  const combined = [
    "Real AI Council Results",
    "",
    "Each AI answered separately. When OpenAI is configured, ChatGPT also makes the final combined plan.",
    "",
  ];

  if (finalConsensus) {
    combined.push("## Final Combined Plan", finalConsensus.trim(), "");
  }

  combined.push(sections);

  if (failed.length) {
    combined.push("", "Provider problems", failed.map((item) => `- ${item}`).join("\n"));
  }

  return combined.join("\n");
}

async function callOpenAI(prompt) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL,
      input: prompt,
    }),
  });

  const data = await parseProviderResponse(response, "OpenAI");
  return data.output_text || collectText(data.output);
}

async function callGemini(prompt) {
  const model = encodeURIComponent(process.env.GEMINI_MODEL);
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    },
  );

  const data = await parseProviderResponse(response, "Gemini");
  return collectText(data.candidates?.[0]?.content?.parts);
}

async function callXAI(prompt) {
  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.XAI_MODEL,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await parseProviderResponse(response, "xAI");
  return data.choices?.[0]?.message?.content || "";
}

async function callAnthropic(prompt) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL,
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await parseProviderResponse(response, "Anthropic");
  return collectText(data.content);
}

async function parseProviderResponse(response, name) {
  const text = await response.text();
  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`${name} returned non-JSON: ${text.slice(0, 120)}`);
  }

  if (!response.ok) {
    throw new Error(`${name} error: ${JSON.stringify(data).slice(0, 240)}`);
  }

  return data;
}

function collectText(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(collectText).filter(Boolean).join("\n");
  if (typeof value.text === "string") return value.text;
  if (typeof value.content === "string") return value.content;
  if (Array.isArray(value.content)) return collectText(value.content);
  return "";
}

function serveStatic(req, res) {
  const requestPath = req.url === "/" ? "/index.html" : req.url;
  const filePath = path.normalize(path.join(root, requestPath.split("?")[0]));

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    res.writeHead(200, { "Content-Type": contentType(filePath) });
    res.end(content);
  });
}

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html";
  if (filePath.endsWith(".css")) return "text/css";
  if (filePath.endsWith(".js")) return "text/javascript";
  return "text/plain";
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request is too large."));
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON."));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function loadDotEnv() {
  const envPath = path.join(root, ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim().replace(/^"|"$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}
