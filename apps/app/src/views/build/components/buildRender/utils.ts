import { assignComponentAttrs } from "@screenwright/core";
import { ElMessage } from "element-plus";
import html2canvas from "html2canvas";

import { updateLayersAgg, updateLayersAggNoCache } from "@/api/library";
import { mediaEnum, textEnum } from "@/components/componentEntry/type";
import { dbManager, STORE_NAME } from "@/db";
import { dyPanelCount } from "@/utils/config";
import { pipeValidator } from "@/utils/pipeValidator";
import { handleMessageBox } from "@/utils/utils";
import { getVersionCode } from "@/utils/version";

import { useStatusAnimation } from "../buildConfig/attrsRender/components/statusAnimation/useStatusAnimation";
import { extendsEnumType } from "./core/ExtendsComponents/type";
import { sceneEnumType } from "./core/SceneComponent/type";
import { DYNAMIC_PANEL_MODULE_ID } from "./core/SystemComponent/panel";
import { customPositionTypeEnum } from "./core/SystemComponent/panel/DynamicPanel";
import type { PanelState, SystemComponentProps } from "./core/SystemComponent/type";
import { PanelType, renderSystemComponentType } from "./core/SystemComponent/type";
import type { Animation, ComponentType, direction } from "./type";
import { FolderType } from "./type";

/**
 * 更新历史记录类型枚举
 * 用于标识组件的操作类型
 */
export enum UpdateHistoryTypeEnum {
  ADD = "ADD",
  UPDATE = "UPDATE",
  SKIP = "SKIP",
  DELETE = "DELETE"
}

// 创建 PanelType 值的数组用于运行时校验

export const setSizeStyle = (attr: {
  width: number;
  height: number;
  unitPavenType: string;
  renderWidth: number;
  renderHeight: number;
  prop: string;
}) => {
  if (!attr) {
    return {
      width: "0px",
      height: "0px"
    };
  }

  if (attr.unitPavenType === "percent") {
    return {
      width: `${(attr.width / 100) * attr.renderWidth}px`,
      height: `${(attr.height / 100) * attr.renderHeight}px`
    };
  }

  const res = processEncodePanel(attr);
  if (res) {
    return res;
  }

  return {
    width: `${attr.width}px`,
    height: `${attr.height}px`
  };

  function processEncodePanel(attr: any): any {
    if (attr.prop && attr.prop === PanelType.encodePanel) {
      return {
        width: `350px`,
        height: `200px`
      };
    }

    return null;
  }
};
function parseUrlInfo(url: string) {
  // 匹配 /build/数字 或 /view/数字
  const idMatch = url.match(/\/(build|view)\/(\d+)/);
  const id = idMatch ? idMatch[2] : "";

  // 解析 ? 后面所有参数
  const params: Record<string, string> = {};
  const queryStr = url.split("?")[1];
  if (queryStr) {
    queryStr.split("&").forEach((item) => {
      const [key, value] = item.split("=");
      if (key) {
        params[key] = value || "";
      }
    });
  }

  return { id, params };
}
const deleteScreenCacheByCurrentRoute = async (fallbackId?: string | number) => {
  try {
    const queryParams = parseUrlInfo(window.location.href);
    const routeId = queryParams.id || String(fallbackId || "");
    const versionCode = queryParams.params.version || getVersionCode() || "";

    if (!routeId) {
      return;
    }

    // 1) 优先删除当前版本缓存（实际缓存主键格式：${id}-${versionCode}）
    if (versionCode) {
      const targetDbId = `${routeId}-${versionCode}`;
      await dbManager.delete(STORE_NAME, targetDbId);
    }

    // 2) 兜底：删除该大屏ID下所有版本缓存，避免版本不一致导致删不掉
    const allCache = await dbManager.getAll<{ id: string | number }>(STORE_NAME);
    const matchKeys = (allCache || [])
      .map((item) => String(item?.id || ""))
      .filter((key) => key === routeId || key.startsWith(`${routeId}-`));

    await Promise.all(matchKeys.map((key) => dbManager.delete(STORE_NAME, key)));
  } catch (error) {
    console.warn("删除大屏缓存失败:", error);
  }
};
export const useComponentStyle = (attr: any) => {
  if (!attr) {
    return {};
  }
  const { left, top } = attr;
  return {
    left: left + "px",
    top: top + "px",
    ...setSizeStyle({
      ...attr,
      prop: attr.component && attr.component.prop
    })
  };
};

export const eventIconClass = (item: ComponentType) => {
  return {
    "component-bind-events": true,
    "has-bind": item.events && item.events.length > 0,
    "has-encode": (item.encodes ?? []).length > 0
  };
};

// 锚点位置
export const setPointStyle = (point: string, index: number, attr: any, cursorResize: string[]) => {
  const { width: pxWidth, height: pxHeight } = setSizeStyle(attr);
  const width = parseInt(pxWidth as string, 10);
  const height = parseInt(pxHeight as string, 10);
  const isTop = /t/.test(point);
  const isBottom = /b/.test(point);
  const isLeft = /l/.test(point);
  const isRight = /r/.test(point);

  let newLeft = 0;
  let newTop = 0;

  // 四个角的点
  if (point.length === 2) {
    newLeft = isLeft ? 0 : width;
    newTop = isTop ? 0 : height;
  } else {
    // 上下两点的点，宽度居中
    if (isTop || isBottom) {
      newLeft = width / 2;
      newTop = isTop ? 0 : height;
    }

    // 左右两边的点，高度居中
    if (isLeft || isRight) {
      newLeft = isLeft ? 0 : width;
      newTop = Math.floor(height / 2);
    }
  }

  const style = {
    left: `${newLeft}px`,
    top: `${newTop}px`,
    cursor: cursorResize[index] + "-resize"
  };

  return style;
};

export const setComponentPosition = (target: any, x?: number, y?: number) => {
  if (x) {
    target.left = x;
  }
  if (y) {
    target.top = y;
  }
};

const dataURLtoFile = (dataurl: any, filename: any) => {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};
export const getCoverUrl = async (dom: HTMLElement, attrs: { width: number; height: number }) => {
  const canvas = await html2canvas(dom, {
    useCORS: true,
    backgroundColor: null,
    allowTaint: true,
    width: attrs.width,
    height: attrs.height
  });
  const fileName = new Date().getTime() + ".png";
  const file = dataURLtoFile(canvas.toDataURL("image/png"), fileName);
  console.log(file, "file");
  const url = URL.createObjectURL(file);

  console.log(url, "fileurl");
  return { url, file };
};

export const blobUrlToFile = async (blobUrl: string, fileName: string) => {
  try {
    // 使用 fetch 获取 Blob
    const response = await fetch(blobUrl);
    const blob = await response.blob();

    // 使用 File 构造函数将 Blob 转换为 File 对象
    const newFile = new File([blob], fileName, { type: blob.type });
    return newFile;
  } catch (error) {
    console.error("将 Blob URL 转换为 File 对象时出错:", error);
    return null;
  }
};

// 获取最小left值的元素
const findElementWithMinLeft = (elements: ComponentType[], direction: any) =>
  elements.reduce((min, current) => (current[direction] < min[direction] ? current : min), elements[0]);

// 计算左边的left
const calcLeftPosition = (child: ComponentType, minLeftChild: ComponentType, ws: number, leftA: number) => {
  const dis = child.component.width * ws - child.component.width;
  return `${minLeftChild.id}` === `${child.id}` ? child.left - leftA : child.left - dis;
};

// 计算顶部的top
const calcTopPosition = (child: ComponentType, minTopChild: ComponentType, hs: number, topA: number) => {
  const dis = child.component.height * hs - child.component.height;
  return `${minTopChild.id}` === `${child.id}` ? child.top - topA : child.top - dis;
};
function getFixed(val = 0, len = 2) {
  return Number(parseFloat(val as any).toFixed(len));
}

export const handleGroupByParent = ({
  attr,
  point,
  newWidth,
  newHeight
}: {
  attr: ComponentType;
  point: direction;
  newWidth: number;
  newHeight: number;
}) => {
  const oldRect = {
    left: attr.left - (newWidth - attr.component.width) * (/l/.test(point) ? 1 : 0),
    top: attr.top - (newHeight - attr.component.height) * (/t/.test(point) ? 1 : 0),
    width: attr.component.width,
    height: attr.component.height
  };
  const newRect = {
    left: attr.left,
    top: attr.top,
    width: newWidth ?? attr.component.width,
    height: newHeight ?? attr.component.height
  };
  const hs = newRect.height / oldRect.height;
  const ws = newRect.width / oldRect.width;
  const children = attr.children || [];
  const isTop = /t/.test(point);
  const isBottom = /b/.test(point);
  const isLeft = /l/.test(point);
  const isRight = /r/.test(point);
  const minLeftChild = findElementWithMinLeft(children, "left");
  const minTopChild = findElementWithMinLeft(children, "top");
  children.forEach((child) => {
    let newLeft = child.left;
    let newTop = child.top;
    // 处理不同拉伸方向
    if (isLeft && isTop) {
      // 左上
      const left = newRect.left - oldRect.left;
      newLeft = calcLeftPosition(child, minLeftChild, ws, left);
      const top = newRect.top - oldRect.top;
      newTop = calcTopPosition(child, minTopChild, hs, top);
    } else if (isLeft && isBottom) {
      const left = newRect.left - oldRect.left;
      newLeft = calcLeftPosition(child, minLeftChild, ws, left);
      newTop = getFixed(oldRect.top + (child.top - oldRect.top) * hs);
    } else if (isRight && isTop) {
      // 右上
      newLeft = getFixed(oldRect.left + (child.left - oldRect.left) * ws);
      const top = newRect.top - oldRect.top;
      newTop = calcTopPosition(child, minTopChild, hs, top);
    } else if (isRight && isBottom) {
      // 右下
      newLeft = getFixed(oldRect.left + (child.left - oldRect.left) * ws);
      newTop = getFixed(oldRect.top + (child.top - oldRect.top) * hs);
    } else if (isLeft) {
      const left = newRect.left - oldRect.left;
      newLeft = calcLeftPosition(child, minLeftChild, ws, left);
    } else if (isRight) {
      // 右中
      newLeft = getFixed(oldRect.left + (child.left - oldRect.left) * ws);
    } else if (isTop) {
      // 上中
      newTop = calcTopPosition(child, minTopChild, hs, newRect.top - oldRect.top);
    } else if (isBottom) {
      // 下中
      newTop = getFixed(oldRect.top + (child.top - oldRect.top) * hs);
    }
    const childHeight = child.component.height;
    const childWidth = child.component.width;
    assignComponentAttrs(child, {
      left: newLeft,
      top: newTop,
      height: getFixed(childHeight * hs),
      width: getFixed(childWidth * ws)
    });
    console.log(child, "child");
  });
  attr.component.width = getFixed(newWidth ?? attr.component.width);
  attr.component.height = getFixed(newHeight ?? attr.component.height);
};

/**
 * 获取不影响旧版本的组件
 * @param component 组件
 * @returns 无 children 的组件
 */
export const getPureComponent = (component: ComponentType): ComponentType => {
  // 分组情况
  if (component.children && component.children.length > 0) {
    return component;
  }
  const temp = {
    ...component,
    parentDynamicPanelId: undefined,
    children: undefined
  };

  delete temp.parentDynamicPanelId;
  delete temp.children;
  return temp;
};

// 这三个的实现都已下沉到 @screenwright/core（selectors/geometry）：它们算的是**由树结构唯一决定的**
// 派生值——最高层级、分组包围盒、以及包围盒的写入配对。后端重演同一个动作时要算出同样的数字，
// 两边各存一份必然漂移，且漂移了不报错。此处再导出，只为保持既有导入路径不变。
//
// 注意分组包围盒现在由 core 的写入 API 内部收口（ComponentManager.reflowGroup），
// 走 group / delete / move / upsert 的地方不需要、也不该再手写一遍；
// 剩下直接调用的，都是「成员位置在 core 之外被改了」的场景（拖拽、属性面板、图层树）。
export { assignComponentAttrs, calculateGroupDimensions, getMaxIndex } from "@screenwright/core";

// 设置组动画
export const setGroupAnimation = (loadAnimation: Animation) => {
  const aniStyle =
    loadAnimation && loadAnimation.type !== "none"
      ? {
          animationTimingFunction: loadAnimation.timingFunction || "linear",
          animationDuration: `${(loadAnimation.duration || 0) / 1000}s`,
          animationDelay: `${(loadAnimation.delay || 0) / 1000}s`,
          animationName: `${
            loadAnimation.type == "opacity-in" ? loadAnimation.type : loadAnimation.type + "-" + loadAnimation.direction
          }`,
          animationFillMode: `forwards`,
          opacity: 0
        }
      : {};
  return { ...aniStyle };
};

export const customPositionStyle = (item: ComponentType, isBuild: boolean) => {
  if (isBuild) {
    return {};
  }
  if (item.component.prop === PanelType.dynamicPanel) {
    const customPosition = item.option.customPosition;
    if (!customPosition) {
      return {};
    }
    const customPositionType = item.option.customPositionType;
    const customPositionLeft = item.option.customPositionLeft;
    const customPositionRight = item.option.customPositionRight;
    const customPositionTop = item.option.customPositionTop;
    const customPositionBottom = item.option.customPositionBottom;
    const customPositionX = item.option.customPositionX;
    const customPositionY = item.option.customPositionY;
    const baseWidth = item.component.width;
    const baseHeight = item.component.height;
    if (customPositionType === customPositionTypeEnum.toLeft) {
      return {
        left: `${customPositionLeft || 0}%`
      };
    }
    if (customPositionType === "toRight") {
      return {
        left: "auto",
        right: `${customPositionRight || 0}%`
      };
    }
    if (customPositionType === customPositionTypeEnum.toCenter) {
      return {
        left: `calc(50% - ${baseWidth / 2}px)`,
        top: `calc(50% - ${baseHeight / 2}px)`
      };
    }
    if (customPositionType === customPositionTypeEnum.toCenterTop) {
      return {
        left: `calc(50% - ${baseWidth / 2}px)`,
        top: `${customPositionTop || 0}%`
      };
    }
    if (customPositionType === customPositionTypeEnum.toCenterBottom) {
      return {
        left: `calc(50% - ${baseWidth / 2}px)`,
        top: "auto",
        bottom: `${customPositionBottom || 0}%`
      };
    }
    if (customPositionType === customPositionTypeEnum.toCustom) {
      return {
        left: `${customPositionX || 0}%`,
        top: `${customPositionY || 0}%`
      };
    }
  }

  return {};
};

// 设置是否事件穿透
export const pointerEventStyle = (item: ComponentType, isBuild: boolean) => {
  if (isBuild) {
    return {};
  }

  if (item.component.prop === PanelType.dynamicPanel) {
    return { pointerEvents: "none" };
  }

  const pointerEventsComponent = [
    textEnum.FtText,
    mediaEnum.FtVideo,
    mediaEnum.FtImg,
    mediaEnum.FtOpenVideo,
    textEnum.FtText2,
    extendsEnumType.FtMaskLayer
  ];
  if (item.component.prop === extendsEnumType.FtMaskLayer) {
    return { pointerEvents: item.option.pointerEvents ? "none" : "auto" };
  }
  if (pointerEventsComponent.includes(item.component.prop as textEnum)) {
    return { pointerEvents: item.option.pointerEvents ? "auto" : "none" };
  }
  return {
    pointerEvents: "auto"
  };
};

/**
 * @description 是否可以添加终端面板
 * @returns 是否可以添加终端面板
 */
const encodePanelLimit = ({
  encodeComponentMap,
  newComponent
}: {
  encodeComponentMap: Map<string, ComponentType & { parentDynamicPanelId?: number[] }>;
  newComponent: ComponentType;
}) => {
  const isEncodePanel = newComponent.component.prop === PanelType.encodePanel;
  if (
    isEncodePanel &&
    Array.from(encodeComponentMap.values()).filter((component) => component.component.prop === PanelType.encodePanel)
      .length >= 5
  ) {
    ElMessage.warning("提示：终端交互组件数量已达上限!");
    return false;
  }
  return true;
};

/**
 * 三维场景限制
 * @param param0
 * @returns
 */
const threeSceneLimit = ({
  componentList,
  newComponent,
  isDynamicPanel,
  isEncodePanel
}: {
  componentList: ComponentType[];
  newComponent: ComponentType;
  isDynamicPanel: boolean;
  isEncodePanel: boolean;
}) => {
  const isMore = () => {
    const threeSceneComponents = componentList.filter(
      (v) => v.component.prop === sceneEnumType.ThreeScene || v.component.prop === sceneEnumType.IndustryScene
    );
    if (threeSceneComponents.length >= 1) {
      ElMessage.warning("提示：场景模板数量已达上限!");
      return false;
    }
    return true;
  };

  if (
    newComponent.component.prop === sceneEnumType.ThreeScene ||
    newComponent.component.prop === sceneEnumType.IndustryScene
  ) {
    if (isDynamicPanel || isEncodePanel) {
      ElMessage.warning("提示：场景模板不能复制到动态面板或终端交互中");
      return false;
    }
    return isMore();
  }
  return true;
};

/**
 * ue组件限制
 * @param param0
 * @returns
 */
const ueLimit = ({
  componentList,
  newComponent,
  isDynamicPanel,
  isEncodePanel
}: {
  componentList: ComponentType[];
  newComponent: ComponentType;
  isDynamicPanel: boolean;
  isEncodePanel: boolean;
}) => {
  const isMore = () => {
    const UePixelStreamingComponents = componentList.filter(
      (v) =>
        v.component.prop === extendsEnumType.UePixelStreaming || v.component.prop === extendsEnumType.UePeerStreaming
    );
    if (UePixelStreamingComponents.length >= 1) {
      ElMessage.warning(`提示：${newComponent.name}已达上限!`);
      return false;
    }
    return true;
  };
  if (newComponent.component.prop === extendsEnumType.UePeerStreaming) {
    if (isDynamicPanel || isEncodePanel) {
      ElMessage.warning("提示：UE组件不能复制到动态面板或终端交互中");
      return false;
    }
    return isMore();
  }
  if (newComponent.component.prop === extendsEnumType.UePixelStreaming) {
    if (isDynamicPanel || isEncodePanel) {
      ElMessage.warning("提示：UE组件不能复制到动态面板或终端交互中");
      return false;
    }
    return isMore();
  }

  if (newComponent.component.prop === extendsEnumType.FtUnrealEngine) {
    if (isDynamicPanel || isEncodePanel) {
      ElMessage.warning("提示：UE组件不能复制到动态面板或终端交互中");
      return false;
    }
    return isMore();
  }
  return true;
};
/**
 * 城市组件限制
 * @param param0
 * @returns
 */
const cityLimit = ({
  componentList,
  newComponent,
  isDynamicPanel,
  isEncodePanel
}: {
  componentList: ComponentType[];
  newComponent: ComponentType;
  isDynamicPanel: boolean;
  isEncodePanel: boolean;
}) => {
  const isMore = () => {
    const cityComponent = componentList.filter((v) => v.component.prop === sceneEnumType.Maptalks);
    if (cityComponent.length >= 1) {
      ElMessage.warning(`提示：城市模板已达上限!`);
      return false;
    }
    return true;
  };
  if (newComponent.component.prop === sceneEnumType.Maptalks) {
    if (isDynamicPanel || isEncodePanel) {
      ElMessage.warning("提示：城市模板不能复制到动态面板或终端交互中");
      return false;
    }
    return isMore();
  }
  return true;
};
/**
 * 数字人组件限制
 * @param param0
 * @returns
 */
const digitalHumanLimit = ({
  componentList,
  newComponent
}: {
  componentList: ComponentType[];
  newComponent: ComponentType;
}) => {
  const isMore = () => {
    const cityComponent = componentList.filter((v) => v.component.prop === extendsEnumType.FtDigitalHuman);
    if (cityComponent.length >= 1) {
      ElMessage.warning(`提示：数字人已达上限!`);
      return false;
    }
    return true;
  };
  if (newComponent.component.prop === extendsEnumType.FtDigitalHuman) {
    return isMore();
  }
  return true;
};

export const validateComponentForAdd = async ({
  componentList,
  newComponent,
  encodeComponentMap,
  isDynamicPanel = false,
  isEncodePanel = false
}: {
  componentList: ComponentType[];
  newComponent: ComponentType;
  encodeComponentMap: Map<string, ComponentType & { parentDynamicPanelId?: number[] }>;
  isDynamicPanel?: boolean;
  isEncodePanel?: boolean;
}) => {
  const result = await new pipeValidator()
    .add(() => threeSceneLimit({ componentList, newComponent: newComponent, isDynamicPanel, isEncodePanel }))
    .add(() => ueLimit({ componentList, newComponent: newComponent, isDynamicPanel, isEncodePanel }))
    .add(() => digitalHumanLimit({ componentList, newComponent: newComponent }))
    .add(() => cityLimit({ componentList, newComponent: newComponent, isDynamicPanel, isEncodePanel }))
    .add(() => encodePanelLimit({ encodeComponentMap, newComponent }))
    .validate();

  return result;
};

/**
 * 粘贴权限校验
 * @param componentList 组件列表
 * @param newComponent 新增组件
 * @param pastePermissionOptions 粘贴权限校验选项
 * @returns 是否通过校验
 */
const checkPastePermission = (
  newComponent: ComponentType,
  pastePermissionOptions: {
    encodeComponentMap: Map<string, ComponentType & { parentDynamicPanelId?: number[] }>;
    isEncodePanel: boolean;
    isDynamicPanel: boolean;
    onError?: (message: string) => void;
  }
): boolean => {
  const {
    encodeComponentMap,
    isEncodePanel: currentIsEncodePanel,
    isDynamicPanel: currentIsDynamicPanel,
    onError
  } = pastePermissionOptions;
  const componentId = newComponent.id.toString();
  const isComponentInEncode = encodeComponentMap.has(componentId);

  /**
   * 处理粘贴权限错误
   * @param message 错误消息
   * @returns false
   */
  const handlePasteError = (message: string): false => {
    if (onError) {
      onError(message);
    } else {
      ElMessage.warning(message);
    }
    return false;
  };

  /**
   * 检查终端交互组件是否能粘贴到动态面板
   */
  const checkEncodeToDynamicPanel = (): boolean => {
    if (
      currentIsDynamicPanel &&
      !currentIsEncodePanel &&
      encodeComponentMap.get(componentId)?.component.prop === PanelType.encodePanel
    ) {
      return handlePasteError("终端交互组件不能粘贴到面板中");
    }
    return true;
  };

  /**
   * 检查终端交互组件是否能粘贴到外部
   */
  const checkEncodeToExternal = (): boolean => {
    if (
      !currentIsEncodePanel &&
      isComponentInEncode &&
      encodeComponentMap.get(componentId)?.component.prop !== PanelType.encodePanel
    ) {
      return handlePasteError("终端交互组件不能粘贴到外部");
    }
    return true;
  };

  /**
   * 检查外部组件是否能粘贴到终端交互中
   */
  const checkExternalToEncode = (): boolean => {
    if (currentIsEncodePanel && !isComponentInEncode) {
      return handlePasteError("外部组件不能粘贴到终端交互中");
    }
    return true;
  };

  const checkEncodePanelToEncode = (): boolean => {
    if (
      currentIsEncodePanel &&
      isComponentInEncode &&
      encodeComponentMap.get(componentId)?.component.prop === PanelType.encodePanel
    ) {
      return handlePasteError("终端交互组件不能粘贴到终端交互中");
    }

    return true;
  };

  // 执行所有权限检查
  return (
    checkEncodeToDynamicPanel() && checkEncodeToExternal() && checkExternalToEncode() && checkEncodePanelToEncode()
  );
};

/**
 * 专门用于粘贴场景的组件校验，使用管道模式集成粘贴权限校验
 * @param params 参数对象
 * @returns 是否通过所有校验
 */
export const validateComponentForPaste = async ({
  componentList,
  newComponent,
  encodeComponentMap,
  isEncodePanel,
  isDynamicPanel,
  onError
}: {
  componentList: ComponentType[];
  newComponent: ComponentType;
  encodeComponentMap: Map<string, ComponentType & { parentDynamicPanelId?: number[] }>;
  isEncodePanel: boolean;
  isDynamicPanel: boolean;
  onError?: (message: string) => void;
}) => {
  const result = await new pipeValidator()
    .add(() => threeSceneLimit({ componentList, newComponent: newComponent, isDynamicPanel, isEncodePanel }))
    .add(() => ueLimit({ componentList, newComponent: newComponent, isDynamicPanel, isEncodePanel }))
    .add(() => digitalHumanLimit({ componentList, newComponent: newComponent }))
    .add(() => cityLimit({ componentList, newComponent: newComponent, isDynamicPanel, isEncodePanel }))
    .add(() => encodePanelLimit({ encodeComponentMap, newComponent }))
    .add(() => checkPastePermission(newComponent, { encodeComponentMap, isEncodePanel, isDynamicPanel, onError }))
    .validate();

  return result;
};

/**
 * 更新分组数据
 * @param {ComponentType} item 分组组件
 * @param {Object} options 配置选项
 * @param {boolean} options.isDynamicPanel 是否位于动态面板内部，默认为 false
 * @param {boolean} options.fullUpdate 是否进行完整更新，默认为 true
 * @param {UpdateHistoryTypeEnum} options.updateHistoryType 更新历史类型，默认为 UpdateHistoryTypeEnum.UPDATE
 * @param {boolean} options.isCache 是否使用缓存，默认为 true
 * @returns {Promise<Promise[]>} 返回所有更新操作的Promise数组
 */
export const saveParentGroupData = async (
  item: ComponentType,
  {
    isDynamicPanel = false,
    fullUpdate = true,
    updateHistoryType = UpdateHistoryTypeEnum.UPDATE,
    isCache = true,
    showLoading = false,
    syncWorkspace = true
  }: {
    isDynamicPanel?: boolean;
    fullUpdate?: boolean;
    updateHistoryType?: UpdateHistoryTypeEnum;
    isCache?: boolean;
    showLoading?: boolean;
    syncWorkspace?: boolean;
  } = {
    isDynamicPanel: false,
    fullUpdate: true,
    updateHistoryType: UpdateHistoryTypeEnum.UPDATE,
    isCache: true,
    showLoading: false,
    syncWorkspace: true
  }
) => {
  const children = item.children || [];

  const { ...groupComponent } = item;

  // 收集所有的 Promise
  const promises = [];
  const updateLayersMethod = isCache ? updateLayersAgg : updateLayersAggNoCache;

  // 添加主分组更新 Promise
  promises.push(
    updateLayersMethod(
      {
        id: groupComponent.id,
        config: JSON.stringify({ ...groupComponent, children: children.map((v) => v.id) }),
        moduleId: 75,
        status: isDynamicPanel,
        minioIds: "[]"
      },
      updateHistoryType,
      showLoading,
      syncWorkspace
    )
  );

  if (fullUpdate) {
    console.log(children, "children");
    // 添加所有子组件更新 Promise
    for (let i = 0; i < children.length; i++) {
      promises.push(
        updateLayersMethod(
          {
            id: children[i].id,
            config: JSON.stringify(getPureComponent(children[i])),
            status: isDynamicPanel,
            dataJson: "{}",
            minioIds: "[]"
          },
          updateHistoryType,
          showLoading,
          syncWorkspace
        )
      );
    }
  }
  console.log(promises, "promises");

  // 修复：返回 Promise.all 的结果，而不是 Promise 数组
  return Promise.all(promises);
};

/**
 * 面板更新 支持动态面板和终端交互
 * @param {SystemComponentProps} item 面板组件
 * @param {Object} options 更新选项
 * @param {boolean} options.fullUpdate 是否进行完整更新，默认为 true
 * @param {boolean} options.isInPanel 是否在面板内，默认为 false
 * @param {UpdateHistoryTypeEnum} options.updateHistoryType 更新历史类型，默认为 UpdateHistoryTypeEnum.UPDATE
 * @param {boolean} options.isCache 是否使用缓存，默认为 true
 * @returns {Promise<BaseEntity<{config: string, id: number, moduleId: number}>>} 返回更新结果
 */
export const onPanelUpdate = async (
  item: SystemComponentProps,
  options: {
    fullUpdate: boolean;
    isInPanel: boolean;
    updateHistoryType?: UpdateHistoryTypeEnum;
    isCache?: boolean;
    showLoading?: boolean;
    syncWorkspace?: boolean;
  } = {
    fullUpdate: true,
    isInPanel: false,
    isCache: true,
    showLoading: false
  }
) => {
  const {
    fullUpdate,
    isInPanel,
    updateHistoryType = UpdateHistoryTypeEnum.UPDATE,
    isCache = true,
    showLoading = false,
    syncWorkspace = true
  } = options;
  try {
    if (!item?.component || !renderSystemComponentType.includes(item.component.prop as PanelType)) {
      console.error("Invalid dynamic panel item", item);
      return;
    }

    const updateConfigItems = (panelItem: PanelState, fullUpdate: boolean) => {
      return {
        ...panelItem,
        config: panelItem.config?.map((configItem) => {
          if (fullUpdate) {
            return configItem;
          }

          return configItem.id;
        })
      };
    };

    const updatePanelData = (panelData: PanelState[], fullUpdate: boolean) => {
      return panelData?.map((panelItem) => updateConfigItems(panelItem, fullUpdate)) ?? [];
    };

    /**
     * @description 待更新动态面板数据
     */
    const updatedPanel = {
      ...item,
      panelData: updatePanelData(item.panelData, fullUpdate),
      children: undefined,
      parentDynamicPanelId: undefined
    };

    const uniqueMinioIds = updatedPanel.panelData.reduce<string[]>((acc, panelItem) => {
      const validIds = panelItem.minioIds?.filter((id): id is number => id !== null).map(String) ?? [];
      return Array.from(new Set([...acc, ...validIds]));
    }, []);

    /**
     * @description 清除了 children 的待更新动态面板数据
     */
    const cleanPanel = { ...updatedPanel };
    delete cleanPanel.children;
    delete cleanPanel.parentDynamicPanelId;

    const requestParams =
      item.component.prop === PanelType.dynamicPanel
        ? {
            moduleId: DYNAMIC_PANEL_MODULE_ID,
            minioIds: JSON.stringify(uniqueMinioIds)
          }
        : {};

    const updateLayersMethod = isCache ? updateLayersAgg : updateLayersAggNoCache;
    return updateLayersMethod(
      {
        id: Number(item.id),
        config: JSON.stringify(cleanPanel),
        status: isInPanel,
        ...requestParams
      },
      updateHistoryType,
      showLoading,
      syncWorkspace
    );
  } catch (error) {
    console.error("Failed to update dynamic panel:", error);
  }
};

/**
 * 根据组件类型保存图层数据，支持缓存控制
 * @param {ComponentType} component 要保存的组件
 * @param {boolean} cIsDynamicPanel 是否位于动态面板内部
 * @param {Object} options 保存选项
 * @param {boolean} options.fullUpdateGroup 是否对分组进行完整更新，默认为 true
 * @param {boolean} options.fullUpdateDynamicPanel 是否对动态面板进行完整更新，默认为 false
 * @param {UpdateHistoryTypeEnum} options.updateHistoryType 更新历史类型，默认为 UpdateHistoryTypeEnum.UPDATE
 * @param {boolean} options.isCache 是否使用缓存，默认为 true
 * @param {boolean} options.showLoading 是否显示 loading，默认为 false
 * @returns {Promise<BaseEntity<{config: string, id: number, moduleId: number}> | Promise[]>} 返回保存结果
 */
export const saveLayersByType = async (
  component: ComponentType,
  cIsDynamicPanel: boolean,
  {
    fullUpdateGroup,
    fullUpdateDynamicPanel,
    updateHistoryType,
    isCache = true,
    showLoading = false,
    syncWorkspace = true
  }: {
    fullUpdateGroup?: boolean;
    fullUpdateDynamicPanel?: boolean;
    updateHistoryType?: UpdateHistoryTypeEnum;
    isCache?: boolean;
    showLoading?: boolean;
    /** false 表示本次改动不回写 agent 工作区（后端已经写好了，见 updateLayersAgg 的同名参数） */
    syncWorkspace?: boolean;
  } = {
    fullUpdateGroup: true,
    fullUpdateDynamicPanel: false,
    updateHistoryType: UpdateHistoryTypeEnum.UPDATE,
    isCache: true,
    showLoading: false
  }
) => {
  const { editorVisible, syncComponentConfig, componentDefaultConfigMap } = useStatusAnimation();
  if (!component) {
    return;
  }
  if (
    editorVisible.value &&
    componentDefaultConfigMap.value.has(component.id.toString()) &&
    updateHistoryType !== UpdateHistoryTypeEnum.ADD
  ) {
    const res = await syncComponentConfig(component);
    if (res && res.success) {
      return Promise.resolve();
    }
  }

  try {
    if (renderSystemComponentType.includes(component.component.prop as PanelType)) {
      return await onPanelUpdate(component as SystemComponentProps, {
        fullUpdate: fullUpdateDynamicPanel ?? false,
        isInPanel: cIsDynamicPanel,
        updateHistoryType: updateHistoryType ?? UpdateHistoryTypeEnum.UPDATE,
        isCache,
        showLoading,
        syncWorkspace
      });
    }

    const isGroup = component.component.prop === FolderType.group;
    if (!isGroup) {
      const updateLayersMethod = isCache ? updateLayersAgg : updateLayersAggNoCache;
      const res = await updateLayersMethod(
        {
          id: component.id,
          config: JSON.stringify(getPureComponent(component)),
          status: cIsDynamicPanel,
          minioIds: JSON.stringify(component.minioArr?.map((v) => v.id))
        },
        updateHistoryType,
        showLoading,
        syncWorkspace
      );
      if (!res.success) {
        const isCanRefresh = await handleMessageBox("检查到该组件已被删除,需要刷新页面同步数据", {
          confirmButtonText: "确定",
          cancelButtonText: "取消"
        });
        if (isCanRefresh) {
          await deleteScreenCacheByCurrentRoute(component.id);
          ElMessage.error(res.message || "更新组件失败，请稍后重试！");
          window.location.reload();
        }
        ElMessage.error(res.message || "更新组件失败，请稍后重试！");
      }
      return res;
    }

    // saveParentGroupData 现在直接返回 Promise
    return await saveParentGroupData(component, {
      isDynamicPanel: cIsDynamicPanel,
      fullUpdate: fullUpdateGroup ?? true,
      updateHistoryType: updateHistoryType ?? UpdateHistoryTypeEnum.UPDATE,
      isCache,
      showLoading,
      syncWorkspace
    });
  } catch (error) {
    console.error("更新图层信息时出错:", error);
    // 修复：返回一个 resolved Promise 而不是 undefined
    return Promise.resolve();
  }
};

// 不允许复制的面板类型
export const isCanNotPanelPaste = (component: ComponentType) => {
  const canNotPaste = [PanelType.quotePanel];
  return canNotPaste.includes(component.component.prop as PanelType);
};

// 从各层级上判断这些组件 中最大动态面板的层数
/**
 * 【支持多个根组件】获取所有动态面板的最大嵌套层数
 * @param {Array} componentList 组件数组（你现在的入参）
 * @returns {Number} 最大层数 0/1/2/3
 */
export const getMaxDynamicPanelLevel = (componentList: ComponentType[]) => {
  let maxLevel = 0;

  // 递归遍历单个组件
  const traverse = (comp: ComponentType) => {
    if (!comp) {
      return;
    }

    // 判断是否是动态面板
    const isPanel = comp.component?.prop === "sw-panel";
    if (isPanel) {
      const level = (comp.parentDynamicPanelId || []).length;
      if (level > maxLevel) {
        maxLevel = level;
      }
      // 达到3层直接退出，不再遍历
      if (maxLevel >= dyPanelCount) {
        return;
      }
    }

    // 递归子面板
    if (comp.panelData && Array.isArray(comp.panelData)) {
      comp.panelData.forEach((item) => {
        if (item.config && Array.isArray(item.config)) {
          item.config.forEach((child: ComponentType) => traverse(child));
        }
      });
    }
  };

  // 遍历数组里的每一个根组件
  if (Array.isArray(componentList)) {
    componentList.forEach((item) => {
      if (maxLevel >= dyPanelCount) {
        return;
      } // 提前退出
      traverse(item);
    });
  }

  return Math.min(maxLevel, dyPanelCount - 1);
};
