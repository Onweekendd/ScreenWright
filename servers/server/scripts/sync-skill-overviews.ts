/**
 * Sync executor skill overviews to skills/overviews/.
 *
 * 主 agent 只挂载 `skills/common` + `skills/overviews`。本脚本从
 * `skills/executor/*\/SKILL.md` 复制到 `skills/overviews/<name>/SKILL.md`，
 * 不带 references/scripts/assets。
 *
 * 目的：主 agent 通过 `skill(name=...)` 拿到概览用于分类用户请求 / 选 skill_ref，
 * 但因为目录里没有 references/，`skill_read` 在 overviews 这套 skill 上注定查无此文件，
 * 物理上阻断主 agent 深入读 references。子 agent 仍走 `skills/executor` 拿完整内容。
 *
 * 运行时机：每次 executor skill 的 SKILL.md 发生改动后跑一次；建议挂在 predev 钩子。
 */
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_ROOT = resolve(__dirname, "../agent-workspace/skills");
const EXECUTOR_DIR = join(SKILLS_ROOT, "executor");
const OVERVIEWS_DIR = join(SKILLS_ROOT, "overviews");

/**
 * 在 SKILL.md frontmatter 后注入一段"主 agent 警告"，原文 body 保留。
 * 主 agent 需要看完整内容才能理解 skill 能做什么；但要明确告知它：
 * references/ 链接和"操作目录"表只是给子 agent 看的索引，不要 skill_read。
 */
const SUPERVISOR_NOTICE = `
> **⚠️ 主 agent 阅读须知（仅对 overviews 副本生效）**
>
> 下文中所有 \`references/xxx.md\` 链接、"操作目录"表、"读取参考文件"指示都是**给子 agent 的施工索引**——你（主 agent）**不要** \`skill_read\`，也不要 \`read_file\` 它们。本 overviews 目录下根本没有 references 文件，调了会失败。
>
> 你的工作只是：读完本 SKILL.md 全文后判断是否匹配用户请求 → \`create_task\` 时把本 skill 名写入 \`metadata.skill_ref\` → 委派子 agent。具体怎么做由子 agent 自己读 references。
`;

function buildOverviewMd(srcContent: string): string {
  // 兼容 CRLF / LF
  const fmMatch = srcContent.match(/^(---\r?\n[\s\S]*?\r?\n---\r?\n)/);
  if (!fmMatch) {
    return `${SUPERVISOR_NOTICE}\n${srcContent}`;
  }
  const frontmatter = fmMatch[1];
  const body = srcContent.slice(frontmatter.length);
  return `${frontmatter}${SUPERVISOR_NOTICE}\n${body}`;
}

async function syncOverviews() {
  // 清空 overviews 目录，避免删掉的 skill 残留
  await rm(OVERVIEWS_DIR, { recursive: true, force: true });
  await mkdir(OVERVIEWS_DIR, { recursive: true });

  const entries = await readdir(EXECUTOR_DIR, { withFileTypes: true });
  const skillDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  for (const skillName of skillDirs) {
    const srcSkillMd = join(EXECUTOR_DIR, skillName, "SKILL.md");
    let content: string;
    try {
      content = await readFile(srcSkillMd, "utf8");
    } catch {
      console.warn(`[sync-skill-overviews] skip ${skillName}: no SKILL.md`);
      continue;
    }

    const overview = buildOverviewMd(content);
    const destDir = join(OVERVIEWS_DIR, skillName);
    await mkdir(destDir, { recursive: true });
    await writeFile(join(destDir, "SKILL.md"), overview, "utf8");
    console.log(`[sync-skill-overviews] generated ${skillName}/SKILL.md (full body + supervisor notice)`);
  }

  console.log(`[sync-skill-overviews] done. ${skillDirs.length} skill(s) synced -> ${OVERVIEWS_DIR}`);
}

syncOverviews().catch((err) => {
  console.error("[sync-skill-overviews] failed:", err);
  process.exit(1);
});
