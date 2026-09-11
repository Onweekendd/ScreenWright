// 定义抽象类modelData，包含基础数据结构和抽象方法
import type { DataModelReq, updateModelReq } from "@/model/DataModel";
import type { ScreenReq } from "@/model/Visual";

abstract class baseModelApi {
  constructor() {}

  // 抽象方法,获取精选模板的数据，子类必须实现
  abstract getScreenModule(data: any): Promise<any>;
  // 抽象方法,获取内容列表函数，子类必须实现
  abstract getScreenList(data: ScreenReq): Promise<any>;
  // 抽象方法,新增列表函数，子类必须实现
  abstract addScreenData(data: DataModelReq): Promise<any>;
  // 抽象方法,复制列表函数，子类必须实现
  abstract copyScreenObj(params: { id: string | number; versionCode: string }, baseUrl: string): Promise<any>;
  // 抽象方法,获取版本列表函数，子类必须实现
  abstract getScreenVersionList(id: string | number, baseUrl: string): Promise<any>;
  // 抽象方法,修改列表函数，子类必须实现
  abstract updateScreenData(data: updateModelReq): Promise<any>;
  // 抽象方法,删除列表函数，子类必须实现
  abstract deleteScreenObj(id: string | number, baseUrl: string): Promise<any>;
}

export { baseModelApi };
