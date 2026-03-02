import { useState, useCallback, useEffect } from "react";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState("");
  const { isSupported, isListening, transcript, startListening, stopListening, clearTranscript } =
    useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      setText(transcript);
      clearTranscript();
    }
  }, [transcript, clearTranscript]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  }, [text, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className="sticky bottom-0 bg-bg-secondary border-t border-border p-3 flex items-center gap-2">
      {isSupported && (
        <button
          type="button"
          onClick={isListening ? stopListening : startListening}
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
            isListening
              ? "bg-status-error text-white"
              : "bg-bubble-ai text-text-secondary hover:text-text-primary"
          }`}
          aria-label={isListening ? "Stop recording" : "Start recording"}
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
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        </button>
      )}

      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        disabled={disabled}
        className="flex-1 bg-bubble-ai text-text-primary placeholder-text-secondary rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-bubble-user/50 disabled:opacity-50"
      />

      <button
        type="button"
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        className="w-10 h-10 rounded-full bg-bubble-user flex items-center justify-center shrink-0 disabled:opacity-30 transition-opacity"
        aria-label="Send message"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m22 2-7 20-4-9-9-4z" />
          <path d="m22 2-11 11" />
        </svg>
      </button>
    </div>
  );
}
