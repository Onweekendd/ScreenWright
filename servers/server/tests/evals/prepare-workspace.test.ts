import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { clearRunArtifacts, prepareEvalWorkspace } from "../../evals/harness/prepare-workspace";

let root: string;
let source: string;
let target: string;

/** 造一棵最小的目录树：`{ "a/b.txt": "内容" }`。 */
const write = (base: string, files: Record<string, string>) => {
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(base, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
};

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "eval-ws-"));
  source = path.join(root, "source");
  target = path.join(root, "target");
  write(source, {
    "skills/common/x/SKILL.md": "skill v1",
    "scripts/create-template.ts": "// script",
    "types/global.d.ts": "// types",
    "tsconfig.json": "{}"
  });
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe("clearRunArtifacts", () => {
  it("清掉本轮产物，但基础设施必须原样留下", () => {
    prepareEvalWorkspace(source, target);
    write(target, {
      "screen_9001_1/info.json": "{}",
      "tasks/thread-uuid/1.json": "{}",
      "plan/thread-uuid.md": "# plan"
    });

    const removed = clearRunArtifacts(target);

    expect(removed).toEqual(["plan", "screen_9001_1", "tasks"]);
    for (const kept of ["skills", "scripts", "types", "tsconfig.json"]) {
      expect(fs.existsSync(path.join(target, kept))).toBe(true);
    }
    // 内容也要在，不能只剩空目录
    expect(fs.readFileSync(path.join(target, "skills/common/x/SKILL.md"), "utf8")).toBe("skill v1");
  });

  it("agent 顺手写出的没见过的目录同样要清——白名单之外一律是本轮产物", () => {
    prepareEvalWorkspace(source, target);
    write(target, { "some-future-dir/whatever.json": "{}", "stray.log": "noise" });

    expect(clearRunArtifacts(target)).toEqual(["some-future-dir", "stray.log"]);
    expect(fs.existsSync(path.join(target, "skills"))).toBe(true);
  });

  it("干净工作区上重复调用应无副作用", () => {
    prepareEvalWorkspace(source, target);

    expect(clearRunArtifacts(target)).toEqual([]);
    expect(clearRunArtifacts(target)).toEqual([]);
    expect(fs.existsSync(path.join(target, "tsconfig.json"))).toBe(true);
  });

  it("工作区还不存在时不得抛错", () => {
    expect(clearRunArtifacts(path.join(root, "never-created"))).toEqual([]);
  });
});

describe("prepareEvalWorkspace 的陈旧检测", () => {
  it("源没变时复用，不重拷", () => {
    prepareEvalWorkspace(source, target);
    const second = prepareEvalWorkspace(source, target);

    expect(second.reused).toContain("skills");
    expect(second.staleRefreshed).toEqual([]);
  });

  it("源改过之后必须自动重拷——副本落后会让 eval 测的是旧 skill", () => {
    prepareEvalWorkspace(source, target);
    // 改源：内容与 mtime 都推进
    const skill = path.join(source, "skills/common/x/SKILL.md");
    fs.writeFileSync(skill, "skill v2");
    const future = new Date(Date.now() + 10_000);
    fs.utimesSync(skill, future, future);

    const result = prepareEvalWorkspace(source, target);

    expect(result.staleRefreshed).toContain("skills");
    expect(fs.readFileSync(path.join(target, "skills/common/x/SKILL.md"), "utf8")).toBe("skill v2");
  });

  it("重命名后旧目录不得残留——两份互相矛盾的 skill 会同时进 available_skills", () => {
    prepareEvalWorkspace(source, target);
    fs.renameSync(path.join(source, "skills/common/x"), path.join(source, "skills/common/y"));
    const renamed = path.join(source, "skills/common/y/SKILL.md");
    const future = new Date(Date.now() + 10_000);
    fs.utimesSync(renamed, future, future);

    prepareEvalWorkspace(source, target);

    expect(fs.existsSync(path.join(target, "skills/common/y"))).toBe(true);
    expect(fs.existsSync(path.join(target, "skills/common/x"))).toBe(false);
  });

  it("源里缺东西时记进 missing，不抛错", () => {
    fs.rmSync(path.join(source, "scripts"), { recursive: true });

    expect(prepareEvalWorkspace(source, target).missing).toContain("scripts");
  });
});
