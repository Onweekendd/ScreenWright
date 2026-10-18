import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

const KEY_LEN = 64;
const SALT_LEN = 16;
const PREFIX = "scrypt";

/** 口令哈希：scrypt + 随机盐，格式 `scrypt$<salt hex>$<hash hex>`（纯 Node 内置，无原生依赖）。 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LEN);
  const hash = await scrypt(password, salt, KEY_LEN);
  return `${PREFIX}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

/** 校验口令；格式不对（含历史占位 "-"）一律返回 false，不抛错。 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [prefix, saltHex, hashHex] = stored.split("$");
  if (prefix !== PREFIX || !saltHex || !hashHex) {
    return false;
  }
  const expected = Buffer.from(hashHex, "hex");
  if (expected.length !== KEY_LEN) {
    return false;
  }
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), KEY_LEN);
  return timingSafeEqual(actual, expected);
}
