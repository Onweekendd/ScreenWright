import { prismaClient } from "@/mastra/storage/prisma";

import moduleData from "./modules-data.json" with { type: "json" };

async function seedModules() {
  console.log("开始导入 Modules 数据...");

  let imported = 0;
  let failed = 0;
  const skipped: string[] = [];

  for (const item of moduleData) {
    try {
      // 检查 name 是否为空，如果为空则跳过
      if (!item.name) {
        skipped.push(`ID: ${item.id} (name 为空)`);
        continue;
      }

      await prismaClient.module.upsert({
        where: { name: item.name },
        update: {},
        create: {
          moduleId: item.id, // SQL 中的原始 ID
          userId: item.user_id,
          type: item.type,
          javaScript: item.java_script,
          level: item.level,
          secondLevelMenu: item.second_level_menu,
          firstLevelMenu: item.first_level_menu,
          name: item.name,
          thumbnail: item.thumbnail,
          createdBy: item.created_by,
          createdTime: item.created_time,
          updatedBy: item.updated_by,
          updatedTime: item.updated_time,
          template: item.template,
          status: item.status
        }
      });
      imported++;
      console.log(`✓ 已导入: ${item.name}`);
    } catch (error) {
      failed++;
      console.error(`✗ 导入失败 ${item.name}:`, error);
    }
  }

  // 清理：删掉源数据里已不存在的组件行（如三维场景 / UE / 已移除组件）
  const validNames = moduleData.map((m) => m.name).filter((n): n is string => !!n);
  const pruned = await prismaClient.module.deleteMany({ where: { name: { notIn: validNames } } });

  console.log(`\n统计:`);
  console.log(`  成功导入: ${imported} 条`);
  console.log(`  导入失败: ${failed} 条`);
  console.log(`  清理陈旧: ${pruned.count} 条`);
  if (skipped.length > 0) {
    console.log(`  跳过记录: ${skipped.length} 条`);
    skipped.forEach((s) => console.log(`    - ${s}`));
  }
}

seedModules()
  .catch(console.error)
  .finally(() => prismaClient.$disconnect());
