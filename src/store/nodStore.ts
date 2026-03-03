import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Screen = "onboarding" | "chat" | "settings" | "souls";

export type ConnectionStatus =
  | "connected"
  | "connecting"
  | "disconnected"
  | "error";

export interface OpenClawConfig {
  token: string;
  mDNS: string;
  baseUrl: string;
  ip?: string;
}

export interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: number;
}

export interface SoulInfo {
  owner: string;
  name: string;
  displayName: string;
  description: string;
  version: string;
}

interface NodState {
  config: OpenClawConfig | null;
  messages: Message[];
  status: ConnectionStatus;
  isTyping: boolean;
  currentScreen: Screen;
  activeSoul: SoulInfo | null;

  setConfig: (config: OpenClawConfig) => void;
  clearConfig: () => void;
  addMessage: (message: Omit<Message, "id" | "timestamp">) => void;
  clearMessages: () => void;
  setStatus: (status: ConnectionStatus) => void;
  setIsTyping: (isTyping: boolean) => void;
  setCurrentScreen: (screen: Screen) => void;
  setActiveSoul: (soul: SoulInfo | null) => void;
}

export const useNodStore = create<NodState>()(
  persist(
    (set) => ({
      config: null,
      messages: [],
      status: "disconnected",
      isTyping: false,
      currentScreen: "onboarding",
      activeSoul: null,

      setConfig: (config) =>
        set({ config, currentScreen: "chat", status: "connected" }),

      clearConfig: () =>
        set({
          config: null,
          currentScreen: "onboarding",
          status: "disconnected",
        }),

      addMessage: (message) =>
        set((state) => ({
          messages: [
            ...state.messages,
            {
              ...message,
              id: crypto.randomUUID(),
              timestamp: Date.now(),
            },
          ],
        })),

      clearMessages: () => set({ messages: [] }),

      setStatus: (status) => set({ status }),

      setIsTyping: (isTyping) => set({ isTyping }),

      setCurrentScreen: (screen) => set({ currentScreen: screen }),

      setActiveSoul: (soul) => set({ activeSoul: soul }),
    }),
    {
      name: "nodi-storage",
      partialize: (state) => ({
        config: state.config,
        messages: state.messages,
        activeSoul: state.activeSoul,
        currentScreen: state.config ? state.currentScreen : "onboarding",
      }),
    },
  ),
);
