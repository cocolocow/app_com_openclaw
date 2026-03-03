import type { ConnectionStatus } from "../store/nodStore";

const statusConfig: Record<
  ConnectionStatus,
  { color: string; label: string }
> = {
  connected: { color: "bg-status-connected", label: "Connected" },
  connecting: { color: "bg-status-connecting", label: "Connecting..." },
  disconnected: { color: "bg-text-secondary", label: "Disconnected" },
  error: { color: "bg-status-error", label: "Error" },
};

export function StatusIndicator({ status }: { status: ConnectionStatus }) {
  const { color, label } = statusConfig[status];

  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs text-text-secondary">{label}</span>
    </div>
  );
}
