import { markRaw, nextTick, ref } from "vue";

import { useBaseData } from "@/hooks/useBaseData";
import { setMinioUrl } from "@/utils/config";
import { defaultGlData } from "@/views/build/components/buildConfig/attrsRender/childrenManager/defaultData";
import { EventTypeEnum } from "@/views/build/components/buildConfig/constants";
import {
  getCurrentMapRegionSelection,
  resolveChinaRegionSelectionByAdcode,
  resolveMapRegionSelectionByAdcode
} from "@/views/build/components/buildConfig/sceneComponent/mapRegionCatalog";
import type { ComponentType } from "@/views/build/components/buildRender/type";

import type { startProps } from "./geojsonMapInstance";
import { geojsonMapInstance } from "./geojsonMapInstance";
import type { MapGlIconActiveOptions } from "./MapGlIconManager";

/**
 * 更新策略接口
 */
interface UpdateStrategy {
  /** 策略名称 */
  name: string;
  /** 检查配置是否变化 */
  checkChange: (oldProps: startProps | null, newProps: startProps) => boolean;
  /** 执行更新操作 */
  execute: (instance: geojsonMapInstance, props: startProps, dom: HTMLElement) => Promise<void>;
  /** 是否需要全量更新（当此策略触发时） */
  requiresFullUpdate?: boolean;
  /** 优先级（数字越小优先级越高） */
  priority?: number;
}

/**
 * 配置比较器：比较两个对象的指定字段
 */
const compareFields = <T>(old: T | null | undefined, newVal: T | null | undefined, fields: (keyof T)[]): boolean => {
  if (!old || !newVal) return old !== newVal;
  return fields.some((field) => old[field] !== newVal[field]);
};

const cloneJson = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const glPresetChildTemplateMap = new Map(defaultGlData.map((child: any) => [child.type, child]));

const normalizeGlPresetChild = (child: any) => {
  if (!child) {
    return child;
  }

  const normalizedType =
    child.type === "mapGlScatter" ? "mapScatter" : child.type === "mapLines" ? "flowLine" : child.type;
  if (!["mapScatter", "flowLine"].includes(normalizedType)) {
    return normalizedType === child.type
      ? child
      : {
          ...child,
          type: normalizedType
        };
  }

  const template = glPresetChildTemplateMap.get(normalizedType);

  if (!template) {
    return {
      ...child,
      type: normalizedType
    };
  }

  const templateOption = cloneJson(template.option || {});
  const childOption = child.option || {};
  const normalizedOption = {
    ...templateOption,
    ...childOption
  };

  if (normalizedType === "mapScatter") {
    if (!normalizedOption.model) {
      normalizedOption.model = templateOption.model || "";
    }
    if (!Array.isArray(normalizedOption.offset) || normalizedOption.offset.length !== 3) {
      normalizedOption.offset = cloneJson(templateOption.offset || [0, 0, 0]);
    }
    if (!Array.isArray(normalizedOption.rotation) || normalizedOption.rotation.length !== 3) {
      normalizedOption.rotation = cloneJson(templateOption.rotation || [0, 0, 0]);
    }
    if (!Array.isArray(normalizedOption.scale) || normalizedOption.scale.length !== 3) {
      normalizedOption.scale = cloneJson(templateOption.scale || [1, 1, 1]);
    }
    if (normalizedOption.opacity === undefined || normalizedOption.opacity === null) {
      normalizedOption.opacity = templateOption.opacity ?? 100;
    }
  } else if (normalizedType === "flowLine") {
    if (!normalizedOption.blendingMode) {
      normalizedOption.blendingMode = templateOption.blendingMode || "AdditiveBlending";
    }
    if (normalizedOption.trailLength === undefined || normalizedOption.trailLength === null) {
      normalizedOption.trailLength = templateOption.trailLength ?? 0.5;
    }
    if (normalizedOption.height === undefined || normalizedOption.height === null) {
      normalizedOption.height = templateOption.height ?? 120;
    }
    if (!normalizedOption.effectColor) {
      normalizedOption.effectColor = cloneJson(templateOption.effectColor || "#ffff00");
    }
    if (normalizedOption.effectOpacity === undefined || normalizedOption.effectOpacity === null) {
      normalizedOption.effectOpacity = templateOption.effectOpacity ?? 100;
    }
    if (normalizedOption.lineWidth === undefined || normalizedOption.lineWidth === null) {
      normalizedOption.lineWidth = templateOption.lineWidth ?? 4;
    }
    if (normalizedOption.lineShow === undefined || normalizedOption.lineShow === null) {
      normalizedOption.lineShow = templateOption.lineShow ?? true;
    }
    if (!normalizedOption.lineColor) {
      normalizedOption.lineColor = templateOption.lineColor || "rgba(46,38,0,1)";
    }
    if (normalizedOption.lineOpacity === undefined || normalizedOption.lineOpacity === null) {
      normalizedOption.lineOpacity = templateOption.lineOpacity ?? 100;
    }
  }

  const hasRenderableScatterData =
    normalizedType === "mapScatter"
      ? Array.isArray(child.data) &&
        child.data.some((item: any) => Number.isFinite(Number(item?.lng)) && Number.isFinite(Number(item?.lat)))
      : Array.isArray(child.data) &&
        child.data.some(
          (item: any) => Array.isArray(item?.from) && item.from.length === 2 && Array.isArray(item?.to) && item.to.length === 2
        );

  return {
    ...cloneJson(template),
    ...child,
    type: normalizedType,
    component: {
      ...cloneJson(template.component || {}),
      ...(child.component || {})
    },
    option: normalizedOption,
    data: hasRenderableScatterData ? cloneJson(child.data) : cloneJson(template.data || []),
    dataRemark:
      Array.isArray(child.dataRemark) && child.dataRemark.length > 0
        ? cloneJson(child.dataRemark)
        : cloneJson(template.dataRemark || []),
    listenArgs:
      Array.isArray(child.listenArgs) && child.listenArgs.length > 0
        ? cloneJson(child.listenArgs)
        : cloneJson(template.listenArgs || [])
  };
};

const normalizeGlPresetChildren = (children: any[] = []) => children.map((child) => normalizeGlPresetChild(child));

/**
 * 深度比较对象（用于数组等复杂类型）
 * 保留此函数以备将来使用
 */
// const deepCompare = (oldVal: unknown, newVal: unknown): boolean => {
//   if (oldVal === newVal) return false;
//   if (typeof oldVal !== typeof newVal) return true;
//   if (Array.isArray(oldVal) && Array.isArray(newVal)) {
//     return JSON.stringify(oldVal) !== JSON.stringify(newVal);
//   }
//   return oldVal !== newVal;
// };

export const useEchartGlmap = (element: ComponentType) => {
  const { option, dataChart, presetChild, handleEventAndCallbackEvent } = useBaseData(element);

  const glMapTemplate = ref<HTMLDivElement | null>(null);
  const mapInstance = ref<geojsonMapInstance | null>(null);
  const isMapUpdating = ref(false);
  let mapUpdateQueue: Promise<void> = Promise.resolve();
  let sceneRoamToken = 0;
  const adcode = ref("100000");
  const currentRegion = ref(getCurrentMapRegionSelection(element.data));
  const getMapSourceFingerprint = (props: startProps | null | undefined) => {
    if (!props) {
      return "";
    }

    const provider = props.mapSource?.provider || "china-adcode";
    const geoJsonUrl = props.mapSource?.geoJsonUrl || "";
    return `${provider}:${geoJsonUrl}:${props.adcode || ""}`;
  };

  const syncCurrentRegionSelection = (data = element.data) => {
    const nextRegion = getCurrentMapRegionSelection(data);
    currentRegion.value = nextRegion;
    adcode.value = nextRegion.adcode || "100000";
  };
  const lastProps = ref<startProps | null>(null); // 存储上一次的配置，用于比较

  const clonePresetChildren = (children: any[] = []) => cloneJson(children);
  const buildCachedProps = (props: startProps, children: any[] = props.presetChild || []): startProps => ({
    ...props,
    sceneControl: {
      ...props.sceneControl,
      bloom: cloneJson(props.sceneControl?.bloom || {}),
      innerShadow: cloneJson(props.sceneControl?.innerShadow || {})
    },
    presetChild: clonePresetChildren(children)
  });
  const syncPresetChildren = (instance: geojsonMapInstance, nextChildren: any[], prevChildren: any[]) => {
    nextChildren.forEach((child: any, index: number) => {
      const childId = child.id || child.title || `child_${index}`;
      const oldChild = prevChildren.find((c: any, oldIndex: number) => {
        const oldId = c.id || c.title || `child_${oldIndex}`;
        return oldId === childId && c.type === child.type;
      });

      if (!oldChild || JSON.stringify(child) !== JSON.stringify(oldChild)) {
        instance.updateChildByType(child.type, child, childId);
      }
    });

    prevChildren.forEach((oldChild: any, oldIndex: number) => {
      const oldId = oldChild.id || oldChild.title || `child_${oldIndex}`;
      const stillExists = nextChildren.some((c: any, index: number) => {
        const newId = c.id || c.title || `child_${index}`;
        return newId === oldId && c.type === oldChild.type;
      });

      if (!stillExists) {
        if (oldChild.type === "plane") {
          (instance as any).planeManager?.remove(oldId);
        } else if (oldChild.type === "mapGlIcon") {
          (instance as any).mapGlIconManager?.remove(oldId);
        } else {
          instance.updateChildByType(oldChild.type, { type: oldChild.type, show: false }, oldId);
        }
      }
    });
  };

  syncCurrentRegionSelection();

  const onGeoComponentClick = (params: any) => {
    const regionSelection = currentRegion.value;
    if (!regionSelection.allowDrillDown) {
      return;
    }
    if (!option.value.maxDrillDownLevel || !option.value.autoDrillDown) {
      return;
    }
    if (dataChart.value.length > option.value.maxDrillDownLevel) {
      return;
    }
    if (mapInstance.value == null) {
      return;
    }

    const region = mapInstance.value.getRegionByName(params.name);
    if (region) {
      const nextRegion =
        (regionSelection.provider === "china-adcode"
          ? resolveChinaRegionSelectionByAdcode(region.adcode)
          : resolveMapRegionSelectionByAdcode(region.adcode)) || null;

      if (!nextRegion || nextRegion.id === regionSelection.id) {
        return;
      }

      adcode.value = nextRegion.adcode;
      element.data = [...element.data, nextRegion];
      syncCurrentRegionSelection(element.data);
    }

    // handleEventAndCallbackEvent({
    //   id: element.id,
    //   triggerType: EventTypeEnum.Click,
    //   events: element.events,
    //   isExecuteOnlyConditionSatisfied: false,
    //   throwValue: dataChart.value
    // });
  };

  const onGeoComponentContextmenu = () => {
    if (dataChart.value.length === 1 || !option.value.autoDrillDown) {
      return;
    }
    const data = element.data;
    data.pop();
    element.data = [...data];
    syncCurrentRegionSelection(data);
  };

  const onRegionClick = (data: { name: string; adcode: string; feature: any; clickType: "left" | "right" }) => {
    console.log("区域点击事件:", data);
    if (data.clickType === "left") {
      onGeoComponentClick(data);
      handleEventAndCallbackEvent({
        id: element.id,
        triggerType: EventTypeEnum.Click,
        events: element.events,
        isExecuteOnlyConditionSatisfied: false,
        throwValue: data
      });
    } else {
      onGeoComponentContextmenu();
    }
  };

  const onChildClick = (data: any) => {
    console.log("子组件点击事件:", data);
    const child = presetChild.value.find((c: any) => {
      return c.id === data.componentId.split("--")[1];
    });

    if (child) {
      handleEventAndCallbackEvent({
        id: element.id,
        triggerType: EventTypeEnum.ChildComponentClick,
        events: child.events || [],
        isExecuteOnlyConditionSatisfied: false,
        throwValue: data
      });
    }
  };
  /**
   * 获取默认配置
   */
  const getDefaultProps = (): startProps => {
    const regionSelection = currentRegion.value;
    const hoverLiftOption = option.value.hoverLift || {};
    const normalizedPresetChildren = normalizeGlPresetChildren(presetChild.value || []);

    return {
      adcode: adcode.value || "100000",
      mapSource: {
        regionId: regionSelection.id,
        provider: regionSelection.provider,
        geoJsonUrl: regionSelection.geoJsonUrl,
        allowDrillDown: regionSelection.allowDrillDown
      },
      fillType: option.value.fillType,
      areaColor: option.value.areaColor || "#171a24",
      activeAreaColor: option.value.activeAreaColor || "#FF00FF",
      picture: setMinioUrl(option.value?.picture),
      normalMap: setMinioUrl(option.value?.normalMap),
      normalMapIntensity: option.value?.normalMapIntensity,
      activePicture: setMinioUrl(option.value?.activePicture),
      uvScaleX: option.value.uvScaleX !== undefined ? option.value.uvScaleX : 1,
      uvScaleY: option.value.uvScaleY !== undefined ? option.value.uvScaleY : 1,
      uvOffsetX: option.value.uvOffsetX !== undefined ? option.value.uvOffsetX : 0,
      uvOffsetY: option.value.uvOffsetY !== undefined ? option.value.uvOffsetY : 0,
      uvRotation: option.value.uvRotation || 0,
      borderWidth: option.value?.borderWidth,
      borderColor: option.value.borderColor,
      sideGlowColor: option.value.sideGlowColor,
      sideGlowStrength: option.value.sideGlowStrength,
      activeBorderColor: option.value.activeBorderColor,
      defaultLiftAdcode: option.value.defaultLiftAdcode || "",
      textStyle: {
        fontFamily: option.value.textStyle.fontFamily || "Arial",
        fontSize: option.value.textStyle.fontSize * 2,
        color: option.value.textStyle.color || "rgba(255, 255, 255, 1)",
        fontStyle: option.value.textStyle.fontStyle || "normal",
        fontWeight: option.value.textStyle.fontWeight || "normal"
      },
      sceneControl: {
        beta: option.value?.beta || undefined,
        regionHeight: option.value.sceneControl.regionHeight * 0.1,
        autoRotate: option.value.sceneControl.autoRotate || false,
        rotateSpeed: option.value?.rotateSpeed || 0.01,
        initialRotationAngle: 0,
        mapRotationAngle: option.value.sceneControl.mapRotationAngle * -1,
        bloom: option.value.sceneControl?.bloom,
        innerShadow: option.value.sceneControl?.innerShadow
      },
      backgroundColor: option.value?.backgroundColor || 0x000000,
      fog: option.value?.fog || false,
      fogColor: option.value?.fogColor || 0x000000,
      camera: {
        distance: option.value.camera.distance * 0.05,
        verticalTiltAngle: option.value.camera.verticalTiltAngle * -1,
        horizontalRotationAngle: option.value.camera.horizontalRotationAngle * -1
      },
      light: {
        ambientIntensity: option.value.light.ambientIntensity,
        ambientColor: option.value.light.ambientColor ? option.value.light.ambientColor : "fff8e1",
        directionalIntensity: option.value.light.directionalIntensity,
        directionalColor: option.value.light.directionalColor ? option.value.light.directionalColor : "fff8e1",
        directionalPosition: undefined
      },
      mouseControl: {
        zoomSpeed: option.value?.mouseControlZoomSpeed !== undefined ? option.value.mouseControlZoomSpeed : 25,
        panSpeed: option.value?.mouseControlPanSpeed !== undefined ? option.value.mouseControlPanSpeed : 10,
        rotateSpeed: option.value?.mouseControlRotateSpeed !== undefined ? option.value.mouseControlRotateSpeed : 25
      },
      hoverLift: {
        height: (hoverLiftOption.hoverLiftHeight ?? hoverLiftOption.height ?? 1) * 0.01,
        duration: hoverLiftOption.hoverLiftDuration ?? hoverLiftOption.duration ?? 300
      },
      onRegionClick: onRegionClick,
      onChildClick: onChildClick,
      presetChild: normalizedPresetChildren
    };
  };

  const updateStrategies: UpdateStrategy[] = [
    {
      name: "materials",
      priority: 1,
      checkChange: (oldProps, newProps) => {
        if (!oldProps) return true;
        // 检测材质相关配置的变化
        if (oldProps.fillType !== newProps.fillType) return true;
        if (oldProps.areaColor !== newProps.areaColor) return true;
        if (oldProps.activeAreaColor !== newProps.activeAreaColor) return true;
        if (oldProps.picture !== newProps.picture) return true;
        if (oldProps.activePicture !== newProps.activePicture) return true;
        if (oldProps.normalMap !== newProps.normalMap) return true;
        if (oldProps.normalMapIntensity !== newProps.normalMapIntensity) return true;
        if (oldProps.borderWidth !== newProps.borderWidth) return true;
        if (oldProps.borderColor !== newProps.borderColor) return true;
        if (oldProps.sideGlowColor !== newProps.sideGlowColor) return true;
        if (oldProps.sideGlowStrength !== newProps.sideGlowStrength) return true;
        if (oldProps.activeBorderColor !== newProps.activeBorderColor) return true;
        if (oldProps.defaultLiftAdcode !== newProps.defaultLiftAdcode) return true;
        // 检测 UV 相关配置的变化
        if (oldProps.uvScaleX !== newProps.uvScaleX) return true;
        if (oldProps.uvScaleY !== newProps.uvScaleY) return true;
        if (oldProps.uvOffsetX !== newProps.uvOffsetX) return true;
        if (oldProps.uvOffsetY !== newProps.uvOffsetY) return true;
        if (oldProps.uvRotation !== newProps.uvRotation) return true;
        // 检测 hoverLift 配置的变化（影响悬停效果）
        const oldHoverLift = oldProps.hoverLift || {};
        const newHoverLift = newProps.hoverLift || {};
        if (oldHoverLift.height !== newHoverLift.height) return true;
        if (oldHoverLift.duration !== newHoverLift.duration) return true;

        // 检测内阴影开关的变化（影响材质及其 Shader 重新生成）
        if (oldProps.sceneControl?.innerShadow?.enable !== newProps.sceneControl?.innerShadow?.enable) return true;

        return false;
      },
      execute: async (instance, props) => {
        console.log("更新材质", props);
        await instance.updateMaterials(props);
      }
    },
    {
      name: "textStyle",
      priority: 2,
      checkChange: (oldProps, newProps) => {
        if (!oldProps) return true;
        const oldTextStyle = oldProps.textStyle || {};
        const newTextStyle = newProps.textStyle || {};
        return compareFields(oldTextStyle, newTextStyle, [
          "fontFamily",
          "fontSize",
          "color",
          "fontStyle",
          "fontWeight"
        ]);
      },
      execute: async (instance, props) => {
        await instance.updateTextLabels(props.textStyle);
      }
    },
    {
      name: "geometry",
      priority: 3,
      requiresFullUpdate: true,
      checkChange: (oldProps, newProps) => {
        if (!oldProps) return true;
        if (oldProps.adcode !== newProps.adcode) return true;
        if (getMapSourceFingerprint(oldProps) !== getMapSourceFingerprint(newProps)) return true;
        const oldSceneControl = oldProps.sceneControl || {};
        const newSceneControl = newProps.sceneControl || {};
        return compareFields(oldSceneControl, newSceneControl, [
          "regionHeight",
          "initialRotationAngle",
          "mapRotationAngle"
        ]);
      },
      execute: async (instance, props, dom) => {
        await instance.updateGeometry(dom, props);
      }
    },
    {
      name: "camera",
      priority: 4,
      checkChange: (oldProps, newProps) => {
        if (!oldProps) return true;
        const oldCamera = oldProps.camera || {};
        const newCamera = newProps.camera || {};
        return compareFields(oldCamera, newCamera, ["distance", "verticalTiltAngle", "horizontalRotationAngle"]);
      },
      execute: async (instance, props, dom) => {
        await instance.updateCamera(dom, props.camera, props.sceneControl?.beta);
      }
    },
    {
      name: "lighting",
      priority: 5,
      checkChange: (oldProps, newProps) => {
        if (!oldProps) return true;
        const oldLight = oldProps.light || {};
        const newLight = newProps.light || {};
        // 检测所有光照相关配置的变化
        if (oldLight.ambientIntensity !== newLight.ambientIntensity) return true;
        if (oldLight.ambientColor !== newLight.ambientColor) return true;
        if (oldLight.directionalIntensity !== newLight.directionalIntensity) return true;
        if (oldLight.directionalColor !== newLight.directionalColor) return true;
        // directionalPosition 不再使用配置，自动计算，所以不需要检测
        return false;
      },
      execute: async (instance, props) => {
        await instance.updateLighting(props.light, props.sceneControl?.regionHeight);
      }
    },
    {
      name: "controls",
      priority: 6,
      checkChange: (oldProps, newProps) => {
        if (!oldProps) return true;
        const oldMouseControl = oldProps.mouseControl || {};
        const newMouseControl = newProps.mouseControl || {};
        return compareFields(oldMouseControl, newMouseControl, ["zoomSpeed", "panSpeed", "rotateSpeed"]);
      },
      execute: async (instance, props, dom) => {
        await instance.updateControls(dom, props.mouseControl);
      }
    },
    {
      name: "scene",
      priority: 7,
      requiresFullUpdate: true,
      checkChange: (oldProps, newProps) => {
        if (!oldProps) return true;
        return compareFields(oldProps, newProps, ["backgroundColor", "fog", "fogColor"]);
      },
      execute: async (instance, props) => {
        await instance.updateScene(props);
      }
    },
    {
      name: "sceneControl",
      priority: 8,
      checkChange: (oldProps, newProps) => {
        if (!oldProps) return true;
        const oldSceneControl = oldProps.sceneControl || {};
        const newSceneControl = newProps.sceneControl || {};

        // 基本属性比较
        if (compareFields(oldSceneControl, newSceneControl, ["autoRotate", "rotateSpeed", "rotateDirection"]))
          return true;

        // Bloom 属性深度比较
        if (JSON.stringify(oldSceneControl.bloom) !== JSON.stringify(newSceneControl.bloom)) return true;

        // InnerShadow 属性深度比较
        if (JSON.stringify(oldSceneControl.innerShadow) !== JSON.stringify(newSceneControl.innerShadow)) return true;

        return false;
      },
      execute: async (instance, props) => {
        await instance.updateSceneControl(props.sceneControl);
      }
    }
  ];

  /**
   * 检测配置变化并返回需要执行的策略
   */
  const detectChanges = (
    oldProps: startProps | null,
    newProps: startProps
  ): {
    strategies: UpdateStrategy[];
    requiresFullUpdate: boolean;
  } => {
    // 首次渲染，需要全量更新
    if (!oldProps) {
      return {
        strategies: [],
        requiresFullUpdate: true
      };
    }

    // 检测变化的策略
    const changedStrategies = updateStrategies
      .filter((strategy) => strategy.checkChange(oldProps, newProps))
      .sort((a, b) => (a.priority || 0) - (b.priority || 0));

    // 检查是否需要全量更新
    const requiresFullUpdate =
      changedStrategies.some((s) => s.requiresFullUpdate) ||
      (changedStrategies.length > 3 &&
        changedStrategies.some((s) => ["materials", "textStyle", "camera"].includes(s.name)));

    return {
      strategies: changedStrategies,
      requiresFullUpdate
    };
  };

  /**
   * 更新地图渲染（内部实现）
   */
  const performMapUpdate = async () => {
    await nextTick();
    if (glMapTemplate.value === null) return;

    try {
      isMapUpdating.value = true;
      // 创建或获取实例（使用 markRaw 避免 Vue 响应式包装）
      if (!mapInstance.value) {
        mapInstance.value = markRaw(new geojsonMapInstance());
      }

      // 获取配置
      const newProps = getDefaultProps();

      // 检测配置变化
      const { strategies, requiresFullUpdate } = detectChanges(lastProps.value, newProps);

      // 执行更新
      if (requiresFullUpdate || !lastProps.value) {
        // 全量更新
        await mapInstance.value.updateDraw(glMapTemplate.value, newProps);
      } else {
        // 增量更新：按优先级执行策略
        const instance = mapInstance.value as geojsonMapInstance;
        const dom = glMapTemplate.value as HTMLElement;
        if (instance && dom) {
          await Promise.all(strategies.map((strategy) => strategy.execute(instance, newProps, dom)));
        }
      }

      // 保存当前配置（对引用类型进行深拷贝以防比较失效）
      const latestPresetChildren = normalizeGlPresetChildren(presetChild.value || []);
      const renderedPresetChildren = newProps.presetChild || [];
      const instance = mapInstance.value as geojsonMapInstance | null;
      if (JSON.stringify(latestPresetChildren) !== JSON.stringify(renderedPresetChildren) && instance) {
        syncPresetChildren(instance, latestPresetChildren, renderedPresetChildren);
      }

      lastProps.value = buildCachedProps(newProps, latestPresetChildren);
      isMapUpdating.value = false;
    } catch (error) {
      isMapUpdating.value = false;
      console.error("地图渲染失败:", error);
    }
  };

  const upDateGlMap = async () => {
    mapUpdateQueue = mapUpdateQueue.then(() => performMapUpdate());
    return mapUpdateQueue;
  };

  /**
   * 仅更新子组件的方法 (解耦更新)
   */
  const performSubComponentUpdate = async () => {
    if (!mapInstance.value) return;

    const newProps = getDefaultProps();
    const instance = mapInstance.value as geojsonMapInstance;
    const newChildren = newProps.presetChild || [];

    if (!lastProps.value) {
      lastProps.value = buildCachedProps(newProps, newChildren);
      syncPresetChildren(instance, newChildren, []);
      return;
    }

    const oldChildren = lastProps.value.presetChild || [];
    syncPresetChildren(instance, newChildren, oldChildren);
    lastProps.value.presetChild = clonePresetChildren(newChildren);
  };

  const updateSubComponents = async () => {
    if (!mapInstance.value) return;

    mapUpdateQueue = mapUpdateQueue.then(async () => {
      await performSubComponentUpdate();
    });

    return mapUpdateQueue;
  };

  /**
   * ?????????
   * @param childComponentList ?????
   * @param visible ????
   */
  const updateChildComponentVisible = (childComponentList: any[], visible: boolean) => {
    if (!mapInstance.value) return;

    childComponentList.forEach((info) => {
      const childId = info.value || info.id;
      const child = presetChild.value.find((c: any) => (c.id || c.title) === childId);
      if (child) {
        child.show = visible;
        const normalizedChild = normalizeGlPresetChild(child);
        mapInstance.value?.updateChildByType(normalizedChild.type, normalizedChild, childId);
      }
    });

    if (lastProps.value) {
      lastProps.value.presetChild = clonePresetChildren(normalizeGlPresetChildren(presetChild.value || []));
    }
  };

  const liftRegionByAdcode = (adcode: string, options?: { height?: number; duration?: number }) => {
    const height = Number(options?.height);
    const duration = Number(options?.duration);
    mapInstance.value?.liftRegionByAdcode(adcode, {
      height: Number.isFinite(height) ? height * 0.01 : undefined,
      duration: Number.isFinite(duration) ? duration : undefined
    });
  };

  const setMapGlIconActive = (options: MapGlIconActiveOptions) => {
    return mapInstance.value?.setMapGlIconActive(options) ?? false;
  };

  const normalizeSceneList = (viewManager: any): any[] => {
    if (Array.isArray(viewManager?.sceneList) && viewManager.sceneList.length) {
      return viewManager.sceneList;
    }

    if (Array.isArray(viewManager?.viewList) && viewManager.viewList.length) {
      return viewManager.viewList.map((item: any, index: number) => ({
        id: item?.id || `legacy_view_${index}`,
        name: item?.name || `场景${index + 1}`,
        shots: [
          {
            id: `legacy_shot_${index}`,
            name: "视角1",
            duration: item?.duration ?? 5,
            camera: item?.camera
          }
        ]
      }));
    }

    return [];
  };

  const stopSceneRoam = () => {
    sceneRoamToken += 1;
    mapInstance.value?.stopViewAnimation();
  };

  const playSceneRoam = async (sceneId: string) => {
    if (!mapInstance.value || !sceneId) {
      return;
    }
    const instance = mapInstance.value;

    const sceneList = normalizeSceneList(option.value?.viewManager);
    const scene = sceneList.find((item: any) => String(item?.id || "") === String(sceneId));
    if (!Array.isArray(scene?.shots) || scene.shots.length === 0) {
      return;
    }

    const token = ++sceneRoamToken;
    instance.stopViewAnimation();

    for (const shot of scene.shots) {
      if (token !== sceneRoamToken) {
        return;
      }
      if (!shot?.camera) {
        continue;
      }

      await instance.viewToAsync(cloneJson(shot.camera), Math.max(Number(shot.duration || 0), 0) * 1000);
    }
  };

  return {
    option,
    dataChart,
    presetChild,
    handleEventAndCallbackEvent,
    glMapTemplate,
    adcode,
    mapInstance,
    syncCurrentRegionSelection,
    upDateGlMap,
    updateSubComponents,
    updateChildComponentVisible,
    liftRegionByAdcode,
    setMapGlIconActive,
    playSceneRoam,
    stopSceneRoam
  };
};
