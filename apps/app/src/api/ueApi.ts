import type { BaseEntity } from "@/model/BaseEntity";
import { BaseName } from "@/utils/config";
import { request } from "@/utils/service";

export const getUEList = (params?: { current?: number; size?: number; name?: string }) =>
  request<BaseEntity<any>>({
    url: `${BaseName.System}/ue/list`,
    method: "POST",
    data: { current: params?.current || 1, size: params?.size || 200, name: params?.name || "", groupId: -2 }
  });
