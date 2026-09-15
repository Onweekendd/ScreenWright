<template>
  <div
    class="swiper-container"
    ref="container"
    :style="{
      width: width + 'px',
      height: height + 'px'
    }"
  >
    <div
      :class="{
        'el-carousel-swiper': true,
        'el-carousel__item': true,
        flex: true,
        'flex-center': true,
        'is-active': isActive(index),
        'el-carousel__item--card': props.type === 'card',
        'is-in-stage': isInStage(index),
        specialIndex: isSpecialIndex(index)
      }"
      v-for="(item, index) in imagesList"
      :key="item.id || index"
      :style="getItemStyle(index)"
      :id="`item-${index}`"
      @click="handleItemClick(item, index)"
    >
      <div class="image-content">
        <div v-if="props.type === 'card'" v-show="!isActive(index)" class="el-carousel__mask" />
        <img :src="setMinioUrl(item.value)" draggable="false" :style="getItemImageStyle(item, index)" />
      </div>
      <!-- -->
      <img
        v-if="item.borderImage"
        class="box"
        :src="setMinioUrl(item.borderImage)"
        :style="getBorderImageStyle(item)"
      />
      <!--  -->
      <div
        v-if="item.content && showFront(index)"
        class="name"
        :style="{
          transform: `translate(${item.textTranslateX || 0}px, ${item.textTranslateY || 0}px)`
        }"
      >
        <div :style="getTextBackgroundStyle(item)">
          <span :style="getTextStyle(item)">{{ item.content }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";

import { has } from "lodash-es";

import { setMinioUrl } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";

import type { ImageItem } from "./swiperType";
import { useSwiper } from "./useSwiper";

type directionType = "horizontal" | "vertical";
// 定义 props
interface Props {
  type?: string;
  direction?: directionType;
  element: ComponentType;
  activeIndex: number;
}

const props = withDefaults(defineProps<Props>(), {
  type: "card",
  direction: "horizontal"
});
const container = ref<HTMLDivElement | null>(null);
const {
  height,
  option,
  width,
  imagesList,
  processIndex,
  getBorderImageStyle,
  getTextBackgroundStyle,
  getTextStyle,
  handleClick
} = useSwiper(props.element);

// 存储每个轮播项的样式
const itemStyles = ref<Record<number, CSSProperties>>({});

const isSpecialIndex = (index: number) => {
  const idx = processIndex(index, props.activeIndex, imagesList.value.length);
  return Math.round(Math.abs(idx)) >= 3;
};

const isInStage = (index: number) => {
  const idx = processIndex(index, props.activeIndex, imagesList.value.length);
  return Math.round(Math.abs(idx)) <= 1;
};

const isActive = (index: number) => {
  const idx = processIndex(index, props.activeIndex, imagesList.value.length);
  return idx === 0;
};

const getItemStyle = (index: number): CSSProperties => {
  const length = imagesList.value.length;
  const relativeIndex = processIndex(index, props.activeIndex, length);

  // 主轴尺寸（横向为宽，纵向为高）
  const containerMainSize = props.direction === "vertical" ? height.value || 0 : width.value || 0;

  // 卡片主轴尺寸
  const cardMainSize = containerMainSize * 0.6;
  // 卡片间距
  const gap = cardMainSize * (option.value.showSwiper ? 0.3 : 0.5);

  // 偏移量
  let offset = relativeIndex * gap;

  // 缩放
  let scale = 1;

  if (Math.abs(relativeIndex) === 1) scale = 0.83;
  else if (Math.abs(relativeIndex) === 2) scale = 0.66;
  else if (Math.abs(relativeIndex) >= 3) scale = 0.53;

  // z-index
  const zIndex = 10 - Math.abs(relativeIndex);
  // 超出范围的卡片隐藏
  const visible = Math.abs(relativeIndex) <= (option.value.showSwiper ? 2 : 1);

  // 横向/纵向切换
  const isVertical = props.direction === "vertical";

  let transform = isVertical ? `translateY(${offset}px) scale(${scale})` : `translateX(${offset}px) scale(${scale})`;

  if (has(option.value, "picStyle")) {
    scale = 1;
    offset = 0;
    scale = scale * option.value.picStyle.firstStyle.directionScale;
    offset = offset + option.value.picStyle.firstStyle.directionTranslate;

    if (Math.abs(relativeIndex) === 1) {
      scale = scale * option.value.picStyle.secondStyle.directionScale;
      offset =
        relativeIndex >= 0
          ? offset + option.value.picStyle.secondStyle.directionTranslate
          : offset - option.value.picStyle.secondStyle.directionTranslate;
    } else if (Math.abs(relativeIndex) >= 2) {
      scale = scale * option.value.picStyle.thirdStyle.directionScale;
      offset =
        relativeIndex >= 0
          ? offset + option.value.picStyle.thirdStyle.directionTranslate
          : offset - option.value.picStyle.thirdStyle.directionTranslate;
    }

    transform = isVertical ? `translateY(${offset}px) scaleY(${scale})` : `translateX(${offset}px) scaleX(${scale})`;
  }
  return {
    transform,
    zIndex,
    visibility: visible ? "visible" : "hidden",
    position: "absolute",
    top: isVertical ? "50%" : 0,
    left: isVertical ? 0 : "50%",
    width: isVertical ? "100%" : `${cardMainSize}px`,
    height: isVertical ? `${cardMainSize}px` : "100%",
    transition: "transform 0.3s cubic-bezier(.55,0,.1,1), z-index 0s",
    transformOrigin: "center center",
    marginLeft: isVertical ? 0 : `-${cardMainSize / 2}px`,
    marginTop: isVertical ? `-${cardMainSize / 2}px` : 0
  };
};

const getItemImageStyle = (item: ImageItem, index: number): CSSProperties => {
  let itemImageStyle: CSSProperties = {
    position: "absolute",
    left: "50%",
    top: "50%",
    objectFit: (item.objectFit || option.value.objectFit || "contain") as "contain",
    transform: `translate(-50%, -50%)`,
    width: `100%`,
    height: `100%`
  };

  const length = imagesList.value.length;
  const relativeIndex = processIndex(index, props.activeIndex, length);
  if (has(option.value, "picStyle")) {
    let width = option.value.picStyle.firstStyle.scaleX + "%";
    let height = option.value.picStyle.firstStyle.scaleY + "%";
    let transform = `translate(calc(-50% + ${option.value.picStyle.firstStyle.translateX}px), calc(-50% + ${option.value.picStyle.firstStyle.translateY}px))`;
    if (Math.abs(relativeIndex) === 1) {
      width = option.value.picStyle.secondStyle.scaleX + "%";
      height = option.value.picStyle.secondStyle.scaleY + "%";
      transform = `translate(calc(-50% + ${option.value.picStyle.secondStyle.translateX}px), calc(-50% + ${option.value.picStyle.secondStyle.translateY}px))`;
    } else if (Math.abs(relativeIndex) >= 2) {
      width = option.value.picStyle.thirdStyle.scaleX + "%";
      height = option.value.picStyle.thirdStyle.scaleY + "%";
      transform = `translate(calc(-50% + ${option.value.picStyle.thirdStyle.translateX}px), calc(-50% + ${option.value.picStyle.thirdStyle.translateY}px))`;
    }

    itemImageStyle.width = width;
    itemImageStyle.height = height;
    itemImageStyle.transform = transform;
  }
  return itemImageStyle;
};

const showFront = (index: number) => {
  const length = imagesList.value.length;
  const relativeIndex = processIndex(index, props.activeIndex, length);
  if (Math.abs(relativeIndex) === 0) {
    return option.value.picStyle.firstStyle.showFont;
  } else if (Math.abs(relativeIndex) === 1) {
    return option.value.picStyle.secondStyle.showFont;
  } else if (Math.abs(relativeIndex) === 2) {
    return option.value.picStyle.thirdStyle.showFont;
  } else {
    return false;
  }
};

const handleItemClick = (item: ImageItem, index: number) => {
  handleClick(item, index);
};

// 更新所有轮播项样式
const updateAllItemStyles = () => {
  imagesList.value.forEach((_, index) => {
    itemStyles.value[index] = getItemStyle(index);
  });
};

// 监听 activeIndex 变化
const updateStyles = () => {
  nextTick(() => {
    updateAllItemStyles();
  });
};

// 生命周期钩子
onMounted(async () => {
  await nextTick();
  updateStyles();
});

onUnmounted(() => {});

// 监听 props.activeIndex 变化
watch(() => props.activeIndex, updateStyles);
watch(() => props.direction, updateStyles);
watch(() => height.value, updateStyles);
watch(() => width.value, updateStyles);
</script>

<style lang="scss" scoped>
.swiper-container {
  position: relative;
  overflow: hidden;

  .el-carousel__item {
    // border: 1px solid #000;
    cursor: pointer;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;

    &.is-in-stage {
      z-index: 2;
    }

    &.is-active {
      z-index: 3;
    }

    &.specialIndex {
      z-index: 0;
    }

    &.el-carousel__item--card {
      border-radius: 6px;
      overflow: hidden;
    }

    .image-content {
      position: relative;
      width: 100%;
      height: 100%;
      object-fit: cover;
      .el-carousel__mask {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.3);
        z-index: 1;
      }
      // background-color: red;
    }
    .box {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: -1;
    }

    .name {
      position: absolute;
      top: 80%;
      left: 0;
      width: 100%;
      text-align: center;
      color: #ffffff;
      z-index: 2;
    }
  }
}

// 添加 flex 工具类
.flex {
  display: flex;
}

.flex-center {
  align-items: center;
  justify-content: center;
}
</style>
