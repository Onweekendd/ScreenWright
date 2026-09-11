/**
 * 阶段3-5b 收尾：把 PG 库里已有大屏 / 组件模板 JSON 中的组件类型判别值
 * component.prop / component.name 由 ft-* 前缀平移到 sw-*，与代码枚举 + schema + fixture 对齐。
 *
 * 影响表：
 *   - modules       (t_module)         java_script / template
 *   - layers        (t_layers)         config
 *   - large_screen                     detail / config
 *   - group_layer_data                 content
 *
 * 已核对：这些 blob 里所有引号包裹的 "ft*" token 都是判别值或其 name 变体，
 * 不存在 /img/ft-*.png 之类误伤（资源路径以 "/ 开头，不被规则命中）。
 *
 * 幂等：重复执行只会命中残留的 ft-*，已是 sw-* 的不受影响。
 * 用法：pnpm --dir servers/server exec tsx scripts/migrate-prop-ft-to-sw.ts [--dry]
 */
import { prismaClient } from "@/mastra/storage/prisma";

const DRY = process.argv.includes("--dry");

/** 对一段 JSON 文本做判别值前缀平移 */
function swapProps(text: string): { out: string; hits: number } {
  let hits = 0;
  const out = text
    // "ft-xxx"  → "sw-xxx"（含 name 变体 ft-flop / ft-scrolltable / ft-special-panel …）
    .replace(/"ft-([A-Za-z0-9][\w-]*)"/g, (_m, s) => {
      hits++;
      return `"sw-${s}"`;
    })
    // "ftXxx" / "ftflop" → "swXxx"（驼峰 / 无连字符形式；此时 ft 后必为字母，不会碰到 ft-）
    .replace(/"ft([A-Za-z][\w-]*)"/g, (_m, s) => {
      hits++;
      return `"sw${s}"`;
    });
  return { out, hits };
}

/** 传入可能是 string / 已解析 JSON，返回同类型 + 命中数 */
function swapAny(value: unknown): { value: unknown; hits: number } {
  if (value == null) return { value, hits: 0 };
  if (typeof value === "string") {
    const { out, hits } = swapProps(value);
    return { value: out, hits };
  }
  const { out, hits } = swapProps(JSON.stringify(value));
  return { value: hits ? JSON.parse(out) : value, hits };
}

async function main() {
  let totalHits = 0;
  let totalRows = 0;

  // ---- modules ----
  const modules = await prismaClient.module.findMany();
  for (const m of modules) {
    const js = swapProps(m.javaScript ?? "");
    const tpl = swapProps(m.template ?? "");
    if (js.hits || tpl.hits) {
      totalRows++;
      totalHits += js.hits + tpl.hits;
      if (!DRY) {
        await prismaClient.module.update({
          where: { id: m.id },
          data: {
            ...(js.hits ? { javaScript: js.out } : {}),
            ...(tpl.hits ? { template: tpl.out } : {})
          }
        });
      }
      console.log(`  modules#${m.moduleId} ${m.name} → ${js.hits + tpl.hits} 处`);
    }
  }

  // ---- layers ----
  const layers = await prismaClient.layers.findMany();
  for (const l of layers) {
    const r = swapAny((l as { config: unknown }).config);
    if (r.hits) {
      totalRows++;
      totalHits += r.hits;
      if (!DRY) {
        await prismaClient.layers.update({
          where: { id: l.id },
          data: { config: r.value as object }
        });
      }
      console.log(`  layers#${l.id} (largeId=${(l as { largeId?: number }).largeId}) → ${r.hits} 处`);
    }
  }

  // ---- large_screen ----
  const screens = await prismaClient.largeScreen.findMany();
  for (const s of screens) {
    const detail = swapAny((s as { detail: unknown }).detail);
    const config = swapAny((s as { config: unknown }).config);
    if (detail.hits || config.hits) {
      totalRows++;
      totalHits += detail.hits + config.hits;
      if (!DRY) {
        await prismaClient.largeScreen.update({
          where: { id: s.id },
          data: {
            ...(detail.hits ? { detail: detail.value as object } : {}),
            ...(config.hits ? { config: config.value as object } : {})
          }
        });
      }
      console.log(`  large_screen#${s.id} → ${detail.hits + config.hits} 处`);
    }
  }

  // group_layer_data 表已随「组合案例」功能在开源版移除

  console.log(`\n${DRY ? "[DRY] " : ""}共 ${totalRows} 行，${totalHits} 处判别值前缀平移 ft-* → sw-*`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prismaClient.$disconnect());
