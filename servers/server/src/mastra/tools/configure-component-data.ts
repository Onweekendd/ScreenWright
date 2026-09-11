/**
 * 给组件配数据来源：一步完成校验、写入组件文件、并把**这个源真能取出哪些字段**还给 agent。
 *
 * ## 为什么要有这个工具
 *
 * 之前 agent 是手写这些字段的，代价在 b8 实测里看得很清楚：
 *
 *   - 摸注册表：`list_files api-registry` → `read index.json` → `read paths/*.json`（3~5 次）
 *   - 找字段名：`ft-dataContainer.md` 只有 534 字节、只字未提请求配置，逼出两次满目录
 *     `grep "dataMethod|requestBody|requestHeader"`
 *   - 手写 `dataType` / `dataSource` / `url` / `path` / `dataMethod` 到组件 JSON
 *
 * 加起来约十次调用，而这些全都是**平台本来就知道的事**。低代码 UI 里人是怎么配的
 * （`dataApi.vue`：选数据源 → 选接口 → 填 method/headers/body → 点测试看字段），
 * 工具就该给 agent 同样的东西。
 *
 * ## 正题：回执里的 `fields` 与 `sample`
 *
 * 写字段只是顺带，这个工具真正的产出是**「这个源能取出哪些字段」**。
 *
 * 反复出现的失败模式是模型在没有权威可依时**编一个看着很合理的名字**——把
 * `{name, seriesName, value}` 编成 `{time, load, output}`，编表格的列键，编接口路径。
 * 编出来的东西磁盘上完全合法，Zod 一个字都不会说，只有真取数时才空。
 * 而字段清单平台手上就有，给它就是了。
 *
 * ## 为什么设计成「数据源」而不是「API」
 *
 * 三种源在本仓**已经**归一到同一个形状 `{ headers: [{name,type}], values }`（对齐 Java）：
 *
 *   - API  → `apiConnect`（真发一次请求，从首条推断字段与类型）
 *   - CSV  → `DataLocal.content` 存的就是 `{ headers, values }`
 *   - DB   → `executeSql` 返回行数组，同样推得出字段
 *
 * 所以入参按源类型分支、回执统一。眼下只实现 API 分支（{@link SourceType}），
 * db / csv 是加分支的事，回执形状不用动。
 *
 * ## `probed` 不能谎报
 *
 * `apiConnect` 是真发请求的，接口没起来就探不到。这时**回退到 swagger 声明的 schema**，
 * 并把 `probed` 标成 false——声明与实测是两回事，不能拿前者冒充后者。b8 头注释里
 * 「别拿这里的绿灯替『接口能取到数』背书」说的是同一件事。
 */

import fsp from "node:fs/promises";
import path from "node:path";

import { createTool } from "@mastra/core/tools";
import type { ComponentType } from "@screenwright/types";
import { DataType } from "@screenwright/types";
import z from "zod";

import { getAgentWorkspacePath } from "@/agent-resources/workspace-path";
import { apiConnect } from "@/mastra/services/data-source.server";
import { getSwaggerIndex, listRegisteredDatasourceIds, pathToFileName } from "@/mastra/services/swagger-registry";

import { applyComponentEdit } from "../services/bi-data-sync/component-edit";
import { prismaClient } from "../storage/prisma";
import { AgentMode } from "../types/bi-chat";
import { SuspendDefs, SuspendType } from "../types/suspend";
import { type Change, ChangeSchema, diffChange } from "./change-report";
import { findComponentFileInWorkspace, isAmbiguousMatch, validateComponentContent } from "./file/utils";

/**
 * 工作区根**每次现读**，不在模块加载时定格。
 *
 * 定格的那份跟 `getSwaggerIndex` / `listRegisteredDatasourceIds`（它们每次现读）在运行期
 * 可能不是同一个目录，于是「index.json 读得到、paths/*.json 读不到」——实测就栽过一次。
 * 同一条纪律见 `create-data-filter.ts` 里关于 `getScreenDirPath` 的注释。
 */
const workspaceBase = (): string => getAgentWorkspacePath();

/**
 * suspend 前算好的字段清单，resume 那一轮取回。key 是 `toolCallId`。
 *
 * **为什么非缓存不可**：AUTO_EDIT 下这个工具走 `suspend` → 前端应用 → `resume`，
 * 而 `suspend()` 的返回值是 never——那一轮算出的 `fields` agent 一个字都看不到。
 * resume 是新一轮 `execute`，局部变量早没了。不带过去的话，工具的**核心产出就丢了**，
 * 回执只剩一句「已配置」，agent 照样得自己去翻 api-registry 猜字段名。
 *
 * 与 change-report 那边「不为 change 建缓存」的取舍不同：那里 `fieldChange` 重读一次文件
 * 就有了，这里重算要么再发一次请求、要么谎报 `probed`。
 *
 * 生命周期与 `edit-files` 的 `batchStates` 同套路：resume 取出即删；没走到 resume 的
 * （用户拒绝、流程中断）留一条几百字节的记录，进程级可接受。
 */
const pendingProbes = new Map<string, { fields: z.infer<typeof FieldSchema>[]; sample: unknown[]; probed: boolean }>();

/** `DataSource.type`：1=数据库，2=API。见 data-source.server.ts 的 listSources 注释。 */
const DATASOURCE_TYPE_API = 2;

/** 眼下只开 api 一支；db / csv 是加分支的事，回执形状已经为它们留好了 */
const SourceType = z.enum(["api"]);

const FieldSchema = z.object({
  name: z.string().describe("字段名，写 dataFormatter 时按这个名字取值"),
  type: z.string().describe("string / number / boolean"),
  description: z.string().optional().describe("接口文档里对这个字段的说明")
});

const InputSchema = z.object({
  componentRef: z
    .string()
    .min(1)
    .describe('目标组件，推荐带屏前缀的 "{screenId}_{versionCode}/{componentId}"，如 "9001_1/900001"'),
  sourceType: SourceType.default("api").describe("数据源种类。目前支持 api"),
  datasourceId: z
    .number()
    .optional()
    .describe("数据源 id。不填会报错并列出当前可用的全部数据源——不要猜，也不要去列 api-registry 目录"),
  apiPath: z
    .string()
    .optional()
    .describe("接口路径，如 /api/production/lines。必须是该数据源真实注册过的路径；写错会报错并列出全部可选"),
  method: z
    .enum(["get", "post", "put", "delete"])
    .optional()
    .describe("HTTP 方法。不填时若该路径只声明了一种方法，自动用它"),
  requestHeader: z.record(z.string(), z.any()).optional().describe("请求头"),
  requestBody: z.record(z.string(), z.any()).optional().describe("请求体（post/put 用）"),
  dataSite: z
    .string()
    .optional()
    .describe('数据在响应里的位置，如 "data"。响应形如 { code, data: [...] } 时填 data；不填则整个响应体当数据'),
  probe: z
    .boolean()
    .optional()
    .default(true)
    .describe("是否真发一次请求来确认字段。默认 true；探不通会自动回退到接口文档声明的 schema")
});

interface ApiSource {
  id: number;
  name: string;
  /** 前端配数据源时写的那份 JSON 字符串，至少含 baseUrl。`apiFilter.getData` 只读它的 baseUrl */
  config?: string;
}

/** 组件上那几个请求字段是平铺的，且 `ComponentType` 上没有精确类型，按需窄化着写 */
interface RequestFields {
  dataType?: number;
  dataSource?: { id: number; name: string; config?: string };
  url?: string;
  path?: string;
  dataMethod?: string;
  requestHeader?: unknown;
  requestBody?: unknown;
}

const relativeToWorkspace = (abs: string): string => path.relative(workspaceBase(), abs).replace(/\\/gu, "/");

/**
 * 当前可用的 API 数据源。报错时列出来，省掉 agent 去列 api-registry 目录那一趟。
 *
 * **库优先、目录兜底**：`DataSource`（type=2）是权威清单，但注册表目录里可能有库里没有的
 * 数据源——eval 的 `seedApiRegistry` 就只种目录不写库，本地离线导入也一样。只认库的话
 * 这些环境下工具直接不可用，而目录里那份 swagger 明明就够校验路径。
 * 库里查不到名字时退而用 swagger 的 title。
 */
const listApiSources = async (): Promise<ApiSource[]> => {
  const byId = new Map<number, ApiSource>();
  try {
    const rows = await prismaClient.dataSource.findMany({
      where: { type: DATASOURCE_TYPE_API },
      select: { id: true, name: true, config: true },
      orderBy: [{ id: "asc" }]
    });
    for (const row of rows) {
      // 库里那份 config 是权威的（前端配数据源时写的），原样带走，别自己拼一个出来
      byId.set(row.id, {
        id: row.id,
        name: row.name,
        config: typeof row.config === "string" ? row.config : row.config ? JSON.stringify(row.config) : undefined
      });
    }
  } catch {
    // 库连不上不该让工具整个不可用：注册表目录还在，照样能校验路径
  }
  for (const id of listRegisteredDatasourceIds()) {
    if (byId.has(id)) {
      continue;
    }
    const index = getSwaggerIndex(id);
    byId.set(id, {
      id,
      name: index?.title ?? `数据源 ${id}`,
      // 库里没有这条时按注册表拼一份等价的。形状对齐前端写的那份
      // （`apiFilter.getData` 只读 config.baseUrl），少了它 url 会被错误拼接
      config: index ? JSON.stringify({ baseUrl: index.baseUrl, type: "api", swaggerUrl: index.swaggerUrl }) : undefined
    });
  }
  return [...byId.values()].sort((a, b) => a.id - b.id);
};

/**
 * 从 OpenAPI 的响应 schema 里摘出数据项的字段表。
 *
 * 只往下走到「数组的 items」或「对象的 properties」这一层就停——再深的嵌套对 agent 写
 * `dataFormatter` 没有帮助，反而把回执撑长。探不通接口时这是唯一的字段来源。
 */
const fieldsFromSpec = (methodSpec: unknown, dataSite?: string): z.infer<typeof FieldSchema>[] => {
  const spec = methodSpec as {
    responses?: Record<string, { content?: Record<string, { schema?: Record<string, unknown> }> }>;
  };
  const schema = spec?.responses?.["200"]?.content?.["application/json"]?.schema;
  if (!schema) {
    return [];
  }

  // dataSite 指到哪一层就从哪一层开始找，不给就从响应根开始
  let node: Record<string, unknown> | undefined = schema;
  if (dataSite) {
    for (const segment of dataSite.split(".")) {
      const properties = node?.properties as Record<string, Record<string, unknown>> | undefined;
      node = properties?.[segment];
      if (!node) {
        return [];
      }
    }
  }
  // 数组就看它的元素长什么样
  if (node?.type === "array") {
    node = node.items as Record<string, unknown> | undefined;
  }

  const properties = node?.properties as
    | Record<string, { type?: string; description?: string; example?: unknown }>
    | undefined;
  if (!properties) {
    return [];
  }
  return Object.entries(properties).map(([name, value]) => ({
    name,
    type: value.type === "integer" ? "number" : (value.type ?? "string"),
    ...(value.description ? { description: value.description } : {})
  }));
};

export const configureComponentData = createTool({
  // id 必须与 agent 里的注册键一致：常驻工具在模型眼里的名字取自 tools 对象的键
  id: "configureComponentData",
  description:
    "给组件配数据来源，一步完成校验、写入组件文件并推送前端，并把该数据源**真能取出哪些字段**返回给你。" +
    "写 dataFormatter 时按返回的 fields 取值——不要凭接口名猜字段名。" +
    "datasourceId / apiPath 填错或不填会直接报错并列出全部可选项，" +
    "所以不要去列 api-registry 目录、也不要为了找请求字段名去 grep skills。",
  inputSchema: InputSchema,

  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    fields: z.array(FieldSchema).optional().describe("这个数据源能取出的字段。写 dataFormatter 按这个来"),
    sample: z.array(z.any()).optional().describe("一两条真实样本"),
    probed: z.boolean().optional().describe("true=真发过请求拿到的字段；false=仅来自接口文档声明，未实测"),
    change: z.array(ChangeSchema).optional()
  }),

  suspendSchema: z.union([
    SuspendDefs[SuspendType.PushComponentUpdate].suspend,
    SuspendDefs[SuspendType.AskApprovalPushComponentUpdate].suspend
  ]),
  resumeSchema: z.union([
    SuspendDefs[SuspendType.AskApprovalPushComponentUpdate].resume,
    SuspendDefs[SuspendType.PushComponentUpdate].resume
  ]),

  execute: async (input, context) => {
    const { componentRef, datasourceId, apiPath, method, requestHeader, requestBody, dataSite, probe } =
      input as unknown as z.infer<typeof InputSchema>;
    const mode = context?.requestContext?.get("mode") as AgentMode | undefined;
    const { resumeData, suspend, toolCallId } = context?.agent ?? {};

    // 前端应用完回到这里：写入在挂起之前就做完了，这一轮只负责如实转述
    if (resumeData && "componentUpdated" in resumeData) {
      const r = resumeData as { componentUpdated?: boolean; error?: string };
      if (r.componentUpdated === false) {
        throw new Error(`配置数据源时前端应用失败: ${r.error ?? "未提供原因"}`);
      }
      // 字段清单是挂起前那一轮算出来的，从缓存取回——不重复探测，也不能不给
      const probe0 = toolCallId ? pendingProbes.get(toolCallId) : undefined;
      if (toolCallId) {
        pendingProbes.delete(toolCallId);
      }
      const found = await findComponentFileInWorkspace(workspaceBase(), componentRef);
      const change: Change[] =
        found && !isAmbiguousMatch(found)
          ? [{ file: relativeToWorkspace(found.file), note: `已写入 API 数据源配置：${apiPath ?? ""}` }]
          : [];
      return {
        success: true,
        message:
          `组件 ${componentRef} 的数据源已配置。` +
          (probe0
            ? (probe0.probed
                ? "fields 是真发请求测到的。"
                : "接口没探通，fields 来自接口文档声明、未经实测——真取数时以实际响应为准。") +
              "下一步：给这个组件建过滤器时，dataFormatter 里按 fields 里的名字取值。"
            : ""),
        ...(probe0 ? { fields: probe0.fields, sample: probe0.sample, probed: probe0.probed } : {}),
        change
      };
    }

    // ── 数据源：不填就把可选项全列出来，不让 agent 去猜 ────────────────────────
    const sources = await listApiSources();
    if (datasourceId === undefined) {
      throw new Error(
        sources.length === 0
          ? "当前没有可用的 API 数据源。请先在平台里注册一个，或确认 swagger 已导入。"
          : `datasourceId 必填。当前可用的 API 数据源：${sources.map((s) => `${s.id}(${s.name})`).join("、")}`
      );
    }
    const source = sources.find((s) => s.id === datasourceId);
    if (!source) {
      throw new Error(
        `数据源 ${datasourceId} 不是可用的 API 数据源。可选：${sources.map((s) => `${s.id}(${s.name})`).join("、") || "无"}`
      );
    }

    const index = getSwaggerIndex(datasourceId);
    if (!index) {
      throw new Error(`数据源 ${datasourceId}(${source.name}) 还没有注册过接口文档，无法校验路径`);
    }

    // ── 路径：这是最容易「编一个看着很合理的名字」的地方，必须挡在这里 ──────────
    if (!apiPath) {
      throw new Error(`apiPath 必填。${source.name} 已注册的接口：${index.paths.join("、")}`);
    }
    if (!index.paths.includes(apiPath)) {
      throw new Error(`接口路径「${apiPath}」在 ${source.name} 里不存在。已注册的接口：${index.paths.join("、")}`);
    }

    // ── 方法：路径对、方法错在磁盘上完全合法，只有真发请求时才 405 ───────────────
    const specPath = path.join(workspaceBase(), "api-registry", String(datasourceId), "paths", pathToFileName(apiPath));
    let pathSpec: Record<string, unknown> = {};
    try {
      pathSpec = JSON.parse(await fsp.readFile(specPath, "utf-8")) as Record<string, unknown>;
    } catch {
      throw new Error(`接口 ${apiPath} 的文档缺失（${relativeToWorkspace(specPath)}），请重新注册该数据源的 swagger`);
    }
    const declared = Object.keys(pathSpec).filter((k) => k !== "path");
    const chosenMethod = method ?? (declared.length === 1 ? declared[0] : undefined);
    if (!chosenMethod) {
      throw new Error(`接口 ${apiPath} 声明了多个方法（${declared.join("、")}），请用 method 指明一个`);
    }
    if (!declared.includes(chosenMethod)) {
      throw new Error(`接口 ${apiPath} 没有声明 ${chosenMethod} 方法。它支持：${declared.join("、")}`);
    }

    // ── 字段清单：先真探，探不通退回声明 ───────────────────────────────────────
    let fields = fieldsFromSpec(pathSpec[chosenMethod], dataSite);
    let sample: unknown[] = [];
    let probed = false;
    if (probe) {
      try {
        const probedResult = await apiConnect({
          url: `${index.baseUrl}${apiPath}`,
          method: chosenMethod,
          headers: requestHeader,
          data: requestBody,
          dataSite
        });
        const { headers, values } = probedResult.result as {
          headers: Array<{ name: string; type: string }>;
          values: unknown[];
        };
        if (headers.length > 0) {
          // 实测拿到了字段名与真实类型，但描述只有文档里有，两边并一并
          const described = new Map(fields.map((f) => [f.name, f.description]));
          fields = headers.map((h) => ({
            name: h.name,
            type: h.type,
            ...(described.get(h.name) ? { description: described.get(h.name) as string } : {})
          }));
          sample = values.slice(0, 2);
          probed = true;
        }
      } catch {
        // 接口没起来是常态（本地开发、离线），不是错误。回退到声明，probed 保持 false
      }
    }

    // ── 写组件 ────────────────────────────────────────────────────────────────
    const found = await findComponentFileInWorkspace(workspaceBase(), componentRef);
    if (!found) {
      throw new Error(`找不到组件 ${componentRef}`);
    }
    if (isAmbiguousMatch(found)) {
      throw new Error(
        `组件引用 ${componentRef} 在多块屏上都命中了：${found.ambiguous.join("、")}。请带上屏前缀，如 "9001_1/900001"`
      );
    }

    const raw = await fsp.readFile(found.file, "utf8");
    let component: Record<string, unknown>;
    try {
      component = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw new Error(`组件文件不是合法 JSON：${found.file}`);
    }

    const fieldsToWrite: RequestFields = {
      dataType: DataType.API,
      // config 不能省：`apiFilter.getData` 读不到它就把 apiBaseUrl 当空串，
      // 于是 `target.url != ""` 成立、走进拼接分支。写全并保证 url === config.baseUrl，
      // 才是那条「不拼接、直接 url + path」的正路
      dataSource: { id: datasourceId, name: source.name, ...(source.config ? { config: source.config } : {}) },
      url: index.baseUrl,
      path: apiPath,
      dataMethod: chosenMethod,
      ...(requestHeader ? { requestHeader } : {}),
      ...(requestBody ? { requestBody } : {})
    };
    Object.assign(component, fieldsToWrite);

    const newContent = JSON.stringify(component, null, 2);
    const validation = validateComponentContent(newContent);
    if (!validation.ok) {
      throw new Error(
        `写入后组件校验失败: ${validation.message}${
          validation.validationErrors ? "\n" + validation.validationErrors.join("\n") : ""
        }`
      );
    }

    // 与 edit_files / configureCallbackArgs 同一条：文本交给 core 合进整屏树再落盘，
    // 工作区只有这一条写入路径
    const applied = await applyComponentEdit(found.file, newContent);
    if (!applied) {
      throw new Error(`组件 ${componentRef} 不在大屏树上，改动未写入工作区`);
    }

    if (suspend) {
      // 挂起前把字段清单存下，resume 那一轮才拿得回来（见 pendingProbes 注释）
      if (toolCallId) {
        pendingProbes.set(toolCallId, { fields, sample, probed });
      }
      const componentForPush = applied.component as ComponentType;
      return suspend(
        mode === AgentMode.ASK_BEFORE_EDIT
          ? {
              type: SuspendType.AskApprovalPushComponentUpdate,
              purpose: `为组件 ${componentRef} 配置 API 数据源`,
              component: componentForPush,
              replacements: 1
            }
          : { type: SuspendType.PushComponentUpdate, component: componentForPush, replacements: 1 }
      ) as never;
    }

    return {
      success: true,
      message:
        `已配置 ${source.name} 的 ${chosenMethod.toUpperCase()} ${apiPath}。` +
        (probed
          ? "fields 是真发请求测到的。"
          : "接口没探通，fields 来自接口文档声明、未经实测——真取数时以实际响应为准。") +
        "下一步：给这个组件建过滤器时，dataFormatter 里按 fields 里的名字取值。",
      fields,
      sample,
      probed,
      change: diffChange(relativeToWorkspace(found.file), raw, newContent)
    };
  }
});
