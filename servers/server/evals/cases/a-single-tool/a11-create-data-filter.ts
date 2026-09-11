/**
 * A11 · 创建数据过滤器
 *
 * 过滤器是这套里唯一一个「一份数据、三处落地」的东西：整屏的 dataFilterArr、磁盘上成对的
 * {name}.json + {name}.js、以及被绑组件各自的 listenArgs。三处必须同时成立——
 *
 * - 只有 dataFilterArr：画布上过滤器存在，但没有组件在听它，配了等于没配
 * - 只有 listenArgs：组件指向一个不存在的过滤器，运行时静默失效
 * - .js 没写出来：过滤器有定义无实现，取数时报错
 *
 * 所以这里断言的是「闭合」，不是「建出来了」。文件名可能因含 Windows 非法字符被净化过，
 * 真实名字在 JSON 的 name 字段里，因此磁盘那条只数成对关系、不按名字去找。
 */

import { AgentMode } from "@/mastra/types/bi-chat";

import { type Assertion, type EvalCase, findComponent, screenFiles } from "../../harness/case";

const FILTER_NAME = "地区筛选";
const BOUND_IDS = [4179, 4180]; // 条形图 + 双向条形图

export const a11CreateDataFilter: EvalCase = {
  id: "a11-create-data-filter",
  title: "创建数据过滤器",
  fixture: "three-components",

  prompt: `在这块大屏上建一个叫「${FILTER_NAME}」的数据过滤器，把「条形图」和「双向条形图」都绑上去`,

  mode: AgentMode.AUTO_EDIT,

  assert: (ctx): Assertion[] => {
    const filters = ctx.screen.dataFilterArr ?? {};
    const entry = Object.values(filters).find((f) => f.name === FILTER_NAME);
    const boundIds = (entry?.bindComponent ?? []).map((b) => Number(b.id));

    const listening = BOUND_IDS.map((id) => ({
      id,
      component: findComponent(ctx.screen, id),
      listens: (findComponent(ctx.screen, id)?.listenArgs ?? []).some((a) => a.filterName === FILTER_NAME)
    }));

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
        name: `dataFilterArr 里有「${FILTER_NAME}」`,
        passed: entry !== undefined,
        detail: `现有过滤器：${
          Object.values(filters)
            .map((f) => f.name)
            .join(", ") || "无"
        }`
      },
      {
        name: "两个图表都绑上了",
        passed: BOUND_IDS.every((id) => boundIds.includes(id)),
        detail: `bindComponent = ${boundIds.join(",") || "空"}，期望含 ${BOUND_IDS.join(",")}`
      },
      // 反向那一半：过滤器说自己绑了谁，被绑的那些组件也得说自己在听。少了这一半，
      // 画布上过滤器看着配好了，运行时却没有任何组件会被它影响。
      {
        name: "被绑组件的 listenArgs 也指回了这个过滤器",
        passed: listening.every((l) => l.listens),
        detail: listening.map((l) => `#${l.id} ${l.component ? (l.listens ? "已听" : "没听") : "不在树上"}`).join("；")
      },
      {
        name: "磁盘上 .json 与 .js 成对",
        passed: jsonBases.length > 0 && unpaired.length === 0,
        detail:
          jsonBases.length === 0
            ? "dataFilterArr/ 下一个 json 都没有"
            : `${jsonBases.length} 个 json${unpaired.length > 0 ? `，缺 js：${unpaired.join(", ")}` : "，全部成对"}`
      }
    ];
  }
};
