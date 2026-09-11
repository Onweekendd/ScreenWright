import type { SystemComponentProps } from "@screenwright/types";
import { type ComponentType, FolderEnum, PanelEnum } from "@screenwright/types";

import { extractStateIdFromDirName } from "@/mastra/tools/file/utils";

/**
 * 可变内容槽（slot）——大屏中"布局不变、内容可换"的字段，作为模板的结构元数据。
 * 全部由脚本机械抽取，agent 不再逐槽标注（保留骨架供将来"按槽填内容"复用）。
 */
export interface Slot {
  id: number;
  type: "text" | "chart-data";
  field: string; // "data"（文本/静态图表）| "dataSource"（接口图表）
  path: string[]; // 沿嵌套链：面板 → [state] → 分组，唯一定位
  pathLabel: string; // path.join(" / ")，便于阅读
  siblingTexts: string[]; // 同分组其它文本，供 AI 判断真实作用
  default?: string; // text 槽：当前文字（占位）；chart 槽不需要（按 shape 生成新数据）
  prop?: string; // chart 槽：具体图表类型
  dataMode?: "static" | "api"; // chart 槽：静态 data / 接口 dataSource
  shape?: string[]; // chart 槽：数据字段（来自 dataRemark），告诉填充方数据形状
  index?: number; // 同 path 同类型多个时的序号（如同一分组两个饼图）
}

/**
 * 部分文本组件（如从 Figma 粘贴而来）的 value 是 HTML 字符串，
 * 其中夹带 `<span data-metadata="...">` 这类不可见的粘贴元数据（base64，体积很大），
 * 仅 `<span style="...">真实文字</span>` 才是可见内容。
 * 这里只取掉所有标签后的纯文本，避免把元数据当作 slot 默认值。
 */
const stripHtml = (value: string): string => {
  // data-metadata/data-buffer 属性值里常混有未转义的 "<" ">"（如 figma 粘贴编码的二进制串），
  // 通用标签正则会被这些字符提前截断导致残留 `">`；属性值本身不含引号，先按属性整体清掉这类 span。
  const withoutPasteMeta = value.replace(/<span[^>]*\bdata-(?:metadata|buffer)="[^"]*"[^>]*>\s*<\/span>/g, "");
  return withoutPasteMeta.replace(/<[^>]*>/g, "").trim();
};

const firstTextValue = (comp: ComponentType): string | null => {
  const data = comp.data as unknown;
  if (Array.isArray(data) && typeof (data[0] as { value?: unknown })?.value === "string") {
    const v = stripHtml((data[0] as { value: string }).value);
    return v ? v : null;
  }
  return null;
};

const isChartProp = (prop: string) => prop.startsWith("echart");

/**
 * 文本是否作为槽保留：仅保留标题/名称类。
 * 纯数字（KPI 数值，属数据层）与短单位/维度词（件/小时、今日 等）不作为可换内容槽。
 */
const isTitleText = (value: string): boolean => {
  const s = value.trim();
  if (/^[\d.,%:：]+$/.test(s)) {
    return false;
  }
  return [...s].length > 4;
};

/**
 * 从大屏组件树提取 slot 骨架。
 *
 * - text 槽：文本框（fttext）的 `data[0].value`
 * - chart-data 槽：图表（echart*）的 `data`（静态）或 `dataSource`（接口）
 *
 * path 沿嵌套结构（面板 → state → 分组）构建以唯一定位——**不能用 `parent` 链**，
 * 因为 state 不是组件、parent 链会断在 state 层，导致镜像左右 / 多状态无法区分。
 */
export const extractSlots = (layers: ComponentType[]): Slot[] => {
  const slots: Slot[] = [];

  const walk = (items: ComponentType[], stack: string[]) => {
    // 本层文本，用于给同层 slot 附 siblingTexts
    const layerTexts = items
      .map((c) => (c.component?.prop === "swtext" ? firstTextValue(c) : null))
      .filter((v): v is string => v !== null);

    for (const comp of items) {
      const prop = comp.component?.prop;
      if (!prop) {
        continue;
      }

      if (prop === "swtext") {
        const value = firstTextValue(comp);
        if (value && isTitleText(value)) {
          slots.push({
            id: comp.id,
            type: "text",
            field: "data",
            path: [...stack],
            pathLabel: stack.join(" / "),
            siblingTexts: layerTexts.filter((t) => t !== value).slice(0, 5),
            default: value
          });
        }
      } else if (isChartProp(prop)) {
        const isStatic = comp.dataType === 0;
        slots.push({
          id: comp.id,
          type: "chart-data",
          prop,
          field: isStatic ? "data" : "dataSource",
          dataMode: isStatic ? "static" : "api",
          shape: ((comp.dataRemark ?? []) as Array<{ key: string }>).map((r) => r.key),
          path: [...stack],
          pathLabel: stack.join(" / "),
          siblingTexts: layerTexts.slice(0, 5)
        });
      }
    }

    // 递归容器：动态面板（贡献 面板名 + state 名两层）、分组（贡献 分组名一层）
    for (const comp of items) {
      const prop = comp.component?.prop;
      const panelData = (comp as SystemComponentProps).panelData;
      if (prop === PanelEnum.dynamicPanel && panelData?.length) {
        const panelName = comp.name ?? comp.title ?? `面板${comp.id}`;
        panelData.forEach((state, i) => {
          if (state.config?.length) {
            const stateName = (state as { name?: string }).name || `状态${i + 1}`;
            walk(state.config, [...stack, panelName, `[${stateName}]`]);
          }
        });
      } else if (prop === FolderEnum.group && comp.children?.length) {
        const groupName = comp.name ?? comp.title ?? `分组${comp.id}`;
        walk(comp.children, [...stack, groupName]);
      }
    }
  };

  walk(layers, []);

  // 同 path + 同类型的多个槽补 index，便于区分（如同一分组里两个饼图）
  const total = new Map<string, number>();
  for (const s of slots) {
    const key = `${s.pathLabel}|${s.prop ?? s.type}`;
    total.set(key, (total.get(key) ?? 0) + 1);
  }
  const seen = new Map<string, number>();
  for (const s of slots) {
    const key = `${s.pathLabel}|${s.prop ?? s.type}`;
    if ((total.get(key) ?? 0) > 1) {
      const n = seen.get(key) ?? 0;
      seen.set(key, n + 1);
      s.index = n;
    }
  }

  return slots;
};

/**
 * 从 workspace 的拆分组件文件重建组件树（writeComponents 的逆操作）：
 * - 分组：{id}_{name}.json 的 children（"id_name" 字符串数组）从 {id}_{name}/ 目录读回
 * - 动态面板：{id}_{name}.json 的 panelData[i].config（"id_name" 字符串数组）从 {id}_{name}/{stateId}/ 目录读回
 *
 * 供 create-template 等脚本复用（extract-slots 自身不作为 CLI 运行）。
 */
export const loadScreenLayers = (
  screenDir: string,
  fsApi: {
    existsSync: (p: string) => boolean;
    readdirSync: (p: string) => string[];
    readFileSync: (p: string, enc: "utf-8") => string;
    join: (...parts: string[]) => string;
  }
): ComponentType[] => {
  const { existsSync, readdirSync, readFileSync, join } = fsApi;
  const componentDir = join(screenDir, "component");

  const load = (jsonPath: string): ComponentType => {
    const comp = JSON.parse(readFileSync(jsonPath, "utf-8")) as ComponentType;
    const dir = jsonPath.replace(/\.json$/, "");
    const prop = comp.component?.prop;

    if (prop === PanelEnum.dynamicPanel) {
      const panelData = (comp as SystemComponentProps).panelData;
      for (const state of panelData ?? []) {
        const stateDirEntry = existsSync(dir)
          ? readdirSync(dir).find((entry) => extractStateIdFromDirName(entry) === String(state.id))
          : undefined;
        const stateDir = stateDirEntry ? join(dir, stateDirEntry) : join(dir, String(state.id));
        if (Array.isArray(state.config) && existsSync(stateDir)) {
          state.config = (state.config as unknown as string[])
            .map((idName) => join(stateDir, `${idName}.json`))
            .filter((fp) => existsSync(fp))
            .map(load);
        }
      }
    } else if (prop === FolderEnum.group && Array.isArray(comp.children)) {
      comp.children = (comp.children as unknown as string[])
        .map((idName) => join(dir, `${idName}.json`))
        .filter((fp) => existsSync(fp))
        .map(load);
    }

    return comp;
  };

  return readdirSync(componentDir)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => load(join(componentDir, f)));
};
