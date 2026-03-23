const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const PRIMARY_MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash";
const FALLBACK_MODELS =
  import.meta.env.VITE_GEMINI_FALLBACK_MODELS || "gemini-2.5-flash,gemini-2.0-flash,gemini-2.0-flash-lite";

const SYSTEM_PROMPT =
  "You are the AI assistant for a college admissions portal. Always answer in 1-2 short sentences and keep it concise. Prioritize DATABASE_CONTEXT for factual values. If exact value is missing, provide the closest available backend summary and ask for application ID if needed.";

const toGeminiRole = (role) => (role === "assistant" ? "model" : "user");

const buildHistoryContents = (history = []) =>
  history
    .filter((message) => Boolean(message?.content))
    .slice(-8)
    .map((message) => ({
      role: toGeminiRole(message.role),
      parts: [{ text: String(message.content) }],
    }));

const parseModelList = (value = "") =>
  String(value)
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);

const getCandidateModels = () => {
  const seen = new Set();
  const models = [PRIMARY_MODEL, ...parseModelList(FALLBACK_MODELS)].filter((model) => {
    if (seen.has(model)) {
      return false;
    }
    seen.add(model);
    return true;
  });

  return models.length ? models : ["gemini-2.5-flash"];
};

const createError = (message, details = {}) => {
  const error = new Error(message);
  Object.assign(error, details);
  return error;
};

const buildGeminiUrl = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

const buildPromptText = ({ question, context }) =>
  [
    "DATABASE_CONTEXT:",
    context || "No backend snapshot available.",
    "",
    "QUESTION:",
    question,
    "",
    "Return a concise answer only. Do not say 'Not available in current backend data'.",
  ].join("\n");

const compactAnswer = (answer) => {
  const normalized = String(answer || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return "";
  }

  const sentences = normalized.match(/[^.!?]+[.!?]?/g) || [];
  const firstTwo = sentences
    .slice(0, 2)
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");

  const compact = firstTwo || normalized;
  const sanitized = compact
    .replace(/not available in current backend data\.?/gi, "")
    .replace(/not available in current backend\.?/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const finalText = sanitized || "I could not match that exactly. Share an application ID for a precise backend answer.";
  if (finalText.length <= 220) {
    return finalText;
  }

  return `${finalText.slice(0, 217).trim()}...`;
};

const requestModel = async ({ model, question, history, context }) => {
  const response = await fetch(`${buildGeminiUrl(model)}?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        ...buildHistoryContents(history),
        {
          role: "user",
          parts: [{ text: buildPromptText({ question, context }) }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 140,
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));
  const apiMessage =
    payload?.error?.message || payload?.promptFeedback?.blockReason || "Gemini request failed.";

  if (!response.ok) {
    throw createError(apiMessage, {
      status: response.status,
      model,
    });
  }

  const answer = payload?.candidates?.[0]?.content?.parts
    ?.map((part) => part?.text || "")
    .join("\n")
    .trim();

  if (!answer) {
    const blockReason = payload?.promptFeedback?.blockReason;
    if (blockReason) {
      throw createError(`Response blocked: ${blockReason}.`, { status: 400, model });
    }
    throw createError("No answer was returned.", { status: 500, model });
  }

  return compactAnswer(answer);
};

const shouldTryNextModel = (error) =>
  error?.status === 404 ||
  /not found/i.test(error?.message || "") ||
  /unsupported/i.test(error?.message || "") ||
  /limit:\s*0/i.test(error?.message || "");

const simplifyGeminiError = (error, attemptedModels) => {
  const message = String(error?.message || "Gemini request failed.");
  const status = error?.status;

  if (/reported as leaked/i.test(message)) {
    return "This Gemini API key is blocked as leaked. Generate a new key in AI Studio and update VITE_GEMINI_API_KEY.";
  }

  if (status === 429 && /limit:\s*0/i.test(message)) {
    return `Gemini quota for this project is 0 for ${attemptedModels.join(", ")}. In Google AI Studio, use a project with active plan (free in eligible regions or paid with billing), then create a new API key and update .env.`;
  }

  if (status === 429) {
    const retryMatch = message.match(/retry in ([\d.]+)s/i);
    if (retryMatch) {
      return `Rate limit hit. Retry in about ${Math.ceil(Number(retryMatch[1]))} seconds.`;
    }
    return "Rate limit exceeded for Gemini API. Reduce request frequency or increase project quota.";
  }

  if (status === 400 && /free tier is not available/i.test(message)) {
    return "Free tier is unavailable for this project/location. Enable billing for the Gemini API project in AI Studio.";
  }

  if (status === 403) {
    return "Gemini API key permission denied. Verify the key belongs to the correct AI Studio project and Gemini API access is enabled.";
  }

  return message;
};

export const askAssistant = async ({ question, history = [], context = "" }) => {
  const trimmedQuestion = String(question || "").trim();

  if (!trimmedQuestion) {
    throw new Error("Question is required.");
  }

  if (!GEMINI_API_KEY) {
    throw new Error("Gemini key is missing. Set VITE_GEMINI_API_KEY in your .env file.");
  }

  const models = getCandidateModels();
  let lastError = null;

  for (let i = 0; i < models.length; i += 1) {
    const model = models[i];
    try {
      return await requestModel({
        model,
        question: trimmedQuestion,
        history,
        context,
      });
    } catch (error) {
      lastError = error;
      if (!shouldTryNextModel(error) || i === models.length - 1) {
        break;
      }
    }
  }

  throw createError(simplifyGeminiError(lastError, models), {
    status: lastError?.status,
  });
};
