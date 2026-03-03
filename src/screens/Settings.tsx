import { useState, useCallback } from "react";
import { useNodStore } from "../store/nodStore";
import { useOpenClaw } from "../hooks/useOpenClaw";

export function Settings() {
  const { config, messages, clearConfig, clearMessages, setCurrentScreen } =
    useNodStore();
  const { testConnection } = useOpenClaw();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "fail" | null>(null);

  const handleTestConnection = useCallback(async () => {
    if (!config) return;
    setTesting(true);
    setTestResult(null);
    const ok = await testConnection(config.baseUrl);
    setTestResult(ok ? "success" : "fail");
    setTesting(false);
  }, [config, testConnection]);

  const handleExportLogs = useCallback(() => {
    const data = JSON.stringify({ config, messages }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nodi-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [config, messages]);

  return (
    <div className="h-dvh flex flex-col bg-bg-primary">
      <header className="bg-bg-secondary border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={() => setCurrentScreen("chat")}
          className="w-9 h-9 rounded-full bg-bubble-ai flex items-center justify-center hover:bg-white/10 transition-colors"
          aria-label="Back"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-base font-semibold">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Connection section */}
        <Section title="Connection">
          {config && (
            <div className="text-xs text-text-secondary space-y-1 mb-3">
              <p>Host: {config.mDNS}</p>
              <p>URL: {config.baseUrl}</p>
            </div>
          )}
          <SettingsButton onClick={handleTestConnection} disabled={testing}>
            {testing
              ? "Testing..."
              : testResult === "success"
                ? "Connected!"
                : testResult === "fail"
                  ? "Connection Failed"
                  : "Test Connection"}
          </SettingsButton>
        </Section>

        {/* Data section */}
        <Section title="Data">
          <SettingsButton onClick={handleExportLogs}>
            Export Logs (JSON)
          </SettingsButton>
          <SettingsButton onClick={clearMessages} variant="warning">
            Clear Chat History
          </SettingsButton>
          <SettingsButton onClick={clearConfig} variant="danger">
            Disconnect & Re-pair
          </SettingsButton>
        </Section>

        {/* About */}
        <Section title="About">
          <div className="text-xs text-text-secondary space-y-1">
            <p>Nod.i v0.1.0</p>
            <p>OpenClaw Companion App</p>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-bg-secondary rounded-xl p-4">
      <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function SettingsButton({
  children,
  onClick,
  disabled,
  variant = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "warning" | "danger";
}) {
  const colors = {
    default: "bg-bubble-ai text-text-primary hover:bg-white/10",
    warning: "bg-bubble-ai text-status-connecting hover:bg-white/10",
    danger: "bg-bubble-ai text-status-error hover:bg-white/10",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full ${colors[variant]} py-2.5 rounded-lg text-sm text-left px-3 transition-colors disabled:opacity-40`}
    >
      {children}
    </button>
  );
}
