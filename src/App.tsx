import { useEffect } from "react";
import { useNodStore } from "./store/nodStore";
import { Onboarding } from "./screens/Onboarding";
import { Chat } from "./screens/Chat";
import { Settings } from "./screens/Settings";

export function App() {
  const { currentScreen, config, setCurrentScreen } = useNodStore();

  useEffect(() => {
    if (config && currentScreen === "onboarding") {
      setCurrentScreen("chat");
    }
  }, [config, currentScreen, setCurrentScreen]);

  switch (currentScreen) {
    case "onboarding":
      return <Onboarding />;
    case "chat":
      return <Chat />;
    case "settings":
      return <Settings />;
  }
}
