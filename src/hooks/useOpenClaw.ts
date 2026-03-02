import { useCallback } from "react";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { useNodStore } from "../store/nodStore";

const BOX_URL = "http://192.168.0.28";
const SETUP_TOKEN = "nodi-setup";

function isTauri(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

async function httpPost(path: string, body: Record<string, unknown>) {
  const url = isTauri() ? `${BOX_URL}${path}` : path;

  const opts: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };

  if (isTauri()) {
    const response = await tauriFetch(url, opts);
    return { ok: response.ok, data: await response.text() };
  }

  const response = await globalThis.fetch(url, opts);
  return { ok: response.ok, data: await response.text() };
}

function parseTokenFromResponse(text: string): { token?: string; mDNS?: string } {
  // Parse "✅ Paired ! Token: xxx mDNS: yyy" or similar
  const tokenMatch = text.match(/Token:\s*(\S+)/i);
  const mdnsMatch = text.match(/mDNS:\s*(\S+)/i);
  return {
    token: tokenMatch?.[1],
    mDNS: mdnsMatch?.[1],
  };
}

export function useOpenClaw() {
  const { config, addMessage, setStatus, setIsTyping } = useNodStore();

  const sendPairingCode = useCallback(
    async (
      code: string,
    ): Promise<{
      success: boolean;
      token?: string;
      mDNS?: string;
      baseUrl?: string;
      error?: string;
    }> => {
      try {
        const result = await httpPost("/hooks/agent", {
          message: `PAIRING ${code}`,
          name: "nod-setup",
          agentId: "main",
          token: SETUP_TOKEN,
        });

        if (!result.ok) {
          return { success: false, error: "Device unreachable" };
        }

        const parsed = parseTokenFromResponse(result.data);
        if (parsed.token) {
          return {
            success: true,
            token: parsed.token,
            mDNS: parsed.mDNS,
            baseUrl: BOX_URL,
          };
        }

        return {
          success: false,
          error: result.data || "Invalid code",
        };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Connection failed",
        };
      }
    },
    [],
  );

  const testConnection = useCallback(
    async (baseUrl: string, token: string) => {
      try {
        const result = await httpPost("/hooks/wake", { token });
        return result.ok;
      } catch {
        return false;
      }
    },
    [],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!config) return;

      addMessage({ text, sender: "user" });
      setIsTyping(true);
      setStatus("connecting");

      try {
        const result = await httpPost("/hooks/agent", {
          token: config.token,
          text,
        });

        setStatus("connected");
        setIsTyping(false);

        if (result.ok) {
          try {
            const parsed = JSON.parse(result.data);
            addMessage({
              text: parsed.message || parsed.response || result.data,
              sender: "ai",
            });
          } catch {
            addMessage({ text: result.data, sender: "ai" });
          }
        } else {
          addMessage({
            text: "Failed to get a response. Please try again.",
            sender: "ai",
          });
          setStatus("error");
        }
      } catch (err) {
        setIsTyping(false);
        setStatus("error");
        addMessage({
          text: `Connection error: ${err instanceof Error ? err.message : "Unknown error"}`,
          sender: "ai",
        });
      }
    },
    [config, addMessage, setIsTyping, setStatus],
  );

  return { sendPairingCode, testConnection, sendMessage };
}
