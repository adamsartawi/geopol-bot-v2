import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4";
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

// ── Gemini API types ─────────────────────────────────────────────────────────

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

interface GeminiCandidate {
  content: GeminiContent;
  finishReason: string;
  index: number;
}

interface GeminiResponse {
  candidates: GeminiCandidate[];
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractText(content: MessageContent | MessageContent[]): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map(p => (typeof p === "string" ? p : p.type === "text" ? p.text : ""))
      .join("\n");
  }
  if (content.type === "text") return content.text;
  return "";
}

/**
 * Convert OpenAI-style messages to Gemini contents + system instruction.
 * Gemini uses role "user" | "model" and requires alternating turns.
 */
function toGeminiContents(messages: Message[]): {
  systemInstruction?: { parts: GeminiPart[] };
  contents: GeminiContent[];
} {
  let systemInstruction: { parts: GeminiPart[] } | undefined;
  const contents: GeminiContent[] = [];

  for (const msg of messages) {
    const text = extractText(msg.content);

    if (msg.role === "system") {
      // Gemini handles system prompts via systemInstruction
      systemInstruction = { parts: [{ text }] };
      continue;
    }

    const geminiRole: "user" | "model" =
      msg.role === "assistant" ? "model" : "user";

    // Merge consecutive same-role messages (Gemini requires alternating)
    const last = contents[contents.length - 1];
    if (last && last.role === geminiRole) {
      last.parts.push({ text });
    } else {
      contents.push({ role: geminiRole, parts: [{ text }] });
    }
  }

  // Gemini requires the last message to be from "user"
  if (contents.length === 0 || contents[contents.length - 1].role !== "user") {
    contents.push({ role: "user", parts: [{ text: "Continue." }] });
  }

  return { systemInstruction, contents };
}

// ── Main invokeLLM ────────────────────────────────────────────────────────────

const GEMINI_MODEL = "gemini-2.0-flash";

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  const apiKey = ENV.geminiApiKey;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const { messages, responseFormat, response_format, outputSchema, output_schema } = params;
  const { systemInstruction, contents } = toGeminiContents(messages);

  // Build generation config
  const generationConfig: Record<string, unknown> = {
    maxOutputTokens: params.maxTokens ?? params.max_tokens ?? 8192,
    temperature: 0.7,
  };

  // Handle JSON output
  const fmt = responseFormat ?? response_format;
  const schema = outputSchema ?? output_schema;
  if (fmt?.type === "json_object" || fmt?.type === "json_schema" || schema) {
    generationConfig.responseMimeType = "application/json";
    if (schema?.schema) {
      generationConfig.responseSchema = schema.schema;
    } else if (fmt?.type === "json_schema" && (fmt as { type: string; json_schema: JsonSchema }).json_schema?.schema) {
      generationConfig.responseSchema = (fmt as { type: string; json_schema: JsonSchema }).json_schema.schema;
    }
  }

  const body: Record<string, unknown> = {
    contents,
    generationConfig,
  };

  if (systemInstruction) {
    body.systemInstruction = systemInstruction;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Gemini API failed: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  const geminiRes = (await response.json()) as GeminiResponse;

  // Normalise to OpenAI-compatible InvokeResult
  const candidate = geminiRes.candidates?.[0];
  const text = candidate?.content?.parts?.map(p => p.text ?? "").join("") ?? "";

  return {
    id: `gemini-${Date.now()}`,
    created: Math.floor(Date.now() / 1000),
    model: GEMINI_MODEL,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: text,
        },
        finish_reason: candidate?.finishReason ?? "stop",
      },
    ],
    usage: geminiRes.usageMetadata
      ? {
          prompt_tokens: geminiRes.usageMetadata.promptTokenCount,
          completion_tokens: geminiRes.usageMetadata.candidatesTokenCount,
          total_tokens: geminiRes.usageMetadata.totalTokenCount,
        }
      : undefined,
  };
}
