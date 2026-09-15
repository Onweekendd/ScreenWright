<template>
  <div class="swiper-container" ref="container">
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
      <div v-if="props.type === 'card'" v-show="!isActive(index)" class="el-carousel__mask" />
      <img
        v-if="item.borderImage"
        class="box"
        :src="setMinioUrl(item.borderImage)"
        :style="getBorderImageStyle(item)"
      />
      <img :src="setMinioUrl(item.value)" draggable="false" :style="getImageStyle(item)" />
      <span v-if="item.content" class="name" :style="getTextStyle(item)">
        {{ item.content }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";

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
const { height, width, imagesList, processIndex, getBorderImageStyle, getImageStyle, getTextStyle, handleClick } =
  useSwiper(props.element);

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
  const containerMainSize =
    props.direction === "vertical" ? container.value?.offsetHeight || 0 : container.value?.offsetWidth || 0;

  // 卡片主轴尺寸
  const cardMainSize = containerMainSize * 0.6;
  // 卡片间距
  const gap = cardMainSize * 0.3;

  // 偏移量
  const offset = relativeIndex * gap;

  // 缩放
  let scale = 1;
  if (Math.abs(relativeIndex) === 1) scale = 0.9;
  else if (Math.abs(relativeIndex) === 2) scale = 0.76;
  else if (Math.abs(relativeIndex) >= 3) scale = 0.62;

  // z-index
  const zIndex = 10 - Math.abs(relativeIndex);
  // 超出范围的卡片隐藏
  const visible = Math.abs(relativeIndex) <= 2;

  // 横向/纵向切换
  const isVertical = props.direction === "vertical";
  const transform = isVertical ? `translateY(${offset}px) scale(${scale})` : `translateX(${offset}px) scale(${scale})`;

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
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;

  .el-carousel-swiper {
    position: relative;
    width: 100%;
    height: 100%;

    .el-carousel__item {
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
    }

    .el-carousel__mask {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.3);
      z-index: 1;
    }

    .box {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: -1;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .name {
      position: absolute;
      bottom: 10%;
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
