<template>
  <div class="alignment-lines-container">
    <!-- 垂直对齐线 -->
    <template v-for="(line, index) in verticalLines" :key="`v-${index}`">
      <div class="alignment-line alignment-line--vertical" :style="getVerticalLineStyle(line)" />
      <!-- 端点标记 -->
      <div
        v-for="(endPoint, i) in getVerticalEndPoints(line)"
        :key="`v-${index}-end-${i}`"
        class="alignment-endpoint"
        :style="{ left: `${endPoint.x}px`, top: `${endPoint.y}px` }"
      />
    </template>

    <!-- 水平对齐线 -->
    <template v-for="(line, index) in horizontalLines" :key="`h-${index}`">
      <div class="alignment-line alignment-line--horizontal" :style="getHorizontalLineStyle(line)" />
      <!-- 端点标记 -->
      <div
        v-for="(endPoint, i) in getHorizontalEndPoints(line)"
        :key="`h-${index}-end-${i}`"
        class="alignment-endpoint"
        :style="{ left: `${endPoint.x}px`, top: `${endPoint.y}px` }"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { useAlignmentWasm } from "../hooks/useAlignmentWasm";

// 使用全局 hooks，不需要 props
const { verticalLines, horizontalLines } = useAlignmentWasm();

/**
 * 判断是否为中心对齐
 * 中心对齐：前两个点距离很近（都是中心点）
 * 边缘对齐：前两个点距离较远（min 和 max）
 */
const isCenterAlignment = (points: number[]): boolean => {
  if (points.length < 2) return true; // 只有一个点，默认是中心
  return Math.abs(points[0] - points[1]) < 1; // 距离小于 1px 认为是同一点
};

/**
 * 获取垂直对齐线样式
 */
const getVerticalLineStyle = (line: { x: number; y: number[] }) => {
  let minY: number, maxY: number;

  if (isCenterAlignment(line.y)) {
    // 中心对齐：只连接到最近的参考点
    const targetY = line.y[0];
    const refPoints = line.y.slice(1);

    if (refPoints.length === 0) {
      minY = maxY = targetY;
    } else {
      const closestRef = refPoints.reduce((closest, current) => {
        const currentDist = Math.abs(current - targetY);
        const closestDist = Math.abs(closest - targetY);
        return currentDist < closestDist ? current : closest;
      });
      minY = Math.min(targetY, closestRef);
      maxY = Math.max(targetY, closestRef);
    }
  } else {
    // 边缘对齐：显示全长
    minY = Math.min(...line.y);
    maxY = Math.max(...line.y);
  }

  return {
    left: `${line.x}px`,
    top: `${minY}px`,
    width: "0",
    height: `${maxY - minY}px`
  };
};

/**
 * 获取水平对齐线样式
 */
const getHorizontalLineStyle = (line: { x: number[]; y: number }) => {
  let minX: number, maxX: number;

  if (isCenterAlignment(line.x)) {
    // 中心对齐：只连接到最近的参考点
    const targetX = line.x[0];
    const refPoints = line.x.slice(1);

    if (refPoints.length === 0) {
      minX = maxX = targetX;
    } else {
      const closestRef = refPoints.reduce((closest, current) => {
        const currentDist = Math.abs(current - targetX);
        const closestDist = Math.abs(closest - targetX);
        return currentDist < closestDist ? current : closest;
      });
      minX = Math.min(targetX, closestRef);
      maxX = Math.max(targetX, closestRef);
    }
  } else {
    // 边缘对齐：显示全长
    minX = Math.min(...line.x);
    maxX = Math.max(...line.x);
  }

  return {
    left: `${minX}px`,
    top: `${line.y}px`,
    width: `${maxX - minX}px`,
    height: "0"
  };
};

/**
 * 获取垂直线的端点位置 - 显示所有节点
 */
const getVerticalEndPoints = (line: { x: number; y: number[] }) => {
  // 垂直线中心 X 位置（左边缘 + 2.5px）
  const centerX = line.x + 2.5;

  // 返回所有 y 值对应的端点
  return line.y.map((y) => ({ x: centerX, y }));
};

/**
 * 获取水平线的端点位置 - 显示所有节点
 */
const getHorizontalEndPoints = (line: { x: number[]; y: number }) => {
  // 水平线中心 Y 位置（上边缘 + 2.5px）
  const centerY = line.y + 2.5;

  // 返回所有 x 值对应的端点
  return line.x.map((x) => ({ x, y: centerY }));
};
</script>

<style lang="scss" scoped>
// 对齐线容器
.alignment-lines-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
}

// 对齐线样式
.alignment-line {
  position: absolute;
  pointer-events: none;

  &--vertical {
    // 垂直虚线：宽度为 0，border-left 显示虚线
    border-left: 5px dashed #642cff;
  }

  &--horizontal {
    // 水平虚线：高度为 0，border-top 显示虚线
    border-top: 5px dashed #642cff;
  }
}

// 对齐线端点标记 - X 形打结样式
.alignment-endpoint {
  position: absolute;
  width: 3px;
  height: 14px;
  background-color: rgba(255, 255, 255, 0.5);
  transform: translate(-50%, -50%) rotate(45deg);
  pointer-events: none;
  z-index: 10000;

  // 创建第二条线形成 X 形
  &::before {
    content: "";
    position: absolute;
    width: 14px;
    height: 3px;
    background-color: rgba(255, 255, 255, 0.5);
    left: 50%;
    top: 50%;
    transform: translateX(-50%) translateY(-50%);
  }

  &:hover,
  &:hover::before {
    background-color: #8b58e7;
  }
}
</style>
