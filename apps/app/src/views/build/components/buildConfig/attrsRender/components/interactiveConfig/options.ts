import { ActionList, createComponent2ActionMapGetter, EncodeEventList, EventList } from "@screenwright/types";

import { interactiveEnum, mediaEnum, textEnum } from "@/components/componentEntry/type";
import { uuid } from "@/utils/utils";
import { PanelType } from "@/views/build/components/buildRender/core/SystemComponent/type";
import type { Condition, Event } from "@/views/build/components/buildRender/type";
import type {
  Action,
  Callback,
  ComponentType,
  EncodeAction,
  EncodeEvent
} from "@/views/build/components/buildRender/type";

import {
  ActionAnimationTypeEnum,
  ActionTypeEnum,
  actionTypeOptions,
  animationList,
  animationOutList,
  animationOutPosition,
  animationPosition,
  ConditionCompareEnum,
  conditionCompareOptions,
  ConditionLogicTypeEnum,
  ConditionTypeEnum,
  conditionTypeOptions,
  customTableListOptions,
  EncodeEventTypeEnum,
  EventTypeEnum,
  MessageTypeEnum,
  messageTypeOptions,
  ParameterTypeEnum,
  parameterTypeOptions,
  SceneObjectExplosionType,
  sceneObjectExplosionTypeOptions,
  tcpudpDataTypeEnum,
  tcpudpDataTypeOptions,
  timingFunction,
  UDPSendtypeEnum,
  UDPSendtypeListOptions,
  ueMessageTypeOptions,
  VisibleTypeEnum,
  visibleTypeOptions
} from "../../../constants/index";

type AllComponentType = ComponentType["component"]["prop"];
// 事件类型相关

/**
 * templateEvents
 * @returns 默认事件
 */
export const templateEvents = (obj: Partial<Event>): Event => {
  return {
    name: "事件",
    id: "event_" + uuid(),
    conditionType: ConditionLogicTypeEnum.All,
    conditions: [],
    actions: [
      {
        ...templateActions()
      }
    ],
    trigger: EventTypeEnum.DataChange,
    btnObjs: [],
    ...obj
  };
};
/**
 * templateActions
 * @returns 默认动作
 */
export const templateActions = (): Action => {
  return {
    id: "action_" + uuid(),
    name: "动作",
    action: ActionTypeEnum.Default,
    actionData: {},
    animation: {
      delay: 0,
      duration: 1000,
      timingFunction: "linear",
      type: ActionAnimationTypeEnum.Opacity,
      idxValue: 1
    },
    mapBox: {
      //弹窗面板XY轴偏移
      boxOffsetX: 0,
      boxOffsetY: 0
    },
    layerInfo: {
      color: "#ffffff",
      name: "",
      callBackField: "",
      childNodeField: ""
    },
    component: [],
    componentConfig: {
      component: {
        prop: PanelType.dynamicPanel,
        width: 0,
        height: 0,
        name: ""
      },
      option: {},
      name: "",
      left: 0,
      top: 0
    },

    componentScope: "current",
    stateId: "",
    sceneStatusName: "",
    switchSceneStatusDelay: 0,
    sceneLevelId: -1,
    keyframesName: "",
    keyframesPlayDelay: 0,
    stateAnimationName: "",
    animationState: -1,
    stateAnimationPlayDelay: 0,
    sceneObject: {
      nameList: [],
      objInfoList: [],
      visible: VisibleTypeEnum.Show
    },
    sceneObjectExplosion: {
      index: "",
      lidName: "",
      baseName: "",
      type: SceneObjectExplosionType.Explode
    },
    sceneChildComponent: {
      nameList: [],
      childComponentInfoList: [],
      visible: VisibleTypeEnum.Show
    },
    mapChildComponent: {
      nameList: [],
      childComponentInfoList: [],
      visible: VisibleTypeEnum.Show
    },
    glMapRegionLift: {
      regionId: "",
      adcode: "",
      name: "",
      height: 1,
      duration: 300
    },
    glMapSceneRoam: {
      sceneId: ""
    },
    glMapIconActive: {
      childId: "",
      matchField: "name",
      matchValue: "",
      matchValueSource: "static",
      eventField: "name",
      action: "select",
      exclusive: true,
      clearWhenMiss: false
    },
    apiInstructionDetail: "",
    apiInstructionDelay: 0,
    scale: {
      lock: true,
      origin: "50% 50%",
      originGrid: { left: "center", top: "center" },
      x: 100,
      y: 100
    },
    translate: {
      toX: 0,
      toY: 0
    },
    encodeKey: null,
    ue4Config: {
      messageName: "",
      messageJson: "",
      messageContent: "",
      messageType: MessageTypeEnum.String
    },
    customActionType: "component", // 动作-类型
    panelStatusAnimationId: "", // 面板状态动画ID
    panelStatusId: "", // 面板状态ID
    tcpudpConfig: {
      dataType: tcpudpDataTypeEnum.None,
      dataSourceId: "",
      dataSourceObj: null,
      sendData: "",
      sendType: UDPSendtypeEnum.Unicast,
      dataDelay: 0
    },
    projectFunName: "",
    projectParamList: [],
    projectParamType: ParameterTypeEnum.Default,
    projectParamValue: {},
    projectParamCode: "",
    swiperCardTabsName: "",
    aiManMsgContent: "",
    setBroadcastId: null,
    videoStartTime: 0,
    videoEndTime: 0,
    option: {},
    translation: "zh",
    blueprintKey: "",
    timeFastIn: 10,
    timeRewind: 10
  };
};

/** 默认动画配置 */
const defaultAnimation = (overrides?: Partial<Action["animation"]>): Action["animation"] => ({
  delay: 0,
  duration: 1000,
  timingFunction: "linear",
  type: ActionAnimationTypeEnum.Opacity,
  idxValue: 1,
  ...overrides
});

/** 仅需 animation.delay 的动作集合 */
const delayOnlyActions = new Set([
  ActionTypeEnum.FollowIcon,
  ActionTypeEnum.FocusLayer,
  ActionTypeEnum.VideoToPlay,
  ActionTypeEnum.VideoToPause,
  ActionTypeEnum.VideoToStop,
  ActionTypeEnum.VideoToRestart,
  ActionTypeEnum.VideoToFullscreen,
  ActionTypeEnum.VideoToUnmuted,
  ActionTypeEnum.VideoToMuted,
  ActionTypeEnum.VideoToAudioUp,
  ActionTypeEnum.VideoToAudioDown,
  ActionTypeEnum.VideoToFastin,
  ActionTypeEnum.VideoToRewind,
  ActionTypeEnum.VideoToSwitch,
  ActionTypeEnum.VoiceControlStart,
  ActionTypeEnum.VoiceControlStop,
  ActionTypeEnum.prevPage,
  ActionTypeEnum.nextPage,
  ActionTypeEnum.TurnOnPatrol,
  ActionTypeEnum.PausePatrol,
  ActionTypeEnum.RestartPatrol,
  ActionTypeEnum.toPrevStatus,
  ActionTypeEnum.toNextStatus,
  ActionTypeEnum.MouseEnter,
  ActionTypeEnum.MouseLeave,
]);

/**
 * 根据 actionType 创建对应的最小化 Action 配置
 * 仅包含该动作类型所需的字段
 */
export const createTemplateAction = (actionType: ActionTypeEnum): Partial<Action> => {
  const base: Partial<Action> = {
    id: "action_" + uuid(),
    name: ActionList.find((a) => a.value === actionType)?.label ?? "动作",
    action: actionType,
    component: [],
    customActionType: "component"
  };

  switch (actionType) {
    case ActionTypeEnum.Default:
      return { ...base };
    // 显隐 / 变换类
    case ActionTypeEnum.Show:
    case ActionTypeEnum.Hide:
    case ActionTypeEnum.ShowHide:
      return { ...base, animation: defaultAnimation() };

    case ActionTypeEnum.Moving:
      return {
        ...base,
        animation: defaultAnimation(),
        translate: { toX: 0, toY: 0 }
      };

    case ActionTypeEnum.Scaling:
    case ActionTypeEnum.ScalingHide:
      return {
        ...base,
        animation: defaultAnimation(),
        scale: {
          lock: true,
          origin: "50% 50%",
          originGrid: { left: "center", top: "center" },
          x: 100,
          y: 100
        }
      };

    // 状态类
    case ActionTypeEnum.SwitchState:
      return { ...base, animation: defaultAnimation(), stateId: "" };

    case ActionTypeEnum.SwitchSceneStatus:
      return { ...base, sceneStatusName: "", switchSceneStatusDelay: 0 };

    case ActionTypeEnum.SwitchSceneLevel:
      return { ...base, sceneLevelId: -1 };

    // 3D 场景类
    case ActionTypeEnum.SwitchSceneObjVisible:
      return {
        ...base,
        sceneObject: {
          nameList: [],
          objInfoList: [],
          visible: VisibleTypeEnum.Show
        }
      };

    case ActionTypeEnum.HandleSceneObjExplosion:
      return {
        ...base,
        sceneObjectExplosion: {
          index: "",
          lidName: "",
          baseName: "",
          type: SceneObjectExplosionType.Explode
        }
      };

    case ActionTypeEnum.SwitchSceneChildComponentVisible:
      return {
        ...base,
        sceneChildComponent: {
          nameList: [],
          childComponentInfoList: [],
          visible: VisibleTypeEnum.Show
        }
      };

    case ActionTypeEnum.SwitchMapChildComponentVisible:
      return {
        ...base,
        mapChildComponent: {
          nameList: [],
          childComponentInfoList: [],
          visible: VisibleTypeEnum.Show
        }
      };

    case ActionTypeEnum.GlMapIconActive:
      return {
        ...base,
        glMapIconActive: {
          childId: "",
          matchField: "name",
          matchValue: "",
          matchValueSource: "static",
          eventField: "name",
          action: "select",
          exclusive: true,
          clearWhenMiss: false
        }
      };

    case ActionTypeEnum.HandleApiInstruction:
      return { ...base, apiInstructionDetail: "", apiInstructionDelay: 0 };

    case ActionTypeEnum.SetAnimationPlay:
    case ActionTypeEnum.SetAnimationPause:
      return { ...base, keyframesName: "", keyframesPlayDelay: 0 };

    case ActionTypeEnum.SetStateAnimationPlay:
      return {
        ...base,
        stateAnimationName: "",
        animationState: -1,
        stateAnimationPlayDelay: 0
      };

    // 交互 / 展示类
    case ActionTypeEnum.SetIndex:
      return { ...base, animation: defaultAnimation() };

    case ActionTypeEnum.SwiperCardChangeIndex:
      return { ...base, swiperCardTabsName: "" };

    case ActionTypeEnum.UpdateConfig:
      return {
        ...base,
        animation: defaultAnimation(),
        componentConfig: {
          component: { prop: PanelType.dynamicPanel, width: 0, height: 0, name: "" },
          option: {},
          name: "",
          left: 0,
          top: 0
        }
      };

    case ActionTypeEnum.UpdateParams:
      return { ...base };

    // 视频播放区间
    case ActionTypeEnum.VideoToPlayRange:
      return { ...base, videoStartTime: 0, videoEndTime: 0 };

    // UE4 / AI 类
    case ActionTypeEnum.SendUe4Msg:
    case ActionTypeEnum.SendUe4MsgStatic:
      return {
        ...base,
        ue4Config: {
          messageName: "",
          messageJson: "",
          messageContent: "",
          messageType: MessageTypeEnum.String
        }
      };

    case ActionTypeEnum.SendAIManMsgStatic:
      return { ...base, aiManMsgContent: "" };

    // 项目特有
    case ActionTypeEnum.ProjectSpecificFun:
      return {
        ...base,
        projectFunName: "",
        projectParamList: [],
        projectParamType: ParameterTypeEnum.Default,
        projectParamValue: {},
        projectParamCode: ""
      };

    // TCP/UDP (SwitchTCState)
    case ActionTypeEnum.SwitchTCState:
      return {
        ...base,
        tcpudpConfig: {
          dataType: tcpudpDataTypeEnum.None,
          dataSourceId: "",
          dataSourceObj: null,
          sendData: "",
          sendType: UDPSendtypeEnum.Unicast,
          dataDelay: 0
        }
      };

    // 仅需 animation.delay 的动作（视频控制、分页、轮巡等）
    default:
      if (delayOnlyActions.has(actionType)) {
        return { ...base, animation: defaultAnimation() };
      }
      // Default 及未知类型
      return { ...base };
  }
};
/**
 * templateConditions
 * @returns 默认条件
 */
export const templateConditions = (): Condition => {
  return {
    id: "condition_" + uuid(),
    name: "条件",
    code: "return data",
    type: ConditionTypeEnum.Field,
    compare: ConditionCompareEnum.Equal,
    expected: "",
    field: "",
    notSaved: false,
    isExists: true,
    tempPool: {
      name: "条件",
      code: "return data",
      type: ConditionTypeEnum.Field,
      compare: ConditionCompareEnum.Equal,
      expected: "",
      field: "",
      isExists: true
    }
  };
};

/**
 * templateCallback
 * @returns 默认回调函数
 */
export const templateCallback = (): Callback => {
  return {
    id: "callback_" + uuid(),
    name: "回调",
    type: "object",
    method: "default",
    value: {
      origin: {
        displayName: "字段值",
        type: "input",
        value: ""
      },
      target: {
        displayName: "变量名",
        type: "input",
        value: ""
      }
    }
  };
};

/**
 * templateEncode
 * @returns 默人远程控制
 */
export const templateEncodeEvent = (): EncodeEvent => {
  return {
    trigger: EncodeEventTypeEnum.None,
    name: "事件",
    id: "encode_event_" + uuid(),
    conditionType: ConditionLogicTypeEnum.All,
    conditions: [],
    actions: [
      {
        ...templateEncodeActions()
      }
    ]
  };
};
/**
 * templateEncode
 * @returns 默人远程控制-动作
 */
export const templateEncodeActions = (): EncodeAction => {
  return {
    id: "encode_action_" + uuid(),
    name: "控制",
    action: ActionTypeEnum.Show,
    actionData: {},
    component: [],
    componentConfig: {
      component: {
        prop: PanelType.dynamicPanel,
        width: 0,
        height: 0,
        name: ""
      },
      option: {},
      name: "",
      left: 0,
      top: 0
    },
    componentScope: "current",
    encodeLabel: null,
    encodeKey: null,
    encodeValue: []
  };
};

/**
 * 配置选项字段枚举
 */
export enum ConfigFieldEnum {
  /** 非事件类型 */
  None = "",
  /** 事件类型 */
  EventType = "eventType",
  /** 编码事件类型 */
  EncodeEventType = "encodeEventType",
  /** 动作 */
  Action = "action",
  /** 动作类型 */
  ActionType = "actionType",
  /** 动画类型 */
  AnimationType = "animationType",
  /** 时间函数 */
  TimingFunction = "timingFunction",
  /** 动画位置 */
  AnimationPosition = "animationPosition",
  /** 动画退出位置 */
  AnimationOutPosition = "animationOutPosition",
  /** 条件类型 */
  ConditionType = "conditionType",
  /** 条件比较 */
  ConditionCompare = "conditionCompare",
  /** 可见性类型 */
  VisibleType = "visibleType",
  /** 消息类型 */
  MessageType = "messageType",
  /** UE消息类型 */
  UeMessageType = "ueMessageType",
  /** 自定义表格列表 */
  CustomTableList = "customTableList",
  /** TCP/UDP数据类型 */
  TcpudpDataType = "tcpudpDataType",
  /** UDP发送类型列表 */
  UDPSendtypeList = "UDPSendtypeList",
  /** 参数类型 */
  ParameterType = "parameterType",
  /** 动画退出类型 */
  AnimationOutType = "animationOutType",
  /** 场景对象爆炸类型 */
  SceneObjectExplosionType = "sceneObjectExplosionType"
}

/**
 * 配置选项字段联合类型
 */
export type ConfigField = `${ConfigFieldEnum}`;

/**
 * configOptions
 * @param field 配置字段类型
 * @returns 相关配置选项数组
 */
export const configOptions = (field: ConfigField): any[] => {
  const strategyMap: Record<ConfigField, any[]> = {
    [ConfigFieldEnum.None]: [],
    [ConfigFieldEnum.EventType]: EventList,
    [ConfigFieldEnum.EncodeEventType]: EncodeEventList,
    [ConfigFieldEnum.Action]: ActionList,
    [ConfigFieldEnum.ActionType]: actionTypeOptions,
    [ConfigFieldEnum.AnimationType]: animationList,
    [ConfigFieldEnum.TimingFunction]: timingFunction,
    [ConfigFieldEnum.AnimationPosition]: animationPosition,
    [ConfigFieldEnum.AnimationOutPosition]: animationOutPosition,
    [ConfigFieldEnum.ConditionType]: conditionTypeOptions,
    [ConfigFieldEnum.ConditionCompare]: conditionCompareOptions,
    [ConfigFieldEnum.VisibleType]: visibleTypeOptions,
    [ConfigFieldEnum.MessageType]: messageTypeOptions,
    [ConfigFieldEnum.UeMessageType]: ueMessageTypeOptions,
    [ConfigFieldEnum.CustomTableList]: customTableListOptions,
    [ConfigFieldEnum.TcpudpDataType]: tcpudpDataTypeOptions,
    [ConfigFieldEnum.UDPSendtypeList]: UDPSendtypeListOptions,
    [ConfigFieldEnum.ParameterType]: parameterTypeOptions,
    [ConfigFieldEnum.AnimationOutType]: animationOutList,
    [ConfigFieldEnum.SceneObjectExplosionType]: sceneObjectExplosionTypeOptions
  };
  return strategyMap[field] || [];
};

export const moreActionSExcludes = () => {
  return configOptions("action")
    .filter((item, i) => i > 2)
    .map((a) => a.value)
    .join(",");
};

export const switchStateProp = (prop: AllComponentType) => {
  const getComponent2ActionMap = createComponent2ActionMapGetter();
  const propActions = getComponent2ActionMap().get(prop) || "";
  return propActions.includes(ActionTypeEnum.SwitchState) || propActions.includes(ActionTypeEnum.SwitchTCState);
};

export const switchSceneStatusProp = (prop: AllComponentType) => {
  const getComponent2ActionMap = createComponent2ActionMapGetter();
  const propActions = getComponent2ActionMap().get(prop) || "";
  return propActions.includes(ActionTypeEnum.SwitchSceneStatus);
};
export const switchSceneRoamProp = (prop: AllComponentType) => {
  const getComponent2ActionMap = createComponent2ActionMapGetter();
  const propActions = getComponent2ActionMap().get(prop) || "";
  return propActions.includes(ActionTypeEnum.SwitchSceneRoam);
};

export const switchSceneLevelProp = (prop: AllComponentType) => {
  const getComponent2ActionMap = createComponent2ActionMapGetter();
  const propActions = getComponent2ActionMap().get(prop) || "";
  return propActions.includes(ActionTypeEnum.SwitchSceneLevel);
};

export const switchVideoProp = (prop: AllComponentType) => {
  const getComponent2ActionMap = createComponent2ActionMapGetter();
  const propActions = getComponent2ActionMap().get(prop) || "";
  return propActions.includes(ActionTypeEnum.VideoToSwitch);
};

export const focusLayerProp = (trigger: EventTypeEnum) => {
  return trigger === EventTypeEnum.ThreeDTilesClick || trigger === EventTypeEnum.Click;
};

export const switchSceneObjVisibleProp = (prop: AllComponentType) => {
  const getComponent2ActionMap = createComponent2ActionMapGetter();
  const propActions = getComponent2ActionMap().get(prop) || "";
  return propActions.includes(ActionTypeEnum.SwitchSceneObjVisible);
};

export const handleSceneObjExplosionProp = (prop: AllComponentType) => {
  const getComponent2ActionMap = createComponent2ActionMapGetter();
  const propActions = getComponent2ActionMap().get(prop) || "";
  return propActions.includes(ActionTypeEnum.HandleSceneObjExplosion);
};

export const switchSceneChildComponentVisibleProp = (prop: AllComponentType) => {
  const getComponent2ActionMap = createComponent2ActionMapGetter();
  const propActions = getComponent2ActionMap().get(prop) || "";
  return propActions.includes(ActionTypeEnum.SwitchSceneChildComponentVisible);
};

export const switchMapChildComponentVisibleProp = (prop: AllComponentType) => {
  const getComponent2ActionMap = createComponent2ActionMapGetter();
  const propActions = getComponent2ActionMap().get(prop) || "";
  return propActions.includes(ActionTypeEnum.SwitchMapChildComponentVisible);
};

export const handleApiInstructionProp = (prop: AllComponentType) => {
  const getComponent2ActionMap = createComponent2ActionMapGetter();
  const propActions = getComponent2ActionMap().get(prop) || "";
  return propActions.includes(ActionTypeEnum.HandleApiInstruction);
};

export const handleSwiperCardIndexProp = (prop: AllComponentType) => {
  const getComponent2ActionMap = createComponent2ActionMapGetter();
  const propActions = getComponent2ActionMap().get(prop) || "";
  return propActions.includes(ActionTypeEnum.SwiperCardChangeIndex);
};

export const hasCustomEvents = (prop: AllComponentType) => {
  return [
    interactiveEnum.Subtabs,
    interactiveEnum.FtMutual,
    interactiveEnum.FtSearch,
    interactiveEnum.FtTimerShaft,
    interactiveEnum.FtCustomSelect,
    "echartcommonMap",
    "threescene",
    interactiveEnum.FtLegend,
    textEnum.FtTextWordCloud,
    interactiveEnum.FtPageQuery,
    interactiveEnum.FtPageTurning,
    interactiveEnum.FtDateTimePicker,
    mediaEnum.FtVideo,
    mediaEnum.CtVideoPanel,
    textEnum.FtScroll,
    textEnum.FtProgress,
    interactiveEnum.FtSingleSelectedLegend
  ].includes(prop);
};

// 不展示 交互-自定义事件的组件
export const filterCustomEvents = (prop: AllComponentType) => {
  return [
    "fullScreenSwitch", // 全屏切换
    "pageReload", // 页面刷新
    "simpleStar" // 闪点
  ].includes(prop);
};
