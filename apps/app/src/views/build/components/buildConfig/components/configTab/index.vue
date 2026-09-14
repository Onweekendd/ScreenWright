<!-- 处理顶部tab切换组件 -->
<template>
  <div class="config-tab flex flex-center-around">
    <div
      :class="{ active: currentActive === item.key }"
      class="config-tab-item flex flex-center"
      v-for="item in tabs"
      :key="item.key"
      @click="handleClick(item.key)"
    >
      <Icon :type="item.icon" :size="size" />
      <div class="title-content flex flex-column flex-justify-center">
        <div class="ch-zh">
          {{ item.title }}
        </div>
        <div class="en">
          {{ item.en }}
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from "vue";

import Icon from "@/components/Icon/index.vue";

import type { echartsTabEnum, GroupTabsEnum, TabProps, TabsEnum } from "../../type";

type configTabEnum = TabsEnum | echartsTabEnum | GroupTabsEnum;

interface Props {
  tabs: TabProps[];
  modelValue: configTabEnum;
  size?: number;
}
// const props = defineProps<Props>()
const props = withDefaults(defineProps<Props>(), {
  size: 18
});
const emits = defineEmits(["update:modelValue", "change"]);
const currentActive = ref(props.modelValue);
const handleClick = (key: configTabEnum) => {
  currentActive.value = key;
  emits("update:modelValue", key);
  emits("change", key);
};
watch(
  () => props.modelValue,
  () => {
    currentActive.value = props.modelValue;
  }
);
</script>
<style lang="scss" scoped>
@import "src/style/theme.scss";
.config-tab {
  display: flex;
  height: 36px;
  color: $sw-text;
  border-radius: 0;
  font-family:
    Source Han Sans CN-Normal,
    Source Han Sans CN;
  font-weight: 400;
  text-align: center;
  border-bottom: 1px solid $sw-border;
  background-color: $sw-title-bg;
  font-size: 12px;
  line-height: 30px;
  margin-bottom: 20px;
  .config-tab-item {
    position: relative;
    flex: 1;
    height: 100%;
    cursor: pointer;
    transition:
      color 0.15s,
      background-color 0.15s;
    .title-content {
      line-height: 8px;
      height: 100%;
      color: $sw-text-dim;
      transition: color 0.15s;
      .en {
        position: relative;
        top: 5px;
        transform: scale(0.6);
        opacity: 0.75;
      }
    }
    .iconfont {
      color: $sw-text-dim;
      transition: color 0.15s;
    }
    &:hover:not(.active) {
      background-color: $sw-hover-bg;
      .title-content {
        color: $sw-text-strong;
      }
      .iconfont {
        color: $sw-text-strong;
      }
    }
    &.active {
      background-color: $sw-active-bg;
      &::after {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 2px;
        background: $sw-active-bar;
      }
      .title-content {
        color: var(--sw-theme-color);
      }
      .iconfont {
        color: var(--sw-theme-color);
      }
    }
  }
}
</style>
