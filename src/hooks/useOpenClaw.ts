import { useCallback } from "react";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { useNodStore } from "../store/nodStore";

const BOX_URL = "http://192.168.1.180:8766";

function isTauri(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

async function httpPost(path: string, body: Record<string, unknown>) {
  const url = `${BOX_URL}${path}`;

  const opts: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };

  if (isTauri()) {
    const response = await tauriFetch(url, opts);
    return { ok: response.ok, data: await response.json() };
  }

  const response = await globalThis.fetch(url, opts);
  return { ok: response.ok, data: await response.json() };
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
        const result = await httpPost("/pair", { code });

        if (!result.ok) {
          return { success: false, error: "Appareil inaccessible" };
        }

        const data = result.data as { success: boolean; token?: string; error?: string };

        if (data.success && data.token) {
          return {
            success: true,
            token: data.token,
            mDNS: "nodi",
            baseUrl: BOX_URL,
          };
        }

        return {
          success: false,
          error: data.error || "Code incorrect",
        };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Connexion impossible",
        };
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

        const data = result.data as { success: boolean; reply?: unknown };

        if (result.ok && data.success) {
          const reply = data.reply;
          const text =
            typeof reply === "string"
              ? reply
              : (reply as { message?: string; response?: string })?.message ||
                (reply as { message?: string; response?: string })?.response ||
                JSON.stringify(reply);
          addMessage({ text, sender: "ai" });
        } else {
          addMessage({
            text: "Impossible d'obtenir une réponse. Réessayez.",
            sender: "ai",
          });
          setStatus("error");
        }
      } catch (err) {
        setIsTyping(false);
        setStatus("error");
        addMessage({
          text: `Erreur de connexion: ${err instanceof Error ? err.message : "Erreur inconnue"}`,
          sender: "ai",
        });
      }
    },
    [config, addMessage, setIsTyping, setStatus],
  );

  return { sendPairingCode, sendMessage };
}
