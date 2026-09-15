import type { CSSProperties } from "vue";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { toRaw } from "vue";

import type { LargeScreenDetailInfo } from "@screenwright/types";
import { isArray } from "lodash-es";

import { useCallbackArguments } from "@/hooks/callbackArguments/useCallbackArguments";
import { useBaseData } from "@/hooks/useBaseData";
import { useIframeWebSocket } from "@/hooks/useIframeWebSocket";
import { setMinioUrl } from "@/utils/config";
import type { WebSocketConfig } from "@/utils/websocket";
import type { PanelType, SystemComponentProps } from "@/views/build/components/buildRender/core/SystemComponent/type";
import { renderSystemComponentType } from "@/views/build/components/buildRender/core/SystemComponent/type";
import type { ComponentType, mediaEnum } from "@/views/build/components/buildRender/type";
import { useLargeScreenInfo } from "@/views/build/useLargeScreenInfo";

import type { FTIframeOptions } from "./type";
/**
 * iframe组件的核心逻辑Hook
 * @param props 组件属性
 */
export const useIframe = (props: { element: ComponentType<mediaEnum.SwIframe, FTIframeOptions> }) => {
  // 使用 useBaseData 组合式函数获取通用媒体属性和方法
  const { option, isBuild, dataChart, componentClasses } = useBaseData<mediaEnum.SwIframe, FTIframeOptions>(
    props.element
  );
  const { initIframeWs, closeIframeWs } = useIframeWebSocket();
  const { addCallbackArgumentsFromComponentList } = useCallbackArguments();
  const { navInfo } = useLargeScreenInfo();
  // 响应式状态
  const ftIframeRef = ref<HTMLElement | null>(null);
  const iframeRef = ref<HTMLIFrameElement | null>(null);
  const iframeContent = ref<HTMLElement | null>(null);
  const iframeWs = ref<WebSocketConfig | null>(null);
  const iframeShow = ref(true);
  const isUpdate = ref(false);
  const dataChartItem = ref<any>({});
  const newIframeUrlData = ref<any>({});

  // 计算属性
  const styleSizeName = computed(() => ({
    // width: "fit-content",
    // height: "fit-content",
    display: iframeShow.value ? "block" : "none"
  }));

  const iframeStyle = computed(() => ({
    width: props.element.component.width + "px",
    height: props.element.component.height + "px",
    padding: `${option.value.gridTop}px ${option.value.gridRight}px ${option.value.gridBottom}px ${option.value.gridLeft}px`
  }));

  const showClose = computed(() => option.value?.showClose || false);

  const frameborder = computed(() => (option.value?.frameborder ? 1 : 0));

  const scrolling = computed(() => (option.value?.scrolling ? "yes" : "no"));

  const sandbox = computed(() => {
    let sandbox = "";
    if (option.value.allowSameOrigin) {
      sandbox += " allow-same-origin";
    }
    if (option.value.allowTopNavigation) {
      sandbox += " allow-top-navigation";
    }
    if (option.value.allowForms) {
      sandbox += " allow-forms";
    }
    if (option.value.allowScripts) {
      sandbox += " allow-scripts";
    }
    return sandbox;
  });

  const closeStyle = computed(() => {
    const style: Record<string, string> = {
      margin: `${option.value.closeTop}px ${option.value.closeRight}px ${option.value.closeBottom}px ${option.value.closeLeft}px`
    };

    if (option.value.closeBtnType === "image") {
      return {
        height: option.value.closeSize + "px",
        width: option.value.closeSize + "px",
        ...style
      };
    }

    return {
      zIndex: "1",
      fontSize: `${option.value.closeSize}px`,
      color: option.value.closeColor,
      ...style
    };
  });

  const containStyle = computed(() => {
    const {
      showScreenFilter,
      screenFilterInfo,
      width,
      height,
      backgroundColor,
      showBackgroundImage,
      backgroundImage,
      enableScroll,
      setTypeOne
    } = option.value.quoteInfo?.detail || {};

    const filterStyle = showScreenFilter
      ? {
          filter: `blur(${screenFilterInfo?.gaussianBlur || 0}px)
        brightness(${screenFilterInfo?.brightness || 100}%)
        contrast(${screenFilterInfo?.contrast || 100}%)
        grayscale(${screenFilterInfo?.grayscale || 0}%)
        hue-rotate(${screenFilterInfo?.hueRotate || 0}deg)
        saturate(${screenFilterInfo?.saturate || 100}%)`
        }
      : {};

    return {
      ...filterStyle,
      width: `${width}px`,
      height: `${height}px`,
      backgroundColor,
      overflow: setTypeOne && enableScroll ? "auto" : "visible",
      backgroundImage: showBackgroundImage ? `url(${setMinioUrl(backgroundImage)})` : undefined
    };
  });

  const contentStyle = computed<CSSProperties>(() => {
    const { backgroundColor, setTypeOne } = option.value.quoteInfo?.detail || {};
    const { rate, outerWidth, outerHeight, innerHeight } = getIframeRect();
    const topOffset = (Number(innerHeight) - Number(outerHeight) * rate) / 2;
    return {
      width: setTypeOne ? `${outerWidth}px` : "100%",
      height: setTypeOne ? `${outerHeight}px` : "100%",
      transform: `scale(${rate}) translateX(-50%)`,
      backgroundColor: backgroundColor,
      position: "relative",
      left: "50%",
      overflow: "hidden",
      top: `${topOffset}px`,
      transformOrigin: "top left"
    };
  });
  const data = computed(() => {
    return [...props.element.option.quoteInfo.component].sort((a, b) => b.zIndex - a.zIndex).reverse();
  });

  // 方法
  const handleIframeClick = () => {
    // 处理iframe点击事件
    // clickFormatter && clickFormatter({ data: dataChartItem })
  };

  const handleBtnClick = () => {
    iframeShow.value = false;
    if (ftIframeRef.value) {
      ftIframeRef.value.style.display = "none";
    }
  };

  const onIframeLoad = () => {
    if (!dataChartItem.value.value) {
      return;
    }
    try {
      const win = iframeRef.value?.contentWindow;
      console.log("onIframeLoad", win);
    } catch (error) {
      console.log(error);
    }
  };

  /**
   * 获取参数前缀
   */
  const getParamPrefix = (url: string, paramsStr: string) => {
    if (!url || !paramsStr) {
      return "";
    }
    const search = url.split("?")[1];
    return !search ? `?${paramsStr}` : `&${paramsStr}`;
  };

  /**
   * 设置iframe URL
   */
  const setIframeUrl = () => {
    const info: any = {};
    // iframe URL 设置逻辑
    info.value = option.value?.iframeUrl || newIframeUrlData.value?.value || "";
    // const keywords = ["view", "build", "shareScreen"];
    // const regex = new RegExp(keywords.join("|"));
    const paramsStr = option.value.hiddenLoading ? "notPlan=true" : "";
    let objInfo: any = null;
    const isLibMode = typeof __BUILD_MODE__ !== "undefined" && __BUILD_MODE__ === "lib";
    if (isLibMode && option.value.extendIframeUrl) {
      objInfo = {
        ...info,
        value: option.value.extendIframeUrl + getParamPrefix(option.value.extendIframeUrl, paramsStr)
      };
    } else if (info) {
      objInfo = {
        ...info,
        value: info.value + getParamPrefix(info.value, paramsStr)
      };
    }
    if (option.value.delayLoading) {
      setTimeout(() => {
        dataChartItem.value = { ...objInfo };
      }, option.value.delayLoading);
    } else {
      dataChartItem.value = { ...objInfo };
    }
  };

  /**
   * 获取iframe矩形尺寸信息
   */
  const getIframeRect = () => {
    const innerWidth = Number(props.element.component.width);
    const innerHeight = Number(props.element.component.height);
    const outerWidth = Number(option.value.quoteInfo?.detail?.width || innerWidth);
    const outerHeight = Number(option.value.quoteInfo?.detail?.height || innerHeight);

    const isWidth = outerWidth * innerHeight < outerHeight * innerWidth;
    const rate = isWidth ? innerHeight / outerHeight : innerWidth / outerWidth;

    return {
      rate,
      outerWidth,
      outerHeight,
      innerHeight
    };
  };

  /**
   * 遍历组件树，将 listenArgs.filterName 加上前缀，与 dataFilterArr 的 key 保持一致
   */
  const prefixComponentFilterNames = (componentList: ComponentType[], prefix: string) => {
    if (!componentList?.length) {
      return;
    }
    const filterNamePrefix = `${prefix}_`;
    for (const element of componentList) {
      if (element.listenArgs?.length) {
        element.listenArgs = toRaw(
          element.listenArgs.map((arg) => {
            return {
              ...arg,
              filterName: arg.filterName.startsWith(filterNamePrefix)
                ? arg.filterName
                : `${filterNamePrefix}${arg.filterName}`
            };
          })
        );
      }
      if (element.children?.length) {
        prefixComponentFilterNames(element.children as ComponentType[], prefix);
      }
      if (renderSystemComponentType.includes(element.component?.prop as PanelType)) {
        const { panelData } = element as SystemComponentProps;
        for (const status of panelData) {
          if (status?.config) {
            prefixComponentFilterNames(status.config as ComponentType[], prefix);
          }
        }
      }
    }
  };

  /**
   * 遍历组件树并添加 parentEncodeId
   * 只处理分组和面板组件
   */
  const addParentEncodeIdToComponents = (componentList: ComponentType[]) => {
    if (!componentList?.length) {
      return;
    }

    const parentEncodeId = option.value.quoteInfo.id;

    for (const element of componentList) {
      // 检查是否是分组或面板
      const isPanel = renderSystemComponentType.includes(element.component?.prop as PanelType);

      Object.assign(element, { parentEncodeId: `${parentEncodeId}` });

      // 处理分组的子组件
      if (element.children?.length) {
        addParentEncodeIdToComponents(element.children as ComponentType[]);
      }

      // 处理面板的状态配置
      if (isPanel) {
        const { panelData } = element as SystemComponentProps;
        for (const status of panelData) {
          if (status?.config) {
            addParentEncodeIdToComponents(status.config as ComponentType[]);
          }
        }
      }
    }
  };

  /**
   * 注册iframe控制
   */
  const registryIframeControl = () => {
    if (isBuild.value) {
      return;
    }
    const { isEncodedControl, controlWebsocketUrl, heartbeatInterval } =
      (option.value.quoteInfo?.detail as LargeScreenDetailInfo) || {};
    if (isEncodedControl && controlWebsocketUrl) {
      iframeWs.value = initIframeWs({
        iframeScreenId: `${option.value.quoteInfo.id}`,
        controlWebsocketUrl,
        heartbeatInterval
      });
    }
  };

  /**
   * 初始化iframe子组
   */
  const initIframe = async () => {
    await nextTick();
    if (isBuild.value) {
      return;
    } // 编辑页不加载

    if (option.value.quoteInfo?.component) {
      addParentEncodeIdToComponents(option.value.quoteInfo.component as ComponentType[]);
    }
    registryIframeControl();

    const { dataFilterArr } = option.value.quoteInfo || {};
    const dataFilterArr2 = typeof dataFilterArr === "string" ? JSON.parse(dataFilterArr) : dataFilterArr;

    const currentComponent = option.value.quoteInfo?.component as ComponentType[] | undefined;
    if (!currentComponent?.length) {
      return;
    }

    const screenId = `${option.value.quoteInfo.id}`;
    const iframeId = `${props.element.id}`;
    // 前缀 = iframe组件id_引用大屏id，保证同一页面多个 iframe 引用相同大屏也不会互相覆盖
    const prefix = `${iframeId}_${screenId}`;

    // 以 prefix 为前缀重命名过滤器 key，避免与外层屏幕同名过滤器冲突
    const prefixedDataFilterArr: Record<string, unknown> = {};
    for (const [key, filter] of Object.entries(dataFilterArr2 || {})) {
      const newKey = `${prefix}_${key}`;
      prefixedDataFilterArr[newKey] = { ...(filter as object), name: newKey };
    }

    // 只合并数据过滤器，不操作 groupData
    navInfo.value.dataFilterArr = Object.assign(navInfo.value.dataFilterArr, toRaw(prefixedDataFilterArr) || {});

    // 追加回调参数关系（不清空已有的）
    if (Object.keys(prefixedDataFilterArr).length > 0) {
      // listenArgs.filterName 同步加前缀，与 dataFilterArr key 保持一致
      prefixComponentFilterNames(currentComponent, prefix);
      addCallbackArgumentsFromComponentList(currentComponent);
    }
  };

  /**
   * 处理错误事件
   */
  const handleError = (e: MessageEvent) => {
    e.preventDefault();
    if (dataChartItem.value.value?.includes(e.origin)) {
      if (e.data) {
        // Handle error event
      }
    }
  };

  // 监听器
  watch(
    () => dataChart.value,
    (nv) => {
      if (isArray(nv) && nv.length) {
        newIframeUrlData.value = nv[0];
      } else {
        newIframeUrlData.value = nv;
      }
      setIframeUrl();
    },
    { deep: true }
  );
  watch(
    () => props.element.option.iframeUrl,
    (nv) => {
      if (!nv) {
        return;
      }
      console.log("iframeUrl变化", nv);
      setIframeUrl();
    }
  );

  // 监听option变化更新URL
  // watchEffect(() => {
  //   setIframeUrl()
  // })

  // 监听sandbox变化，更新iframe
  watch(
    () => sandbox.value,
    async () => {
      isUpdate.value = true;
      await nextTick();
      isUpdate.value = false;
    },
    { deep: true, immediate: true }
  );

  // 生命周期钩子
  onMounted(async () => {
    setIframeUrl();
    window.addEventListener("message", handleError, false);
    initIframe();
  });

  onBeforeUnmount(() => {
    if (iframeRef.value) {
      iframeRef.value.src = "about:blank";
    }
    console.log(option.value.quoteInfo, "option.value.quoteInfo");
    if (option.value.quoteInfo && option.value.quoteInfo.id) {
      closeIframeWs(`${option.value.quoteInfo.id}`);
    }
    window.removeEventListener("message", handleError, false);
  });

  return {
    option,
    isBuild,
    ftiframeRef: ftIframeRef,
    iframeRef,
    iframeContent,
    iframeShow,
    isUpdate,
    dataChartItem,
    styleSizeName,
    iframeStyle,
    showClose,
    frameborder,
    scrolling,
    sandbox,
    closeStyle,
    containStyle,
    contentStyle,
    componentClasses,
    data,
    handleIframeClick,
    handleBtnClick,
    onIframeLoad,
    setMinioUrl,
    initIframe
  };
};
