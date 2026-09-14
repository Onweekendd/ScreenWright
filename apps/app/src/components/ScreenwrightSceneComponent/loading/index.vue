<template>
  <transition name="animation">
    <div
      class="loading-mask"
      id="screenwright-loading-mask"
      v-if="loadingScene"
      :style="{ background, zIndex }"
      :data-progress="loadingProgress"
    >
      <div class="loading-mask-scene">
        <div class="loading-mask-scene-detail flex flex-center flex-column">
          <video :src="loadingMaskScene" autoplay loop muted />
          <div class="loading-progress">
            <div class="loading-progress-inner">
              <div class="loading-progress-box">
                <div
                  class="loading-progress-detail"
                  :style="`transform:translate(${-160 + 160 * loadingProgress}px)`"
                />
              </div>
            </div>
            <!-- <div class="loading-progress-text 优设标题黑">{{ Number(progress * 100).toFixed() }}%</div> -->
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

import { debounce } from "lodash-es";

import loadingMaskScene from "@/assets/video/loading/loading-mask-scene.webm?url";
import { useGlobalLoading } from "@/hooks/useGlobalLoading";

const { loadingScene, hideLoading, loadingProgress } = useGlobalLoading();

// const text = ref("拼命加载中...")
const background = ref("rgba(0, 0, 0, 0.5)");
// const spinner = ref("el-icon-loading")
// const type = ref("normal")
const zIndex = ref(9999);
// const progress = ref(0)

const setDelay = () => {
  hideLoading("scene");
};
const setDelayDebounced = debounce(setDelay, 500);

watch(loadingProgress, (val) => {
  if (val >= 1) setDelayDebounced();
});
</script>

<style lang="scss" scoped>
.loading-mask {
  width: 100%;
  height: 100%;
  font-size: 16px;
  color: var(--sw-theme-color);
  position: fixed;
  top: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  // 2023/09/01 三维状态新增后遮罩层级被遮挡 暂先提高zIndex
  z-index: 9999;
  //   .loading-mask-inner {
  //     text-align: center;
  //     width: 100%;
  //     height: 100%;
  //     background-image: url("~@/assets/image/loading/loading.png");
  //     background-size: 40px 40px;
  //     background-repeat: no-repeat;
  //     background-position: center;
  //     .loading-icon {
  //       animation: rotating 2s linear infinite;
  //     }
  //     .loading-text {
  //       margin: 3px 0;
  //     }
  //   }
  .loading-mask-scene {
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    &-detail {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      video {
        width: 200px;
        height: 200px;
      }
      .loading-progress {
        margin-top: 8px;
        &-inner {
          overflow: hidden;
          width: 176px;
          height: 16px;
          border-radius: 8px;
          background-image: url("@/assets/image/loading/progress-bottom.png");
          background-repeat: no-repeat;
          background-position: center;
          .loading-progress-box {
            width: 168px;
            height: 8px;
            border-radius: 8px;
            overflow: hidden;
            margin: 4px;
            .loading-progress-detail {
              width: 100%;
              height: 100%;
              background-image: url("@/assets/image/loading/progress.png");
              background-repeat: no-repeat;
              background-position: center;
              transform-origin: right;
            }
          }
        }
      }
    }
  }
}
.animation-enter,
.animation-leave-to {
  opacity: 0;
}
.animation-enter-active,
.animation-leave-active {
  transition: opacity 0.3s;
}
@keyframes rotating {
  0% {
    -webkit-transform: rotateZ(0);
    transform: rotateZ(0);
  }
  100% {
    -webkit-transform: rotateZ(360deg);
    transform: rotateZ(360deg);
  }
}
</style>
