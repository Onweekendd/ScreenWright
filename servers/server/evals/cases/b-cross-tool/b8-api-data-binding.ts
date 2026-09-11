/**
 * B8 · 把接口数据接到图表上
 *
 * 测的是领域提示词 §四 那七步能不能真的走完：建数据容器 → 配请求 → 给容器写过滤器 →
 * 配 `cbArgs` → 目标组件绑过滤器 → 目标过滤器把 `callbackArgs` 映射成渲染格式。
 * 七步里断掉任何一步，画布上都不报错，只是图表一直空着。
 *
 * ## 正题是「有没有去读注册表」
 *
 * 这条 case 最要紧的一句断言是 **`path` 必须是 `api-registry` 里真实存在的路径**。
 *
 * 它抓的是这一整轮反复出现的同一个失败模式：**模型在没有权威可依时会编一个看着很合理的
 * 名字**——编过 data 的字段名（`{name, seriesName, value}` 编成 `{time, load, output}`）、
 * 编过表格的列键（`label` 这个 schema 里根本没有的键）。接口路径是同一件事的第三次：
 * `/api/production/list` 比真实的 `/api/production/lines` 更「像」一个接口，磁盘上完全合法，
 * Zod 校验一个字都不会说，只有真发请求时才 404。而注册表就在工作区里躺着，读一下就有。
 *
 * ## 起点在屏之外
 *
 * `api-registry/` 是所有大屏共享的目录，`fixture` 表达不了，所以用 `setup` 种
 * （见 `harness/api-registry.ts`：离线快照 + 生产同一段写盘代码）。
 *
 * agent 得自己发现数据源 id——注册表的目录形状写在 `workspace-structure.md` 里，
 * 可通过工作区列目录工具发现数据源；prompt 不直接报 id 或接口路径。
 *
 * ## 这条验不到什么
 *
 * 验请求配置，以及注入模拟响应后 core 过滤器/回调链路的结果；fake 前端不发 API 请求。
 * 不验浏览器挂载、网络、代理和真实渲染。真实取数要求 mock-server 真在跑：
 * 在 `servers/mock-server` 运行 `pnpm mock:dev`，产线快照由 `src/data/mock-data.ts` 提供。
 * 别拿这里的绿灯替「接口能取到数」背书。
 */

import { DataType, type ComponentType } from "@screenwright/types";

import { AgentMode } from "@/mastra/types/bi-chat";

import productionLines from "../../../../mock-server/src/data/production-lines.json";
import { verifyProductionBinding } from "../../harness/api-data-binding";
import {
  methodsOf,
  MOCK_API_BASE_URL,
  MOCK_DATASOURCE_ID,
  registeredPaths,
  seedApiRegistry
} from "../../harness/api-registry";
import {
  type Assertion,
  type EvalCase,
  findComponent,
  flattenLayers,
  newComponents,
  screenFiles
} from "../../harness/case";

/** 条形图。起点屏里三个图表，挑第一个当消费端 */
const TARGET_ID = 4179;

const DATA_CONTAINER_PROP = "sw-dataContainer";

/** 组件上那几个请求字段是平铺的，且 `ComponentType` 上没有精确类型，按需窄化着读 */
interface RequestFields {
  url?: unknown;
  path?: unknown;
  dataMethod?: unknown;
  openFilter?: unknown;
}

const requestFieldsOf = (c: ComponentType): RequestFields => c as unknown as RequestFields;

const asString = (value: unknown): string => (typeof value === "string" ? value : "");

export const b8ApiDataBinding: EvalCase = {
  id: "b8-api-data-binding",
  title: "把接口数据接到图表上",
  fixture: "three-components",

  setup: async () => {
    await seedApiRegistry();
  },

  // 末尾那句禁止委派是**方差控制**，不是"这样更好"。同一条 case 连跑两次，agent 一次独自
  // 走完（37 步 / 51 工具 / 211s），一次派出 7 个子 agent（57 步 / 94 工具 / 324s）——断言
  // 两次都全绿，耗时和 token 却差出一半，改 prompt / 改 skill 的效果全淹没在这个方差里。
  // 钉死执行策略，L2 指标才比得动。
  //
  // 是提示层约束，**模型可以不听**：跑完核一眼报告里有没有子 agent 分支段，有就说明这轮
  // 没约束住，该轮的耗时对比作废。
  prompt:
    "工作区里已经注册好了工厂的接口数据源。请把生产线的实时状态数据接到这块大屏的「条形图」上，" +
    "让它显示各条产线的当日产量。\n" +
    "整个任务你自己从头做到尾：不要调用 ask_swExecutorAgent、ask_templateExtractorAgent、" +
    "ask_dataFlowVerificationAgent 委派，也不要用 createTask / claimTask 分发任务，自检也自己跑。",

  mode: AgentMode.AUTO_EDIT,

  assert: async (ctx): Promise<Assertion[]> => {
    const added = newComponents(ctx.before, ctx.screen);
    const containers = flattenLayers(ctx.screen.layers).filter((c) => c.component.prop === DATA_CONTAINER_PROP);
    const container = containers[0];
    const fields = container ? requestFieldsOf(container) : {};

    const known = registeredPaths();
    const chosenPath = asString(fields.path);
    const pathIsReal = known.includes(chosenPath);
    const chosenMethod = asString(fields.dataMethod).toLowerCase();
    const allowedMethods = pathIsReal ? methodsOf(chosenPath) : [];

    const target = findComponent(ctx.screen, TARGET_ID);
    const targetFilters = (target?.listenArgs ?? []).map((a) => a.filterName);
    const targetFields = target ? requestFieldsOf(target) : {};

    const filterFiles = screenFiles(ctx.workspace.screenDir).filter((f) => f.startsWith("dataFilterArr/"));
    const jsonBases = filterFiles.filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5));
    const jsBases = new Set(filterFiles.filter((f) => f.endsWith(".js")).map((f) => f.slice(0, -3)));
    const unpaired = jsonBases.filter((b) => !jsBases.has(b));

    return [
      {
        name: "工作区发生了变更",
        passed: ctx.fingerprintChanged,
        detail: ctx.fingerprintChanged ? undefined : "整屏指纹与起点一致，agent 什么都没落盘"
      },
      {
        name: "建出了数据容器",
        passed: container !== undefined,
        detail:
          container !== undefined
            ? `#${container.id}${containers.length > 1 ? `（共 ${containers.length} 个）` : ""}`
            : `本次新增的组件：${added.map((c) => `${c.id}/${c.component.prop}`).join("、") || "无"}`
      },
      // 本 case 的正题。路径编得再像也没用，注册表里没有就是 404。
      {
        name: "请求路径是注册表里真实存在的接口",
        passed: pathIsReal,
        detail: pathIsReal
          ? chosenPath
          : `实得 ${chosenPath === "" ? "空" : `「${chosenPath}」`}，注册表里只有：${known.join("、")}`
      },
      {
        name: "baseUrl 与请求方法跟注册表对得上",
        passed: pathIsReal && asString(fields.url) === MOCK_API_BASE_URL && allowedMethods.includes(chosenMethod),
        detail:
          `url=${asString(fields.url) || "空"}（应为 ${MOCK_API_BASE_URL}）；` +
          `method=${chosenMethod || "空"}（${pathIsReal ? `该路径声明了 ${allowedMethods.join("/")}` : "路径本身就不对，方法无从判断"}）`
      },
      // 七步里点名「最常漏的一处」：容器自己也要开过滤器，否则响应根本进不了过滤器
      {
        name: "使用 API 数据类型和已注册的数据源",
        passed: container?.dataType === DataType.API && container.dataSource?.id === MOCK_DATASOURCE_ID,
        detail: `dataType=${String(container?.dataType)}；dataSource.id=${String(container?.dataSource?.id)}`
      },
      {
        name: "选中生产线实时状态接口",
        passed: chosenPath === "/api/production/lines",
        detail: chosenPath || "未配置路径"
      },
      {
        name: "数据容器这一侧配全了（cbArgs + listenArgs + openFilter）",
        passed:
          (container?.cbArgs ?? []).length > 0 &&
          (container?.listenArgs ?? []).length > 0 &&
          fields.openFilter === true,
        detail: container
          ? `cbArgs ${(container.cbArgs ?? []).length} 项；listenArgs ${(container.listenArgs ?? []).length} 项；openFilter=${String(fields.openFilter)}`
          : "没有数据容器"
      },
      {
        name: "条形图绑上了过滤器并开了 openFilter",
        passed: targetFilters.length > 0 && targetFields.openFilter === true,
        detail: target
          ? `listenArgs=${targetFilters.join("、") || "空"}；openFilter=${String(targetFields.openFilter)}`
          : `#${TARGET_ID} 不在树上`
      },
      {
        name: "过滤器的 .json 与 .js 成对",
        passed: jsonBases.length > 0 && unpaired.length === 0,
        detail:
          jsonBases.length === 0
            ? "dataFilterArr/ 下一个 json 都没有"
            : `${jsonBases.length} 个 json${unpaired.length > 0 ? `，缺 js：${unpaired.join("、")}` : "，全部成对"}`
      },
      ...(container ? await verifyProductionBinding(ctx.screen, container.id, TARGET_ID, productionLines) : [])
    ];
  }
};
