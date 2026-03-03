import { useCallback } from "react";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { useNodStore } from "../store/nodStore";

const BOX_URL = "https://attempts-acquisitions-favorite-reveal.trycloudflare.com";
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS  = 120_000;

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
    const r = await tauriFetch(url, opts);
    return { ok: r.ok, data: await r.json() };
  }
  const r = await globalThis.fetch(url, opts);
  return { ok: r.ok, data: await r.json() };
}

export function useOpenClaw() {
  const { config, addMessage, setStatus, setIsTyping } = useNodStore();

  const sendPairingCode = useCallback(
    async (code: string): Promise<{
      success: boolean;
      token?: string;
      baseUrl?: string;
      error?: string;
      pending?: boolean;
      pendingId?: string;
      confirmUrl?: string;
    }> => {
      try {
        // Étape 1 — envoie le code
        const result = await httpPost("/pair", { code });
        if (!result.ok) return { success: false, error: "Appareil inaccessible" };

        const data = result.data as {
          success: boolean;
          pending?: boolean;
          pendingId?: string;
          message?: string;
          error?: string;
        };

        if (!data.success) {
          return { success: false, error: data.error || "Code incorrect" };
        }

        // Étape 2 — si confirmation physique requise, poll jusqu'à réponse
        if (data.pending && data.pendingId) {
          return {
            success: true,
            pending: true,
            pendingId: data.pendingId,
            confirmUrl: `${BOX_URL.replace("https://", "http://192.168.0.30")}/confirm`,
          };
        }

        // Pairing direct (sans confirmation)
        const d = result.data as { token?: string };
        return { success: true, token: d.token, baseUrl: BOX_URL };

      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Connexion impossible" };
      }
    },
    []
  );

  const pollConfirmation = useCallback(
    async (pendingId: string): Promise<{
      status: "confirmed" | "waiting" | "rejected" | "expired" | "error";
      token?: string;
    }> => {
      const started = Date.now();

      while (Date.now() - started < POLL_TIMEOUT_MS) {
        try {
          const result = await httpPost("/poll", { pendingId });
          const data = result.data as {
            status: string;
            token?: string;
          };

          if (data.status === "confirmed" && data.token) {
            return { status: "confirmed", token: data.token };
          }
          if (data.status === "rejected") return { status: "rejected" };
          if (data.status === "expired")  return { status: "expired" };

        } catch {
          return { status: "error" };
        }

        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      }

      return { status: "expired" };
    },
    []
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
          addMessage({ text: "Impossible d'obtenir une réponse. Réessayez.", sender: "ai" });
          setStatus("error");
        }
      } catch (err) {
        setIsTyping(false);
        setStatus("error");
        addMessage({
          text: `Erreur: ${err instanceof Error ? err.message : "Inconnue"}`,
          sender: "ai",
        });
      }
    },
    [config, addMessage, setIsTyping, setStatus]
  );

  return { sendPairingCode, pollConfirmation, sendMessage };
}
