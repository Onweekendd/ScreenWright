import { prismaClient } from "@/mastra/storage/prisma";

// 开源单机版无登录：这个账号只用于承载 userInfo（用户名 / 角色 / 头像）。
// passwordHash 列非空但不再校验，占位即可。
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || "admin";

async function seedBiUser() {
  console.log(`开始创建默认用户: ${ADMIN_NAME}`);

  const user = await prismaClient.biUser.upsert({
    where: { userName: ADMIN_NAME },
    update: { role: 0, status: 1, forbidden: false },
    create: {
      userName: ADMIN_NAME,
      passwordHash: "-",
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
}

seedBiUser()
  .catch((e) => {
    console.error("种子失败:", e);
    process.exit(1);
  })
  .finally(() => prismaClient.$disconnect());
