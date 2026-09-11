import type { LargeScreeInfo } from "@screenwright/types";

import type { BaseEntity } from "@/model/BaseEntity";
import { serverRequestWithCache } from "@/utils/cacheService";
import { BaseName } from "@/utils/config";
import { request } from "@/utils/service";

// 大屏详情已回落 Screenwright。
// 走带缓存的实例：命中 IndexedDB 时 handleRequestCacheInterceptor 会直接返回缓存
// （只发一次轻量 /largeScreen/meta 比对 updatedTime，省掉整包 layers 的 /info），
// 未命中 / 已过期再正常请求，响应后由 debouncedResponseHandler 回灌缓存。
export const getLargeScreenInfo = (id: number) => {
  return serverRequestWithCache<BaseEntity<LargeScreeInfo>>({
    url: `${BaseName.System}/largeScreen/info/${id}?id=${id}`,
    method: "get"
  });
};
const getFormData = (data = {}) => {
  const formData = new FormData();
  for (const k in data) {
    const item = data[k as keyof typeof data];
    formData.append(k, item);
  }
  return formData;
};
export const queryBlueprint = (params: { largeId: number; password?: string; type?: number }) => {
  const formdata = getFormData(params);
  return request<BaseEntity<any>>({
    url: `${BaseName.System}/blue/print/query/data`,
    method: "post",
    data: formdata
  });
};

export const queryOpenBlueprint = (params: { largeId: number; password: string; type: number }) => {
  const formdata = getFormData(params);
  return request<BaseEntity<any>>({
    url: `${BaseName.Online}/largeScreenAgg/blue/print/open/data`,
    method: "POST",
    data: formdata
  });
};
