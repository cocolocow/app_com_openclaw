import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Screen = "onboarding" | "chat" | "settings" | "souls" | "tools" | "toolChat";

export type ConnectionStatus =
  | "connected"
  | "connecting"
  | "disconnected"
  | "error";

export interface OpenClawConfig {
  token: string;
  mDNS: string;
  baseUrl: string;
  boxId?: string;
  boxUrl?: string;
  reconnectToken?: string;
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

  // Tool sessions
  activeToolId: string | null;
  toolMessages: Record<string, Message[]>;
  toolTyping: boolean;
  toolSessionCounter: Record<string, number>;

  setConfig: (config: OpenClawConfig) => void;
  clearConfig: () => void;
  addMessage: (message: Omit<Message, "id" | "timestamp">) => void;
  clearMessages: () => void;
  setStatus: (status: ConnectionStatus) => void;
  setIsTyping: (isTyping: boolean) => void;
  setCurrentScreen: (screen: Screen) => void;
  setActiveSoul: (soul: SoulInfo | null) => void;

  // Tool actions
  setActiveToolId: (toolId: string | null) => void;
  addToolMessage: (toolId: string, message: Omit<Message, "id" | "timestamp">) => void;
  clearToolMessages: (toolId: string) => void;
  setToolTyping: (typing: boolean) => void;
  resetToolSession: (toolId: string) => void;
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
      activeToolId: null,
      toolMessages: {},
      toolTyping: false,
      toolSessionCounter: {},

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

      // Tool actions
      setActiveToolId: (toolId) => set({ activeToolId: toolId }),
      addToolMessage: (toolId, message) =>
        set((state) => ({
          toolMessages: {
            ...state.toolMessages,
            [toolId]: [
              ...(state.toolMessages[toolId] ?? []),
              { ...message, id: crypto.randomUUID(), timestamp: Date.now() },
            ],
          },
        })),
      clearToolMessages: (toolId) =>
        set((state) => {
          const copy = { ...state.toolMessages };
          delete copy[toolId];
          return { toolMessages: copy };
        }),
      setToolTyping: (typing) => set({ toolTyping: typing }),
      resetToolSession: (toolId) =>
        set((state) => ({
          toolSessionCounter: {
            ...state.toolSessionCounter,
            [toolId]: (state.toolSessionCounter[toolId] ?? 0) + 1,
          },
        })),
    }),
    {
      name: "nodi-storage",
      partialize: (state) => ({
        config: state.config,
        messages: state.messages,
        activeSoul: state.activeSoul,
        toolMessages: state.toolMessages,
        currentScreen: state.config ? state.currentScreen : "onboarding",
      }),
    },
  ),
);
