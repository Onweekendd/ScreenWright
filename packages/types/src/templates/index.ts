import type { Action, ActionAnimation } from "../types/action";
import {
  ActionAnimationTypeEnum,
  ActionList,
  ActionTypeEnum,
  ComponentScopeEnum,
  ConditionCompareEnum,
  ConditionLogicTypeEnum,
  ConditionTypeEnum,
  MessageTypeEnum,
  ParameterTypeEnum,
  SceneObjectExplosionType,
  tcpudpDataTypeEnum,
  UDPSendtypeEnum,
  VisibleTypeEnum
} from "../types/action";
import { PanelEnum } from "../types/componentProp/panel";
import type { Event } from "../types/event";
import { EventTypeEnum } from "../types/event";

// --- ID 生成 ---

const chars = "0123456789abcdefghijklmnopqrstuvwxyzGHIJKLMNOPQRSTUVWXYZ";
const uuid = (len = 36) => {
  const s: string[] = [];
  for (let i = 0; i < len; i++) {
    s[i] = chars[Math.floor(Math.random() * chars.length)];
  }
  if (len > 8) {
    s[14] = "4";
    s[19] = chars[(parseInt(s[19], 16) & 0x3) | 0x8];
    s[8] = s[13] = s[18] = s[23] = "-";
  }
  return s.join("");
};

// --- 工具函数 ---

export const componentIdToToken = (id: string) => `$component(${id})`;

/** 多组件时仅允许的动作类型：显示 / 隐藏 / 显隐切换 */
const MULTI_ACTION_TYPES: ActionTypeEnum[] = [ActionTypeEnum.Show, ActionTypeEnum.Hide, ActionTypeEnum.ShowHide];

/**
 * 根据 componentId 和 actionType 构建完整的 Action 模板（含 component token、componentScope）
 * componentScope 不传时默认为 Current；调用方应在能解析源/目标关系时显式传入计算好的 scope。
 */
export const buildActionFromTemplate = ({
  componentId,
  actionType,
  scope
}: {
  componentId: string[];
  actionType: ActionTypeEnum;
  scope?: ComponentScopeEnum;
}): Partial<Action> | { error: string } => {
  if (componentId.length > 1 && !MULTI_ACTION_TYPES.includes(actionType)) {
    return {
      error: `多组件时不支持 actionType "${actionType}"，仅支持: ${MULTI_ACTION_TYPES.map((a) => `"${a}"`).join(", ")}。请更换 actionType 或减少 componentId 为单个组件`
    };
  }

  const template = createTemplateAction(actionType);
  template.component = componentId.map(componentIdToToken);
  template.componentScope = scope ?? ComponentScopeEnum.Current;

  return template;
};

// --- Zod Schemas ---

// --- 模板工厂 ---

/** 默认动画配置 */
const defaultAnimation = (overrides?: Partial<ActionAnimation>): ActionAnimation => ({
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
  ActionTypeEnum.OnExport,
  ActionTypeEnum.OnClear,
  ActionTypeEnum.OnRedo,
  ActionTypeEnum.OnUndo,
  ActionTypeEnum.Signature,
  ActionTypeEnum.TurnOnPatrol,
  ActionTypeEnum.PausePatrol,
  ActionTypeEnum.RestartPatrol,
  ActionTypeEnum.toPrevStatus,
  ActionTypeEnum.toNextStatus,
  ActionTypeEnum.MouseEnter,
  ActionTypeEnum.MouseLeave,
  ActionTypeEnum.OnTranslateImage
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

    case ActionTypeEnum.GlMapRegionLift:
      return {
        ...base,
        glMapRegionLift: {
          regionId: "",
          adcode: "",
          name: "",
          height: 1,
          duration: 300
        }
      };

    case ActionTypeEnum.GlMapSceneRoam:
      return {
        ...base,
        glMapSceneRoam: {
          sceneId: ""
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
          component: { prop: PanelEnum.dynamicPanel, width: 0, height: 0, name: "" },
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

    // 仅需 animation.delay 的动作（视频控制、分页、签名板、轮巡等）
    default:
      if (delayOnlyActions.has(actionType)) {
        return { ...base, animation: defaultAnimation() };
      }
      // Default 及未知类型
      return { ...base };
  }
};

/**
 * 生成默认完整 Action 对象
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
        prop: PanelEnum.dynamicPanel,
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
    customActionType: "component",
    panelStatusAnimationId: "",
    panelStatusId: "",
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
    translation: "zh"
  };
};

/**
 * 生成默认条件对象
 */
export const templateConditions = () => {
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
    tempPool: null
  };
};

/**
 * 生成默认事件对象
 */
export const templateEvents = (obj: Partial<Event> & Record<string, unknown>): Event => {
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
