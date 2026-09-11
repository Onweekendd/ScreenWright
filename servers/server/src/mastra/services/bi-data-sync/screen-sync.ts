import type { SystemComponentProps } from "@screenwright/types";
import { type ComponentType, FolderEnum, PanelEnum, type ParsedLargeScreenInfo } from "@screenwright/types";
import { existsSync, rmSync } from "fs";
import path from "path";

import { buildIdNameBase, buildStateDirName, sanitizeFsName } from "../../tools/file/utils";
import { getScreenIdFromVersionKey } from "../screen-workspace";
import { collectIncomingIds } from "./component-tree";
import { buildCallbackFlowGraph, buildEventFlowGraph } from "./flow-graphs";
import {
  collectExistingIds,
  ensureDir,
  getScreenDirPath,
  pruneStaleFiles,
  removeComponentArtifacts,
  writeIfChanged,
  writeJson
} from "./fs-utils";
import { buildLayout, buildNestedLayout } from "./layout";
import { serializeVuePartSFC, VUE_PART_PROP } from "./vue-part-sfc";

interface SyncScreenDataInput {
  id: string;
  cacheTime: number;
  parsedLargeScreenInfo: ParsedLargeScreenInfo;
}

type ScreenMetaRest = Omit<ParsedLargeScreenInfo, "layers" | "dataFilterArr" | "aniFrameSet" | "statusAnimation">;

/**
 * 大屏全量同步写入器（组合函数为类）：用前端传来的一份大屏数据初始化，
 * 把原本层层传参的 layers / screenDir / componentDir / existingIdMap / incomingIds 收敛为实例字段，
 * 各阶段作为私有方法共享这份数据。sync() 为唯一入口，编排顺序与旧实现完全一致。
 *
 * 目录结构：
 * screen_{id}/
 * ├── _meta.json           同步锚点 { updatedTime, componentIds }
 * ├── info.json            大屏基本信息（name、宽高、versionCode、config 等）
 * ├── dataFilterArr/       数据过滤器（每个过滤器一个 .json + 一个 .js）
 * ├── aniFrameSet.json     动画帧
 * ├── statusAnimation.json 状态动画
 * ├── _callback_flows/     回调参数数据流图（每个 argName 一个文件）
 * ├── _event_flows/        事件-行为链路（每个 sourceId 一个文件）
 * ├── _layout.json         全屏结构骨架
 * └── component/           组件树（文件+文件夹并列表示层级）
 */
class ScreenSyncWriter {
  private readonly cacheTime: number;
  private readonly layers: ParsedLargeScreenInfo["layers"];
  private readonly dataFilterArr: ParsedLargeScreenInfo["dataFilterArr"];
  private readonly aniFrameSet: ParsedLargeScreenInfo["aniFrameSet"];
  private readonly statusAnimation: ParsedLargeScreenInfo["statusAnimation"];
  /** info.json 落盘的大屏元信息（剔除 layers/config/dataFilterArr/动画等重型字段，仍含 id/detail/updatedTime） */
  private readonly screenMeta: ScreenMetaRest;
  private readonly screenDir: string;
  private readonly componentDir: string;

  /** 写入前磁盘上已有的 id → 路径映射（用于移动检测与孤儿清理），须在 writeComponents 之前采集 */
  private existingIdMap = new Map<number, string>();
  /** incoming layers 的全部组件 id（含子组件） */
  private incomingIds = new Set<number>();

  constructor({ id, cacheTime, parsedLargeScreenInfo }: SyncScreenDataInput) {
    const { layers, dataFilterArr, aniFrameSet, statusAnimation, ...screenMeta } = parsedLargeScreenInfo;
    this.cacheTime = cacheTime;
    this.layers = layers;
    this.dataFilterArr = dataFilterArr;
    this.aniFrameSet = aniFrameSet;
    this.statusAnimation = statusAnimation;
    this.screenMeta = screenMeta;
    this.screenDir = getScreenDirPath(id);
    this.componentDir = path.join(this.screenDir, "component");
  }

  /** 全量同步入口：顺序与旧 syncScreenData 完全一致 */
  sync() {
    ensureDir(this.screenDir);
    this.writeTopFiles();
    this.syncDataFilters();

    // existingIdMap 必须在 writeComponents 写入新文件之前采集，否则移动检测失效
    this.existingIdMap = collectExistingIds(this.componentDir);
    this.incomingIds = collectIncomingIds(this.layers);

    writeJson(path.join(this.screenDir, "_meta.json"), {
      updatedTime: this.screenMeta.updatedTime || this.cacheTime,
      componentIds: [...this.incomingIds].sort((a, b) => a - b)
    });

    this.writeComponents(this.layers, this.componentDir);
    this.removeLegacyVuePartDts();
    this.pruneOrphans();
    this.writeCallbackFlows();
    this.writeEventFlows();
    this.writeLayout();
    this.cleanupLegacyFiles();
  }

  private writeTopFiles() {
    writeJson(path.join(this.screenDir, "info.json"), this.screenMeta);
    writeJson(path.join(this.screenDir, "aniFrameSet.json"), this.aniFrameSet);
    writeJson(path.join(this.screenDir, "statusAnimation.json"), this.statusAnimation);
  }

  /**
   * 将 dataFilterArr 同步到 dataFilterArr/ 目录
   * 每个过滤器拆分为两个文件：{name}.json（元数据）和 {name}.js（dataFormatter 函数体）
   * 已删除的过滤器对应文件一并清理
   */
  private syncDataFilters() {
    const filterDir = path.join(this.screenDir, "dataFilterArr");
    ensureDir(filterDir);

    // 过滤器名可能含 Windows 非法字符（如 "获取自由度>18占比" 的 >），落盘前净化为合法文件名。
    // 真实过滤器名保留在 JSON 的 name 字段里，edit/delete 回推前端时以 name 为准，故文件名净化不影响绑定。
    const incomingFileBases = new Set<string>();

    for (const [name, filter] of Object.entries(this.dataFilterArr ?? {})) {
      const { dataFormatter, ...filterMeta } = filter as unknown as Record<string, unknown>;
      const fileBase = sanitizeFsName(name);
      incomingFileBases.add(fileBase);
      writeJson(path.join(filterDir, `${fileBase}.json`), { ...filterMeta, dataFormatter: `${fileBase}.js` });
      writeIfChanged(path.join(filterDir, `${fileBase}.js`), typeof dataFormatter === "string" ? dataFormatter : "");
    }

    pruneStaleFiles(filterDir, incomingFileBases, [".json", ".js"]);
  }

  /**
   * 递归写入组件列表到指定目录（颗粒度更新版本）
   *
   * 写入前检查：若组件在磁盘上存在旧路径且与新路径不同 → 先删旧路径文件及子目录（处理层级移动）
   *
   * 文件结构规则（文件名/目录名均为 {id}_{name} 形式；name 为空时退回组件类型，便于人和 agent 直接识别组件含义）：
   * - 叶子组件：{id}_{name}.json
   * - 分组组件：{id}_{name}.json（自身，去掉 children） + {id}_{name}/ 目录（存子组件）
   * - 动态面板：{id}_{name}.json（自身，panelData 保留状态元信息但去掉 config） + {id}_{name}/{stateId}_{stateName}/ 目录
   */
  private writeComponents(components: ComponentType[], basePath: string) {
    ensureDir(basePath);

    for (const component of components) {
      const compId = component.id;
      const idNameBase = buildIdNameBase(compId, component.name ?? component.title ?? "");

      const newFilePath = path.join(basePath, `${idNameBase}.json`);

      const oldFilePath = this.existingIdMap.get(compId);

      // 处理层级移动/改名：旧路径存在且与新路径不同时，清理旧位置
      if (oldFilePath && oldFilePath !== newFilePath) {
        removeComponentArtifacts(oldFilePath);
      }

      const panelData = (component as SystemComponentProps).panelData;

      if (component.component.prop === PanelEnum.dynamicPanel && panelData?.length) {
        // 动态面板：去掉各状态内的子组件（config），保留状态元信息
        const { panelData: _pd, ...rest } = component as SystemComponentProps;
        writeJson(newFilePath, {
          ...rest,
          panelData: panelData.map(({ config, ...stateMeta }) => ({
            ...stateMeta,
            config: config.map((c) => buildIdNameBase(c.id, c.name ?? c.title ?? ""))
          }))
        });

        // 各状态的子组件递归写入 {idNameBase}/{stateId}_{stateName}/，同时写 _layout.json
        for (const state of panelData) {
          if (state.config?.length) {
            const stateDir = path.join(basePath, idNameBase, buildStateDirName(state.id, state.name));
            this.writeComponents(state.config, stateDir);
            const stateRelDir = path.relative(this.componentDir, stateDir).replace(/\\/g, "/");
            writeJson(
              path.join(stateDir, "_layout.json"),
              buildNestedLayout(component, state.config, { id: state.id, name: state.name }, stateRelDir)
            );
          }
        }
      } else if (component.component.prop === FolderEnum.group && component.children?.length) {
        // 分组组件：自身去掉 children，子组件写入同名子目录，同时写 _layout.json
        const { children, ...rest } = component;
        writeJson(newFilePath, {
          ...rest,
          children: children.map((child) => buildIdNameBase(child.id, child.name ?? child.title ?? ""))
        });
        const groupDir = path.join(basePath, idNameBase);
        this.writeComponents(children, groupDir);
        const groupRelDir = path.relative(this.componentDir, groupDir).replace(/\\/g, "/");
        writeJson(path.join(groupDir, "_layout.json"), buildNestedLayout(component, children, undefined, groupRelDir));
      } else {
        // 叶子组件
        if (component.component.prop === VUE_PART_PROP) {
          const option = (component as Record<string, unknown>).option as Record<string, unknown> | undefined;
          if (option?.js || option?.template || option?.css) {
            writeIfChanged(
              newFilePath.replace(/\.json$/, ".vue"),
              serializeVuePartSFC(String(option?.template ?? ""), String(option?.js ?? ""), String(option?.css ?? ""))
            );
            writeJson(newFilePath, {
              ...component,
              option: {
                ...(option ?? {}),
                template: `${idNameBase}.vue`,
                js: `${idNameBase}.vue`,
                css: `${idNameBase}.vue`
              }
            });
          } else {
            writeJson(newFilePath, component);
          }
        } else {
          writeJson(newFilePath, component);
        }
      }
    }
  }

  /** 旧版逐 component 目录的 _vue-part-types.d.ts 已由 workspace/types/vue-part.ts + tsconfig 取代，清理历史残留 */
  private removeLegacyVuePartDts() {
    const legacyVuePartDts = path.join(this.componentDir, "_vue-part-types.d.ts");
    if (existsSync(legacyVuePartDts)) {
      rmSync(legacyVuePartDts);
    }
  }

  /** 删除孤儿：磁盘存在但 incoming 中不存在的组件 */
  private pruneOrphans() {
    for (const [id, filePath] of this.existingIdMap) {
      if (this.incomingIds.has(id) || !existsSync(filePath)) {
        continue;
      }
      removeComponentArtifacts(filePath);
    }
  }

  /** _callback_flows/{argName}.json — 每个回调参数独立文件，agent 按需读取 */
  private writeCallbackFlows() {
    const dir = path.join(this.screenDir, "_callback_flows");
    ensureDir(dir);
    const flows = buildCallbackFlowGraph(this.layers, this.dataFilterArr);
    const current = new Set(Object.keys(flows));
    for (const [argName, entry] of Object.entries(flows)) {
      writeJson(path.join(dir, `${argName}.json`), entry);
    }
    pruneStaleFiles(dir, current, [".json"]);
  }

  /** _event_flows/{sourceId}.json — 每个组件的事件-行为链路独立文件 */
  private writeEventFlows() {
    const dir = path.join(this.screenDir, "_event_flows");
    ensureDir(dir);
    const flows = buildEventFlowGraph(this.layers);
    const current = new Set(flows.keys());
    for (const [sourceId, entries] of flows) {
      writeJson(path.join(dir, `${sourceId}.json`), entries);
    }
    pruneStaleFiles(dir, current, [".json"]);
  }

  /** _layout.json — 全屏结构骨架：嵌套层级 + 绝对坐标 + 网格占位 + 主题采样 */
  private writeLayout() {
    const layout = buildLayout(this.layers, this.screenMeta.detail);
    layout.screen.id = this.screenMeta.id;
    writeJson(path.join(this.screenDir, "_layout.json"), layout);
  }

  /** 清理旧格式文件 */
  private cleanupLegacyFiles() {
    const legacyDataFlow = path.join(this.screenDir, "_data_flow.json");
    if (existsSync(legacyDataFlow)) {
      rmSync(legacyDataFlow);
    }
    // config 已并入 info.json，独立的 config.json 不再产生
    const legacyConfig = path.join(this.screenDir, "config.json");
    if (existsSync(legacyConfig)) {
      rmSync(legacyConfig);
    }
    const legacyEventFlows = path.join(this.screenDir, "_event_flows.json");
    if (existsSync(legacyEventFlows)) {
      rmSync(legacyEventFlows);
    }
    // 草稿机制已移除，历史遗留的 draftId → realId 映射表不再有消费者
    const legacyDraftIdMap = path.join(this.screenDir, "_draft_id_map.json");
    if (existsSync(legacyDraftIdMap)) {
      rmSync(legacyDraftIdMap);
    }
  }
}

/**
 * 全量同步大屏数据到 workspace（组件目录颗粒度三路合并）。
 * 用前端传来的大屏数据初始化 ScreenSyncWriter 并执行同步。
 */
export const syncScreenData = (input: SyncScreenDataInput) => new ScreenSyncWriter(input).sync();

/**
 * 同步大屏范式模板（描述）到 workspace
 *
 * 写入 screen_{id}/template-{screenId}.json，与 template-extractor 提取产物同名同位，
 * 直接成为当前大屏的语义认知索引（而非另起文件），主 agent / 提取器按既有约定读取。
 *
 * 典型来源：前端「应用 AI 模板」后，把模板范式描述（其中旧组件 id 已重映射为目标大屏的新 id）
 * 回写到当前大屏，使描述与画布上的真实组件 id 对齐，并作为该屏最新认知。
 *
 * @param id 大屏标识 {screenId}_{versionCode}（目录用），screenId 从中解析出来拼文件名
 */
export const syncScreenDescribe = ({ id, describe }: { id: string; describe: string }) => {
  const screenDir = getScreenDirPath(id);
  ensureDir(screenDir);
  const screenId = getScreenIdFromVersionKey(id);
  writeIfChanged(path.join(screenDir, `template-${screenId}.json`), describe);
};
