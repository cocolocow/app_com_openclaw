import type { Message } from "../store/nodStore";

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ChatBubble({ message }: { message: Message }) {
  const isUser = message.sender === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? "bg-bubble-user rounded-br-md"
            : "bg-bubble-ai rounded-bl-md"
        }`}
      >
        <p className="text-sm leading-relaxed text-text-primary whitespace-pre-wrap break-words">
          {message.text}
        </p>
        <p
          className={`text-[10px] mt-1 ${
            isUser ? "text-white/60 text-right" : "text-text-secondary"
          }`}
        >
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}
