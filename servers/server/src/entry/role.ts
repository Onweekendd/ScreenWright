/**
 * 进程角色。同一份代码、同一个镜像，靠环境变量 ROLE 决定这个进程干什么：
 * - api：登录鉴权、大屏 / 图层 / 数据源等业务接口、素材 blob、终端控制 WebSocket
 * - ai：对话（bi-chat SSE）、Mastra agent / workflow、artifact 沙箱预览
 * - worker：只消费 BullMQ 队列里的长任务（生图等），不监听 HTTP
 * - all：以上全跑在一个进程里（本地开发默认，`pnpm server:dev` 行为不变）
 */
export type Role = "api" | "ai" | "worker" | "all";

const ROLES: readonly Role[] = ["api", "ai", "worker", "all"];

export function parseRole(raw: string | undefined = process.env.ROLE): Role {
  if (!raw) {
    return "all";
  }
  if (!(ROLES as readonly string[]).includes(raw)) {
    throw new Error(`ROLE 只能是 ${ROLES.join(" | ")}，收到：${raw}`);
  }
  return raw as Role;
}

export const runsApi = (role: Role): boolean => role === "api" || role === "all";
export const runsAi = (role: Role): boolean => role === "ai" || role === "all";
export const runsHttp = (role: Role): boolean => role !== "worker";
export const runsWorker = (role: Role): boolean => role === "worker" || role === "all";
