<template>
  <el-form-item :label="props.label" :label-width="props.labelWidth" :title="props.label">
    <div class="flex alignList" :style="{ marginLeft: props.marginLeft }">
      <div
        :class="getItemClass(index)"
        v-for="(item, index) in alignList"
        :key="index"
        :title="item.label || ''"
        @click="select(item.value, index)"
      >
        <Icon :type="item.icon" :class="index == activeIndex ? 'icon_active' : ''" v-if="type !== 'custom'" />
        <span v-else :class="index == activeIndex ? 'icon_active' : ''">{{ item.label }}</span>
      </div>
    </div>
  </el-form-item>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useVModel } from "@vueuse/core";

import Icon from "@editor/base/Icon/index.vue";

import type { ItemSelectAlignProps } from "./ItemSelectAlign";
import { typeAttrs } from "./ItemSelectAlign";

const props = withDefaults(defineProps<ItemSelectAlignProps>(), {
  label: "对齐方式",
  type: typeAttrs.default,
  labelWidth: "73",
  marginLeft: "0px"
});

const emit = defineEmits(["update:modelValue", "change"]);
const model = useVModel(props, "modelValue", emit);

const alignType = {
  [typeAttrs.component]: [
    { label: "左对齐", value: "left", icon: "iconfont-jurassic_horizalign-left" },
    { label: "水平居中", value: "x_center", icon: "iconfont-jurassic_horizalign-center" },
    { label: "右对齐", value: "right", icon: "iconfont-jurassic_horizalign-right" },
    { label: "上对齐", value: "top", icon: "iconfont-jurassic_verticalalign-top" },
    { label: "垂直居中", value: "y_center", icon: "iconfont-jurassic_verticalalign-center" },
    { label: "下对齐", value: "bottom", icon: "iconfont-jurassic_verticalalign-bottom" }
  ],
  [typeAttrs.layout]: [
    { label: "横向分布", value: "x_layout", icon: "iconfont-jurassic_HorCenter-fenbu" },
    { label: "纵向分布", value: "y_layout", icon: "iconfont-jurassic_VerCenter-fenbu" }
  ],
  [typeAttrs.size]: [
    { label: "等高", value: "equal_height", icon: "iconfont-denggao" },
    { label: "等宽", value: "equal_width", icon: "iconfont-dengdaxiao" },
    { label: "等尺寸", value: "equal_size", icon: "iconfont-dengkuan" }
  ],
  [typeAttrs.default]: [
    { label: "左对齐", value: "left", icon: "iconfont-zuoduiqi1" },
    { label: "水平居中", value: "center", icon: "iconfont-juzhongduiqi" },
    { label: "右对齐", value: "right", icon: "iconfont-youduiqi1" },
    { label: "左右对齐", value: "justify", icon: "iconfont-zuoyouduiqi" }
  ],
  [typeAttrs.vertical]: [
    { label: "上对齐", value: "top", icon: "iconfont-dingduanduiqi" },
    { label: "垂直居中", value: "center", icon: "iconfont-chuizhiduiqi" },
    { label: "下对齐", value: "bottom", icon: "iconfont-diduanduiqi" }
  ],
  [typeAttrs.flex]: [
    { label: "左对齐", value: "flex-start", icon: "iconfont-zuoduiqi1" },
    { label: "水平居中", value: "center", icon: "iconfont-juzhongduiqi" },
    { label: "右对齐", value: "flex-end", icon: "iconfont-youduiqi1" }
  ],
  [typeAttrs.verticalWithMiddle]: [
    { label: "上对齐", value: "top", icon: "iconfont-dingduanduiqi" },
    { label: "垂直居中", value: "middle", icon: "iconfont-chuizhiduiqi" },
    { label: "下对齐", value: "bottom", icon: "iconfont-diduanduiqi" }
  ],
  [typeAttrs.defaultWithThree]: [
    { label: "左对齐", value: "left", icon: "iconfont-zuoduiqi1" },
    { label: "水平居中", value: "center", icon: "iconfont-juzhongduiqi" },
    { label: "右对齐", value: "right", icon: "iconfont-youduiqi1" }
  ]
};
const alignList = computed(() => {
  if (props.type === "custom") {
    return props.customOptions || [];
  }
  return alignType[props.type];
});
const activeIndex = ref(0);

const getItemClass = (index: number) => {
  return activeIndex.value === index ? "alignItem_active" : "alignItem";
};

const select = (value: string, index: number) => {
  activeIndex.value = index;
  model.value = value;
  emit("change", value);
};

onMounted(() => {
  activeIndex.value = alignList.value.findIndex((item) => item.value === model.value);
});
</script>

<style lang="scss" scoped>
// 定义公共变量
$bg-color: #1a1e27;
$border-radius: 0px;
$item-height: 25px;
$inactive-border-color: #353745;
$active-gradient-start: var(--sw-theme-color);
$active-gradient-end: var(--sw-theme-color);
$font-size: 14px;

// 定义公共的混合样式
@mixin align-item-base {
  height: $item-height;
  background: $bg-color;
  border-radius: $border-radius;
  opacity: 1;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $font-size;
}

.alignList {
  width: 100%;
  height: $item-height;

  .alignItem {
    @include align-item-base;
    border: 1px solid $inactive-border-color;
    cursor: pointer;
    color: #b4b7c1;
  }

  .alignItem_active,
  .alignItem:hover {
    @include align-item-base;
    border: 1px solid;
    border-image: linear-gradient(180deg, $active-gradient-start, $active-gradient-end) 1 1;
  }

  i {
    font-size: $font-size !important;
  }

  .icon_active {
    color: $active-gradient-end;
  }
}
</style>
