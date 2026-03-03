import { useState, useCallback, useEffect, useRef } from "react";
import { useNodStore } from "../store/nodStore";
import { useOpenClaw } from "../hooks/useOpenClaw";

const PROVISION_URL = "https://unbnd-server-production.up.railway.app";

type Step = "code" | "waiting" | "confirmed" | "rejected" | "expired";

export function Onboarding() {
  const [step, setStep]               = useState<Step>("code");
  const [pairingCode, setPairingCode] = useState("");
  const [error, setError]             = useState("");
  const [pendingId, setPendingId]     = useState("");
  const [boxUrl, setBoxUrl]           = useState("");
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [pairing, setPairing]         = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { setConfig } = useNodStore();
  const { sendPairingCode, pollConfirmation } = useOpenClaw();

  const stopPoll = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  useEffect(() => () => stopPoll(), [stopPoll]);

  useEffect(() => {
    if (step !== "waiting") return;
    const t = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [step]);

  useEffect(() => {
    if (!pendingId || !boxUrl || step !== "waiting") return;
    stopPoll();
    pollRef.current = setInterval(async () => {
      const res = await pollConfirmation(pendingId, boxUrl);
      if (res.status === "confirmed" && res.token) {
        stopPoll();
        setStep("confirmed");
        setConfig({ token: res.token, baseUrl: boxUrl, mDNS: "nodi" });
      } else if (res.status === "rejected") { stopPoll(); setStep("rejected"); }
      else if (res.status === "expired")    { stopPoll(); setStep("expired"); }
    }, 2000);
  }, [pendingId, boxUrl, step]);

  const handlePair = useCallback(async () => {
    const code = pairingCode.trim().toUpperCase();
    if (code.length < 6) return;
    setError("");
    setPairing(true);

    try {
      // 1. Résout l'URL du Nodi depuis Railway
      const resolveRes = await fetch(`${PROVISION_URL}/resolve/${code}`);
      if (!resolveRes.ok) {
        setError("Code introuvable. Vérifiez le code affiché sur votre Nodi.");
        setPairing(false);
        return;
      }
      const { url: resolvedUrl } = await resolveRes.json() as { boxUrl: string };
      setBoxUrl(resolvedUrl);

      // 2. Envoie le code au Nodi
      const result = await sendPairingCode(code, resolvedUrl);
      setPairing(false);

      if (!result.success) { setError(result.error || "Code incorrect"); return; }
      if (result.pending && result.pendingId) {
        setPendingId(result.pendingId);
        setSecondsLeft(120);
        setStep("waiting");
        return;
      }
      if (result.token) setConfig({ token: result.token, baseUrl: resolvedUrl, mDNS: "nodi" });
    } catch {
      setError("Impossible de joindre le serveur. Vérifiez votre connexion.");
      setPairing(false);
    }
  }, [pairingCode, sendPairingCode, setConfig]);

  const reset = () => {
    stopPoll();
    setStep("code");
    setPairingCode("");
    setError("");
    setPendingId("");
    setBoxUrl("");
  };

  if (step === "waiting") return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-8 bg-bg-primary text-center">
      <div className="mb-8">
        <div className="text-6xl mb-4 animate-pulse">📱</div>
        <h2 className="text-2xl font-bold mb-2">Confirmez sur la box</h2>
        <p className="text-text-secondary text-sm">Appuyez sur <span className="text-green-400 font-bold">OUI</span> sur l'écran tactile de votre Nodi</p>
      </div>
      <div className="w-full max-w-sm">
        <div className="bg-bubble-ai rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm text-text-secondary">En attente de confirmation…</span>
          </div>
          <div className="w-full bg-bg-primary rounded-full h-2">
            <div className="bg-green-400 h-2 rounded-full transition-all duration-1000" style={{ width: `${(secondsLeft / 120) * 100}%` }} />
          </div>
          <p className="text-xs text-text-secondary mt-2 text-right">{secondsLeft}s</p>
        </div>
        <button onClick={reset} className="text-xs text-text-secondary underline">Annuler</button>
      </div>
    </div>
  );

  if (step === "confirmed") return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-8 bg-bg-primary text-center">
      <div className="text-7xl mb-6">✅</div>
      <h2 className="text-2xl font-bold text-green-400">Connecté !</h2>
      <p className="text-text-secondary text-sm mt-2">Bienvenue sur votre Nodi</p>
    </div>
  );

  if (step === "rejected") return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-8 bg-bg-primary text-center">
      <div className="text-7xl mb-6">🚫</div>
      <h2 className="text-2xl font-bold text-red-400">Connexion refusée</h2>
      <button onClick={reset} className="mt-6 text-sm text-blue-400 underline">Réessayer</button>
    </div>
  );

  if (step === "expired") return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-8 bg-bg-primary text-center">
      <div className="text-7xl mb-6">⏱️</div>
      <h2 className="text-2xl font-bold text-yellow-400">Temps écoulé</h2>
      <button onClick={reset} className="mt-6 text-sm text-blue-400 underline">Réessayer</button>
    </div>
  );

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-8 bg-bg-primary">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-2">Nod.i</h1>
        <p className="text-text-secondary text-sm">Your OpenClaw companion</p>
      </div>
      <div className="w-full max-w-sm space-y-4">
        <p className="text-text-secondary text-xs text-center">Entrez le code affiché sur votre Nodi</p>
        <input
          type="text"
          inputMode="text"
          autoCapitalize="characters"
          placeholder="Code"
          value={pairingCode}
          onChange={(e) => setPairingCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
          onKeyDown={(e) => e.key === "Enter" && handlePair()}
          maxLength={6}
          className="w-full bg-bubble-ai text-text-primary placeholder-text-secondary rounded-xl px-4 py-3 text-center text-3xl font-mono tracking-[0.4em] outline-none focus:ring-2 focus:ring-bubble-user/50"
        />
        <button
          type="button"
          onClick={handlePair}
          disabled={pairing || pairingCode.length < 6}
          className="w-full bg-bubble-user text-white py-3.5 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {pairing ? "Connexion..." : "Connecter"}
        </button>
        {error && <p className="text-status-error text-xs text-center">{error}</p>}
      </div>
    </div>
  );
}
