import { useCallback } from "react";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { useNodStore } from "../store/nodStore";

const BOX_URL = "http://192.168.1.180:8766";
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

export function useOpenClaw() {
  const { config, addMessage, setStatus, setIsTyping } = useNodStore();

  const sendPairingCode = useCallback(
    async (
      code: string,
    ): Promise<{
      success: boolean;
      token?: string;
      baseUrl?: string;
      error?: string;
    }> => {
      try {
        const result = await httpPost("/pair", { code });

        if (!result.ok) {
          return { success: false, error: "Invalid code or device unreachable" };
        }

        try {
          const parsed = JSON.parse(result.data);
          return { success: true, token: parsed.token, baseUrl: BOX_URL };
        } catch {
          return { success: true, token: result.data, baseUrl: BOX_URL };
        }
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
        const result = await httpPost("/message", {
          token: config.token,
          message: text,
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
