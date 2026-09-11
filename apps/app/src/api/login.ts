import type { TreeRes, UserRes } from "@/model/Login";
import { BaseName } from "@/utils/config";
import { serverRequest } from "@/utils/serverService";

// 开源单机版无登录：仅保留 菜单 / 当前用户 查询（baseURL = VITE_FUNAI_API_URL）

export const getCurrentUser = () => {
  return serverRequest<UserRes>({
    url: `${BaseName.User}/current/${BaseName.AppCode}`,
    method: "get"
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
