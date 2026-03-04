import { useRef, useEffect, useCallback } from "react";
import { useNodStore } from "../store/nodStore";
import { useOpenClaw } from "../hooks/useOpenClaw";
import { ChatBubble } from "../components/ChatBubble";
import { ChatInput } from "../components/ChatInput";
import { TypingIndicator } from "../components/TypingIndicator";
import { TOOLS } from "../data/tools";
import { isNative } from "../App";

export function ToolChat() {
  const {
    activeToolId,
    toolMessages,
    toolTyping,
    setCurrentScreen,
    addToolMessage,
    addMessage,
    clearToolMessages,
    resetToolSession,
  } = useNodStore();
  const { sendToolMessage } = useOpenClaw();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const tool = TOOLS.find((t) => t.id === activeToolId);
  const messages = activeToolId ? (toolMessages[activeToolId] ?? []) : [];

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, toolTyping]);

  // Inject greeting on first open
  useEffect(() => {
    if (!tool) return;
    const existing = useNodStore.getState().toolMessages[tool.id];
    if (!existing || existing.length === 0) {
      addToolMessage(tool.id, { text: tool.greeting, sender: "ai" });
    }
  }, [tool?.id, addToolMessage]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!tool) return;
      await sendToolMessage(text, tool.sessionKey, tool.id, {
        systemPrompt: tool.systemPrompt,
        caps: tool.caps,
        commands: tool.commands,
        permissions: tool.permissions,
      });
    },
    [tool, sendToolMessage],
  );

  const handleBack = useCallback(() => {
    // Inject summary into main chat if there were user messages
    if (tool && messages.length > 2) {
      const lastAi = [...messages].reverse().find((m) => m.sender === "ai");
      if (lastAi) {
        addMessage({
          text: `[Outil ${tool.name}] ${lastAi.text.slice(0, 200)}${lastAi.text.length > 200 ? "..." : ""}`,
          sender: "ai",
        });
      }
    }
    setCurrentScreen("tools");
  }, [tool, messages, addMessage, setCurrentScreen]);

  if (!tool) {
    setCurrentScreen("tools");
    return null;
  }

  return (
    <div className={`${isNative ? "h-full" : "h-dvh"} flex flex-col bg-bg-primary`}>
      {/* Header */}
      <header className="bg-bg-secondary border-b border-border px-4 py-3 safe-top flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={handleBack}
          className="w-9 h-9 rounded-full bg-bubble-ai flex items-center justify-center hover:bg-white/10 transition-colors"
          aria-label="Back"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <div className={`w-8 h-8 rounded-lg ${tool.color} border flex items-center justify-center text-base`}>
          {tool.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold truncate">{tool.name}</h1>
          <p className="text-[10px] text-text-secondary">Session dediee</p>
        </div>
        <button
          type="button"
          onClick={() => { resetToolSession(tool.id); clearToolMessages(tool.id); addToolMessage(tool.id, { text: tool.greeting, sender: "ai" }); }}
          className="w-9 h-9 rounded-full bg-bubble-ai flex items-center justify-center hover:bg-white/10 transition-colors"
          aria-label="Nouvelle session"
          title="Nouvelle session"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M21 21v-5h-5" />
          </svg>
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        {toolTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={toolTyping} />
    </div>
  );
}
