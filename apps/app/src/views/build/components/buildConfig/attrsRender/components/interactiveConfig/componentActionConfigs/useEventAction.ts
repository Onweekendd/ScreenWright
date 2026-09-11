import type { Ref } from "vue";
import { computed } from "vue";

import { isArray } from "lodash-es";

import { templateActions } from "@/views/build/components/buildConfig/attrsRender/components/interactiveConfig/options";
import { useUpdateInstance } from "@/views/build/components/buildConfig/useUpdateInstance";

const useEventAction = (eventId: Ref<string>, actionId: Ref<string>) => {
  const { selectTargetData, update } = useUpdateInstance();

  const event = computed(() => {
    if (!("events" in selectTargetData.value[0])) return [];
    return selectTargetData.value[0]?.events?.find((item: any) => item.id === eventId);
  });

  const action = computed(() => {
    if (isArray(event.value)) return templateActions();
    return event.value?.actions.find((item: any) => item.id === actionId.value) ?? templateActions();
  });

  return {
    event,
    selectTargetData,
    action,
    update
  };
};

export { useEventAction };
