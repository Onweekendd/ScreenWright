import { randomBytes } from "node:crypto";

import { hashPassword } from "@/lib/auth/password";
import { prismaClient } from "@/mastra/storage/prisma";

// 初始超管账号。口令来源：SEED_ADMIN_PASSWORD；
// 未设置时，开发环境用 admin123，生产环境（NODE_ENV=production）随机生成并只在这次输出里打印一次。
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || "admin";
const isProd = process.env.NODE_ENV === "production";

/** 与历史占位值一致：旧版（无登录）种子写入的 passwordHash 为 "-"，视作「尚未设置口令」 */
const UNSET_PASSWORD_HASH = "-";

function resolveInitialPassword(): { password: string; generated: boolean } {
  const fromEnv = process.env.SEED_ADMIN_PASSWORD;
  if (fromEnv) {
    return { password: fromEnv, generated: false };
  }
  if (isProd) {
    return { password: randomBytes(12).toString("base64url"), generated: true };
  }
  return { password: "admin123", generated: false };
}

async function seedBiUser() {
  console.log(`开始创建默认用户: ${ADMIN_NAME}`);

  const existing = await prismaClient.biUser.findUnique({ where: { userName: ADMIN_NAME } });

  // 已设置过口令的账号不覆盖（避免重复部署把管理员改过的口令重置回初始值）
  if (existing && existing.passwordHash !== UNSET_PASSWORD_HASH) {
    await prismaClient.biUser.update({
      where: { id: existing.id },
      data: { role: 0, status: 1, forbidden: false }
    });
    console.log(`✓ 默认用户已存在: id=${existing.id}, userName=${existing.userName}，口令保持不变`);
    return;
  }

  const { password, generated } = resolveInitialPassword();
  const passwordHash = await hashPassword(password);

  const user = existing
    ? await prismaClient.biUser.update({
        where: { id: existing.id },
        data: { passwordHash, role: 0, status: 1, forbidden: false }
      })
    : await prismaClient.biUser.create({
        data: {
          userName: ADMIN_NAME,
          passwordHash,
          role: 0, // 0=超管
          status: 1, // 1=正常
          type: 0,
          stockType: 1,
          forbidden: false,
          realname: "管理员",
          createLarge: [],
          createScene: [],
          exportLarge: [],
          exportScene: [],
          createCity: [],
          exportCity: []
        }
      });

  console.log(`✓ 默认用户已就绪: id=${user.id}, userName=${user.userName}, role=0(超管)`);
  if (generated) {
    console.log(`  初始口令（仅显示这一次，请立即保存）: ${password}`);
  } else if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log("  使用开发默认口令 admin123；生产环境请设置 SEED_ADMIN_PASSWORD");
  }
}

seedBiUser()
  .catch((e) => {
    console.error("种子失败:", e);
    process.exit(1);
  })
  .finally(() => prismaClient.$disconnect());
