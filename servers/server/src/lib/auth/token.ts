import { sign, verify } from "hono/jwt";

export interface TokenPayload {
  userId: number;
  userName: string;
  role: number;
}

const ALG = "HS256";
const DEFAULT_TTL_SECONDS = 7 * 24 * 60 * 60;
const DEV_SECRET = "funbi-dev-only-secret-change-me";

let warnedDevSecret = false;

/**
 * JWT 密钥。生产环境必须通过 JWT_SECRET 提供，缺失直接抛错（宁可起不来，也不用公开的默认密钥签发令牌）；
 * 非生产环境退回固定开发密钥并告警一次。
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) {
    return secret;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("生产环境必须设置 JWT_SECRET");
  }
  if (!warnedDevSecret) {
    warnedDevSecret = true;
    console.warn("[auth] 未设置 JWT_SECRET，使用开发默认密钥（仅限本地开发）");
  }
  return DEV_SECRET;
}

function ttlSeconds(): number {
  const n = Number(process.env.JWT_EXPIRES_IN_SECONDS);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_TTL_SECONDS;
}

export async function signToken(payload: TokenPayload): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return sign({ ...payload, iat: now, exp: now + ttlSeconds() }, getJwtSecret(), ALG);
}

/** 校验并解出身份；签名错误 / 过期 / 载荷缺字段都返回 null。 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const p = await verify(token, getJwtSecret(), ALG);
    if (typeof p.userId !== "number" || typeof p.userName !== "string" || typeof p.role !== "number") {
      return null;
    }
    return { userId: p.userId, userName: p.userName, role: p.role };
  } catch {
    return null;
  }
}
