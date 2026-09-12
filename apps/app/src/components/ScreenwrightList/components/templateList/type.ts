export interface ExportParams {
  id: number;
  name?: string;
}

/** 写入导出包 view.js 的大屏配置（大屏详情里各 JSON 字段解析后的形态） */
export interface TempMode {
  aniFrameSet: unknown;
  statusAnimation: unknown;
  dataFilterArr: unknown;
  detail: unknown;
  component: unknown[];
  encodedControl: string[] | null;
  config: unknown;
}
