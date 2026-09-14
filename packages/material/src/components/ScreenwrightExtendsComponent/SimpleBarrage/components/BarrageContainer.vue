<template>
  <div class="barrage-container" ref="containerRef">
    <!-- 弹幕内容会动态添加到这里 -->
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

import type { DataItem, Option, TextStyle } from "../type";
import {
  animateBarrage,
  calculateBarrageImageSize,
  calculateGridPosition,
  calculateTextWidth,
  cleanupBarrageElement,
  createBarrageImageElement,
  createTextElement,
  type CustomHTMLDivElement,
  type GridCell
} from "../utils";

/** @description 组件属性定义 */
interface Props {
  /** @description 组件ID */
  id: number;
  /** @description 配置选项 */
  option: Option;
  /** @description 容器宽度 */
  width: number | string;
  /** @description 容器高度 */
  height: number | string;
  /** @description 弹幕数据 */
  barrageData?: DataItem[];
  /** @description 是否可编辑模式 */
  editable?: boolean;
  /** @description 缩放值 */
  screenScale?: number;
}

/** @description 组件事件定义 */
// 定义props和emits
const props = withDefaults(defineProps<Props>(), {
  barrageData: () => [],
  editable: false,
  screenScale: 1
});

// 响应式数据 (原data字段转换为ref)
/** @description 停止计数 */
const stopCount = ref<number>(0);

/** @description 最大宽度 */
const maxWidth = ref<number>(0);

/** @description 弹幕数组 */
const barrageArray = ref<
  Array<{
    top: number;
    left: number;
    width: number;
    divNode: CustomHTMLDivElement;
  }>
>([]);

/** @description 弹幕网格 */
const barrageGrid = ref<Array<Array<GridCell>>>([]);

/** @description 轮播轮次 */
const roundCount = ref<number>(0);

// 模板引用
const containerRef = ref<HTMLElement>();

// 计算属性
/** @description 弹幕数据 */
const totalData = computed(() => {
  return props.barrageData;
});

// 监听器
watch(
  () => props.width,
  () => {
    initBarrage();
  }
);

watch(
  () => props.height,
  () => {
    initBarrage();
  }
);

watch(
  () => props.option,
  () => {
    initBarrage();
  },
  { deep: true }
);

// 方法定义 (原methods转换为函数)
/**
 * 初始化弹幕
 */
const initBarrage = (): void => {
  dispose();
  if (!totalData.value.length) return;

  stopCount.value = 0;
  roundCount.value = 0; // 重置轮播轮次
  const { lineNum, stylesList: styleArray } = props.option;
  const dataArray = totalData.value.reverse();
  const rowNum = Math.ceil(dataArray.length / lineNum);

  // 初始化网格
  barrageGrid.value = [];
  for (let i = 0; i < rowNum; i++) {
    barrageGrid.value[i] = [];
    for (let j = 0; j < lineNum; j++) {
      barrageGrid.value[i].push({
        row: i,
        col: j
      });
    }
  }

  // 处理每个弹幕项
  dataArray.forEach((item: DataItem) => {
    if (!item || item.text == undefined) return;

    if (item.type === "image") {
      handleImageBarrage(item, props.option);
    } else {
      const style = styleArray[Math.floor(Math.random() * styleArray.length)];
      if (!style) return;
      handleTextBarrage(item, props.option, style);
    }
  });
};

/**
 * 处理图片弹幕
 * @param item - 弹幕项
 * @param option - 选项
 */
const handleImageBarrage = (item: DataItem, option: Option): void => {
  const { width, height } = calculateBarrageImageSize(Number(props.height), option.lineNum, {
    imageMinHeight: option.imageMinHeight,
    imageMaxHeight: option.imageMaxHeight
  });

  // 计算图片位置
  const position = calculateGridPosition({
    domWidth: width,
    fontSize: height, // 使用图片高度代替fontSize
    width: Number(props.width),
    height: Number(props.height),
    lineNum: option.lineNum,
    barrageGrid: barrageGrid.value,
    type: "image",
    imageSpacing: 500
  });

  if (!position.top || !position.left || !position.width) return;

  // 更新网格数据
  barrageGrid.value[position.row][position.col] = position;

  // 生成并添加图片单元
  const divNode = createBarrageImageElement({
    position: !props.editable ? "absolute" : "unset",
    imageUrl: item.text,
    top: position.top,
    left: position.left,
    width: width,
    height: height,
    objectFit: option.imageObjectFit || "cover"
  });

  appendBarrageElement(divNode, {
    top: position.top,
    left: position.left,
    width: position.width
  });
};

/**
 * 处理文本弹幕
 * @param item - 弹幕项
 * @param option - 选项
 * @param textStyle - 文本样式
 */
const handleTextBarrage = (item: DataItem, option: Option, textStyle: TextStyle): void => {
  const isTextShadow = textStyle.isTextShadow;

  // 计算文本宽度
  const domWidth = calculateTextWidth({
    text: item.text,
    textStyle
  });

  // 计算文本位置
  const position = calculateGridPosition({
    domWidth,
    fontSize: textStyle.fontSize,
    width: Number(props.width),
    height: Number(props.height),
    lineNum: option.lineNum,
    barrageGrid: barrageGrid.value,
    type: "text"
  });

  if (!position.top || !position.left || !position.width) return;

  // 更新网格数据
  barrageGrid.value[position.row][position.col] = position;

  // 生成并添加文本单元
  const divNode = createTextElement({
    position: !props.editable ? "absolute" : "unset",
    text: item.text,
    top: position.top,
    left: position.left,
    width: position.width,
    textStyle,
    // backgroundImage: item.backgroundImage,
    borderRadius: option.textBoxBorderRadius || 0,
    padding: option.textBoxPadding,
    isTextShadow
  });

  appendBarrageElement(divNode, {
    top: position.top,
    left: position.left,
    width: position.width
  });
};

/**
 * 添加弹幕元素到容器并设置事件
 * @param divNode - 弹幕节点
 * @param position - 位置信息
 */
const appendBarrageElement = (
  divNode: CustomHTMLDivElement,
  position: { top: number; left: number; width: number }
): void => {
  const container = containerRef.value;
  if (container && container instanceof HTMLElement) {
    container.appendChild(divNode);
  }

  barrageArray.value.push({
    top: position.top,
    left: position.left,
    width: position.width,
    divNode: divNode
  });

  updateMaxWidth();
  if (!props.editable) {
    initAnimate();
  }
};

/**
 * 更新最大宽度
 */
const updateMaxWidth = (): void => {
  maxWidth.value = 0;
  if (!barrageGrid.value.length) return;

  const lastRow = barrageGrid.value[barrageGrid.value.length - 1];
  for (let i = 0, l = lastRow.length; i < l; i++) {
    const colWidth = lastRow[i].width || 0;
    const colLeft = lastRow[i].left || 0;
    maxWidth.value = Math.max(maxWidth.value, colWidth + colLeft);
  }
};

/**
 * 初始化动画
 */
const initAnimate = (): void => {
  barrageArray.value.forEach(({ divNode }) => {
    barrageAnimate(divNode as CustomHTMLDivElement);
  });
};

/**
 * 弹幕动画
 * @param divNode - 弹幕节点
 */
const barrageAnimate = (divNode: CustomHTMLDivElement): void => {
  animateBarrage(
    divNode,
    props.option.speed,
    parseFloat(divNode.style.left.replace(/[^0-9.-]+/g, "")) + divNode.offsetWidth * props.screenScale * 1.2,
    props.option.loop,
    () => {
      stopCount.value += 1;
      if (stopCount.value === barrageArray.value.length) {
        roundCount.value += 1;
        stopCount.value = 0;

        if (!props.option.loop) {
          return;
        }

        initBarrage();
      }
    }
  );
};

/**
 * 清理资源
 */
const dispose = (): void => {
  barrageArray.value.forEach(({ divNode }) => {
    cleanupBarrageElement(divNode as CustomHTMLDivElement);
  });
  barrageArray.value = [];
};

// 生命周期hooks
onMounted(() => {
  initBarrage();
});

onBeforeUnmount(() => {
  dispose();
});
</script>

<style lang="scss" scoped>
.barrage-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
