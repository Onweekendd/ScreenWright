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
.config-tab {
  height: 36px;
  color: #ffffff;
  border-radius: 0;
  font-family:
    Source Han Sans CN-Normal,
    Source Han Sans CN;
  font-weight: 400;
  text-align: center;
  border-left: 1px solid #000;
  border-right: 1px solid #000;
  background-color: rgb(55, 58, 71);
  font-size: 12px;
  line-height: 30px;
  margin-bottom: 20px;
  .config-tab-item {
    width: 100%;
    height: 100%;
    cursor: pointer;
    .title-content {
      line-height: 8px;
      height: 100%;
      color: #b4b7c1;
      .en {
        position: relative;
        top: 5px;
        transform: scale(0.6);
      }
    }
    .iconfont {
      color: #b4b7c1;
    }
    &.active {
      color: #ffffff;
      background-image: linear-gradient(180deg, #8b58e7 0%, #642cff 100%);
      .title-content {
        color: #ffffff;
      }
      .iconfont {
        color: #ffffff;
      }
    }
  }
}
</style>
