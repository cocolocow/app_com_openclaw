import { useNodStore } from "../store/nodStore";
import { TOOLS, type ToolDefinition } from "../data/tools";
import { isNative } from "../App";

export function Tools() {
  const { setCurrentScreen, setActiveToolId, toolMessages } = useNodStore();

  const openTool = (tool: ToolDefinition) => {
    setActiveToolId(tool.id);
    setCurrentScreen("toolChat");
  };

  return (
    <div className={`${isNative ? "h-full" : "h-dvh"} flex flex-col bg-bg-primary`}>
      <header className="bg-bg-secondary border-b border-border px-4 py-3 safe-top shrink-0">
        {!isNative && (
          <button
            type="button"
            onClick={() => setCurrentScreen("chat")}
            className="w-9 h-9 rounded-full bg-bubble-ai flex items-center justify-center hover:bg-white/10 transition-colors mb-2"
            aria-label="Back"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        )}
        <h1 className="text-base font-semibold">Outils</h1>
        <p className="text-xs text-text-secondary mt-0.5">
          Des assistants guides pour chaque tache
        </p>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {TOOLS.map((tool) => {
          const msgCount = toolMessages[tool.id]?.length ?? 0;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => openTool(tool)}
              className="w-full text-left bg-bg-secondary rounded-xl p-4 hover:bg-white/5 transition-colors border border-transparent hover:border-border"
            >
              <div className="flex items-start gap-3">
                <div className={`w-11 h-11 rounded-xl ${tool.color} border flex items-center justify-center text-xl shrink-0`}>
                  {tool.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold">{tool.name}</h3>
                    {msgCount > 0 && (
                      <span className="text-[10px] text-text-secondary bg-bubble-ai px-2 py-0.5 rounded-full">
                        {msgCount} msg
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                    {tool.description}
                  </p>
                </div>
                <svg className="shrink-0 text-text-secondary mt-1" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
