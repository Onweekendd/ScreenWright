import type { LargeScreeInfo } from "@screenwright/types";

import { ComponentManager } from "./managers/ComponentManager";
import { DataFilterManager } from "./managers/DataFilterManager";
import { EventDispatcher } from "./managers/EventDispatcher";
import { EventManager } from "./managers/EventManager";
import { PanelManager } from "./managers/PanelManager";
import { ScreenManager } from "./managers/ScreenManager";
import { SelectionManager } from "./managers/SelectionManager";
import type { EditorState } from "./state/EditorState";
import type { EditorCoreState } from "./types/state";

/**
 * 编辑器核心中心类（对应视频编辑器 demo 中的 Editor）。
 * 持有并装配各业务管理器；所有管理器共享同一个 EditorState。
 *
 * 当前已落地：
 *  - screen      大屏管理（ScreenManager）
 *  - component   组件管理（ComponentManager）
 *  - panel       动态面板状态管理（PanelManager）
 *  - event       事件管理（EventManager，框架无关部分）
 *  - dataFilter  数据过滤器管理（DataFilterManager）
 *  - eventDispatcher 事件派发编排（EventDispatcher）
 * 后续按同一模板挂载：history / export 等管理器。
 */
export class ScreenEditor {
  /** 状态后端（由 UI 层提供具体实现）。 */
  readonly state: EditorState<EditorCoreState>;

  /** 大屏管理。 */
  readonly screen: ScreenManager;

  /** 组件管理。 */
  readonly component: ComponentManager;

  /** 选区管理（选中目标 + 编辑组件列表）。 */
  readonly selection: SelectionManager;

  /** 事件管理（框架无关部分）。 */
  readonly event: EventManager;

  /** 动态面板状态管理。 */
  readonly panel: PanelManager;

  /** 数据过滤器管理。 */
  readonly dataFilter: DataFilterManager;

  /** 事件派发（求值条件 → 执行动作 → 抛回调 → 消费方重算过滤器）。 */
  readonly eventDispatcher: EventDispatcher;

  constructor(state: EditorState<EditorCoreState>) {
    this.state = state;
    this.screen = new ScreenManager(state);
    // event 必须先于 component：组件被删除时要注销它在回调关系图里的登记，
    // ComponentManager 因此持有 EventManager 那份 CallbackArguments。
    this.event = new EventManager();
    this.component = new ComponentManager(state, this.event.callbackArguments);
    this.selection = new SelectionManager(state, this.component);
    this.panel = new PanelManager({ editorState: state, componentManager: this.component });
    this.dataFilter = new DataFilterManager({
      editorState: state,
      callbackArguments: this.event.callbackArguments,
      callbackEventManager: this.event.callbackEventManager,
      componentManager: this.component
    });
    this.eventDispatcher = new EventDispatcher({
      componentManager: this.component,
      dataFilterManager: this.dataFilter,
      eventCallbacks: this.event.eventCallbacks
    });
  }

  /**
   * 用一份大屏数据装配编辑器：状态、过滤器基线、回调参数关系图，一次到位。
   *
   * 【为什么必须有这个方法】构造函数只把各 manager 装起来，状态是空的；
   * 「从一份 LargeScreeInfo 填充状态」过去只有前端做（useInitLargeScreenData 手工调 7 个 setter），
   * 后端 ScreenEditor.create(reader) 之后**一个都没调**——initCallbackArguments 在 servers/server
   * 全仓库调用数为 0，回调参数关系图一直是空的。
   *
   * 现在没炸是因为后端不跑运行时，且 _callback_flows 由 flow-graphs 独立重算；
   * 但一旦要在 Node 里跑数据流（A 抛出回调 → B 重算过滤器），关系图为空会让
   * callbackRelation 恒为 undefined、循环直接 continue——**什么都不发生且不报错**。
   *
   * 【顺序不能换】navInfo 带着 dataFilterArr，必须先于 cloneDataFilterOnInit；
   * layers 必须先于 initCallbackArguments。
   *
   * 宿主特有的部分不在这里：前端的编辑器 UI 配置（setDetail2Config）、动画初始化、
   * wasm、历史缓存仍留在 useInitLargeScreenData——它们不是 core 的关注点。
   *
   * @param detailInfo 后端接口下发的原始形态，或 ScreenReader 读盘得到的内存形态。
   *   两者都可以：setNavInfo / setLayers 内部都用 parseIfNeeded 兼容「已经是对象」的情况。
   */
  init(detailInfo: LargeScreeInfo): void {
    this.screen.setNavInfo(detailInfo);
    this.component.setLayers(detailInfo);
    this.selection.syncFromLayers();
    this.dataFilter.cloneDataFilterOnInit();
    this.event.callbackArguments.initCallbackArguments(this.component.getLayers());
  }

  /** 工厂方法：与 demo 的 Editor.build 保持一致的创建入口。 */
  static create(state: EditorState<EditorCoreState>): ScreenEditor {
    return new ScreenEditor(state);
  }
}
