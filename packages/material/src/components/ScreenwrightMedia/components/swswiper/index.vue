<template>
  <div class="ft-swiper" :style="styleSizeName" ref="ftSwiper">
    <div class="swiper-container" @mouseenter="isHover = true" @mouseleave="isHover = false">
      <div v-if="arrowDisplay" class="btn top" :style="arrowTopStyle" @click.stop="onSwiperAction('pre')">
        <Icon type="ArrowLeft" v-if="!option.arrowImg" size="30" />
      </div>

      <div v-if="arrowDisplay" class="btn bottom" :style="arrowBottomStyle" @click.stop="onSwiperAction('next')">
        <Icon type="ArrowLeft" v-if="!option.arrowImg" size="30" />
      </div>
      <!-- 
      -->
      <el-carousel
        v-if="!refreshing"
        ref="swiperRef"
        :type="type"
        :indicator-position="indicator"
        :interval="interval"
        :height="`${height}`"
        :direction="direction"
        :autoplay="autoplay"
        :arrow="arrow"
        @change="onChangeSwiper"
      >
        <template v-if="option.showSwiper && option.type === 'card'">
          <el-carousel-item v-for="(item, index) in imagesList" :key="item.id || index" />
          <swiperComponent :element="element" :activeIndex="activeIndex" :direction="direction" :type="type" />
        </template>
        <template v-else>
          <el-carousel-item
            v-for="(item, index) in imagesList"
            :key="item.id || index"
            @click="handleClick(item, index)"
          >
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
          </el-carousel-item>
        </template>
      </el-carousel>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";

import Icon from "@editor/base/Icon/index.vue";
import { setMinioUrl } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";

import swiperComponent from "./swiper.vue";
import { useSwiper } from "./useSwiper";

interface Props {
  element: ComponentType;
}

const props = defineProps<Props>();

const {
  isHover,
  styleSizeName,
  arrowTopStyle,
  arrowBottomStyle,
  arrowDisplay,
  option,
  height,
  imagesList,
  getBorderImageStyle,
  getImageStyle,
  getTextStyle,
  handleClick
} = useSwiper(props.element);

const refreshing = ref(false);
const ftSwiper = ref<HTMLElement | null>(null);
const swiperRef = ref();
const activeIndex = ref(0);

const indicator = computed(() => option.value.indicator || "none");
const type = computed(() => option.value.type || "");
const interval = computed(() => option.value.interval || 5000);
const direction = computed(() => option.value.direction || "horizontal");
const autoplay = computed(() => Boolean(option.value.autoplay));
const arrow = computed(() => option.value.arrow || "hover");
const arrowImg = computed(() => (option.value.arrowImg ? `url(${setMinioUrl(option.value.arrowImg)})` : ""));
// const isRotate = computed(() => (option.value.isRotate && option.value.arrowImg ? "rotate(180deg)" : "rotate(0deg)"))
// const rotateRight = computed(() => (option.value.isRotate && option.value.arrowImg ? "rotate(0deg)" : "rotate(180deg)"))
const isRotate = computed(() => {
  if (option.value.arrowImg) {
    return option.value.isRotate ? "rotate(180deg)" : "rotate(0deg)";
  } else {
    return "rotate(0deg) translate(0, -50%)";
  }
});

const rotateTop = computed(() => {
  return option.value.isRotate ? "rotate(-90deg)" : "rotate(90deg)";
});

const rotateBottom = computed(() => {
  return option.value.isRotate ? "rotate(90deg)" : "rotate(-90deg)";
});
const rotateRight = computed(() => {
  if (option.value.arrowImg) {
    return option.value.isRotate ? "rotate(0deg)" : "rotate(180deg)";
  } else {
    return "rotate(0deg) translate(0, -50%)";
  }
});
const arrowIcon = computed(() => (option.value.arrowImg ? "none" : "block"));
const opacity = computed(() => option.value.opacity || 1);
const secondOpacity = computed(() => option.value.secondOpacity || 1);
const thirdOpacity = computed(() => option.value.thirdOpacity || 1);

const onChangeSwiper = async () => {
  await nextTick();
  activeIndex.value = swiperRef.value && swiperRef.value.activeIndex;
};

const onSwiperAction = async (type: string) => {
  await nextTick();
  console.log("type===>", type);
  switch (type) {
    case "pre":
      swiperRef.value.prev();
      break;
    case "next":
      swiperRef.value.next();
      break;
  }
  activeIndex.value = swiperRef.value.activeIndex;
};

watch(
  () => option.value,
  () => {
    refreshing.value = true;
    setTimeout(() => {
      refreshing.value = false;
    }, 200);
  },
  { deep: true }
);

watch(
  () => arrowDisplay.value,
  () => {
    console.log(
      "arrowDisplay.value==>",
      arrowDisplay.value,
      option.value.direction === "vertical",
      option.value.arrow,
      isHover.value
    );
  },
  {
    immediate: true
  }
);
</script>

<style lang="scss" scoped>
.ft-swiper {
  --arrowImg: v-bind("arrowImg");
  --rotate: v-bind("isRotate");
  --rotateRight: v-bind("rotateRight");
  --rotateTop: v-bind("rotateTop");
  --rotateBottom: v-bind("rotateBottom");
  --arrowIcon: v-bind("arrowIcon");
  --opacity: v-bind("opacity");
  --secondOpacity: v-bind("secondOpacity");
  --thirdOpacity: v-bind("thirdOpacity");

  .swiper-container {
    height: 100%;
    width: 100%;
  }

  img {
    width: 100%;
    height: 100%;
  }

  .name {
    position: absolute;
    left: 0;
    bottom: 10%;
    width: 100%;
    color: #ffffff;
    text-align: center;
  }

  .box {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
  }

  .btn {
    background-image: var(--arrowImg);
    background-size: 100% 100%;
    width: 30px;
    height: 30px;
    border-radius: 30px;
    &.top {
      transform: var(--rotateTop);
    }
    &.bottom {
      transform: var(--rotateBottom);
    }
    > :deep(.el-icon) {
      display: var(--arrowIcon);
    }
  }

  :deep {
    .el-carousel {
      position: relative;
      height: 100%;
      width: 100%;
      .el-carousel__indicators.el-carousel__indicators--horizontal {
        position: absolute;
        bottom: 10px;
        left: 50%;
        transform: translate(-50%, 0);
      }

      .el-carousel__arrow {
        background-image: var(--arrowImg);
        background-size: 100% 100%;
        background-repeat: no-repeat;
        transform: var(--rotate);
        .el-icon {
          display: var(--arrowIcon);
        }
      }

      .el-carousel__arrow--right {
        transform: var(--rotateRight);
      }

      .el-carousel__container {
        height: 100%;
        z-index: 0;

        .el-carousel__item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          opacity: var(--thirdOpacity);

          &.is-in-stage {
            opacity: var(--secondOpacity);

            &.is-active {
              opacity: var(--opacity);
            }
          }
        }
      }
    }

    .el-carousel__mask {
      background-color: transparent !important;
    }
  }
}
</style>
