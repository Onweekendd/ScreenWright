<template>
  <div class="bi-view" :style="overFlowStyle">
    <div
      class="loading-mask-scene"
      style="width: 100%; height: 100%; background-color: #232630"
      v-if="loadingScreenData"
    />

    <div
      class="view-wrapper"
      :style="{
        ...wrapperStyle,
        ...wrapperBgStyle
      }"
      v-else-if="isInitLoad"
    >
      <buildRender :editConfig="editConfig" v-model="componentList" disabled />
    </div>

    <!-- 非加载情况 需要密码 -->
    <div class="release-mark flex flex-column flex-center" v-else>
      <div class="fs-12">已打开密码保护，请输入密码</div>
      <div class="pas-container">
        <el-input
          type="password"
          v-model="config.password"
          autocomplete="off"
          show-password
          @keyup.enter="verifyPassword"
        />
        <span class="btn" @click.stop="verifyPassword()">确定</span>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted } from "vue";

import buildRender from "@/views/build/components/buildRender/index.vue";

import { useVideoProgress } from "../view/useVideoProgress";
import { useShareScreen } from "./useShareScreen";
// 使用分享屏幕组合式函数获取所有业务逻辑
const {
  componentList,
  loadingScreenData,
  editConfig,
  wrapperStyle,
  wrapperBgStyle,
  config,
  isInitLoad,
  overFlowStyle,
  verifyPassword,
  init
} = useShareScreen();
const { initVideoProgressControl } = useVideoProgress();
// 生命周期处理
onMounted(async () => {
  await init();
  initVideoProgressControl(componentList.value);
});
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
.loading-mask-scene {
  width: 100%;
  height: 100%;
}
.bi-view {
  position: relative;
  width: 100%;
  height: 100%;

  &::-webkit-scrollbar {
    border-radius: 5px;
    background-color: #2d2d2d !important;
    // width: 10px !important;
    // height: 10px !important;
  }
  .view-wrapper {
    overflow: hidden !important;
    position: relative;
  }
}
.release-mark {
  width: 100%;
  height: 100%;
  color: #ffffff;
  text-align: left;
  background-color: #181a24;
  @include common-element-style(".el-input__wrapper", true, true);

  & > div {
    width: 370px;
    margin: 5px 0;

    span.btn {
      cursor: pointer;
      padding: 7px 20px;
      background: -webkit-gradient(linear, left top, left bottom, from(#8b58e7), to(#642cff));
      background: linear-gradient(180deg, #8b58e7, #642cff);
      border-radius: 5px;
      font-size: 12px;
    }
  }

  .el-input {
    width: 300px;
    height: 30px;
    margin-right: 5px;
    background-color: #2a2a2a !important;
    color: #ffffff !important;

    border-radius: 4px !important;
  }

  .el-input__wrapper {
    height: 30px !important;
    line-height: 30px !important;
    background-color: #2a2a2a !important;
    color: #ffffff !important;
    border-color: #444 !important;
    box-shadow: 0 0 0 1px #444 inset !important; // Element Plus 使用 box-shadow 而不是 border
    border-radius: 4px !important;
    box-sizing: border-box;
    transition: all 0.2s;
  }

  // 悬停状态
  .el-input__wrapper:hover {
    border-color: #8b58e7 !important;
    box-shadow: 0 0 0 1px #8b58e7 inset !important;
  }

  // 选中/聚焦状态
  .el-input__wrapper.is-focus {
    border-color: #8b58e7 !important;
    box-shadow: 0 0 0 1px #8b58e7 inset !important;
  }

  // 输入文本颜色
  .el-input__inner {
    color: #ffffff !important;
    height: 100% !important;
  }

  // 图标颜色
  .el-input__suffix {
    color: #999 !important;
  }

  // 占位符文本颜色
  .el-input__inner::placeholder {
    color: #999 !important;
  }

  .el-input__suffix {
    color: #999 !important;
  }
}
</style>
