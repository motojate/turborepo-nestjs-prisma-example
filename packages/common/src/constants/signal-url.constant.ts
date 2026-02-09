import { CollectorTarget } from "../types";

export const SIGNAL_URL_TARGETS: readonly CollectorTarget[] = [
  {
    id: "z8a37xaz0", // TODO: change to hex -> 7d4f2a1b9c
    url: "wss://ssr-staging.conworth.net/webrtc/server",
    description: "staging signaling server",
    enabled: true,
  },
  {
    id: "3e9b8c0a5d",
    url: "wss://ssr-dev.conworth.net/webrtc/server",
    description: "dev signaling server",
    enabled: false,
  },
];
