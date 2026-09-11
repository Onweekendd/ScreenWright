<template>
  <span class="sw-count-up" ref="countUpRef" />
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount, shallowRef, nextTick } from "vue";
import { CountUp } from "./countup";

export interface Props {
  animation?: boolean;
  start?: number;
  end?: number | string;
  prefixData?: string;
  decimals?: number;
  useGrouping?: boolean;
  duration?: number;
  options?: object;
  callback?: () => void;
  autoplay?: boolean;
  intervalTime?: number;
  incrementFrequency?: number; // 自增频率，当 autoplay 和 autoIncrement 同时开启时使用
  autoIncrement?: boolean; // 是否启用自增
}
defineOptions({
  name: "SwCountUp"
});
const props = withDefaults(defineProps<Props>(), {
  animation: true,
  start: 0,
  prefixData: "",
  decimals: 0,
  useGrouping: true,
  duration: 2,
  options: () => ({}),
  callback: () => {},
  autoplay: false,
  intervalTime: 10
});
const countUpRef = ref<HTMLElement>();
const countUP = shallowRef<CountUp | null>(null);
const timer = ref<NodeJS.Timeout | null>(null);
let initCounter = 0;
let pendingInit: (() => void) | null = null;

const init = () => {
  if (!countUpRef.value) return;

  // 增加计数器，用于标记当前调用
  const currentInit = ++initCounter;

  // 取消之前的待执行 init
  if (pendingInit) {
    pendingInit = null;
  }

  // 创建一个新的 init 函数
  const executeInit = () => {
    // 检查是否是最新的调用
    if (currentInit !== initCounter) {
      return;
    }

    if (!countUpRef.value) return;

    const endValue = Number(props.end);
    // 如果 endValue 是 NaN 或无效值，使用 0 作为默认值
    const validEndValue = isNaN(endValue) || props.end === undefined || props.end === null ? 0 : endValue;

    // 先清理之前的实例和定时器
    if (timer.value) {
      clearInterval(timer.value);
      timer.value = null;
    }

    // 清理旧实例的动画帧
    if (countUP.value) {
      // 取消动画帧
      if ((countUP.value as any).rAF) {
        cancelAnimationFrame((countUP.value as any).rAF);
      }
      countUP.value = null;
    }

    // 先清空 DOM 内容，避免显示旧值
    if (countUpRef.value) {
      countUpRef.value.textContent = "";
      countUpRef.value.innerHTML = "";
    }

    // 确保 validEndValue 是有效数字
    const finalValue = typeof validEndValue === "number" && !isNaN(validEndValue) ? validEndValue : 0;

    // 创建新实例
    // 当 autoplay 为 false 时，设置 startVal 为 finalValue，这样构造函数中就会显示正确的值
    // 当 autoplay 为 true 时，设置 startVal 为 0，从 0 开始动画
    countUP.value = new CountUp(countUpRef.value, finalValue, {
      startVal: !props.autoplay ? finalValue : (props.start ?? 0), // autoplay 为 false 时直接显示最终值，为 true 时从 start 开始动画
      decimalPlaces: props.decimals,
      useEasing: true,
      useGrouping: props.useGrouping,
      separator: ",",
      prefix: props.prefixData,
      decimal: ".",
      duration: props.autoplay ? props.duration || 2 : 0
    });

    if (props.autoplay) {
      // 当 autoplay 为 true 时，启动动画
      countUP.value.start();
      playAnimate();
    } else {
      // 当 autoplay 为 false 时，直接设置值，不做动画
      // duration 为 0 时，start() 会直接调用 printValue(this.endVal)
      // 由于构造函数中已经显示了 startVal（即 finalValue），这里再次调用确保显示的是 endVal
      countUP.value.start();
    }

    pendingInit = null;
  };

  // 使用 nextTick 确保在下一个事件循环中执行，这样可以取消之前的调用
  pendingInit = executeInit;
  nextTick(() => {
    // 双重检查：确保是最新的调用，且 pendingInit 没有被取消
    if (pendingInit === executeInit && currentInit === initCounter) {
      executeInit();
    }
  });
};

const destroy = () => {
  // 先取消定时器
  if (timer.value) {
    clearInterval(timer.value);
    timer.value = null;
  }

  // 取消待执行的 init
  pendingInit = null;

  // 清理 CountUp 实例
  if (countUP.value) {
    // 取消动画帧
    if ((countUP.value as any).rAF) {
      cancelAnimationFrame((countUP.value as any).rAF);
    }
    countUP.value = null;
  }
};

const reStart = (callback?: (countUp: CountUp) => void) => {
  if (countUP.value && countUP.value.start) {
    countUP.value.start(() => {
      if (callback) {
        callback(countUP.value as CountUp);
      }
    });
  }
};

const pauseResume = () => {
  if (countUP.value && countUP.value.pauseResume) {
    countUP.value.pauseResume();
  }
};

const reset = () => {
  if (countUP.value && countUP.value.reset) {
    countUP.value.reset();
  }
};

const update = (newEndVal: number, useAnimation?: boolean, incrementDuration?: number) => {
  if (countUP.value && countUP.value.update) {
    countUP.value.update(newEndVal, useAnimation, incrementDuration);
  } else {
    if (timer.value) clearInterval(timer.value);
  }
};

const playAnimate = () => {
  if (timer.value) clearInterval(timer.value);
  timer.value = null;

  // 如果同时开启了自增，不启动 playAnimate 的定时器
  // 因为自增逻辑会处理后续的动画（从当前值到自增后的值）
  // 第一次动画（从0到目标值）已经在 init 中通过 start() 处理了
  if (props.incrementFrequency) {
    console.log(`[SwCountUp] autoplay 和 autoIncrement 同时开启，playAnimate 不启动定时器，由自增逻辑处理后续动画`);
    return;
  }

  // 如果只开启了 autoplay，使用 intervalTime 作为间隔，重复从0到目标值的动画
  timer.value = setInterval(
    () => {
      reset();
      update(Number(props.end));
    },
    (props.intervalTime || 10) * 1000
  );
};

// 暴露方法给父组件使用
defineExpose({
  init,
  destroy,
  reStart,
  pauseResume,
  reset,
  update
});

watch(
  [
    () => props.decimals,
    () => props.end,
    () => props.prefixData,
    () => props.useGrouping,
    () => props.autoplay,
    () => props.animation,
    () => props.intervalTime,
    () => props.incrementFrequency
  ],
  () => {
    destroy();
    init();
  }
);

onMounted(() => {
  if (props.animation) {
    init();
  }
});

onBeforeUnmount(() => {
  destroy();
});
</script>

<style lang="scss" scoped></style>
