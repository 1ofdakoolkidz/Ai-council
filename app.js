const models = [
  {
    name: "ChatGPT",
    provider: "OpenAI",
    initials: "CG",
    keyUrl: "https://platform.openai.com/api-keys",
    weight: 1,
    lens: "Good for turning ideas into clear build plans.",
  },
  {
    name: "Gemini",
    provider: "Google",
    initials: "GE",
    keyUrl: "https://aistudio.google.com/app/apikey",
    weight: 1,
    lens: "Good for research, structure, and big-picture thinking.",
  },
  {
    name: "Grok",
    provider: "xAI",
    initials: "GR",
    keyUrl: "https://console.x.ai",
    weight: 1,
    lens: "Good for challenging assumptions and spotting weak points.",
  },
  {
    name: "Claude",
    provider: "Anthropic",
    initials: "CL",
    keyUrl: "https://console.anthropic.com",
    weight: 1,
    lens: "Good for careful requirements and long explanations.",
  },
];

const exampleBrief =
  "Build a web app where a founder describes an app idea, then ChatGPT, Gemini, Grok, and Claude independently analyze it. The app should compare their recommendations, expose disagreements, synthesize a consensus product spec, and generate a prioritized build plan.";

const modelList = document.querySelector("#modelList");
const briefInput = document.querySelector("#briefInput");
const results = document.querySelector("#results");
const statusBadge = document.querySelector("#statusBadge");
const agreementLevel = document.querySelector("#agreementLevel");
const riskDepth = document.querySelector("#riskDepth");
const includeTickets = document.querySelector("#includeTickets");
const includeQuestions = document.querySelector("#includeQuestions");
const envTemplate = document.querySelector("#envTemplate");
let providerStatus = {};

function renderModels() {
  modelList.innerHTML = models
    .map(
      (model) => {
        const status = providerStatus[model.id];
        const statusText = status === true ? "Connected" : status === false ? "Needs key" : "Not checked";
        const statusClass = status === true ? "connected" : status === false ? "missing" : "";

        return `
        <article class="model-card">
          <span class="model-mark">${model.initials}</span>
          <div>
            <strong>${model.name}</strong>
            <p>${model.provider}: ${model.lens}</p>
          </div>
          <div class="model-actions">
            <span class="connection-badge ${statusClass}">${statusText}</span>
            <a class="key-link" href="${model.keyUrl}" target="_blank" rel="noreferrer">Get key</a>
          </div>
        </article>
      `;
      },
    )
    .join("");
}

async function loadProviderStatus() {
  try {
    const response = await fetch("/api/status");
    if (!response.ok) return;

    const data = await response.json();
    providerStatus = Object.fromEntries(data.providers.map((provider) => [provider.id, provider.connected]));
    renderModels();
  } catch {
    renderModels();
  }
}

function setPhase(phaseName) {
  document.querySelectorAll(".map-step").forEach((card) => {
    card.classList.toggle("active", card.dataset.phase === phaseName);
  });
}

async function copyText(text) {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const helper = document.createElement("textarea");
  helper.value = text;
  helper.setAttribute("readonly", "");
  helper.style.position = "fixed";
  helper.style.left = "-9999px";
  document.body.appendChild(helper);
  helper.select();
  document.execCommand("copy");
  helper.remove();
}

function analyzeBrief(brief) {
  const normalized = brief.toLowerCase();
  const wantsCode = /code|build|app|website|software|prototype/.test(normalized);
  const wantsAi = /ai|model|chatgpt|gemini|grok|claude|consensus/.test(normalized);
  const hasUsers = /user|customer|founder|developer|team/.test(normalized);

  return {
    appType: wantsCode ? "AI-assisted app creation platform" : "product planning platform",
    coreUser: hasUsers ? "builders and product teams" : "solo founders and app makers",
    needsAi: wantsAi,
  };
}

function createModelOpinion(model, brief, analysis) {
  const sharedStrengths = [
    "Independent model passes reduce single-model blind spots.",
    "A visible disagreement layer makes the final plan more trustworthy.",
    "Structured prompts are more reliable than open-ended chat transcripts.",
  ];

  const risks = [
    "Provider APIs can disagree because each model sees different context windows, policies, and training priors.",
    "API keys must live on the server, never in browser code.",
    "Consensus can hide a novel minority insight if the scoring rules are too rigid.",
    "Costs and latency grow quickly when every request fans out to multiple providers.",
  ];

  const recommendations = {
    ChatGPT: [
      "Start with a strict JSON schema for model responses.",
      "Separate product spec generation from code generation.",
      "Add traceable acceptance criteria for every generated ticket.",
    ],
    Gemini: [
      "Support file, image, and diagram inputs once the text workflow is stable.",
      "Keep a source map linking each final recommendation back to model comments.",
      "Use a research pass for market, docs, and technical constraints.",
    ],
    Grok: [
      "Force one model to argue against the consensus before final synthesis.",
      "Expose confidence and dissent instead of presenting a fake single truth.",
      "Add cost controls so users can choose fast, balanced, or exhaustive mode.",
    ],
    Claude: [
      "Use a requirements-review pass before generating any code.",
      "Detect vague briefs and ask focused clarification questions.",
      "Preserve long-form reasoning artifacts for later product decisions.",
    ],
  };

  return {
    model: model.name,
    focus: model.lens,
    summary: `${model.name} would frame this as a ${analysis.appType} for ${analysis.coreUser}.`,
    strengths: sharedStrengths.slice(0, 2),
    risks: risks.slice(0, Number(riskDepth.value)),
    recommendations: recommendations[model.name],
    confidence: analysis.needsAi ? "High" : "Medium",
    briefLength: brief.length,
  };
}

async function runRealCouncil(brief) {
  const response = await fetch("/api/council", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      brief,
      settings: {
        agreementLevel: agreementLevel.value,
        riskDepth: Number(riskDepth.value),
        includeTickets: includeTickets.checked,
        includeQuestions: includeQuestions.checked,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Backend returned ${response.status}`);
  }

  return response.json();
}

function synthesizeConsensus(opinions) {
  const agreement = agreementLevel.value;
  const recurringRecommendations = [
    "Use an orchestrator backend that calls each AI provider independently.",
    "Require every model to return the same structured fields: assumptions, architecture, risks, feature plan, tests, and open questions.",
    "Run a critique round where each model reviews the combined anonymous proposals.",
    "Use a final synthesis step that preserves dissent instead of flattening everything into bland agreement.",
    "Turn the final spec into build tickets with acceptance criteria and test notes.",
  ];

  const tickets = [
    "Create provider adapter interface for OpenAI, Google Gemini, xAI Grok, and Anthropic Claude.",
    "Build council-run endpoint that starts independent analysis jobs in parallel.",
    "Store raw responses, scores, objections, and consensus output.",
    "Design comparison UI with tabs for each model and a final consensus view.",
    "Add export options for product spec, task list, and implementation prompt.",
  ];

  const questions = [
    "Should the app generate runnable code directly, or stop at a detailed build plan first?",
    "Will users bring their own API keys, or will the app bill usage centrally?",
    "Which providers are mandatory for launch, and which can be added after the core workflow works?",
  ];

  const modelLines = opinions
    .map(
      (opinion) =>
        `${opinion.model}: ${opinion.summary}\n  Focus: ${opinion.focus}\n  Confidence: ${opinion.confidence}\n  Top recommendations: ${opinion.recommendations.join("; ")}`,
    )
    .join("\n\n");

  let output = `Consensus mode: ${agreement}\n\n`;
  output += `Model opinions\n${modelLines}\n\n`;
  output += `Shared product direction\n${recurringRecommendations.map((item) => `- ${item}`).join("\n")}\n\n`;
  output += `Recommended architecture\n`;
  output += `- Frontend: app brief editor, council progress timeline, model comparison, consensus report, export controls.\n`;
  output += `- Backend: provider adapters, prompt templates, job queue, response normalizer, scoring and synthesis service.\n`;
  output += `- Data: users, council runs, provider responses, critiques, consensus reports, generated tickets.\n`;
  output += `- Safety: server-side keys, rate limits, audit logs, model output validation, clear disclosure that consensus is advisory.\n\n`;

  if (includeTickets.checked) {
    output += `Build tickets\n${tickets.map((item, index) => `${index + 1}. ${item}`).join("\n")}\n\n`;
  }

  if (includeQuestions.checked) {
    output += `Open questions\n${questions.map((item) => `- ${item}`).join("\n")}\n\n`;
  }

  output += `Next best step\nBuild the backend orchestrator first, even if it initially uses mock providers. Once the data shape is stable, replace each mock with a real provider adapter.`;
  return output;
}

async function runCouncil() {
  const brief = briefInput.value.trim();
  if (!brief) {
    results.classList.add("empty-state");
    results.textContent = "Add an app idea first, then run the council.";
    statusBadge.textContent = "Needs brief";
    return;
  }

  statusBadge.textContent = "Thinking";
  results.classList.remove("empty-state");
  results.textContent = "Asking the council...";

  const phases = ["independent", "critique", "consensus", "build"];
  for (const phase of phases) {
    setPhase(phase);
    await new Promise((resolve) => setTimeout(resolve, 360));
  }

  try {
    const realCouncil = await runRealCouncil(brief);
    if (realCouncil.mode === "real" || realCouncil.mode === "setup-needed") {
      results.textContent = realCouncil.report;
      statusBadge.textContent = realCouncil.mode === "real" ? "Real AIs" : "Setup";
      return;
    }
  } catch (error) {
    console.info("Real backend unavailable, using local demo mode.", error);
  }

  const analysis = analyzeBrief(brief);
  const opinions = models.map((model) => createModelOpinion(model, brief, analysis));
  results.textContent = `${synthesizeConsensus(opinions)}\n\nNote\nThis is demo mode. To use the real AIs, run the backend in README.md and add provider API keys.`;
  statusBadge.textContent = "Demo";
}

document.querySelector("#runCouncil").addEventListener("click", runCouncil);
document.querySelector("#runCouncilBottom").addEventListener("click", runCouncil);
document.querySelector("#clearBrief").addEventListener("click", () => {
  briefInput.value = "";
  briefInput.focus();
});
document.querySelector("#loadExample").addEventListener("click", () => {
  briefInput.value = exampleBrief;
  briefInput.focus();
});
document.querySelector("#copyOutput").addEventListener("click", async () => {
  await copyText(results.textContent);
  statusBadge.textContent = "Copied";
  setTimeout(() => {
    statusBadge.textContent = results.classList.contains("empty-state") ? "Ready" : "Complete";
  }, 1200);
});
document.querySelector("#copyEnv").addEventListener("click", async () => {
  await copyText(envTemplate.textContent);
  statusBadge.textContent = "Template copied";
  setTimeout(() => {
    statusBadge.textContent = "Ready";
  }, 1400);
});

renderModels();
loadProviderStatus();
