/**
 * 过滤器运行器（框架无关）：按组件的 dataType 选数据源策略，跑完再做 dataRemark 字段映射。
 *
 * 原为 @screenwright/composables 的 `FilterData`。下沉的理由是 Node 侧也要真跑过滤器——
 * Screenwright 后端算过滤器结果、eval 验 `dataFormatter` 写得对不对，都走这里。
 *
 * 【策略是注册进来的，不是 import 进来的】
 * core 只内置 {@link StaticDataFilter}（读组件自己的 data，零 IO）。api / sql / csv / websocket
 * 都需要真实 IO 或长连接，实现留在 use，宿主启动时用 {@link registerFilterStrategy} 注册。
 * 注册表是模块级的：宿主注册一次，此后 new 出来的每个 runner 都共享——与 setFilterResultSink /
 * setCallbackArgsSource 同一套路。
 */
import type { ChildComponent, ComponentType, DataRemark, DataType, Filter } from "@screenwright/types";
import { DataType as DataTypeEnum } from "@screenwright/types";

import type { BaseFilter } from "./BaseFilter";
import { StaticDataFilter } from "./StaticDataFilter";

/** 需要先建立订阅才能取数的策略（websocket）。core 不认识具体实现，只按形状调用。 */
interface SubscribableFilter {
  setupSubscription?: (target: ComponentType | ChildComponent, onDataReceived?: (data: any) => void) => Promise<void>;
}

// ── 轻量工具（core 不依赖 lodash，见 ScreenManager / selectors 的同类内联）─────────

const isNil = (v: unknown): boolean => v === null || v === undefined;

const isString = (v: unknown): v is string => typeof v === "string";

const isPlainObject = (v: unknown): v is Record<string, unknown> => {
  if (typeof v !== "object" || v === null) {
    return false;
  }
  const proto = Object.getPrototypeOf(v) as unknown;
  return proto === null || proto === Object.prototype;
};

const isEmpty = (v: unknown): boolean => {
  if (isNil(v)) {
    return true;
  }
  if (Array.isArray(v) || isString(v)) {
    return v.length === 0;
  }
  if (typeof v === "object") {
    return Object.keys(v as object).length === 0;
  }
  return true;
};

/**
 * duck-type 版 isRef：core 不能 import vue，但入参可能是宿主传进来的 Vue ref。
 * Vue 的 ref 带 `__v_isRef` 标记，判定形状即可，不必依赖框架。
 */
const isRef = (v: unknown): v is { value: unknown } =>
  typeof v === "object" && v !== null && (v as { __v_isRef?: boolean }).__v_isRef === true;

// ── 数据源策略注册表（模块级）───────────────────────────────────────────────

const strategies = new Map<DataType, () => BaseFilter>([
  [DataTypeEnum.STATIC, () => new StaticDataFilter()],
  // IOT 与静态同源：数据已经在组件上，不需要额外取数
  [DataTypeEnum.IOT, () => new StaticDataFilter()]
]);

/** 注册一种数据源策略（宿主启动时调用；重复注册以最后一次为准）。 */
export function registerFilterStrategy(dataType: DataType, factory: () => BaseFilter): void {
  strategies.set(dataType, factory);
}

/** 当前已注册的数据源类型，便于宿主自检「该注册的都注册了没」。 */
export function registeredFilterStrategies(): DataType[] {
  return [...strategies.keys()];
}

class FilterRunner {
  /**
   * 转换单个对象的数据映射
   * @param item - 要转换的数据对象
   * @param mapKey - 数据映射规则
   */
  transformMarkDataObject(item: Record<string, unknown>, mapKey: DataRemark[]): Record<string, unknown> {
    if (!mapKey || !item) {
      return item;
    }

    const transformedItem: Record<string, unknown> = { ...item };
    mapKey.forEach((mapItem) => {
      transformedItem[mapItem.key] = item[mapItem.map];
    });

    return transformedItem;
  }

  transformMarkData(data: Array<unknown | undefined | null> | { value: unknown }, mapKey: DataRemark[]) {
    if (!mapKey || !data) {
      if (isString(data)) {
        return data;
      } else {
        return [];
      }
    }

    let typeData: unknown = isRef(data) ? data.value : data;
    if (isPlainObject(typeData)) {
      typeData = [typeData];
    }
    // 转换每个数据项，过滤掉空项
    return (typeData as Record<string, unknown>[])
      .filter((item) => !isNil(item) || !isEmpty(item))
      .map((item) => this.transformMarkDataObject(item, mapKey));
  }

  /** 按组件 dataType 取策略；未注册的一律退回静态数据源，与下沉前行为一致。 */
  private getDataTypeStrategy(target: ComponentType | ChildComponent): BaseFilter {
    const strategyFactory = strategies.get(target.dataType);
    return strategyFactory ? strategyFactory() : new StaticDataFilter();
  }

  async executeStrategy(options: {
    filterConfig: Record<string, Filter>;
    target: ComponentType | ChildComponent;
    onDataReceived?: (data: any) => void;
  }) {
    const { filterConfig, target, onDataReceived } = options;
    const strategy = this.getDataTypeStrategy(target);

    // 需要订阅的数据源（websocket）先建订阅再取数。这里按形状判断而不是判 dataType，
    // 因为 core 不认识具体策略实现——谁提供了 setupSubscription 谁就先订阅。
    const subscribable = strategy as unknown as SubscribableFilter;
    if (subscribable.setupSubscription) {
      await subscribable.setupSubscription(target, onDataReceived);
    }

    return await strategy.run(filterConfig, target);
  }

  async run(options: {
    filterConfig: Record<string, Filter>;
    target: ComponentType | ChildComponent;
    onDataReceived?: (customComponent?: ComponentType | ChildComponent) => void;
  }) {
    const { filterConfig, target, onDataReceived } = options;
    const result = await this.executeStrategy({ filterConfig, target, onDataReceived });

    // 处理数据映射
    if (Array.isArray(result)) {
      return this.transformMarkData(result, target.dataRemark || []);
    }

    // result 为对象时，也执行转换
    if (isPlainObject(result) && target.dataRemark?.length) {
      return this.transformMarkDataObject(result, target.dataRemark);
    }

    return result;
  }

  async getInputData(target: ComponentType) {
    const strategy = this.getDataTypeStrategy(target);
    return await strategy.getInputData(target);
  }
}

export { FilterRunner };
