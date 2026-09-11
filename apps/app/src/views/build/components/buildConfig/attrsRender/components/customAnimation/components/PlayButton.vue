<template>
  <el-tooltip effect="dark" :content="isPlay ? '停止动画' : '播放动画'" placement="top">
    <div class="play-btn" :class="{ 'is-playing': isPlay }" @click="handlePlay">
      <Icon :type="isPlay ? 'iconfont-tingzhi' : 'iconfont-bofang1'" />
    </div>
  </el-tooltip>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { ElMessage } from "element-plus";

import Icon from "@/components/Icon/index.vue";

import type { AnimationItem } from "../type";
import { useCustomAnimation } from "../useCustomAnimation";

// 组件名称
defineOptions({
  name: "PlayButton"
});

// Props定义
interface Props {
  /** 面板ID */
  panelId?: number;
  /** 状态ID */
  statusId?: string;

  currentAnimation?: AnimationItem;
}

const props = withDefaults(defineProps<Props>(), {
  panelId: undefined,
  statusId: undefined
});

// 使用自定义动画hooks
const {
  isPlay,
  changePlay,
  startProgressAnimation,
  stopProgressAnimation,
  getAvailablePlayComponentSetting,
  triggerAnimationPlay,
  triggerAnimationStop
} = useCustomAnimation();

const availablePlayComponentSetting = computed(() => {
  return getAvailablePlayComponentSetting(props.currentAnimation);
});

/**
 * 计算动画的最大时间
 */
const calculateMaxTime = (): number => {
  if (!availablePlayComponentSetting.value?.length) return 0;

  return availablePlayComponentSetting.value.reduce((acc: number, cur) => {
    return Math.max(acc, cur.delay + cur.duration);
  }, 0);
};

/**
 * 处理播放/停止动画
 */
const handlePlay = (): void => {
  // 检查是否有选中的动画
  if (!props.currentAnimation) {
    ElMessage.error("请先选择一个动画");
    return;
  }

  // 检查动画是否有组件设置
  if (!props.currentAnimation.componentSetting || props.currentAnimation.componentSetting.length === 0) {
    ElMessage.error("请先添加组件");
    return;
  }

  // 控制进度时间轴
  if (!isPlay.value) {
    // 计算并启动进度动画
    const maxTime = calculateMaxTime();
    startProgressAnimation(maxTime);

    // 触发组件动画
    triggerAnimationPlay(props.currentAnimation);
  } else {
    // 停止进度动画
    stopProgressAnimation();

    // 停止动画播放
    triggerAnimationStop(props.currentAnimation);
  }

  // 切换播放状态
  changePlay(!isPlay.value);
};
</script>

<style lang="scss" scoped>
.play-btn {
  & > i {
    font-size: 16px;
    color: #fff;
    cursor: pointer;
    transition: color 0.3s ease;
  }

  &.is-playing > i {
    color: #ff4d4f;
  }
}
</style>
