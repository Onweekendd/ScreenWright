import type {
  ChildComponent,
  ComponentType,
  DataRemark,
  Filter,
} from "@screenwright/types";
import { DataType } from "@screenwright/types";
import { isEmpty, isNil, isPlainObject, isString } from "lodash-es";
import type { Ref } from "vue";
import { isRef } from "vue";

import type { BaseFilter } from "./baseFilter";
import { staticDataFilter } from "./staticDataFilter";

// TODO[material 迁移]: 其余数据源策略（apiFilter / sqlFilter / csvFilter / websocketFilter）
// 依赖 app 的 @/api/dataSource 与回调参数管理，暂未随图表迁入物料包。
// 当前非 STATIC/IOT 类型会回退到 staticDataFilter（直接返回 target.data，不发起远程请求），
// 待后续按宿主注入方式接入远程数据源后再补齐。

class FilterData {
  /**
   * 转换单个对象的数据映射
   * @param item - 要转换的数据对象
   * @param mapKey - 数据映射规则
   * @returns 转换后的对象
   */
  transformMarkDataObject(
    item: Record<string, unknown>,
    mapKey: DataRemark[],
  ): Record<string, unknown> {
    if (!mapKey || !item) {
      return item;
    }

    const transformedItem: Record<string, unknown> = {
      ...item,
    };

    // 根据映射规则转换每个属性
    mapKey.forEach((mapItem) => {
      transformedItem[mapItem.key] = item[mapItem.map];
    });

    return transformedItem;
  }

  transformMarkData(
    data: Array<unknown | undefined | null> | Ref<unknown>,
    mapKey: DataRemark[],
  ): unknown[] | string {
    if (!mapKey || !data) {
      if (isString(data)) {
        return data;
      } else {
        return [];
      }
    }

    let typeData = isRef(data) ? data.value : data;
    if (isPlainObject(typeData)) {
      typeData = [typeData];
    }
    // 转换每个数据项，过滤掉空项
    return (typeData as Record<string, unknown>[])
      .filter((item) => !isNil(item) || !isEmpty(item))
      .map((item) => this.transformMarkDataObject(item, mapKey));
  }

  /**
   * 数据处理策略映射
   */
  private readonly dataStrategies = new Map<DataType, () => BaseFilter>([
    [DataType.STATIC, () => new staticDataFilter()],
    [DataType.IOT, () => new staticDataFilter()],
  ]);

  /**
   * 获取数据处理策略
   */
  private getDataTypeStrategy(target: ComponentType | ChildComponent) {
    const strategyFactory = this.dataStrategies.get(target.dataType);

    return strategyFactory ? strategyFactory() : new staticDataFilter();
  }

  /**
   * 执行数据处理策略
   */
  async executeStrategy(options: {
    filterConfig: Record<string, Filter>;
    target: ComponentType | ChildComponent;
  }) {
    const { filterConfig, target } = options;
    const strategy = this.getDataTypeStrategy(target);

    // 执行过滤转换
    return await strategy.run(filterConfig, target);
  }

  async run(options: {
    filterConfig: Record<string, Filter>;
    target: ComponentType | ChildComponent;
  }) {
    const { filterConfig, target } = options;
    // 执行策略
    const result = await this.executeStrategy({ filterConfig, target });
    // 处理数据映射
    if (Array.isArray(result)) {
      return this.transformMarkData(result, target.dataRemark || []);
    }

    // result 为对象时，也执行转换
    if (isPlainObject(result) && target.dataRemark?.length) {
      return this.transformMarkDataObject(
        result as Record<string, unknown>,
        target.dataRemark,
      );
    }

    return result;
  }

  async getInputData(target: ComponentType) {
    // 获取输入数据处理策略
    const strategy = this.getDataTypeStrategy(target);

    // 执行策略
    const result = await strategy.getInputData(target);
    return result;
  }
}

export { FilterData };
