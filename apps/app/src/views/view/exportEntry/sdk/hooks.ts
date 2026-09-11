/**
 * Hooks 实际实现导出
 *
 * 这个文件会被 lib 打包，包含真正的 hooks 实现
 */
import { useCallbackArguments } from "@/hooks/callbackArguments/useCallbackArguments";
import { useEncodeEvent } from "@/hooks/encodeHanding/useEncodeEvent";
import { useActionEvent } from "@/hooks/eventHandling/useActionEvent";
import { useEventCallbacks } from "@/hooks/eventHandling/useEventCallbacks";
import { useEventHandling } from "@/hooks/eventHandling/useEventHandling";
import { useEvent } from "@/hooks/useEvent";
import { useCreateComponent } from "@/views/build/components/agentBI/hooks/useCreateComponent";
import { EventTypeEnum } from "@/views/build/components/buildConfig/constants";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";
import { useGlobalAnimation } from "@/views/build/components/buildRender/hooks/useGlobalAnimation";
import * as CoreType from "@/views/build/components/buildRender/type";
import { useDataFilter } from "@/views/build/useDataFilter";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";
import { useInitLargeScreenData } from "@/views/build/useInitLargeScreenData";
import { useLargeScreenInfo } from "@/views/build/useLargeScreenInfo";
import { useEncodeCommunication } from "@/views/view/useEncodeCommunication";

export const sdk = {
  useInitLargeScreenData,
  useEditStore,
  useGlobalAnimation,
  useDataFilter,
  useGlobalComponentData,
  useLargeScreenInfo,
  useActionEvent,
  useEventHandling,
  useEventCallbacks,
  useEvent,
  useCallbackArguments,
  useEncodeEvent,
  useEncodeCommunication,
  useCreateComponent,
  EventTypeEnum,
  CoreType
};

export const screenwright = { sdk };

export type ScreenwrightSdk = typeof sdk;
export type ScreenwrightSdkInstance = typeof screenwright;
