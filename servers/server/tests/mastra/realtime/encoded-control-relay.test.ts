import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { WebSocket } from "ws";

import { EncodedControlRelay } from "@/mastra/realtime/encoded-control-relay";

/** 等一个 ws 收到消息（或超时） */
function once(ws: WebSocket, event: "open" | "message"): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`等待 ${event} 超时`)), 2000);
    ws.once(event, (data: unknown) => {
      clearTimeout(timer);
      resolve(event === "message" ? JSON.parse(String(data)) : undefined);
    });
  });
}

describe("EncodedControlRelay", () => {
  let relay: EncodedControlRelay;
  let server: Server;
  let base: string;

  beforeEach(async () => {
    relay = new EncodedControlRelay();
    server = createServer();
    server.on("upgrade", (req, socket, head) => {
      if (relay.matches(req.url)) {
        relay.handleUpgrade(req, socket, head);
      } else {
        socket.destroy();
      }
    });
    await new Promise<void>((r) => server.listen(0, r));
    base = `ws://127.0.0.1:${(server.address() as AddressInfo).port}/bi-system/encodedControl`;
  });

  afterEach(async () => {
    relay.close();
    await new Promise<void>((r) => server.close(() => r()));
  });

  it("把 thirdParty 的动作转发给同房间的 bi", async () => {
    const screen = new WebSocket(`${base}/bi/42`);
    const terminal = new WebSocket(`${base}/thirdParty/42`);
    await Promise.all([once(screen, "open"), once(terminal, "open")]);

    const received = once(screen, "message");
    terminal.send(JSON.stringify({ actions: [{ id: 1, encodeKey: "a" }] }));

    expect(await received).toEqual({ actions: [{ id: 1, encodeKey: "a" }] });
    screen.close();
    terminal.close();
  });

  it("不同 screenId 互不串扰", async () => {
    const screenA = new WebSocket(`${base}/bi/A`);
    const terminalB = new WebSocket(`${base}/thirdParty/B`);
    await Promise.all([once(screenA, "open"), once(terminalB, "open")]);

    let leaked = false;
    screenA.once("message", () => (leaked = true));
    terminalB.send(JSON.stringify({ actions: [] }));

    await new Promise((r) => setTimeout(r, 200));
    expect(leaked).toBe(false);
    screenA.close();
    terminalB.close();
  });

  it("心跳消息不转发", async () => {
    const screen = new WebSocket(`${base}/bi/hb`);
    const terminal = new WebSocket(`${base}/thirdParty/hb`);
    await Promise.all([once(screen, "open"), once(terminal, "open")]);

    let got = false;
    screen.once("message", () => (got = true));
    terminal.send(JSON.stringify({ type: "heartbeat", timestamp: Date.now() }));

    await new Promise((r) => setTimeout(r, 200));
    expect(got).toBe(false);
    screen.close();
    terminal.close();
  });
});
