<template>
  <sw-collapse-item title="阴影" v-model="shadowEnabled" showIcon>
    <template #content>
      <ItemTextShadow label="阴影" v-model="shadowInput" @change="handleChange" :labelWidth="secondLabelWidth" />
    </template>
  </sw-collapse-item>
</template>
<script setup lang="ts">
import { computed } from "vue";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { buildShadow, parseShadow } from "@editor/base/atomicCssComposers";
import ItemTextShadow from "@editor/textComponent/textConfig/ItemComponent/ItemTextShadow/index.vue";
import type { ShadowProps } from "@editor/textComponent/textConfig/ItemComponent/ItemTextShadow/type";

import { useUpdateInstance } from "../../../../useUpdateInstance";
import { secondLabelWidth } from "../../textConfig";

const { update, selectTargetData } = useUpdateInstance();
const option = computed(() => selectTargetData.value[0].option as Record<string, any>);

// 阴影由 option.textShadow 是否存在驱动，折叠面板开关等价于新增/删除该字段。
// text-shadow 不支持 inset，直接复用通用的 shadow 解析/合成（insetSupported=false）。
const shadowEnabled = computed({
  get: () => typeof option.value.textShadow === "string" && option.value.textShadow.length > 0,
  set: (val: boolean) => {
    option.value.textShadow = val ? buildShadow(parseShadow(option.value.textShadow), false) : undefined;
    update();
  }
});
const shadowInput = computed<ShadowProps>({
  get: () => {
    const parts = parseShadow(option.value.textShadow);
    return { color: parts.color, x: parts.x, y: parts.y, blur: parts.blur };
  },
  set: (val) => (option.value.textShadow = buildShadow({ ...parseShadow(option.value.textShadow), ...val }, false))
});
const handleChange = () => update();
</script>
