import type { Component } from "vue";

import { ActionTypeEnum } from "../../../../constants/action";
import ActionMoving from "./actions/ActionMoving.vue";
import ActionNextPage from "./actions/ActionNextPage.vue";
import ActionPrevPage from "./actions/ActionPrevPage.vue";
import ActionScaling from "./actions/ActionScaling.vue";
import AnimationPlayback from "./actions/AnimationPlayback.vue";
import ApiInstruction from "./actions/ApiInstruction.vue";
import FocusLayer from "./actions/FocusLayer.vue";
import FollowIcon from "./actions/FollowIcon.vue";
import GlMapIconActive from "./actions/GlMapIconActive.vue";
import GlMapRegionLift from "./actions/GlMapRegionLift.vue";
import GlMapSceneRoam from "./actions/GlMapSceneRoam.vue";
import HandleSceneObjExplosion from "./actions/HandleSceneObjExplosion.vue";
import ProjectFunction from "./actions/ProjectFunction.vue";
import SendAIManMsg from "./actions/SendAIManMsg.vue";
import SendUE4Msg from "./actions/SendUE4Msg.vue";
import SetDelay from "./actions/SetDelay.vue";
import SetIndex from "./actions/SetIndex.vue";
import SetStateAnimation from "./actions/SetStateAnimation.vue";
import ShowHide from "./actions/Show&Hide.vue";
import SwiperCardChangeIndexPage from "./actions/SwiperCardChangeIndexPage.vue";
import SwitchMapChildComponent from "./actions/SwitchMapChildComponent.vue";
import SwitchSceneChildComponent from "./actions/SwitchSceneChildComponent.vue";
import SwitchSceneLevel from "./actions/SwitchSceneLevel.vue";
import SwitchSceneObject from "./actions/SwitchSceneObject.vue";
import SwitchSceneRoam from "./actions/SwitchSceneRoam.vue";
import SwitchSceneStatus from "./actions/SwitchSceneStatus.vue";
import SwitchState from "./actions/SwitchState.vue";
import UpdateConfig from "./actions/UpdateConfig.vue";
import VideoAction from "./actions/VideoAction.vue";
import VideoToFastin from "./actions/VideoToFastin.vue";
import VideoToPlayRange from "./actions/VideoToPlayRange.vue";
import VideoToRewind from "./actions/VideoToRewind.vue";
import VideoToSwitch from "./actions/VideoToSwitch.vue";

// Simple mapping of action types to components
export const actionComponentMap: Record<string, Component> = {
  [ActionTypeEnum.Show]: ShowHide,
  [ActionTypeEnum.Hide]: ShowHide,
  [ActionTypeEnum.ShowHide]: ShowHide,
  [ActionTypeEnum.SendUe4Msg]: SendUE4Msg,
  [ActionTypeEnum.SendUe4MsgStatic]: SendUE4Msg,
  [ActionTypeEnum.SendAIManMsgStatic]: SendAIManMsg,
  [ActionTypeEnum.SwitchSceneStatus]: SwitchSceneStatus,
  [ActionTypeEnum.SwitchSceneRoam]: SwitchSceneRoam,
  [ActionTypeEnum.SwitchSceneLevel]: SwitchSceneLevel,
  [ActionTypeEnum.SwitchState]: SwitchState,
  [ActionTypeEnum.SetStateAnimationPlay]: SetStateAnimation,
  [ActionTypeEnum.SwitchSceneObjVisible]: SwitchSceneObject,
  [ActionTypeEnum.HandleSceneObjExplosion]: HandleSceneObjExplosion,
  [ActionTypeEnum.HandleApiInstruction]: ApiInstruction,
  [ActionTypeEnum.SetAnimationPlay]: AnimationPlayback,
  [ActionTypeEnum.SetAnimationPause]: AnimationPlayback,
  [ActionTypeEnum.FocusLayer]: FocusLayer,
  [ActionTypeEnum.FollowIcon]: FollowIcon,
  [ActionTypeEnum.ProjectSpecificFun]: ProjectFunction,
  [ActionTypeEnum.VideoToPlayRange]: VideoToPlayRange,
  [ActionTypeEnum.VideoToSwitch]: VideoToSwitch,
  // 视频控制相关动作
  [ActionTypeEnum.VideoToPlay]: VideoAction,
  [ActionTypeEnum.VideoToPause]: VideoAction,
  [ActionTypeEnum.VideoToStop]: VideoAction,
  [ActionTypeEnum.VideoToRestart]: VideoAction,
  [ActionTypeEnum.VideoToUnmuted]: VideoAction,
  [ActionTypeEnum.VideoToMuted]: VideoAction,
  [ActionTypeEnum.VideoToAudioUp]: VideoAction,
  [ActionTypeEnum.VideoToAudioDown]: VideoAction,
  [ActionTypeEnum.VideoToFastin]: VideoToFastin,
  [ActionTypeEnum.VideoToRewind]: VideoToRewind,

  [ActionTypeEnum.SwitchSceneChildComponentVisible]: SwitchSceneChildComponent,
  [ActionTypeEnum.SwitchMapChildComponentVisible]: SwitchMapChildComponent,
  [ActionTypeEnum.GlMapRegionLift]: GlMapRegionLift,
  [ActionTypeEnum.GlMapSceneRoam]: GlMapSceneRoam,
  [ActionTypeEnum.GlMapIconActive]: GlMapIconActive,
  [ActionTypeEnum.Moving]: ActionMoving,
  [ActionTypeEnum.Scaling]: ActionScaling,
  [ActionTypeEnum.ScalingHide]: ActionScaling,
  [ActionTypeEnum.SetIndex]: SetIndex,
  [ActionTypeEnum.UpdateConfig]: UpdateConfig,
  [ActionTypeEnum.prevPage]: ActionPrevPage,
  [ActionTypeEnum.nextPage]: ActionNextPage,
  [ActionTypeEnum.SwiperCardChangeIndex]: SwiperCardChangeIndexPage,

  [ActionTypeEnum.TurnOnPatrol]: SetDelay,
  [ActionTypeEnum.PausePatrol]: SetDelay,

  [ActionTypeEnum.RestartPatrol]: SetDelay,
  [ActionTypeEnum.toPrevStatus]: SetDelay,
  [ActionTypeEnum.toNextStatus]: SetDelay,
  [ActionTypeEnum.PauseScroll]: SetDelay,
  [ActionTypeEnum.StartScroll]: SetDelay
};

/**
 * Get the appropriate component for a given action type
 * @param action The action type string
 * @returns The component to render for this action type, or null if not found
 */
export const getActionComponent = (action: string): Component | null => {
  for (const [key, component] of Object.entries(actionComponentMap)) {
    if (action.includes(key)) {
      return component;
    }
  }
  return null;
};
