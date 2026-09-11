import { nextTick, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { ElMessage } from "element-plus";
import md5 from "js-md5";

import { openCheckData } from "@/api/dataSource";
import { useMinioPreload } from "@/service-workers/minioCache/useMinioPreload";
import { useUserStoreHook } from "@/store/modules/user";

import type { DynamicPanelProps } from "../build/components/buildRender/core/SystemComponent/panel/DynamicPanel";
import type { SystemComponentProps } from "../build/components/buildRender/core/SystemComponent/type";
import { renderSystemComponentType } from "../build/components/buildRender/core/SystemComponent/type";
import { useGlobalComponentData } from "../build/useGlobalComponentData";
import { useView } from "../view/useView";
/**
 * 分享屏幕业务逻辑组合式函数
 * 提供分享屏幕初始化、密码验证、配置管理等功能
 * @returns 分享屏幕相关的响应式数据和方法
 */
export function useShareScreen() {
  const userStore = useUserStoreHook();
  const router = useRouter();
  const route = useRoute();
  const { allComponentMap } = useGlobalComponentData();
  const { startPreload } = useMinioPreload();
  const config = ref<{ password: string | null }>({
    password: null
  });
  const isInitLoad = ref<boolean>(true);

  // 复用 useView 中的初始化逻辑
  const {
    loadingScreenData,
    componentList,
    currentConfig,
    wrapperStyle,
    wrapperBgStyle,
    overFlowStyle,
    initTerminalPanel,
    initDefaultView
  } = useView();

  /**
   * 密码验证函数
   * 验证分享密码并初始化相应的视图
   * @param isFirst - 是否为首次验证
   */
  const verifyPassword = async (isFirst = false) => {
    if (!isFirst && !config.value.password) {
      ElMessage.error("请输入密码！");
      return;
    }

    const id = parseInt((route.params.id as string).split("-")[4]) || null;
    const type = route.query.type;

    const ihlCode = (route.params.id as string).split("-")[5] || null;
    const ihlVal = ihlCode === md5("ihl:true");

    if (!id) {
      return;
    }
    if (window.prohibitionZone) {
      window.prohibitionZone.ihl = ihlVal;
    }

    if (isFirst) {
      await userStore.getShareScreenRoleEquitiesInfo({ id });
      config.value.password = null;
    }

    const openCheckDataRes = await openCheckData({ id, password: config.value.password });
    if (openCheckDataRes.code == 200) {
      isInitLoad.value = openCheckDataRes.result;
      if (openCheckDataRes.result) {
        isInitLoad.value = true;
        if (type && type !== "0") {
          // 初始化终端面板
          await initTerminalPanel(Number(type), {
            isShare: true,
            password: config.value.password as string
          });
        } else {
          // 初始化默认大屏视图 - 使用 id 参数
          await initDefaultView(String(id), {
            isShare: true,
            password: config.value.password as string
          });
        }
      } else {
        if (!isFirst) {
          ElMessage.error("密码错误!");
        }
      }
    } else {
      router.push("/invalid");
    }
  };

  /**
   * 初始化分享屏幕
   * 执行完整的分享屏幕初始化流程
   */
  const init = async () => {
    loadingScreenData.value = true;
    await verifyPassword(true);
    await nextTick();
    const allTopDynamicPanel = Array.from(allComponentMap.value.values()).filter((component) =>
      renderSystemComponentType.some(
        (type) =>
          component.component.prop === type &&
          component.parentDynamicPanelId.length === 0 &&
          (component as DynamicPanelProps).option.isPreLoad
      )
    ) as SystemComponentProps[];

    // 等待所有预加载任务完成后再关闭 loading
    await Promise.all(allTopDynamicPanel.map((component) => startPreload(component)));
    loadingScreenData.value = false;
  };

  return {
    // 响应式数据
    componentList,
    editConfig: currentConfig,
    wrapperStyle,
    wrapperBgStyle,
    overFlowStyle,
    config,
    isInitLoad,
    loadingScreenData,

    // 方法
    verifyPassword,
    initTerminalPanel,
    initDefaultView,
    init
  };
}
