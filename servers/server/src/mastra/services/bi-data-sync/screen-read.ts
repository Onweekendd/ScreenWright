import {
  type EditorCoreState,
  type EditorState,
  type NavInfo,
  ScreenEditor,
  type TargetChart
} from "@screenwright/core";
import { type ComponentType, FolderEnum, PanelEnum, type ParsedLargeScreenInfo } from "@screenwright/types";
import {
  ComponentFlatSchema,
  FilterSchema,
  PanelStateFlatSchema,
  parsedLargeScreenInfoObject
} from "@screenwright/types/schemas";
import { existsSync, readdirSync } from "fs";
import path from "path";
import { z, type ZodType } from "zod";

import { buildStateDirName } from "../../tools/file/utils";
import { getScreenDirPath, readTextFile } from "./fs-utils";
import { parseSFCToParts, VUE_PART_PROP } from "./vue-part-sfc";

interface ScreenReaderInput {
  id: string;
}

/**
 * 顶层三个文件的 schema，与 screen-sync 的 writeTopFiles 一一对称。
 * 全部从 ParsedLargeScreenInfo 的 object 形态派生，避免结构在读写两侧各写一遍。
 */
const screenObject = parsedLargeScreenInfoObject();

/**
 * info.json：整屏结构去掉那些各自独立落盘的字段（layers 进 component/，dataFilterArr 进 dataFilterArr/），config 含在其中
 *
 * 导出给写入侧（screen-file-edit 的 validateScreenInfoContent）复用：读的时候拿它挡、写的时候不挡，
 * 就会出现「写得进去、下次读不回来」的死局。
 */
export const ScreenInfoSchema = screenObject.omit({
  layers: true,
  dataFilterArr: true,
  aniFrameSet: true,
  statusAnimation: true
});
/** aniFrameSet.json / statusAnimation.json：各取整屏结构里的对应字段 */
const AniFrameSetSchema = screenObject.shape.aniFrameSet;
const StatusAnimationSchema = screenObject.shape.statusAnimation;

/**
 * 子组件字段的磁盘形态。writeComponents 只对分组与动态面板两条分支做抽取——把子组件写进同名
 * 子目录，字段本身降级成一串 basename：
 * - 分组：children: ["4155_条形图", ...]
 * - 动态面板：panelData[].config: ["4158_条形图", ...]
 *
 * 其余带 panelData 的面板（如 terminal-control 终端控制面板）走的是兜底分支，整个组件原样落盘，
 * config 里仍是完整的子组件对象、并不独立成文件。故这里必须同时接受两种形态，
 * 只认 basename 会让整屏读取在这类组件上直接抛错。
 */
const DiskChildrenSchema = z
  .union([
    z.array(z.string()).describe("抽到子目录的子组件文件 basename"),
    z.array(z.any()).describe("原样内联的子组件对象")
  ])
  .describe("子组件列表：basename 字符串或内联组件对象");

/**
 * 磁盘上组件 json 的形态。
 *
 * 用 extend 而不是 omit + extend：同名 key 直接覆盖即可；而且 ComponentFlatSchema 末尾是
 * catchall(z.any())，被 omit 掉的 key 会立刻被 catchall 接住，omit 在这里等于没做。
 */
const DiskComponentSchema = ComponentFlatSchema.extend({
  children: DiskChildrenSchema.optional(),
  panelData: z
    .array(PanelStateFlatSchema.extend({ config: DiskChildrenSchema }))
    .describe("面板状态列表")
    .optional()
});

/** 磁盘形态的组件：children / panelData[].config 可能还是 basename，vue-part 的 option 还是文件名指针 */
export type DiskComponent = z.infer<typeof DiskComponentSchema>;

/**
 * 剥掉组件上的 `callbackArgs` 死键。
 *
 * 它由后端的组件模板带进来（前端 `useComponentCreateActions.ts` 建组件时已在源头剥掉，
 * 但存量文件里还有），不在 `ComponentFlatSchema` 里（那里只有 `cbArgs`），
 * 前端也没有任何一处读组件对象上的这个字段。
 *
 * 之所以值得在读取时主动剥：它是**持续误导 agent 的噪声**。实测真实工作区 21/23 个组件文件
 * 带着这个空数组，而真正生效的 `cbArgs` 只有 13 个有——agent 打开文件看到 `callbackArgs`
 * 端端正正在那儿、`cbArgs` 却常常不存在，把哪个当正牌字段全靠运气（实测确实猜错过）。
 *
 * 放在读取侧而不是写入侧，是为了顺带清存量：整屏回写时用的就是这份读出来的树，
 * agent 每碰一次某块屏，那块屏就干净一次。
 */
const stripDeadKeys = <T>(component: T): T => {
  delete (component as { callbackArgs?: unknown }).callbackArgs;
  return component;
};

/**
 * 从工作区读取大屏数据 反向构建出 ParsedLargeScreenInfo
 */
export class ScreenReader implements EditorState<EditorCoreState> {
  private readonly screenDir: string;
  private readonly componentDir: string;

  /**
   * 这四个字段合起来就是 {@link EditorCoreState}：reader 自身即状态，{@link getState} 直接返回 this。
   *
   * componentList 与 layers **共用同一个数组**（不是副本），与前端
   * `SelectionManager.syncFromLayers`（`setComponentList(getLayers())`）同口径：后端始终在
   * 整屏根画布上作业，「当前编辑的列表」就是根图层列表本身。拷一份会让两边各自漂移——
   * 树改了，选区模型看到的还是旧的。
   */
  navInfo: NavInfo;
  layers: ComponentType[];
  componentList: ComponentType[];
  targetChart: TargetChart;

  constructor({ id }: ScreenReaderInput) {
    this.screenDir = getScreenDirPath(id);
    this.componentDir = path.join(this.screenDir, "component");

    const { layers, ...info } = this.read();

    this.layers = layers;
    this.navInfo = info;
    this.componentList = layers;
    this.targetChart = {
      hoverId: undefined,
      selectId: []
    };
  }

  /** {@link EditorState} 实现：reader 自身就是那份状态，无需再包一层。 */
  getState(): EditorCoreState {
    return this;
  }

  /**
   * {@link EditorState} 实现：**就地合并**，不像 core 的 MemoryEditorState 那样换新对象。
   *
   * 两者对 core 等价（管理器每次都重新 getState），但 reader 是要被调用方一直握在手里的
   * ——读完、改完、再交给写入侧落盘，中途换掉状态对象会让手里那个引用变成过期快照。
   * 这也与 core 写入 API 的约定①（就地变更，绝不替换数组或节点引用）一致。
   */
  setState(patch: Partial<EditorCoreState>): void {
    Object.assign(this, patch);
  }

  /**
   * 把当前内存态拼回完整的 {@link ParsedLargeScreenInfo}，供 screen-sync 的 syncScreenData 整屏写回。
   *
   * navInfo 的类型就是 `Omit<ParsedLargeScreenInfo, "layers">`——dataFilterArr / aniFrameSet /
   * statusAnimation 本就在其中，构造时随 `{ layers, ...info }` 一并读了进来，core 不消费它们
   * （不在 EditorCoreState 里）也就不会碰，原样带回去即可；唯一可能被 core 改过的是 layers。
   *
   * 能这样原样带回去，前提是 {@link readAndValidate} 交出来的是原始对象而非 schema 产物——
   * 否则这一趟往返会把整屏没动过的字段全部重写一遍。
   */
  toParsedLargeScreenInfo(): ParsedLargeScreenInfo {
    return { ...this.navInfo, layers: this.layers };
  }

  /**
   * 全量读取入口：与 ScreenSyncer.sync 逆向对称，把工作区目录还原成 ParsedLargeScreenInfo
   * 纯读操作，不建目录也不写盘；缺文件会抛错，缺目录按空处理
   */
  read(): ParsedLargeScreenInfo {
    return {
      ...this.readAndValidate(path.join(this.screenDir, "info.json"), ScreenInfoSchema),
      layers: this.readComponents(""),
      dataFilterArr: this.readDataFilters(),
      aniFrameSet: this.readAndValidate(path.join(this.screenDir, "aniFrameSet.json"), AniFrameSetSchema),
      statusAnimation: this.readAndValidate(path.join(this.screenDir, "statusAnimation.json"), StatusAnimationSchema)
    };
  }

  /**
   * 读取 JSON 文件并按 schema 校验；文件缺失、非法 JSON、结构不符都会抛错。
   *
   * **校验用 schema，返回的是 `JSON.parse` 的原始对象,不是 `schema.parse()` 的产物。**
   * 这两者不等价：zod 会给带 `.default()` 的可选字段补值（组件上的 `cbArgs` / `listenArgs` /
   * `events` / `img` 都是），并按 schema 声明顺序重排 key。而这棵树读完之后是要**原样写回工作区**的
   * （见 component-edit 的整屏回写），一旦放进去的是补全重排过的版本，落盘时就会把跟本次编辑
   * 毫无关系的组件也改一遍——实测编辑一个顶层组件会连带改掉同屏另一棵子树的 9 个文件，
   * git 提交完全失真。
   *
   * 少掉的默认值不会有人踩空：core 与 flow-graphs 的消费方一律是防御式取值
   * （`component.events?.length`、`comp.cbArgs ?? []`）。而且磁盘上这份内容本来就是
   * ScreenSyncWriter 从前端数据写下去的——文件里没有的字段，前端自己那份也没有，
   * 补默认值等于后端凭空造数据再推回去。
   *
   * @param filePath 绝对路径，由 screenDir / componentDir 拼出，与写入侧 ensureDir、writeJson 同一套口径
   * @param schema 只用来校验结构，不用它的输出
   */
  private readAndValidate<T>(filePath: string, schema: ZodType<T>): T {
    // 报错只给相对 screenDir 的路径：绝对路径含工作区前缀，对定位没有帮助
    const source = path.relative(this.screenDir, filePath);
    const raw = readTextFile(filePath);
    if (raw === null) {
      throw new Error(`Screen file not found: ${source}`);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new Error(`Screen file is not valid JSON: ${source} (${error})`);
    }

    try {
      schema.parse(parsed);
    } catch (error) {
      throw new Error(`Screen data validation failed (${source}): ${error}`);
    }
    return parsed as T;
  }

  /**
   * 从 dataFilterArr/ 目录读回过滤器表（与 syncDataFilters 逆向对称）
   *
   * 每个过滤器落盘时拆成两个文件：{fileBase}.json（元数据，dataFormatter 位置存的是 js 文件名）
   * 与 {fileBase}.js（函数体），这里把 js 内容读回来填进 dataFormatter。
   *
   * 文件名经 sanitizeFsName 净化过，真实过滤器名只在 json 的 name 字段里，故以 name 作 key 还原。
   */
  private readDataFilters(): ParsedLargeScreenInfo["dataFilterArr"] {
    const filterDir = path.join(this.screenDir, "dataFilterArr");
    if (!existsSync(filterDir)) {
      return {};
    }

    const filters: ParsedLargeScreenInfo["dataFilterArr"] = {};

    for (const entry of readdirSync(filterDir)) {
      if (!entry.endsWith(".json") || entry.startsWith("_")) {
        continue;
      }
      const filter = this.readAndValidate(path.join(filterDir, entry), FilterSchema);
      const formatterPath = path.join(filterDir, entry.replace(/\.json$/, ".js"));
      // 伴生 js 缺失时按空函数体处理，避免整屏读取因为一个过滤器失败
      filters[filter.name] = { ...filter, dataFormatter: readTextFile(formatterPath) ?? "" };
    }

    return filters;
  }

  /**
   * 从 component/{basePath} 目录读回组件列表（与 screen-sync 的 writeComponents 逆向对称）
   *
   * 目录约定（文件名/目录名均为 {id}_{name}）：
   * - 叶子组件：{id}_{name}.json
   * - 分组组件：{id}_{name}.json + {id}_{name}/ 目录（存子组件）
   * - 动态面板：{id}_{name}.json + {id}_{name}/{stateId}_{stateName}/ 目录（按状态分目录）
   *
   * @param basePath 相对 componentDir 的子路径，顶层传 ""
   */
  public readComponents(basePath: string): ComponentType[] {
    const currentDir = path.join(this.componentDir, basePath);
    // 读取器不建目录：状态没有子组件时写入侧就不会建目录，这里遇到缺失直接当空处理
    if (!existsSync(currentDir)) {
      return [];
    }

    const entries = readdirSync(currentDir, { withFileTypes: true });
    // 只有 {id}_{name}.json 才是组件本身：_layout.json 等 _ 开头的是布局元数据，
    // {base}.vue 是 vue-part 组件的伴生文件，都不能按组件解析（忽略规则与 collectExistingIds 一致）
    const componentFiles = entries.filter((e) => e.isFile() && e.name.endsWith(".json") && !e.name.startsWith("_"));
    // 目录名与某个组件 json 的 basename 完全相同，说明该组件的子组件落在这个目录里
    const nestedBases = new Set(
      entries
        .filter((e) => e.isDirectory() && componentFiles.some((f) => f.name === `${e.name}.json`))
        .map((e) => e.name)
    );

    return (
      componentFiles
        .map((file) => {
          const idNameBase = file.name.replace(/\.json$/, "");
          const filePath = path.join(currentDir, file.name);
          // vue-part 的模板/脚本/样式在伴生 .vue 里，先填回 option
          const component = this.attachVuePartSource(
            stripDeadKeys(this.readAndValidate(filePath, DiskComponentSchema)),
            filePath
          );

          // 子目录名就是当前 json 的 basename，直接沿用；用 name 重新拼会漏掉落盘时的 title 兜底与字符净化
          return nestedBases.has(idNameBase)
            ? this.attachNestedChildren(component, path.join(basePath, idNameBase))
            : (component as ComponentType);
        })
        // 目录列出的是文件名字典序（"999" 排在 "4112" 之后），叠放次序只由 zIndex 承载，
        // 故按 zIndex 升序还原——与 buildLayout 同口径：小的在前（底层），大的在后（前景）。
        // zIndex 相同的保持字典序：Array.sort 是稳定排序，同层组件的相对次序至少是确定的。
        .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
    );
  }

  /**
   * 把一份**磁盘形态**的组件对象内联成内存形态，与 {@link readComponents} 对单个文件做的事完全一致
   * （同样两步：先 {@link attachVuePartSource} 填 vue-part 的三段，再 {@link attachNestedChildren}
   * 展开子树）。
   *
   * 给「组件在内存里被改过、还没落盘」这条路用（见 component-edit 的 applyComponentEdit）：
   * agent 编辑的是磁盘形态的 json 文本，要放回树上必须先走一遍同样的内联。直接把磁盘形态塞进树
   * 会得到畸形节点——分组的 children 是一串 basename 字符串、vue-part 的 option.template 是
   * ".vue" 文件名——紧接着的整屏回写就会照着它去取 child.id（拼出 undefined_undefined 的文件名）、
   * 把 "xxx.vue" 这个字符串本身当模板写进 .vue，直接写坏工作区。
   *
   * @param diskComponent 磁盘形态的组件对象（JSON.parse 的结果，未经内联）
   * @param jsonPath 该组件 json 的绝对路径；用来定位伴生 .vue 与同名子组件目录
   */
  public inflateComponent(diskComponent: DiskComponent, jsonPath: string): ComponentType {
    const withVueSource = this.attachVuePartSource(stripDeadKeys(diskComponent), jsonPath);

    // 子目录与 json 同名（去掉扩展名），与 readComponents 里的 nestedBases 判定同口径
    const nestedDir = jsonPath.replace(/\.json$/, "");
    if (!existsSync(nestedDir)) {
      return withVueSource as ComponentType;
    }
    return this.attachNestedChildren(withVueSource, path.relative(this.componentDir, nestedDir));
  }

  /**
   * vue-part（Vue2 组件选项对象）落盘时，option.{template,js,css} 被换成指向同名 .vue 的文件名指针，
   * 真实内容存在伴生 SFC 里。这里把 SFC 解析回三段填回 option，与 serializeVuePartSFC 成对。
   *
   * 复用同文件夹下 vue-part-sfc 的 parseSFCToParts：它同时负责剥除落盘时注入的类型锚点
   * （@__vp_types__ JSDoc 与 @__vp_anchor__ export 行），还原后端期望的 generate(info) 工厂字符串。
   *
   * 三段皆空的 vue-part 写入侧不产出 .vue，此时 option 里不是指针，原样返回即可。
   */
  private attachVuePartSource(component: DiskComponent, jsonPath: string): DiskComponent {
    if (component.component.prop !== VUE_PART_PROP) {
      return component;
    }

    const sfc = readTextFile(jsonPath.replace(/\.json$/, ".vue"));
    if (sfc === null) {
      return component;
    }

    return { ...component, option: { ...(component.option ?? {}), ...parseSFCToParts(sfc) } };
  }

  /**
   * 把子目录里的子组件递归读回来，挂到父组件对应字段上，还原成内存态 ComponentType
   * @param component 磁盘态组件（children / panelData[].config 还是 basename 字符串）
   * @param nestedPath 该组件的子目录，相对 componentDir
   */
  private attachNestedChildren(component: DiskComponent, nestedPath: string): ComponentType {
    if (component.component.prop === FolderEnum.group) {
      return { ...component, children: this.readComponents(nestedPath) } as ComponentType;
    }

    if (component.component.prop === PanelEnum.dynamicPanel && component.panelData) {
      return {
        ...component,
        panelData: component.panelData.map((state) => ({
          ...state,
          // 状态目录名由 stateId + stateName 组成，与写入侧 buildStateDirName 同一套规则
          config: this.readComponents(path.join(nestedPath, buildStateDirName(state.id, state.name)))
        }))
      } as ComponentType;
    }

    // 有子目录但既不是分组也不是动态面板：保留组件本身，子目录内容交给后续规则处理
    return component as ComponentType;
  }
}

/**
 * 从工作区搭一个 headless 编辑器。
 *
 * 磁盘 → {@link ScreenReader}（它同时是 EditorState）→ {@link ScreenEditor}。此后
 * `editor.component.*` / `editor.panel.*` 跑的与前端**是同一份函数**：改树的规则
 * ——分组包围盒重算、zIndex 重排、回调关系注销、分组最少成员——只存在于 core 一处，
 * 前后端不会各写一遍再慢慢分叉。
 *
 * 不注入 `setCallbackArgsSource`：那是过滤器执行期的运行时值，只有前端跑过滤器时才需要；
 * 未注入时 core 返回空对象，headless 下不会崩。
 *
 * 读取在 ScreenReader 的构造函数里完成，缺文件会立刻抛（不是等到第一次用才炸）。
 */
export function createScreenEditor(id: string): ScreenEditor {
  return ScreenEditor.create(new ScreenReader({ id }));
}
