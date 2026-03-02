import { useRef, useEffect } from "react";
import { useNodStore } from "../store/nodStore";
import { useOpenClaw } from "../hooks/useOpenClaw";
import { ChatBubble } from "../components/ChatBubble";
import { ChatInput } from "../components/ChatInput";
import { TypingIndicator } from "../components/TypingIndicator";
import { StatusIndicator } from "../components/StatusIndicator";

export function Chat() {
  const { messages, status, isTyping, config, setCurrentScreen } =
    useNodStore();
  const { sendMessage } = useOpenClaw();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const deviceId = config?.mDNS
    ? `#${config.mDNS.slice(-4).toUpperCase()}`
    : "";

  return (
    <div className="h-dvh flex flex-col bg-bg-primary">
      {/* Header */}
      <header className="bg-bg-secondary border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-base font-semibold">
            Nod.i {deviceId}
          </h1>
          <StatusIndicator status={status} />
        </div>
        <button
          type="button"
          onClick={() => setCurrentScreen("settings")}
          className="w-9 h-9 rounded-full bg-bubble-ai flex items-center justify-center hover:bg-white/10 transition-colors"
          aria-label="Settings"
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
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <p className="text-text-secondary text-sm text-center">
              Send a message to start chatting with your OpenClaw agent.
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={isTyping} />
    </div>
  );
}
