import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";

import { type WebSocket, WebSocketServer } from "ws";

/**
 * 终端交互中继：在「终端控制面板」和「被控大屏」之间转发组件动作，
 * 取代原先外置的 Java 网关 / Electron 内置 socket.io。
 *
 * 端点  GET /bi-system/encodedControl/:role/:screenId
 *   role = "bi"          被控大屏，接收动作
 *   role = "thirdParty"  终端面板 / iframe 引用，发送动作
 *
 * 按 screenId 分房间。thirdParty 收到的消息广播给同房间所有 bi（单向为主）；
 * bi → thirdParty 方向保留转发骨架（当前前端接收端只 log）。
 * 心跳（{ type: "heartbeat" }）直接吞掉，另加 ws 层 ping/pong 清理死连接。
 * 开源单机版不鉴权（与 /blobs 一致）。
 */

type Role = "bi" | "thirdParty";

interface Room {
  bi: Set<WebSocket>;
  thirdParty: Set<WebSocket>;
}

type AliveSocket = WebSocket & { isAlive?: boolean };

const ENDPOINT_RE = /^\/bi-system\/encodedControl\/(bi|thirdParty)\/([^/?#]+)/;
const PING_INTERVAL = 30_000;

export class EncodedControlRelay {
  private readonly wss = new WebSocketServer({ noServer: true });
  private readonly rooms = new Map<string, Room>();
  private readonly pinger: NodeJS.Timeout;

  constructor() {
    this.pinger = setInterval(() => this.sweep(), PING_INTERVAL);
    this.pinger.unref?.();
  }

  /** 供 server.ts 的 upgrade 分流判断 */
  matches(url: string | undefined): boolean {
    return !!url && ENDPOINT_RE.test(url);
  }

  handleUpgrade(request: IncomingMessage, socket: Duplex, head: Buffer): void {
    const match = request.url?.match(ENDPOINT_RE);
    if (!match) {
      socket.destroy();
      return;
    }
    const role = match[1] as Role;
    const screenId = decodeURIComponent(match[2]);

    this.wss.handleUpgrade(request, socket, head, (ws) => {
      this.join(role, screenId, ws);
    });
  }

  close(): void {
    clearInterval(this.pinger);
    for (const room of this.rooms.values()) {
      for (const ws of [...room.bi, ...room.thirdParty]) {
        ws.close(1001, "server shutdown");
      }
    }
    this.rooms.clear();
    this.wss.close();
  }

  private join(role: Role, screenId: string, ws: AliveSocket): void {
    const room = this.rooms.get(screenId) ?? { bi: new Set<WebSocket>(), thirdParty: new Set<WebSocket>() };
    room[role].add(ws);
    this.rooms.set(screenId, room);
    ws.isAlive = true;

    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.on("message", (raw) => {
      const text = raw.toString();
      // 心跳吞掉，不转发
      try {
        if ((JSON.parse(text) as { type?: string }).type === "heartbeat") {
          return;
        }
      } catch {
        // 非 JSON，按原样透传
      }
      const targets = role === "thirdParty" ? room.bi : room.thirdParty;
      for (const peer of targets) {
        if (peer.readyState === peer.OPEN) {
          peer.send(text);
        }
      }
    });

    const leave = () => {
      room[role].delete(ws);
      if (room.bi.size === 0 && room.thirdParty.size === 0) {
        this.rooms.delete(screenId);
      }
    };
    ws.on("close", leave);
    ws.on("error", leave);
  }

  private sweep(): void {
    for (const room of this.rooms.values()) {
      for (const ws of [...room.bi, ...room.thirdParty] as AliveSocket[]) {
        if (ws.isAlive === false) {
          ws.terminate();
          continue;
        }
        ws.isAlive = false;
        ws.ping();
      }
    }
  }
}

export const encodedControlRelay = new EncodedControlRelay();
