import { useState, useCallback } from "react";
import { useNodStore } from "../store/nodStore";
import { useOpenClaw } from "../hooks/useOpenClaw";

export function Onboarding() {
  const [pairingCode, setPairingCode] = useState("");
  const [pairing, setPairing] = useState(false);
  const [error, setError] = useState("");
  const { setConfig } = useNodStore();
  const { sendPairingCode } = useOpenClaw();

  const handlePair = useCallback(async () => {
    const code = pairingCode.trim().toUpperCase();
    if (!code) return;

    setPairing(true);
    setError("");

    const result = await sendPairingCode(code);

    if (result.success && result.token) {
      setConfig({
        token: result.token,
        mDNS: result.mDNS || "openclaw",
        baseUrl: result.baseUrl || "http://192.168.0.28",
      });
    } else {
      setError(result.error || "Pairing failed. Check your code and try again.");
    }
    setPairing(false);
  }, [pairingCode, sendPairingCode, setConfig]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-8 bg-bg-primary">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-2">Nod.i</h1>
        <p className="text-text-secondary text-sm">
          Your OpenClaw companion
        </p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <div className="text-center mb-2">
          <p className="text-text-secondary text-xs">
            Enter the code shown on your OpenClaw screen
          </p>
        </div>

        <input
          type="text"
          inputMode="text"
          autoCapitalize="characters"
          placeholder="Pairing code"
          value={pairingCode}
          onChange={(e) =>
            setPairingCode(
              e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6),
            )
          }
          maxLength={6}
          className="w-full bg-bubble-ai text-text-primary placeholder-text-secondary rounded-xl px-4 py-3 text-center text-3xl font-mono tracking-[0.4em] outline-none focus:ring-2 focus:ring-bubble-user/50"
        />

        <button
          type="button"
          onClick={handlePair}
          disabled={pairing || pairingCode.length < 6}
          className="w-full bg-bubble-user text-white py-3.5 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {pairing ? "Connecting..." : "Connect"}
        </button>

        {error && (
          <p className="text-status-error text-xs text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
