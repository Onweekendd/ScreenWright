import type {
  CallbackManager,
  ChildComponent,
  ComponentType,
  Event,
  PanelEnum,
  SystemComponentProps
} from "@screenwright/types";

import { renderSystemComponentType } from "../constants/panel";
import { extractComponentId } from "../utils/extractComponentId";
import { mapValueWithDataRemark } from "../utils/mapValueWithDataRemark";

// 反向映射结构中的目标组件信息
export interface TargetComponentInfo {
  /** 源组件ID */
  sourceComponentId: string;
  /** 源组件绑定的事件列表 */
  events: Event[];
}

// 事件映射类型
export type EventMappingTarget = Map<string, TargetComponentInfo[]>;

/**
 * 回调参数管理（纯类，框架无关）。
 * 负责维护回调关系（source/target）、反向事件映射，以及回调值的注入。
 *
 * **按大屏一个实例**，不再是单例：Node 侧一个进程可能同时持有多块大屏的编辑器，
 * 共享一份关系图会让它们互相污染，且不报错。实例由 EventManager 持有，
 * 全前端唯一是因为编辑器唯一（useScreenEditor），不是因为这个类是单例。
 *
 * 过滤器运行时需要的 callbackArgs（运行时值）另走 CallbackArgsSource 注入点。
 */
class CallbackArguments {
  /** 回调管理器 */
  private callbackArgumentsManager: CallbackManager = {};

  /**
   * 回调参数 用于注入过滤器执行
   * 键名为 变量名 值为 回调参数值
   */
  private callbackArgs: Record<string, any> = {};

  /** 反向事件映射表：对象组件ID -> {源组件ID, 事件列表} */
  private eventMappingTarget: EventMappingTarget = new Map();

  public clearCallbackArguments(): void {
    this.callbackArgs = {};
    this.callbackArgumentsManager = {};
    this.eventMappingTarget.clear();
  }

  /** 获取回调管理器 */
  public getCallbackArgumentsManager(): CallbackManager {
    return this.callbackArgumentsManager;
  }

  /** 获取回调参数 */
  public getCallbackArgs(): Record<string, any> {
    return this.callbackArgs;
  }

  /** 获取事件映射目标表（反向索引） */
  public getEventMappingTarget(): EventMappingTarget {
    return this.eventMappingTarget;
  }

  /** 设置回调参数 */
  public setCallbackArgs(key: string, value: any): void {
    this.callbackArgs[key] = value;
  }

  public deleteCallbackArgs(key: string): void {
    delete this.callbackArgs[key];
  }

  /** 添加回调参数 */
  public addCallbackArgument(component: ComponentType | ChildComponent): void {
    this.registerSourceComponents(component);
    this.registerTargetComponents(component);
  }

  /** 构建事件映射 */
  private buildEventMapping(component: ComponentType | ChildComponent): void {
    if (!component.events?.length) {
      return;
    }

    const sourceComponentId = String(component.id);

    for (const event of component.events) {
      for (const action of event.actions || []) {
        const targetComponentIds = (action.component || []).map(extractComponentId);

        for (const targetId of targetComponentIds) {
          const targetIdStr = String(targetId);
          if (!this.eventMappingTarget.has(targetIdStr)) {
            this.eventMappingTarget.set(targetIdStr, []);
          }

          const existingMapping = this.eventMappingTarget.get(targetIdStr)!;
          const sourceInfo = existingMapping.find((m) => m.sourceComponentId === sourceComponentId);

          if (sourceInfo) {
            const hasEvent = sourceInfo.events.some((registeredEvent) => registeredEvent.id === event.id);
            if (!hasEvent) {
              sourceInfo.events.push(event);
            }
          } else {
            existingMapping.push({
              sourceComponentId,
              events: [event]
            });
          }
        }
      }
    }
  }

  /** 初始化回调参数（清空后添加） */
  public initCallbackArguments(componentList: ComponentType[] | ChildComponent[]): void {
    this.clearCallbackArguments();
    this.addCallbackArgumentsFromComponentList(componentList);
  }

  /** 批量添加回调参数（不清空，直接添加） */
  public addCallbackArgumentsFromComponentList(componentList: ComponentType[] | ChildComponent[]): void {
    if (!componentList?.length) {
      return;
    }

    for (const element of componentList) {
      if (!element) {
        continue;
      }

      this.addCallbackArgument(element);

      this.buildEventMapping(element);

      if (element.children?.length) {
        this.addCallbackArgumentsFromComponentList(element.children);
      }

      if (element.presetChild?.length) {
        this.addCallbackArgumentsFromComponentList(element.presetChild);
      }

      if (renderSystemComponentType.includes(element.component?.prop as PanelEnum)) {
        const { panelData } = element as SystemComponentProps;
        for (const status of panelData) {
          this.addCallbackArgumentsFromComponentList(status.config as ComponentType[] | ChildComponent[]);
        }
      }
    }
  }

  /** 注册回调源组件 */
  private registerSourceComponents(component: ComponentType | ChildComponent): void {
    if (!component) {
      return;
    }
    const { cbArgs, id, name } = component;

    if (!cbArgs || cbArgs.length === 0) {
      return;
    }

    cbArgs.forEach((arg) => {
      const field = arg.value.target.value;
      if (!this.callbackArgumentsManager[field]) {
        this.initCallbackRelation(field);
      }

      const source = this.callbackArgumentsManager[field]!.source;
      const isRegistered = source.some((item) => item.id === id && item.cbId === arg.id);
      if (!isRegistered) {
        source.push({
          id,
          name,
          cbId: arg.id
        });
      }
    });
  }

  /**
   * 注册回调目标组件
   * TODO: 添加子组件处理
   */
  private registerTargetComponents(component: ComponentType | ChildComponent): void {
    if (!component) {
      return;
    }

    const { listenArgs, name, id, openFilter } = component;

    if (!listenArgs || listenArgs.length === 0 || !openFilter) {
      return;
    }

    listenArgs.forEach((arg) => {
      const { callbackFields, filterName } = arg;
      callbackFields.forEach((field) => {
        if (!this.callbackArgumentsManager[field]) {
          this.initCallbackRelation(field);
        }

        const target = this.callbackArgumentsManager[field]!.target;
        const isRegistered = target.some((item) => item.id === id && item.filterName === filterName);
        if (!isRegistered) {
          target.push({
            filterName,
            name,
            id
          });
        }
      });
    });
  }

  /** 初始化回调关系 */
  public initCallbackRelation(field: string): void {
    this.callbackArgumentsManager[field] = {
      source: [],
      target: []
    };
  }

  /** 移除组件的回调关系 */
  public removeComponentFromCallbacks(component: ComponentType | ChildComponent): void {
    const { cbArgs, listenArgs, id } = component;

    if (cbArgs && cbArgs.length > 0) {
      cbArgs.forEach((arg) => {
        const field = arg.value.target.value;
        if (this.callbackArgumentsManager[field]) {
          this.callbackArgumentsManager[field]!.source = this.callbackArgumentsManager[field]!.source.filter(
            (item) => item.id !== id
          );
        }
      });
    }

    if (listenArgs && listenArgs.length > 0) {
      listenArgs.forEach((arg) => {
        const { callbackFields } = arg;
        callbackFields.forEach((field) => {
          if (this.callbackArgumentsManager[field]) {
            this.callbackArgumentsManager[field]!.target = this.callbackArgumentsManager[field]!.target.filter(
              (item) => item.id !== id
            );
          }
        });
      });
    }

    Object.keys(this.callbackArgumentsManager).forEach((field) => {
      const relation = this.callbackArgumentsManager[field];
      if (relation && relation.source.length === 0 && relation.target.length === 0) {
        delete this.callbackArgumentsManager[field];
      }
    });
  }

  /** 处理回调：把源组件抛出的值按 cbArgs 映射写入 callbackArgs */
  public handleCallback({
    sourceComponent,
    throwValue
  }: {
    sourceComponent: ComponentType | ChildComponent;
    throwValue: Record<string, any>;
  }): void {
    const mappedValue = mapValueWithDataRemark(sourceComponent, throwValue);
    sourceComponent.cbArgs.forEach((arg) => {
      const originKey = arg.value.origin.value;
      const targetKey = arg.value.target.value;

      if (throwValue[originKey] !== undefined) {
        this.callbackArgs[targetKey] = mappedValue[originKey];
      }
    });
  }
}

export { CallbackArguments };
