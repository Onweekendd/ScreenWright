import { cpSync } from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { editFilesTool } from "../../../src/mastra/tools/file/edit-files";
import { readFileState } from "../../../src/mastra/tools/file/state";
import { AgentMode } from "../../../src/mastra/types/bi-chat";
import { SuspendType } from "../../../src/mastra/types/suspend";

/**
 * 前端同步路径：component / dataFilter / screenInfo / agent 产物 各走一条分支。
 *
 * 这些用例钉住「哪种文件走哪条分支、payload 带哪些字段、resume 后是否才经 core 整屏落盘」。
 * screenInfo / dataFilter / component / vue-part 都使用完整大屏 fixture，因为预览与提交都会读取整屏树。
 */

const tempDirs: string[] = [];

interface EditInput {
  path: string;
  edits: Array<{ old_string: string; new_string: string; replace_all?: boolean }>;
}

/**
 * 建一个临时 agent workspace，files 的 key 是相对 workspace 根的路径（如 "screen_1/info.json"），
 * 并把 MASTRA_WORKSPACE_PATH 指过去——info.json / agent 产物这两条判定要靠它才认得出大屏目录。
 *
 * 目录**故意叫 agent-workspace 而不是 workspace**：真实部署就是这个名字，而被修掉的那个 bug
 * 正是 `includes("/workspace/screen_")` 在 `agent-workspace/screen_x` 上匹配不到
 * （workspace 前面是 "-" 不是 "/"）。fixture 用真名，这条 bug 才不会再溜回来。
 */
async function createTempWorkspace(files: Record<string, string>): Promise<string> {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), "edit-files-sync-"));
  tempDirs.push(dir);
  const workspace = path.join(dir, "agent-workspace");
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(workspace, rel);
    await fsp.mkdir(path.dirname(abs), { recursive: true });
    await fsp.writeFile(abs, content, "utf8");
  }
  process.env.MASTRA_WORKSPACE_PATH = workspace;
  return workspace;
}

async function executeEditFiles(
  files: EditInput[],
  options: {
    mode?: AgentMode;
    toolCallId?: string;
    resumeData?: Record<string, unknown>;
    onSuspend?: (payload: Record<string, unknown>) => void;
  } = {}
) {
  const execute = editFilesTool.execute as unknown as (
    input: { files: EditInput[] },
    context: Record<string, unknown>
  ) => Promise<unknown>;

  return execute(
    { files },
    {
      requestContext: {
        get: (key: string) => (key === "mode" ? (options.mode ?? AgentMode.AUTO_EDIT) : undefined)
      },
      agent: {
        toolCallId: options.toolCallId,
        resumeData: options.resumeData,
        suspend: async (payload: Record<string, unknown>) => {
          options.onSuspend?.(payload);
        }
      }
    }
  );
}

/**
 * 组件分支的 fixture：把 data-read 的 mock 大屏拷进临时工作区。
 *
 * 不能再用「临时目录里放一个孤零零的组件 json」——组件编辑现在要过 core
 * （edit-files 的 applyComponentEdit），而 core 是从整屏读树的：没有 info.json /
 * aniFrameSet.json / statusAnimation.json 就读不出树，也就拿不到可推的完整组件。
 * 顺带这份 fixture 里 4152 是个真实的顶层组件，比手搓的最小对象更贴近生产。
 */
const SCREEN_FIXTURE = path.resolve(__dirname, "..", "..", "data-read", "mock", "screen_75_1");
/** fixture 里被编辑的那个组件（顶层条形图），它的 zIndex 落盘值为 0 */
const FIXTURE_COMPONENT_ID = 4152;
const FIXTURE_COMPONENT_REL = path.join("component", "4152_条形图.json");

async function screenFixture(): Promise<string> {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), "edit-files-sync-"));
  tempDirs.push(dir);
  const workspace = path.join(dir, "agent-workspace");
  // .git 是 fixture 目录里的 gitlink，拷进来会让 Windows 上的清理撞 EBUSY
  cpSync(SCREEN_FIXTURE, path.join(workspace, "screen_75_1"), {
    recursive: true,
    filter: (src) => !src.split(/[\\/]/).includes(".git")
  });
  // getScreenVersionKeyFromPath / getScreenDirPath 都按调用时的 env 解析
  process.env.MASTRA_WORKSPACE_PATH = workspace;
  return path.join(workspace, "screen_75_1");
}

async function componentTree(): Promise<string> {
  return path.join(await screenFixture(), FIXTURE_COMPONENT_REL);
}

async function dataFilterFixture(
  bindComponent: Array<{ label: string; id: number | string }> = []
): Promise<{ filePath: string; componentPath: string }> {
  const screenRoot = await screenFixture();
  const filterDir = path.join(screenRoot, "dataFilterArr");
  const filePath = path.join(filterDir, "我的过滤器.json");
  await fsp.mkdir(filterDir, { recursive: true });
  await Promise.all([
    fsp.writeFile(
      filePath,
      JSON.stringify(
        {
          name: "我的过滤器",
          callBack: ["a"],
          callBackStatus: false,
          dataFormatter: "我的过滤器.js",
          bindComponent,
          checked: true,
          notSaved: false,
          tempPool: { callBack: [], dataFormatter: "" },
          show: true
        },
        null,
        2
      ),
      "utf8"
    ),
    fsp.writeFile(path.join(filterDir, "我的过滤器.js"), "const fn = () => 1;", "utf8")
  ]);
  return { filePath, componentPath: path.join(screenRoot, FIXTURE_COMPONENT_REL) };
}

const ORIGINAL_WORKSPACE_PATH = process.env.MASTRA_WORKSPACE_PATH;

afterEach(async () => {
  readFileState.clear();
  // 每个用例都会把 MASTRA_WORKSPACE_PATH 指向自己的临时目录，用完还回去，避免串到别的文件
  process.env.MASTRA_WORKSPACE_PATH = ORIGINAL_WORKSPACE_PATH;
  await Promise.all(tempDirs.splice(0).map((dir) => fsp.rm(dir, { recursive: true, force: true })));
});

describe("edit_files 前端同步路径", () => {
  it.each([
    [AgentMode.AUTO_EDIT, SuspendType.UpdateScreenInfo],
    [AgentMode.ASK_BEFORE_EDIT, SuspendType.AskApprovalUpdateScreenInfo]
  ] as const)("screen info 文件，%s 模式挂起为对应更新类型，resume 前不落盘", async (mode, expectedType) => {
    const screenRoot = await screenFixture();
    const filePath = path.join(screenRoot, "info.json");
    const payloads: Array<Record<string, unknown>> = [];

    await executeEditFiles(
      [{ path: filePath, edits: [{ old_string: '"width": "1920"', new_string: '"width": "2560"' }] }],
      {
        mode,
        toolCallId: `screen-info-${String(mode)}`,
        onSuspend: (payload) => payloads.push(payload)
      }
    );

    expect(payloads).toHaveLength(1);
    expect(payloads[0]).toMatchObject({
      type: expectedType,
      screenId: 75,
      detail: { width: "2560" },
      minioIds: [],
      replacements: 1
    });
    await expect(fsp.readFile(filePath, "utf8")).resolves.toContain('"width": "1920"');
  });

  it("数据过滤器文件挂起为 save_filter，并把同名 .js 合并进 dataFormatter", async () => {
    const { filePath } = await dataFilterFixture();
    const payloads: Array<Record<string, unknown>> = [];

    await executeEditFiles([{ path: filePath, edits: [{ old_string: '"a"', new_string: '"b"' }] }], {
      toolCallId: "filter",
      onSuspend: (payload) => payloads.push(payload)
    });

    expect(payloads).toHaveLength(1);
    expect(payloads[0]).toMatchObject({
      type: SuspendType.SaveFilter,
      filterName: "我的过滤器",
      filter: { name: "我的过滤器", callBack: ["b"], dataFormatter: "const fn = () => 1;" },
      replacements: 1
    });
  });

  it("过滤器改名时 payload 带上旧名，工作区只留新名的两个文件", async () => {
    const { filePath } = await dataFilterFixture();
    const filterDir = path.dirname(filePath);
    const payloads: Array<Record<string, unknown>> = [];
    const files = [{ path: filePath, edits: [{ old_string: '"name": "我的过滤器"', new_string: '"name": "新名"' }] }];

    await executeEditFiles(files, { toolCallId: "filter-rename", onSuspend: (payload) => payloads.push(payload) });

    // 前端的 handleSaveFilter 只按 name 做 upsert，没有旧名就会新旧并存
    expect(payloads[0]).toMatchObject({ filterName: "新名", originalName: "我的过滤器" });

    await executeEditFiles(files, {
      toolCallId: "filter-rename",
      resumeData: { filterSaved: true, batchId: payloads[0].batchId, operationId: payloads[0].operationId }
    });

    const remaining = (await fsp.readdir(filterDir)).sort();
    expect(remaining).toEqual(["新名.js", "新名.json"]);
  });

  it("过滤器写坏 schema 时不挂起，直接返回 validationErrors 且不落盘", async () => {
    const { filePath } = await dataFilterFixture();
    const before = await fsp.readFile(filePath, "utf8");
    const payloads: Array<Record<string, unknown>> = [];

    // 读的时候 readDataFilters 是会因为校验不过整屏抛错的，写的时候不挡就等于把大屏写死
    const result = (await executeEditFiles(
      [{ path: filePath, edits: [{ old_string: '"callBackStatus": false', new_string: '"callBackStatus": "no"' }] }],
      { toolCallId: "filter-invalid", onSuspend: (payload) => payloads.push(payload) }
    )) as { success: boolean; results: Array<{ validationErrors?: string[] }> };

    expect(payloads).toHaveLength(0);
    expect(result.success).toBe(false);
    expect(result.results[0].validationErrors?.join("\n")).toContain("callBackStatus");
    await expect(fsp.readFile(filePath, "utf8")).resolves.toBe(before);
  });

  it("屏幕配置写坏 schema 时不挂起，直接返回 validationErrors 且不落盘", async () => {
    const filePath = path.join(await screenFixture(), "info.json");
    const before = await fsp.readFile(filePath, "utf8");
    const payloads: Array<Record<string, unknown>> = [];

    const result = (await executeEditFiles(
      [{ path: filePath, edits: [{ old_string: '"scale": 2', new_string: '"scale": "big"' }] }],
      { toolCallId: "screen-info-invalid", onSuspend: (payload) => payloads.push(payload) }
    )) as { success: boolean; results: Array<{ validationErrors?: string[] }> };

    expect(payloads).toHaveLength(0);
    expect(result.success).toBe(false);
    expect(result.results[0].validationErrors?.join("\n")).toContain("scale");
    await expect(fsp.readFile(filePath, "utf8")).resolves.toBe(before);
  });

  it("agent 从 info.json 删掉的字段真的会消失，不会被旧值补回来", async () => {
    const screenRoot = await screenFixture();
    const filePath = path.join(screenRoot, "info.json");
    // 挑一个 schema 上可有可无的字段（走 catchall）——删必填字段会被前面那道校验直接挡掉
    expect(JSON.parse(await fsp.readFile(filePath, "utf8"))).toHaveProperty("hasPassword");
    const payloads: Array<Record<string, unknown>> = [];
    const files = [{ path: filePath, edits: [{ old_string: '  "hasPassword": null,\n', new_string: "" }] }];

    await executeEditFiles(files, { toolCallId: "screen-info-delete", onSuspend: (payload) => payloads.push(payload) });
    await executeEditFiles(files, {
      toolCallId: "screen-info-delete",
      resumeData: { screenInfoUpdated: true, batchId: payloads[0].batchId, operationId: payloads[0].operationId }
    });

    // info.json 是这些字段的唯一来源，整份替换才有删除语义——合并写法下旧值会被静默补回来
    const after = JSON.parse(await fsp.readFile(filePath, "utf8"));
    expect(after).not.toHaveProperty("hasPassword");
    expect(after.id).toBe(75);
    // 不在 info.json 里、各自独立落盘的三个字段不能被这次替换清空
    expect(after.dataFilterArr).toBeUndefined();
    await expect(fsp.readFile(path.join(screenRoot, "statusAnimation.json"), "utf8")).resolves.not.toBe("");
  });

  it("组件文件校验通过后挂起为 push_component_update", async () => {
    const filePath = await componentTree();
    const payloads: Array<Record<string, unknown>> = [];

    await executeEditFiles([{ path: filePath, edits: [{ old_string: '"zIndex": 0', new_string: '"zIndex": 9' }] }], {
      toolCallId: "component",
      onSuspend: (payload) => payloads.push(payload)
    });

    expect(payloads).toHaveLength(1);
    expect(payloads[0]).toMatchObject({
      type: SuspendType.PushComponentUpdate,
      component: { id: FIXTURE_COMPONENT_ID, zIndex: 9 },
      replacements: 1
    });
  });

  it("组件校验失败时不挂起，直接返回 validationErrors 且不落盘", async () => {
    const filePath = await componentTree();
    const payloads: Array<Record<string, unknown>> = [];

    const result = (await executeEditFiles(
      [{ path: filePath, edits: [{ old_string: '"zIndex": 0', new_string: '"zIndex": "not-a-number"' }] }],
      { toolCallId: "component-invalid", onSuspend: (payload) => payloads.push(payload) }
    )) as { success: boolean; results: Array<{ validationErrors?: string[] }> };

    expect(payloads).toHaveLength(0);
    expect(result.success).toBe(false);
    expect(result.results[0].validationErrors?.length).toBeGreaterThan(0);
    await expect(fsp.readFile(filePath, "utf8")).resolves.toContain('"zIndex": 0');
  });

  it("agent 内部产物在 ASK 模式下不询问用户，直接落盘", async () => {
    const workspace = await createTempWorkspace({ "screen_1/_analysis.json": '{"note":"old"}' });
    const filePath = path.join(workspace, "screen_1/_analysis.json");
    const payloads: Array<Record<string, unknown>> = [];

    const result = (await executeEditFiles([{ path: filePath, edits: [{ old_string: "old", new_string: "new" }] }], {
      mode: AgentMode.ASK_BEFORE_EDIT,
      toolCallId: "artifact",
      onSuspend: (payload) => payloads.push(payload)
    })) as { success: boolean };

    expect(payloads).toHaveLength(0);
    expect(result.success).toBe(true);
    await expect(fsp.readFile(filePath, "utf8")).resolves.toBe('{"note":"new"}');
  });
});

describe("edit_files resume 结算", () => {
  /** 跑到第一次挂起，返回 payload 与可原样复用的 files（resume 必须传同一份输入）。 */
  async function suspendOnce(
    filePath: string,
    edit: { old_string: string; new_string: string },
    toolCallId: string,
    mode: AgentMode = AgentMode.AUTO_EDIT
  ) {
    const payloads: Array<Record<string, unknown>> = [];
    const files: EditInput[] = [{ path: filePath, edits: [edit] }];
    const initialResult = await executeEditFiles(files, {
      mode,
      toolCallId,
      onSuspend: (payload) => payloads.push(payload)
    });
    expect(payloads, JSON.stringify(initialResult)).toHaveLength(1);
    return { payload: payloads[0], files };
  }

  it("组件推送成功时标记 frontendSynced", async () => {
    const filePath = await componentTree();
    const toolCallId = "resume-component-ok";
    const { payload, files } = await suspendOnce(
      filePath,
      { old_string: '"zIndex": 0', new_string: '"zIndex": 9' },
      toolCallId
    );

    const result = (await executeEditFiles(files, {
      toolCallId,
      resumeData: { componentUpdated: true, batchId: payload.batchId, operationId: payload.operationId }
    })) as { success: boolean; results: Array<{ frontendSynced?: boolean; message: string }> };

    expect(result.success).toBe(true);
    expect(result.results[0].frontendSynced).toBe(true);
    expect(result.results[0].message).toContain("组件已推送到前端并写入工作区");
  });

  it("组件推送失败时标记未同步且工作区保持原样", async () => {
    const filePath = await componentTree();
    const toolCallId = "resume-component-fail";
    const { payload, files } = await suspendOnce(
      filePath,
      { old_string: '"zIndex": 0', new_string: '"zIndex": 9' },
      toolCallId
    );

    const result = (await executeEditFiles(files, {
      toolCallId,
      resumeData: {
        componentUpdated: false,
        error: "前端离线",
        batchId: payload.batchId,
        operationId: payload.operationId
      }
    })) as { success: boolean; results: Array<{ frontendSynced?: boolean; message: string }> };

    expect(result.success).toBe(false);
    expect(result.results[0].frontendSynced).toBe(false);
    expect(result.results[0].message).toContain("前端离线");
    await expect(fsp.readFile(filePath, "utf8")).resolves.toContain('"zIndex": 0');
  });

  it("过滤器保存成功时标记 frontendSynced", async () => {
    const { filePath, componentPath } = await dataFilterFixture([{ label: "条形图", id: FIXTURE_COMPONENT_ID }]);
    const toolCallId = "resume-filter";
    const { payload, files } = await suspendOnce(filePath, { old_string: '"a"', new_string: '"b"' }, toolCallId);

    const result = (await executeEditFiles(files, {
      toolCallId,
      resumeData: { filterSaved: true, batchId: payload.batchId, operationId: payload.operationId }
    })) as { success: boolean; results: Array<{ frontendSynced?: boolean; message: string }> };

    expect(result.success).toBe(true);
    expect(result.results[0].frontendSynced).toBe(true);
    expect(result.results[0].message).toContain("过滤器已推送到前端并写入工作区");
    await expect(fsp.readFile(filePath, "utf8")).resolves.toContain('"b"');
    const component = JSON.parse(await fsp.readFile(componentPath, "utf8"));
    expect(component.listenArgs).toContainEqual({
      filterName: "我的过滤器",
      usageStatus: true,
      callbackFields: ["b"]
    });
  });

  it("屏幕配置保存失败时带出错误原因", async () => {
    const filePath = path.join(await screenFixture(), "info.json");
    const toolCallId = "resume-screen-info";
    const { payload, files } = await suspendOnce(
      filePath,
      { old_string: '"width": "1920"', new_string: '"width": "2560"' },
      toolCallId
    );

    const result = (await executeEditFiles(files, {
      toolCallId,
      resumeData: {
        screenInfoUpdated: false,
        error: "保存超时",
        batchId: payload.batchId,
        operationId: payload.operationId
      }
    })) as { success: boolean; results: Array<{ frontendSynced?: boolean; message: string }> };

    expect(result.success).toBe(false);
    expect(result.results[0].frontendSynced).toBe(false);
    expect(result.results[0].message).toContain("保存超时");
    await expect(fsp.readFile(filePath, "utf8")).resolves.toContain('"width": "1920"');
  });

  it("ASK 模式挂起等待审批期间，工作区一个字节都没动", async () => {
    const filePath = await componentTree();
    const before = await fsp.readFile(filePath, "utf8");

    const { payload } = await suspendOnce(
      filePath,
      { old_string: '"zIndex": 0', new_string: '"zIndex": 9' },
      "ask-not-written-yet",
      AgentMode.ASK_BEFORE_EDIT
    );

    // 审批框里已经能看到改完的样子（组件已过 core），但磁盘还是原样
    expect(payload.type).toBe(SuspendType.AskApprovalPushComponentUpdate);
    expect(payload.component).toMatchObject({ id: FIXTURE_COMPONENT_ID, zIndex: 9 });
    await expect(fsp.readFile(filePath, "utf8")).resolves.toBe(before);
  });

  it("ASK 模式下用户拒绝时，工作区保持原样", async () => {
    const filePath = await componentTree();
    const before = await fsp.readFile(filePath, "utf8");
    const toolCallId = "resume-rejected";
    const { payload, files } = await suspendOnce(
      filePath,
      { old_string: '"zIndex": 0', new_string: '"zIndex": 9' },
      toolCallId,
      AgentMode.ASK_BEFORE_EDIT
    );

    expect(payload.type).toBe(SuspendType.AskApprovalPushComponentUpdate);

    const result = (await executeEditFiles(files, {
      mode: AgentMode.ASK_BEFORE_EDIT,
      toolCallId,
      resumeData: { approved: false, batchId: payload.batchId, operationId: payload.operationId }
    })) as { success: boolean; results: Array<{ frontendSynced?: boolean; message: string }> };

    expect(result.success).toBe(false);
    expect(result.results[0].frontendSynced).toBe(false);
    expect(result.results[0].message).toContain("工作区未改动");
    // 拒绝 = 这次编辑从未发生。落盘推迟到批准之后，这里必须一字未改
    await expect(fsp.readFile(filePath, "utf8")).resolves.toBe(before);
  });

  it.each([
    [false, '"width": "1920"'],
    [true, '"width": "2560"']
  ] as const)("屏幕配置审批，approved=%s，工作区保存为 %s", async (approved, expected) => {
    const screenRoot = await screenFixture();
    const filePath = path.join(screenRoot, "info.json");
    const toolCallId = `screen-info-approval-${String(approved)}`;
    const { payload, files } = await suspendOnce(
      filePath,
      { old_string: '"width": "1920"', new_string: '"width": "2560"' },
      toolCallId,
      AgentMode.ASK_BEFORE_EDIT
    );

    await executeEditFiles(files, {
      mode: AgentMode.ASK_BEFORE_EDIT,
      toolCallId,
      resumeData: approved
        ? { screenInfoUpdated: true, batchId: payload.batchId, operationId: payload.operationId }
        : { approved: false, batchId: payload.batchId, operationId: payload.operationId }
    });

    await expect(fsp.readFile(filePath, "utf8")).resolves.toContain(expected);
    const layout = JSON.parse(await fsp.readFile(path.join(screenRoot, "_layout.json"), "utf8"));
    expect(layout.screen.width).toBe(approved ? 2560 : 1920);
  });

  it("ASK 模式下过滤器被拒绝时不落盘，且 payload 用的是内存里的新内容", async () => {
    const { filePath } = await dataFilterFixture();
    const toolCallId = "filter-rejected";
    const { payload, files } = await suspendOnce(
      filePath,
      { old_string: '"a"', new_string: '"b"' },
      toolCallId,
      AgentMode.ASK_BEFORE_EDIT
    );

    // 还没落盘，但 payload 里已经是改完的样子——被编辑的那个文件取内存内容，配套的 .js 才读盘
    expect(payload.type).toBe(SuspendType.AskApprovalSaveFilter);
    expect(payload.filter).toMatchObject({ callBack: ["b"], dataFormatter: "const fn = () => 1;" });
    await expect(fsp.readFile(filePath, "utf8")).resolves.toContain('"a"');

    const result = (await executeEditFiles(files, {
      mode: AgentMode.ASK_BEFORE_EDIT,
      toolCallId,
      resumeData: { approved: false, batchId: payload.batchId, operationId: payload.operationId }
    })) as { results: Array<{ message: string }> };

    expect(result.results[0].message).toContain("工作区未改动");
    await expect(fsp.readFile(filePath, "utf8")).resolves.toContain('"a"');
  });

  it("ASK 模式下用户批准时，这时才落盘", async () => {
    const filePath = await componentTree();
    const toolCallId = "resume-approved";
    const { payload, files } = await suspendOnce(
      filePath,
      { old_string: '"zIndex": 0', new_string: '"zIndex": 9' },
      toolCallId,
      AgentMode.ASK_BEFORE_EDIT
    );

    const result = (await executeEditFiles(files, {
      mode: AgentMode.ASK_BEFORE_EDIT,
      toolCallId,
      resumeData: { componentUpdated: true, batchId: payload.batchId, operationId: payload.operationId }
    })) as { success: boolean; results: Array<{ frontendSynced?: boolean; message: string }> };

    expect(result.success).toBe(true);
    expect(result.results[0].frontendSynced).toBe(true);
    await expect(fsp.readFile(filePath, "utf8")).resolves.toContain('"zIndex": 9');
  });

  it("vue-part 推送成功时通过组件 core 回写 SFC，并保留 JSON 文件指针", async () => {
    const screenRoot = await screenFixture();
    const filePath = path.join(screenRoot, "component", "4166_自定义组件.vue");
    const jsonPath = filePath.replace(/\.vue$/, ".json");
    const component = JSON.parse(await fsp.readFile(jsonPath, "utf8"));
    component.option.funName = "fun-card";
    await fsp.writeFile(jsonPath, JSON.stringify(component, null, 2), "utf8");
    const toolCallId = "resume-vue-part";
    const { payload, files } = await suspendOnce(
      filePath,
      { old_string: 'name: "fun-card"', new_string: 'name: "fun-card-updated"' },
      toolCallId
    );

    const pushedComponent = payload.component as { option: { js: string } };
    expect(pushedComponent.option.js).toContain('name: "fun-card-updated"');
    await expect(fsp.readFile(filePath, "utf8")).resolves.toContain('name: "fun-card"');

    await executeEditFiles(files, {
      toolCallId,
      resumeData: { componentUpdated: true, batchId: payload.batchId, operationId: payload.operationId }
    });

    await expect(fsp.readFile(filePath, "utf8")).resolves.toContain('name: "fun-card-updated"');
    await expect(fsp.readFile(jsonPath, "utf8")).resolves.toContain('"js": "4166_自定义组件.vue"');
  });
});
