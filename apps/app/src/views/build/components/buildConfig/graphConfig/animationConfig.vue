<template>
  <div class="animation-option">
    <div class="create-animation" @click="handleCreateAnimation">创建动画</div>
    <el-form-item label="加载动画" :label-width="80">
      <el-select
        :model-value="getActiveLoadAnimation()?.animationId || 'none'"
        popper-class="sw-select-dropdown"
        style="width: 100%"
        @change="onSelectLoadAnimation"
        :key="debouncedKey"
      >
        <el-option
          v-for="item in option"
          :key="item.value"
          :label="item.label === '' ? ' ' : item.label"
          :value="item.value"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="卸载动画" :label-width="80">
      <el-select
        :model-value="getActiveUnloadAnimation()?.animationId || 'none'"
        popper-class="sw-select-dropdown"
        style="width: 100%"
        @change="onSelectUnloadAnimation"
        :key="debouncedKey"
      >
        <el-option
          v-for="item in option"
          :key="item.value"
          :label="item.label === '' ? ' ' : item.label"
          :value="item.value"
        />
      </el-select>
    </el-form-item>
    <StatusAnimationTrigger />
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch } from "vue";

import { debounce } from "lodash-es";

import { useCustomAnimation } from "../attrsRender/components/customAnimation/useCustomAnimation";
import { getAnimationWithPanIdAndStatusId } from "../attrsRender/components/customAnimation/util";
import { useStatusAnimationData } from "../attrsRender/components/statusAnimation/useStatusAnimationData";
import StatusAnimationTrigger from "./statusAnimationTrigger.vue";

const { showCustomAnimation, activeAnimationList, animationList, onActiveAnimationChange, editorHeight } =
  useCustomAnimation();
const { editorHeight: statusEditorHeight } = useStatusAnimationData();

// 防抖的 key 生成
const debouncedKey = ref(`${editorHeight.value}-${statusEditorHeight.value}`);

// 防抖更新 key 的函数
const updateKey = debounce(() => {
  debouncedKey.value = `${editorHeight.value}-${statusEditorHeight.value}`;
}, 300);

// 监听高度变化并防抖更新 key
watch([editorHeight, statusEditorHeight], updateKey, { immediate: true });

const props = withDefaults(
  defineProps<{
    panelId?: number;
    activeStatusId?: string;
  }>(),
  {
    panelId: undefined,
    activeStatusId: undefined
  }
);

const handleCreateAnimation = () => {
  showCustomAnimation.value = true;
};

const onSelectLoadAnimation = (id: string) => {
  onActiveAnimationChange({
    panelId: props.panelId,
    statusId: props.activeStatusId,
    animationId: id,
    type: "load"
  });
};

const currentAnimationList = computed(() => {
  return getAnimationWithPanIdAndStatusId({
    data: animationList.value,
    panelId: props.panelId,
    statusId: props.activeStatusId
  });
});

const currentActiveAnimationList = computed(() => {
  return getAnimationWithPanIdAndStatusId({
    data: activeAnimationList.value,
    panelId: props.panelId,
    statusId: props.activeStatusId
  });
});

const getActiveLoadAnimation = () => {
  return currentActiveAnimationList.value.find((item) => item.type === "load");
};

const getActiveUnloadAnimation = () => {
  return currentActiveAnimationList.value.find((item) => item.type === "unload");
};

const onSelectUnloadAnimation = (id: string) => {
  onActiveAnimationChange({
    panelId: props.panelId,
    statusId: props.activeStatusId,
    animationId: id,
    type: "unload"
  });
};

const option = computed(() => {
  return [{ name: "无", id: "none" }, ...currentAnimationList.value].map((v) => ({
    label: v.name === "" ? " " : v.name,
    value: v.id
  }));
});
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

.animation-option {
  width: calc(100% - 20px);
  height: calc(100% - 60px);
  padding: 10px 10px;
  background-color: #232630;
  .create-animation {
    cursor: pointer;
    width: fit-content;
    padding: 5px 10px;
    border-radius: 3px;
    margin-bottom: 10px;
    background-color: #383b49;
    font-size: 12px;
    &:hover {
      color: #ffffff;
      background-image: linear-gradient(180deg, #8b58e7 0%, #642cff 100%);
    }
  }
}
</style>
