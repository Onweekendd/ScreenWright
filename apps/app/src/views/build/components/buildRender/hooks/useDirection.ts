import { onKeyStroke } from "@vueuse/core";

import { useAction } from "./useAction";
import { useEditStore } from "./useEditStore";

interface DirectionConfig {
  key: string;
  property: "top" | "left";
  offset: number;
}

// 方向键映射配置
const directionConfig: Record<string, DirectionConfig> = {
  ArrowUp: { key: "ArrowUp", property: "top", offset: -1 },
  ArrowDown: { key: "ArrowDown", property: "top", offset: 1 },
  ArrowLeft: { key: "ArrowLeft", property: "left", offset: -1 },
  ArrowRight: { key: "ArrowRight", property: "left", offset: 1 }
};

// 目标数据项接口
interface TargetDataItem {
  top?: number;
  left?: number;
  isLock?: boolean;
}
// 处理方向键移动
export const useDirection = () => {
  const { selectTargetData, isPanel } = useEditStore();
  const { updateComponentLayers } = useAction({
    isDynamicPanel: isPanel()
  });
  // 移动单个目标
  const move = (direction: keyof typeof directionConfig, target: TargetDataItem) => {
    const config = directionConfig[direction];
    if (!config) return;

    target[config.property] = (target[config.property] || 0) + config.offset;
  };

  // 处理方向键事件
  const handleDirectionKey = (direction: DirectionConfig) => (e: KeyboardEvent) => {
    if (!selectTargetData.value || selectTargetData.value.length === 0) return;
    if (e.target && e.target instanceof HTMLElement) {
      // 处理在 el-input 或 textarea 中按下方向键的情况
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.className.includes("editor")) {
        return;
      }
    }
    if (e.key === direction.key) {
      e.preventDefault();
    }
    const isHasLock = selectTargetData.value.some((v) => v && v.isLock);
    if (isHasLock) {
      return;
    }
    for (let i = 0; i < selectTargetData.value.length; i++) {
      const target = selectTargetData.value[i];
      if (target) {
        // 更新目标数据的 top 和 left 属性
        move(direction.key as keyof typeof directionConfig, target);
        const isGroup = target.children && target.children.length > 0;
        if (isGroup && target.children) {
          for (let j = 0; j < target.children.length; j++) {
            const child = target.children[j];
            if (child) {
              move(direction.key as keyof typeof directionConfig, child);
            }
          }
        }
        updateComponentLayers(target);
      }
    }
  };

  // 初始化方向键监听
  const initDirection = () => {
    Object.values(directionConfig).forEach((direction) => {
      onKeyStroke([direction.key], handleDirectionKey(direction));
    });
  };

  return {
    move,
    initDirection
  };
};
