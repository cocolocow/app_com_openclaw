import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { useNodStore } from "./store/nodStore";
import { useOpenClaw } from "./hooks/useOpenClaw";
import { Onboarding } from "./screens/Onboarding";
import { Chat } from "./screens/Chat";
import { Settings } from "./screens/Settings";
import { Souls } from "./screens/Souls";
import { Tools } from "./screens/Tools";
import { ToolChat } from "./screens/ToolChat";
import { TabBar } from "./components/TabBar";

export const isNative = Capacitor.isNativePlatform();

export function App() {
  const { currentScreen, config, setCurrentScreen } = useNodStore();
  const { syncSoul } = useOpenClaw();

  useEffect(() => {
    if (config && currentScreen === "onboarding") {
      setCurrentScreen("chat");
    }
  }, [config, currentScreen, setCurrentScreen]);

  // Sync active soul from Nodi on connect
  useEffect(() => {
    if (config) syncSoul();
  }, [config, syncSoul]);

  if (currentScreen === "onboarding") {
    return <Onboarding />;
  }

  const screen = (() => {
    switch (currentScreen) {
      case "chat": return <Chat />;
      case "settings": return <Settings />;
      case "souls": return <Souls />;
      case "tools": return <Tools />;
      case "toolChat": return <ToolChat />;
    }
  })();

  if (!isNative) {
    return screen;
  }

  return (
    <div className="h-dvh flex flex-col bg-bg-primary">
      <div className="flex-1 overflow-hidden">{screen}</div>
      <TabBar active={currentScreen} onChange={setCurrentScreen} />
    </div>
  );
}
