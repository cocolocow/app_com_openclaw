import { useCallback } from "react";
import { useNodStore, type SoulInfo } from "../store/nodStore";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS  = 120_000;
const PROVISION_URL    = "https://unbnd-server-production.up.railway.app";

function getBoxUrl(baseUrl: string): string {
  if (baseUrl.startsWith("http")) return baseUrl;
  return `http://${baseUrl}:8766`;
}

async function httpPost(baseUrl: string, path: string, body: Record<string, unknown>) {
  const url = `${getBoxUrl(baseUrl)}${path}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { ok: r.ok, data: await r.json() };
}

async function tryReconnect(boxId: string, reconnectToken: string): Promise<string | null> {
  try {
    const url = `${PROVISION_URL}/reconnect/${boxId}`;
    const r = await fetch(url, { headers: { "X-Reconnect-Token": reconnectToken } });
    if (!r.ok) return null;
    const data = (await r.json()) as { url?: string };
    return data.url || null;
  } catch {
    return null;
  }
}

async function fetchSoulFromNodi(baseUrl: string, token: string): Promise<SoulInfo | null> {
  try {
    const url = `${getBoxUrl(baseUrl)}/soul`;
    const r = await fetch(url, { headers: { "X-Session-Token": token } });
    if (!r.ok) return null;
    const data = (await r.json()) as { soul?: SoulInfo | null };
    return data.soul || null;
  } catch {
    return null;
  }
}

export function useOpenClaw() {
  const { config, setConfig, addMessage, setStatus, setIsTyping, setActiveSoul } = useNodStore();

  const testConnection = useCallback(async (baseUrl: string): Promise<boolean> => {
    try {
      const url = `${getBoxUrl(baseUrl)}/status`;
      const r = await fetch(url);
      const data = await r.json() as { online?: boolean };
      return data.online === true;
    } catch {
      return false;
    }
  }, []);

  const sendPairingCode = useCallback(
    async (code: string, baseUrl: string): Promise<{
      success: boolean;
      token?: string;
      pending?: boolean;
      pendingId?: string;
      error?: string;
    }> => {
      try {
        const result = await httpPost(baseUrl, "/pair", { code });
        if (!result.ok) return { success: false, error: "Appareil inaccessible" };

        const data = result.data as {
          success: boolean;
          pending?: boolean;
          pendingId?: string;
          token?: string;
          error?: string;
        };

        if (!data.success) return { success: false, error: data.error || "Code incorrect" };

        if (data.pending && data.pendingId) {
          return { success: true, pending: true, pendingId: data.pendingId };
        }

        return { success: true, token: data.token };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Connexion impossible" };
      }
    },
    []
  );

  const pollConfirmation = useCallback(
    async (pendingId: string, baseUrl: string): Promise<{
      status: "confirmed" | "waiting" | "rejected" | "expired" | "error";
      token?: string;
      boxId?: string;
      reconnectToken?: string;
    }> => {
      const started = Date.now();
      while (Date.now() - started < POLL_TIMEOUT_MS) {
        try {
          const result = await httpPost(baseUrl, "/poll", { pendingId });
          const data = result.data as { status: string; token?: string; boxId?: string; reconnectToken?: string };
          if (data.status === "confirmed" && data.token) return { status: "confirmed", token: data.token, boxId: data.boxId, reconnectToken: data.reconnectToken };
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

      const attempt = async (baseUrl: string) => {
        return httpPost(baseUrl, "/message", {
          token: config.token,
          message: text,
        });
      };

      try {
        let result = await attempt(config.baseUrl);

        // Auto-reconnect : si la requête échoue et qu'on a un reconnectToken
        if (!result.ok && config.boxId && config.reconnectToken) {
          const newUrl = await tryReconnect(config.boxId, config.reconnectToken);
          if (newUrl && newUrl !== config.baseUrl) {
            setConfig({ ...config, baseUrl: newUrl });
            result = await attempt(newUrl);
          }
        }

        setStatus("connected");
        setIsTyping(false);
        const data = result.data as { success: boolean; reply?: unknown };
        if (result.ok && data.success) {
          const reply = data.reply;
          const replyText =
            typeof reply === "string" ? reply
            : (reply as { message?: string })?.message
            || (reply as { response?: string })?.response
            || JSON.stringify(reply);
          addMessage({ text: replyText, sender: "ai" });
        } else {
          addMessage({ text: "Impossible d'obtenir une réponse. Réessayez.", sender: "ai" });
          setStatus("error");
        }
      } catch (err) {
        // Tentative de reconnexion sur erreur réseau
        if (config.boxId && config.reconnectToken) {
          try {
            const newUrl = await tryReconnect(config.boxId, config.reconnectToken);
            if (newUrl && newUrl !== config.baseUrl) {
              setConfig({ ...config, baseUrl: newUrl });
              const result = await attempt(newUrl);
              setStatus("connected");
              setIsTyping(false);
              const data = result.data as { success: boolean; reply?: unknown };
              if (result.ok && data.success) {
                const reply = data.reply;
                const replyText =
                  typeof reply === "string" ? reply
                  : (reply as { message?: string })?.message
                  || (reply as { response?: string })?.response
                  || JSON.stringify(reply);
                addMessage({ text: replyText, sender: "ai" });
                return;
              }
            }
          } catch { /* fallthrough */ }
        }
        setIsTyping(false);
        setStatus("error");
        addMessage({ text: `Erreur: ${err instanceof Error ? err.message : "Inconnue"}`, sender: "ai" });
      }
    },
    [config, setConfig, addMessage, setIsTyping, setStatus]
  );

  const syncSoul = useCallback(async () => {
    if (!config) return;
    const soul = await fetchSoulFromNodi(config.baseUrl, config.token);
    setActiveSoul(soul);
  }, [config, setActiveSoul]);

  return { testConnection, sendPairingCode, pollConfirmation, sendMessage, syncSoul };
}
