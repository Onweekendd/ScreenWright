// 定义抽象类modelData，包含基础数据结构和抽象方法
import { pick } from "lodash-es";

import type { DataForm } from "../type";

abstract class modelData {
  defaultData: Partial<DataForm>;

  constructor(initData: Partial<DataForm>) {
    this.defaultData = pick(initData, ["id", "group", "type", "name", "description"]);
  }
  public getFormData = (data = {}) => {
    const formData = new FormData();
    for (const k in data) {
      const item = data[k as keyof typeof data];
      formData.append(k, item);
    }
    return formData;
  };
  // 抽象方法，用于添加数据，子类必须实现
  abstract addApi(data: any): Promise<any>;

  // 抽象方法，用于编辑数据，子类必须实现
  abstract editApi(data: any): Promise<any>;

  // 抽象方法，用于删除数据，子类必须实现
  abstract delApi(data: any): Promise<any>;
}

export { modelData };
