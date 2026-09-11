import type { SetupContext } from "vue";
import { useVModel } from "@vueuse/core";

import type { configEncodeControlEmits, configEncodeControlProps } from "./configEncodeControl";

export const useConfigEncodeControl = (
  props: configEncodeControlProps,
  emit: SetupContext<configEncodeControlEmits>["emit"]
) => {
  const controlWebsocketUrl = useVModel(props, "controlWebsocketUrl", emit);
  const heartbeatInterval = useVModel(props, "heartbeatInterval", emit);
  const changeHeartbeatInterval = () => {
    emit("change", "heartbeatInterval", heartbeatInterval.value);
  };
  return {
    controlWebsocketUrl,
    heartbeatInterval,
    changeHeartbeatInterval
  };
};
