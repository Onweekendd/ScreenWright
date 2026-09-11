import type { getPluginReq, getPluginRes } from "@/model/Plugin";
import { request } from "@/utils/service";

export const getPlugin = (params: getPluginReq) => {
  return request<getPluginRes>({
    url: "/bi-system/plug/info/list",
    method: "post",
    data: params
  });
};
