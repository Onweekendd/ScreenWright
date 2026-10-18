import type { LoginReq, LoginRes, TreeRes, UserRes } from "@/model/Login";
import { BaseName } from "@/utils/config";
import { serverRequest } from "@/utils/serverService";

// 登录 / 当前用户 / 菜单（baseURL = VITE_FUNAI_API_URL）

/** 用户名密码登录；成功返回 { token, userInfo } */
export const login = (data: Pick<LoginReq, "username" | "password">) => {
  return serverRequest<LoginRes>({
    url: `${BaseName.User}/login`,
    method: "post",
    data
  });
};

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
