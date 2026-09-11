import type { PluginMessage, UIMessage } from "../../types";

type MessageHandler = (msg: UIMessage) => void;

const handlers: MessageHandler[] = [];

export function usePluginBridge() {
  function postMessage(msg: PluginMessage) {
    parent.postMessage({ pluginMessage: msg }, "*");
  }

  function onMessage(handler: MessageHandler) {
    handlers.push(handler);
    return () => {
      const idx = handlers.indexOf(handler);
      if (idx >= 0) handlers.splice(idx, 1);
    };
  }

  function init() {
    window.addEventListener("message", handleMessage);
    postMessage({ type: "getSelection" });
  }

  return { postMessage, onMessage, init };
}

function handleMessage(event: MessageEvent) {
  const msg = event.data?.pluginMessage as UIMessage | undefined;
  if (!msg) return;
  for (const handler of handlers) {
    handler(msg);
  }
}
