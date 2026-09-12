import { ref } from "vue";
import { createGlobalState } from "@vueuse/core";

import { apiClient } from "@screenwright/server/rpc";
import type { ParsedLargeScreenInfo } from "@screenwright/types";
import { ElMessage } from "element-plus";
import { cloneDeep, flatten, sortBy } from "lodash-es";

import { copyAiTemplateComponents } from "@/api/aiTemplate";
import { getModuleInfoList } from "@/api/library";
import type { LargeScreenAiConfig } from "@/model/AiTemplate";
import type { GroupCase } from "@/model/Layer";
import type { ModuleInfo } from "@/model/Library";
import to from "@/utils/await-to-js";
import { setMinioUrl } from "@/utils/config";
import { buildScreenVersionKey, buildScreenWorkspaceDir } from "@/utils/screenWorkspace";
import { useAction } from "@/views/build/components/buildRender/hooks/useAction";
import { assetsClassManager } from "@/views/build/components/buildTabs/selectAssets/assetsClass";
import { assetsMenuManager } from "@/views/build/components/buildTabs/selectAssets/assetsMenu";
import type {
  AllAssetsForRender,
  AllModuleForRender,
  AssetsGroupForRender,
  GetMaterialDataOption,
  MenuItemForRender,
  ModuleGroupForRender,
  SingleModuleTypeForRender
} from "@/views/build/components/buildTabs/selectAssets/assetsMenuType";

import type { ComponentType } from "./components/buildRender/type";
import { useCacheData } from "./useCacheData";
import { useGlobalComponentData } from "./useGlobalComponentData";
import { useLargeScreenInfo } from "./useLargeScreenInfo";
import { NavListType } from "./useNavAction";

/**
 * 将模块信息数组转换为菜单组数据结构
 * 根据一级菜单和二级菜单对模块信息进行分组和层级化处理
 * @param arr - 模块信息数组，包含firstLevelMenu、secondLevelMenu、name等字段
 * @returns 转换后的菜单组数据
 * @example
 * const modules = [
 *   { firstLevelMenu: "图表", secondLevelMenu: "柱形图", name: "基础柱图", thumbnail: "xxx.jpg", id: 1 },
 *   { firstLevelMenu: "图表", secondLevelMenu: "折线图", name: "基础折线图", thumbnail: "xxx.jpg", id: 2 }
 * ]
 * const result = transformData(modules)
 * // 返回: [{ title: "图表", children: [{ title: "柱形图", children: [...] }, { title: "折线图", children: [...] }] }]
 */
const transformData = (arr: ModuleInfo[]): AllModuleForRender => {
  const result: AllModuleForRender = [];
  const firstLevelMap = new Map<string, SingleModuleTypeForRender>();
  for (const item of arr) {
    const { firstLevelMenu, secondLevelMenu, name } = item;
    let firstLevelItem = firstLevelMap.get(firstLevelMenu);
    if (!firstLevelItem) {
      firstLevelItem = { title: firstLevelMenu, children: [] };
      firstLevelMap.set(firstLevelMenu, firstLevelItem);
      result.push(firstLevelItem);
    }

    if (secondLevelMenu) {
      let secondLevelItem = firstLevelItem.children?.find((child) => child.title === secondLevelMenu);
      if (!secondLevelItem) {
        secondLevelItem = { title: secondLevelMenu, children: [] };
        (firstLevelItem.children as ModuleGroupForRender[])?.push(secondLevelItem);
      }
      (secondLevelItem as ModuleGroupForRender).children?.push({ title: name, img: item.thumbnail, moduleId: item.id });
    } else {
      if (name !== "项目模板beta") {
        (firstLevelItem.children as MenuItemForRender[])?.push({ title: name, img: item.thumbnail, moduleId: item.id });
      }
    }
  }

  return result;
};

/**
 * 根据指定的排序数组对菜单数据进行排序
 * 将数据按照预定义的顺序进行重新排列，未在排序数组中的项目会被排到最后
 * @param sortList - 需要排序的菜单数据列表
 * @param orderByArray - 排序依据的字符串数组，定义了排序的优先级
 * @returns 排序后的菜单数据
 * @example
 * const menuData = [{ title: "媒体" }, { title: "图表" }, { title: "文字" }]
 * const order = ["图表", "文字", "媒体"]
 * const result = transformTabsData(menuData, order)
 * // 返回: [{ title: "图表" }, { title: "文字" }, { title: "媒体" }]
 */
function transformTabsData<T extends { title: string }>(sortList: T[], orderByArray: string[]): T[] {
  // 使用 lodash 的 sortBy 按照 orderByArray 顺序排序，未命中顺序的排在最后
  return sortBy(sortList, (item: T) => {
    if (!item || !item.title) {
      return Infinity;
    }
    const index = orderByArray.indexOf(item.title);
    return index === -1 ? Infinity : index;
  });
}

/**
 * 处理模块信息列表，进行数据转换、排序和过滤
 * 将原始的模块信息转换为菜单组结构，并根据预定义规则进行排序和筛选
 * @param records - 原始的模块信息数组
 * @returns 处理后的菜单组数据，已排序并过滤掉不需要的类型
 */
export const processModuleInfoList = (records: ModuleInfo[]): AllModuleForRender => {
  const orderByArray = ["图表", "文字", "媒体", "指标", "地图", "交互", "扩展", "第三方", "展项"];
  const echartOrder = ["柱形图", "折线图", "饼图", "散点图", "其他", "项目"];
  const filterType = ["面板"];
  const transFormTabsList = transformData(records);
  const tabsGroupSortBy = transformTabsData(transFormTabsList, orderByArray);

  const transFormEchartData = transformTabsData(tabsGroupSortBy[0].children as ModuleGroupForRender[], echartOrder);
  tabsGroupSortBy[0].children = transFormEchartData;
  tabsGroupSortBy[0].children.unshift({
    title: "全部",
    children: flatten(tabsGroupSortBy[0].children.map((item) => item.children))
  });

  return tabsGroupSortBy
    .filter((item) => !filterType.includes(item.title))
    .filter((item) => item.title && item.title.length > 0);
};

/**
 * 递归把组件树里的组件 id 替换为复制接口返回的新 id，覆盖三类引用：
 *   1. id 字段：顶层组件、分组、动态面板各状态子组件等自身 id；
 *   2. parent 字段：子组件指向父组件的 id；
 *   3. 字符串内嵌的 $component(id) 引用：事件 / 加密动作的 component 关联列表。
 * 通过重建对象天然完成深拷贝，避免改动模板缓存的 screenData。
 * 注意：children、parentDynamicPanelId、panelData[].config 等数字 id 数组按约定不处理。
 * @param components 模板源屏组件树
 * @param idMap 旧组件 id → 新组件 id 映射
 */
export const remapComponentIds = (components: ComponentType[], idMap: Map<number, number>): ComponentType[] => {
  const componentRefRe = /\$component\((\d+)\)/g;
  const remapComponentRef = (text: string): string =>
    text.replace(componentRefRe, (matched, idStr) => {
      const newId = idMap.get(Number(idStr));
      return newId === undefined ? matched : `$component(${newId})`;
    });
  const walk = (value: unknown): unknown => {
    if (typeof value === "string") {
      return value.includes("$component(") ? remapComponentRef(value) : value;
    }
    if (Array.isArray(value)) {
      return value.map(walk);
    }
    if (value && typeof value === "object") {
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value)) {
        result[key] =
          (key === "id" || key === "parent") && typeof val === "number" && idMap.has(val) ? idMap.get(val) : walk(val);
      }
      return result;
    }
    return value;
  };
  return walk(components) as ComponentType[];
};

/**
 * 把描述文本里出现的旧组件 id 一次性替换为新 id。
 * 单次扫描 + 查表，避免链式替换把刚替换出的新 id 再次命中（旧/新 id 区间重叠时的经典坑）。
 * @param describe 模板范式描述（含旧组件 id）
 * @param idMap 旧组件 id → 新组件 id 映射
 */
export const remapDescribeIds = (describe: string, idMap: Map<number, number>): string => {
  const oldIds = [...idMap.keys()];
  if (!describe || oldIds.length === 0) {
    return describe;
  }
  const re = new RegExp(`\\b(${oldIds.join("|")})\\b`, "g");
  return describe.replace(re, (matched) => String(idMap.get(Number(matched)) ?? matched));
};

/**
 * 系统资产的数据对象创建和管理hooks
 * 提供组件菜单、素材库等数据的获取和管理功能
 * 使用createGlobalState确保全局状态一致性
 */
export const useTabsMenuGroup = createGlobalState(() => {
  const assetsData = ref<AllAssetsForRender>([]);
  const tabsGroupMenu = ref<AllModuleForRender>([]);
  const tabsList = ref<ModuleInfo[]>([]);
  const { addComponentList, addGroupComponentList } = useAction();
  const { groupData } = useGlobalComponentData();
  const { navInfo } = useLargeScreenInfo();
  /**
   * 获取模块信息列表的API调用
   * 从服务器获取组件模块信息，并处理成菜单组数据格式
   */
  const getModuleInfoListApi = async (): Promise<void> => {
    const [error, res] = await to(getModuleInfoList());
    if (error) {
      return;
    }
    if (res && res.success) {
      if (!res.result) {
        tabsList.value = [];
        tabsGroupMenu.value = [];
        return;
      }
      tabsList.value = res.result.records;

      tabsGroupMenu.value = processModuleInfoList(tabsList.value);
    }
  };

  /**
   * 获取素材数据
   * 根据指定的选项参数获取对应的素材库数据，支持分页和重置更新
   * @param option - 素材数据获取选项，包含标题、菜单组项、大屏ID等信息
   */
  const getMaterialData = async (option: GetMaterialDataOption): Promise<void> => {
    if (!assetsData.value || assetsData.value.length === 0) {
      console.warn("assetsData 为空，无法获取素材数据");
      return;
    }

    const menuIndex = assetsData.value.findIndex((item) => item.title === option.title);
    if (menuIndex === -1) {
      console.warn(`未找到标题为 "${option.title}" 的菜单组`);
      return;
    }

    const menuGroup = assetsData.value[menuIndex];

    const childIndex = menuGroup.children.findIndex(
      (child) => child.groupId === (option.menuGroupItem as AssetsGroupForRender).groupId
    );

    if (childIndex === -1) {
      console.warn(`未找到 groupId 为 ${(option.menuGroupItem as AssetsGroupForRender).groupId} 的子菜单项`);
      return;
    }

    const config = assetsMenuManager.getAssetConfigByTitle(option.title);
    if (!config) {
      console.warn(`未找到标题为 "${option.title}" 的配置信息`);
      return;
    }

    // 直接操作菜单组中的子项，确保数据同步
    const targetChild = menuGroup.children[childIndex];

    // 处理重置更新
    if (option.resetUpdate) {
      targetChild.pageNum = 1;
      targetChild.children = [];
      targetChild.total = 0;
    }

    // 检查是否还有更多数据需要加载
    if (targetChild.total > 0 && targetChild.children.length >= targetChild.total) {
      return;
    }

    const updatedChild = await assetsMenuManager.loadAssetDataWithPagination(targetChild, config.key, option.largeId);

    // 更新引用，确保响应式更新
    menuGroup.children[childIndex] = updatedChild;
    assetsData.value = [...assetsData.value];
  };

  /**
   * 获取素材库列表
   * 获取系统定义的素材库分类数据，动态从资产类管理器获取所有可用的资产类型
   */
  const getMaterialLibraryList = async (): Promise<void> => {
    // 动态获取所有可用的资产类型，避免硬编码
    const dataRes = assetsClassManager.getAllAssetTypes();
    assetsData.value = [];

    const res = await assetsMenuManager.getAssetsLibraryData(dataRes);
    if (res && res.libraryMapData) {
      assetsData.value = res.libraryMapData;
    }
  };

  const updatedMaterialLibraryItem = async (title: string) => {
    const menuIndex = assetsData.value.findIndex((item) => item.title === title);
    if (menuIndex === -1) {
      console.warn(`未找到标题为 "${title}" 的菜单组`);
      return;
    }
    const itemData = await assetsMenuManager.refreshAssetMenuItem(title);
    if (itemData) {
      assetsData.value[menuIndex] = cloneDeep(itemData);
    }
  };

  /**
   * 通过组件方式获取模块信息
   * 调用getModuleInfoListApi获取组件模块相关的数据
   */
  const getModuleInfoByComponent = async (): Promise<void> => {
    await getModuleInfoListApi();
  };

  /**
   * 通过素材方式获取库数据
   * 调用getMaterialLibraryList获取素材库相关的数据
   */
  const getLibraryByMaterial = async (): Promise<void> => {
    await getMaterialLibraryList();
  };
  const getAssetsWidthHeight = (type: string, url: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      let width = 0;
      let height = 0;

      if (!type || !url) {
        resolve({ width, height });
        return;
      }

      switch (type) {
        case "img": {
          const nImg = new Image();
          nImg.src = setMinioUrl(url);
          nImg.onload = () => {
            const imgWidthLarger = nImg.width >= 1920;
            if (imgWidthLarger) {
              width = 1920;
              const scale = Number((width / nImg.width).toFixed(2));
              height = scale * nImg.height;
            } else {
              width = nImg.width;
              height = nImg.height;
            }
            resolve({ width, height });
          };
          break;
        }

        case "video": {
          const video = document.createElement("video");
          video.setAttribute("crossOrigin", "anonymous");
          video.setAttribute("src", setMinioUrl(url));
          video.currentTime = 1;
          video.addEventListener("loadeddata", () => {
            const videoWidthLarger = video.videoWidth > 1920;
            if (videoWidthLarger) {
              width = 1920;
              const scale = Number((width / video.videoWidth).toFixed(2));
              height = scale * video.videoHeight;
            } else {
              width = video.videoWidth;
              height = video.videoHeight;
            }
            resolve({ width, height });
          });
          break;
        }
      }
    });
  };

  type MaterialApplyResult = ComponentType | GroupCase[] | null;
  type MaterialApplyHandler = (item: MenuItemForRender, attrs?: any) => Promise<MaterialApplyResult>;

  /** 普通图片/视频素材：量好原始宽高后加到画布 */
  const applyNormalAsset: MaterialApplyHandler = async (item, attrs) => {
    const { width, height } = await getAssetsWidthHeight(item.type!, item.img!);
    return addComponentList(item, {
      left: attrs?.left || 0,
      top: attrs?.top || 0,
      component: {
        width,
        height
      } as any,
      url: item.url
    });
  };

  /**
   * 把组件分批追加到画布（groupData），避免一次性合入大量组件造成渲染卡顿，
   * 每批之间让出一帧让画布逐批渲染出来。
   * @param layers 待追加的组件（已重映射 id）
   * @param batchSize 每批组件数
   */
  const appendLayersInBatches = async (layers: ComponentType[], batchSize = 3): Promise<void> => {
    for (let i = 0; i < layers.length; i += batchSize) {
      // 原地 push，不能整体重新赋值 groupData.value（会换成新数组、丢掉原引用，破坏外部对该数组的持有）
      groupData.value.push(...layers.slice(i, i + batchSize));
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
  };

  /**
   * 素材库「点击/添加」策略表：按资产类型分派，替代函数体内的 `item.type === xxx` 分支。
   * 闭包直接捕获 addComponentList / addGroupComponentList / getAssetsWidthHeight，无需注入上下文。
   * 新增一种资产类型 = 往表里注册一行，不再改 addComponentByNavType。
   */
  /**
   * 应用一份 AI 模板到当前大屏：服务端深度复制模板组件 → 按新 id 重映射 → 分批合入画布 →
   * 强制刷新缓存 → 把范式描述里的旧 id 替换为新 id 回写到 AI workspace。
   * 资产面板「应用」与 AI 流程（apply_ai_template suspend）共用此逻辑。
   * @param config 模板配置，至少含 id / screenData / payload
   * @returns 成功时返回回写后的范式描述文件 workspace 相对路径（template-{screenId}.json），失败返回 null
   */
  const applyAiTemplate = async (config: LargeScreenAiConfig): Promise<string | null> => {
    if (!config.id) {
      ElMessage.error("AI模板ID不存在");
      return null;
    }

    // 1. 服务端深度复制模板组件到当前大屏，拿到 旧id→新id 映射
    const [copyErr, copyRes] = await to(
      copyAiTemplateComponents({ targetLargeId: navInfo.value.id, configId: config.id })
    );
    if (copyErr || !copyRes?.success) {
      ElMessage.error("应用 AI 模板失败");
      return null;
    }

    const idMap = new Map<number, number>();
    for (const { oldId, newId } of copyRes.result ?? []) {
      idMap.set(oldId, newId);
    }

    // 2. 模板源屏组件按新 id 重映射后分批追加到当前画布（groupData），避免一次性合入卡顿
    const templateScreenData = JSON.parse(config.screenData ?? "{}") as ParsedLargeScreenInfo;
    const remappedLayers = remapComponentIds(templateScreenData.layers ?? [], idMap);
    await appendLayersInBatches(remappedLayers);

    // 3. 插入完成后强制刷新缓存：用大屏最新 updatedTime 把当前画布缓存到 IndexedDB
    // 懒调用 useCacheData：它依赖链回指 useTabsMenuGroup，工厂初始化期调用会造成循环 init，故放到运行时
    const { forceCacheWithLatestTime } = useCacheData();
    await forceCacheWithLatestTime();

    // 4. 模板范式描述里的旧组件 id 替换为新 id，回写到 AI workspace，使描述与画布真实 id 对齐
    const remappedDescribe = remapDescribeIds(config.payload ?? "", idMap);
    await to(
      apiClient.customApi["sync-screen-describe"].$post({
        json: { id: buildScreenVersionKey(navInfo.value.id, navInfo.value.versionCode), describe: remappedDescribe }
      })
    );

    // 回写落盘为 screen_{id}_{versionCode}/template-{screenId}.json，供 AI 流程读取继续修改
    return `${buildScreenWorkspaceDir(navInfo.value.id, navInfo.value.versionCode)}/template-${navInfo.value.id}.json`;
  };

  const materialApplyHandlers: Record<string, MaterialApplyHandler> = {
    // AI模板：服务端深度复制模板组件到当前大屏，再按新 id 重映射到画布并回写描述
    aiTemplate: async (item) => {
      await applyAiTemplate(item as MenuItemForRender & LargeScreenAiConfig);
      return null;
    },
    // 组数据
    group: (item, attrs) => addGroupComponentList(item, attrs)
  };

  /** 素材库资产分派：命中策略表用对应 handler；普通素材需有 type+img 才量尺寸加画布，否则当组数据处理 */
  const applyMaterialAsset: MaterialApplyHandler = (item, attrs) => {
    const handler = item.type ? materialApplyHandlers[item.type] : undefined;
    if (handler) {
      return handler(item, attrs);
    }
    return item.type && item.img ? applyNormalAsset(item, attrs) : addGroupComponentList(item, attrs);
  };

  // 添加组件和素材库数据
  const addComponentByNavType = async (
    item: MenuItemForRender,
    navListType: NavListType,
    attrs?: any
  ): Promise<MaterialApplyResult> => {
    if (navListType === NavListType.Component) {
      return addComponentList(item, attrs);
    }
    if (navListType === NavListType.MaterialLibrary) {
      return applyMaterialAsset(item, attrs);
    }
    return null;
  };

  return {
    assetsData,
    tabsGroupMenu,
    tabsList,
    getModuleInfoListApi,
    getMaterialData,
    getModuleInfoByComponent,
    getLibraryByMaterial,
    updatedMaterialLibraryItem,
    addComponentByNavType,
    applyAiTemplate
  };
});
