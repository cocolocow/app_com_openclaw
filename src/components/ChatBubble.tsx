import { useState, useCallback, useMemo } from "react";
import type { Message } from "../store/nodStore";

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ttsSupported = typeof window !== "undefined" && "speechSynthesis" in window;

/** Lightweight markdown-to-HTML for chat bubbles. */
function renderMarkdown(text: string): string {
  let html = text
    // Escape HTML
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks: ```...```
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, _lang, code) =>
    `<pre class="bg-black/30 rounded-lg px-3 py-2 my-1 overflow-x-auto text-xs"><code>${code.trim()}</code></pre>`
  );

  // Inline code: `...`
  html = html.replace(/`([^`]+)`/g, '<code class="bg-black/30 px-1.5 py-0.5 rounded text-xs">$1</code>');

  // Bold: **...**
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Italic: *...*
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Links: [text](url)
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener" class="underline text-blue-400 hover:text-blue-300">$1</a>'
  );

  // Bare URLs
  html = html.replace(
    /(?<!="|">)(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener" class="underline text-blue-400 hover:text-blue-300">$1</a>'
  );

  // Headers: ## ... (only at start of line)
  html = html.replace(/^### (.+)$/gm, '<strong class="text-xs uppercase tracking-wide text-text-secondary">$1</strong>');
  html = html.replace(/^## (.+)$/gm, '<strong class="text-sm">$1</strong>');
  html = html.replace(/^# (.+)$/gm, '<strong class="text-base">$1</strong>');

  // Unordered list items: - ... or * ...
  html = html.replace(/^[\-\*] (.+)$/gm, '<span class="flex gap-1.5"><span>•</span><span>$1</span></span>');

  // Ordered list items: 1. ...
  html = html.replace(/^(\d+)\. (.+)$/gm, '<span class="flex gap-1.5"><span>$1.</span><span>$2</span></span>');

  // Line breaks
  html = html.replace(/\n/g, "<br/>");

  return html;
}

export function ChatBubble({ message }: { message: Message }) {
  const isUser = message.sender === "user";
  const [speaking, setSpeaking] = useState(false);

  const html = useMemo(() => (isUser ? null : renderMarkdown(message.text)), [isUser, message.text]);

  const speak = useCallback(() => {
    if (!ttsSupported) return;

    if (speaking) {
      speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message.text);
    utterance.lang = "fr-FR";
    utterance.rate = 1;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    // Voices load async — wait if needed
    const voices = speechSynthesis.getVoices();
    const frVoice = voices.find((v) => v.lang.startsWith("fr"));
    if (frVoice) utterance.voice = frVoice;

    speechSynthesis.speak(utterance);
    setSpeaking(true);
  }, [message.text, speaking]);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? "bg-bubble-user rounded-br-md"
            : "bg-bubble-ai rounded-bl-md"
        }`}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed text-text-primary whitespace-pre-wrap break-words">
            {message.text}
          </p>
        ) : (
          <div
            className="text-sm leading-relaxed text-text-primary break-words [&_pre]:whitespace-pre-wrap [&_a]:break-all"
            dangerouslySetInnerHTML={{ __html: html! }}
          />
        )}
        <div className={`flex items-center mt-1 ${isUser ? "justify-end" : "justify-between"}`}>
          <p
            className={`text-[10px] ${
              isUser ? "text-white/60" : "text-text-secondary"
            }`}
          >
            {formatTime(message.timestamp)}
          </p>
          {!isUser && ttsSupported && (
            <button
              type="button"
              onClick={speak}
              className={`ml-2 p-1 rounded-full transition-colors ${
                speaking ? "text-bubble-user" : "text-text-secondary"
              }`}
              aria-label={speaking ? "Stop" : "Read aloud"}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {speaking ? (
                  <>
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </>
                ) : (
                  <>
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  </>
                )}
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
