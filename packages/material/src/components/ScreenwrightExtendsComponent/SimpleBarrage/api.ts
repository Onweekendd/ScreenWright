import { BaseName, request } from "@screenwright/composables";

// 弹幕签名列表接口：原 app `@/api/visual` 的 simpleBarrageList，物料化后就近重建，
// 走 @screenwright/composables 的 http 端口（token/baseURL/loading 等横切关注点由 app 注入的 request 处理）。
const systemBase = BaseName.System;

export interface SimpleBarrageListParams {
  size: number;
  layerScrollId: string | number;
  [key: string]: unknown;
}

interface SimpleBarrageRecord {
  signUrl: string;
  [key: string]: unknown;
}

interface SimpleBarrageListResult {
  result: {
    records: SimpleBarrageRecord[];
  };
}

export const simpleBarrageList = (
  data: SimpleBarrageListParams,
  showLoading = true,
) =>
  request<SimpleBarrageListResult>({
    url: `${systemBase}/sign/list`,
    method: "post",
    data,
    showLoading,
  });
