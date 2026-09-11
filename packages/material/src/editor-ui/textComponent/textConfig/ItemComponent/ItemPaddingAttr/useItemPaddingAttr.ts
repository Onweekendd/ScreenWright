// 处理 文本样式属性不一致的问题
import { onMounted, ref } from "vue";

import { useUpdateInstance } from "@editor/useUpdateInstance";

import type { PaddingProps } from "./type";

interface Props {
  padding: string;
}

export const useItemPaddingAttr = (
  attrsMap: Props = {
    padding: "padding"
  }
) => {
  const input = ref({ padding: [0, 0, 0, 0] });
  const { selectTargetData, update } = useUpdateInstance();
  const handleConfigPaddingChange = (key: keyof PaddingProps, value: PaddingProps) => {
    console.log("handleConfigTextChange", key, value);
    if (!selectTargetData.value[0].option) {
      return;
    }
    selectTargetData.value[0].option[attrsMap.padding] = value.padding;
    update();
  };

  onMounted(() => {
    if (!selectTargetData.value[0].option) {
      return;
    }
    input.value.padding = selectTargetData.value[0].option[attrsMap.padding];
  });
  return {
    input,
    handleConfigPaddingChange
  };
};
