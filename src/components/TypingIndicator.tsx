export function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div className="bg-bubble-ai rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 bg-text-secondary rounded-full"
            style={{
              animation: `typing-dot 1.4s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
