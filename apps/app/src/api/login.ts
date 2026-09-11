import type { DataOpenReq } from "@/model/DataModel";
import type { TreeRes } from "@/model/Login";
import type { UserRoleRes } from "@/model/Role";
import { BaseName } from "@/utils/config";
import { serverRequest } from "@/utils/serverService";

// 开源单机版无登录：仅保留 菜单 / 权益 查询（baseURL = VITE_FUNAI_API_URL）

export const getRoleEquities = () => {
  return serverRequest<UserRoleRes>({
    url: `${BaseName.User}/roleEquities/infoByApplicationCode/${BaseName.AppCode}`,
    method: "get"
  });
};

export const openCheckEquities = (data: DataOpenReq) => {
  return serverRequest<UserRoleRes>({
    url: `${BaseName.Online}/largeScreenAgg/openCheckEquities`,
    method: "post",
    data: {
      ...data
    }
  });
};

/**
 * 获取应用下的菜单数据
 * @remarks bi-system | user
 */
export const getRouteData = (data = {}) => {
  return serverRequest<TreeRes>({
    url: `${BaseName.User}/menu/application/userTree/${BaseName.AppCode}`,
    method: "post",
    data: {
      ...data,
      applicationCode: BaseName.AppCode
    }
  });
};
