<template>
  <el-scrollbar
    :always="true"
    class="table-body"
    ref="bodyRef"
    :style="{ height: `${bodyHeight}px` }"
  >
    <ul :style="ulStyle" :class="{ slideAni: shouldAnimate }">
      <slot
        v-for="(item, index) in repeatedList"
        :key="`${item.id ?? item._rowNumber}-${item._copy}`"
        :item="item"
        :index="index"
      />
    </ul>
  </el-scrollbar>
</template>

<script setup lang="ts">
import type { ScrollbarInstance } from "element-plus";
import type { CSSProperties } from "vue";
import { computed, ref } from "vue";

interface Props {
  option: any;
  height: number;
  isAnimateScroll: boolean;
  listData: Array<{ id?: string | number; [key: string]: any }>;
}

const props = withDefaults(defineProps<Props>(), {
  height: 0,
  isAnimateScroll: false,
  listData: () => []
});

const bodyRef = ref<ScrollbarInstance>();

const rawBodyHeight = computed(
  () => props.height - (props.option.header?.show === false ? 0 : (props.option.header?.height ?? 40))
);
const rowHeight = computed(() => props.option.rowStyle?.height ?? 40);
const originalLength = computed(() => props.listData.length);

// 可视行数必须小于实际数据行数，滚动才有意义；两者相等或可视行数更多时不触发滚动
const shouldAnimate = computed(() => {
  const visibleRows = props.option.scroll?.visibleRows ?? 0;
  return props.isAnimateScroll && visibleRows > 0 && originalLength.value > visibleRows;
});

// 静态（不滚动）时，可视区高度向下取整到整数行，避免拖拽出的组件高度不是行高整数倍时，
// 边缘露出一条固定不动、被从中间切开的半行；滚动时内容持续移动，边缘露出半行是正常现象，
// 这时应该用满全部可用高度，不然会在底部留出一条空白
const bodyHeight = computed(() => {
  if (shouldAnimate.value || !rowHeight.value) return rawBodyHeight.value;
  return Math.max(rowHeight.value, Math.floor(rawBodyHeight.value / rowHeight.value) * rowHeight.value);
});

// 复制份数按"可视区像素高度"反算，保证复制后的总高度至少覆盖 2 倍可视区——
// 组件被拖得很高、可视行数很多时，只复制一份会导致数据在滚到一半就露出空白（内容被看到头了）
const repeatCount = computed(() => {
  if (!shouldAnimate.value) return 1;
  const originalHeight = originalLength.value * rowHeight.value;
  if (!originalHeight) return 2;
  return Math.max(2, Math.ceil((2 * bodyHeight.value) / originalHeight));
});

const repeatedList = computed(() => {
  const result: Array<Record<string, any>> = [];
  for (let copy = 0; copy < repeatCount.value; copy++) {
    props.listData.forEach((it, i) => {
      result.push({ ...it, _rowNumber: i, _copy: copy });
    });
  }
  return result;
});

// 一轮完整滚动 = 平移一份原始数据的高度（不是复制后的总高度），配合每行耗时算出总时长
const animationDuration = computed(() => `${(props.option.scroll?.speed ?? 1) * (originalLength.value || 1)}s`);

// 平移距离固定等于"一份原始数据的像素高度"，直接由行高 × 行数算出，
// 不依赖运行时测量 DOM（避免异步渲染/字体加载时机不稳导致的接缝抖动）
const heightValue = computed(() => `-${originalLength.value * rowHeight.value}px`);

const ulStyle = computed<CSSProperties>(() => ({
  animationDuration: animationDuration.value
}));
</script>

<style lang="scss" scoped>
.table-body {
  width: 100%;
  box-sizing: border-box;

  * {
    box-sizing: border-box !important;
  }

  ul {
    padding: 0;
    margin: 0;
  }

  &::-webkit-scrollbar {
    width: 0;
    height: 0;
  }

  // 只挡住滚动条滑块本身的拖动交互，不影响内容区域的点击（否则会连行点击事件一起挡掉）
  :deep(.el-scrollbar__bar) {
    pointer-events: none;
  }

  &:hover {
    .slideAni {
      animation-play-state: paused;
    }
  }
  &:not(:hover) {
    .slideAni {
      animation-play-state: running;
    }
  }
}

.slideAni {
  animation-name: slideAni;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

@keyframes slideAni {
  0% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, v-bind("heightValue"), 0);
  }
}
</style>
