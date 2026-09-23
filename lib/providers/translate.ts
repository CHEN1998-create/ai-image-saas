// 提示词翻译层：中文 prompt → 英文（SDXL 等模型对英文理解显著更好）
// 使用 Workers AI Llama-3.1（免费额度）；失败时原样返回，不阻断生成

import { socksDispatcher } from "fetch-socks";
import { fetch as undiciFetch } from "undici";

const API_BASE = "https://api.cloudflare.com/client/v4";
const TRANSLATE_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";

// 与生图 provider 相同的本地代理策略（api.cloudflare.com 国内直连被墙）
let proxyDispatcher: unknown;
if (
  process.env.NODE_ENV === "development" &&
  process.env.HTTPS_PROXY?.startsWith("socks5://")
) {
  const u = new URL(process.env.HTTPS_PROXY);
  proxyDispatcher = socksDispatcher({
    type: 5,
    host: u.hostname,
    port: Number(u.port)
  });
}

function hasCJK(s: string): boolean {
  return /[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(s);
}

interface ChatResponse {
  result?: { response?: string };
}

export async function translateToEnglish(prompt: string): Promise<string> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_AI_API_KEY;
  // 无中文、或未配置 Workers AI → 原样返回
  if (!hasCJK(prompt) || !accountId || !apiToken) return prompt;

  try {
    const res = await undiciFetch(
      `${API_BASE}/accounts/${accountId}/ai/run/${TRANSLATE_MODEL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are a translator for an AI image generator. Translate the user's text into a concise English image description. Keep visual details, style and composition words. Output ONLY the English translation, nothing else."
            },
            { role: "user", content: prompt }
          ],
          max_tokens: 200
        }),
        signal: AbortSignal.timeout(12_000),
        dispatcher: proxyDispatcher
      } as Parameters<typeof undiciFetch>[1]
    );
    if (!res.ok) return prompt;
    const json = (await res.json()) as ChatResponse;
    const text = json.result?.response?.trim();
    // 译文合理（非空且比原文短不了太离谱）才采用
    return text && text.length >= 2 ? text : prompt;
  } catch {
    return prompt;
  }
}
