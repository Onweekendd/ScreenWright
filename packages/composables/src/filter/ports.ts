/**
 * filterData 数据源策略依赖的后端接口注入端口（真正的 IO 边界，粒度收窄到单个函数）。
 * 部署顺序要求：主应用必须在挂载任何触发数据过滤的物料组件之前调用一次 initFilterDataApi。
 */
export type ExecuteSqlFn = (params: {
  jdbcUrl: string;
  password: string;
  username: string;
  sql: string;
}) => Promise<{ success: boolean; message?: string; result?: unknown }>;

export type QueryAPIDataFn = (params: Record<string, unknown>) => Promise<unknown>;

export type GetCsvDataFn = (id: number) => Promise<{ success: boolean; message?: string; result?: unknown }>;

export interface FilterDataApiImpls {
  executeSql: ExecuteSqlFn;
  queryAPIData: QueryAPIDataFn;
  getCsvData: GetCsvDataFn;
}

let impl: FilterDataApiImpls | null = null;

/** 由主应用在启动时调用一次，注入 sqlFilter/apiFilter/csvFilter 需要的后端接口实现。 */
export function initFilterDataApi(impls: FilterDataApiImpls): void {
  impl = impls;
}

function getImpl(): FilterDataApiImpls {
  if (!impl) {
    throw new Error(
      "[@screenwright/composables] filterData 尚未初始化，请在应用启动时调用 initFilterDataApi() 注入实现"
    );
  }
  return impl;
}

export const executeSql: ExecuteSqlFn = (params) => getImpl().executeSql(params);
export const queryAPIData: QueryAPIDataFn = (params) => getImpl().queryAPIData(params);
export const getCsvData: GetCsvDataFn = (id) => getImpl().getCsvData(id);
