import { type RouteLocationNormalized } from "vue-router";

/** 独立渲染页白名单：跳过菜单 / 动态路由 / 权益初始化（匹配路由 path） */
const whiteList: string[] = ["/shareScreen"];
const whiteListName: string[] = ["shareScreen", "terminal", "screenPage"];

/** 免登录白名单（匹配路由 name） */
// const whiteListByName: string[] = []

/** 判断是否在白名单 */
const isWhiteList = (to: RouteLocationNormalized) => {
  // 检查完整路径匹配
  if (whiteList.indexOf(to.path) !== -1 || whiteListName.indexOf(to.name as any) !== -1) {
    return true;
  }

  // 检查路径前缀匹配
  // return whiteList.some((path) => to.path.startsWith(path))
};

const whiteEquitiesInfo = ["view"];

export { isWhiteList, whiteEquitiesInfo, whiteList };
