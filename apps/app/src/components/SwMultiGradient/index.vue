<template>
  <div class="sw-multi-gradient">
    <div class="sw-multi-gradient-header">
      <el-tooltip effect="dark" content="复制 figama 渐变色方案" placement="left">
        <Icon type="CopyDocument" size="16" class="mr-right" @click="handleCopy" />
      </el-tooltip>

      <Icon type="CirclePlus" @click="handleAdd" size="16" />
    </div>
    <div class="sw-multi-gradient-body">
      <div class="sw-multi-gradient-item flex flex-align-between" v-for="item in colorData" :key="item.id">
        <div class="sw-multi-gradient-item-left flex flex-center">
          <ScreenwrightColorPicker
            style="top: 0px"
            v-model="item.color"
            :options="{ colorTypeOption: 'linear-gradient', returnType: 'rgba' }"
            class="mr-right"
            @change="handleChange()"
          />
          <span class="mr-right">Linear</span>
          <sw-input-number
            v-model="item.opacity"
            unit="%"
            :max="100"
            :min="0"
            :controls="false"
            width="60"
            @change="handleChange"
          />
        </div>
        <div class="sw-multi-gradient-item-right">
          <Icon
            :type="getIconType(item.isShowColor)"
            color="#b4b7c1"
            size="16"
            class="sw-multi-gradient-item-icon"
            @click="toggleVisible(item.id)"
          />
          <Icon type="Delete" @click="handleDel(item.id)" size="14" class="sw-multi-gradient-item-icon" />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from "vue";

import ScreenwrightColorPicker from "@/components/ScreenwrightColorPicker/index.vue";
import SwInputNumber from "@/components/SwInputNumber/index.vue";
import Icon from "@/components/Icon/index.vue";
import { useDialog } from "@/hooks/useDialog";

import createInput from "./createInput.vue";
type GradientItem = {
  id: string;
  color: string;
  opacity: number;
  isShowColor: boolean;
};
const { dialog } = useDialog();
const createGradientItem = (partial?: Partial<Omit<GradientItem, "id">>): GradientItem => {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    color: partial?.color || "linear-gradient(89.98deg, #00B3FF 0.02%, #1D61FF 48.71%, #A237FF 98.07%)",
    opacity: typeof partial?.opacity === "number" ? partial.opacity : 100,
    isShowColor: typeof partial?.isShowColor === "boolean" ? partial.isShowColor : true
  };
};

const normalizeList = (list: GradientItem[]): GradientItem[] => {
  return list.map((item) => ({
    id: item.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    color: item.color,
    opacity: item.opacity,
    isShowColor: item.isShowColor
  }));
};

const props = withDefaults(
  defineProps<{
    modelValue: GradientItem[];
  }>(),
  {
    modelValue: () => []
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: GradientItem[]): void;
  (e: "change", value: GradientItem[]): void;
}>();

const colorData = ref<GradientItem[]>([]);

const isGradientListEqual = (a: GradientItem[], b: GradientItem[]) => {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((item, index) => {
    const other = b[index];
    return (
      item.id === other.id &&
      item.color === other.color &&
      item.opacity === other.opacity &&
      item.isShowColor === other.isShowColor
    );
  });
};

const applyExternalValue = (value: GradientItem[] | undefined) => {
  const normalized = normalizeList(value || []);
  if (isGradientListEqual(normalized, colorData.value)) {
    return;
  }
  console.log("需要赋值");
  colorData.value = normalized;
};

const splitByTopLevelComma = (value: string): string[] => {
  const result: string[] = [];
  let start = 0;
  let depth = 0;

  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (char === "(") {
      depth += 1;
      continue;
    }
    if (char === ")") {
      depth -= 1;
      if (depth < 0) {
        return [];
      }
      continue;
    }
    if (char === "," && depth === 0) {
      result.push(value.slice(start, i).trim());
      start = i + 1;
    }
  }

  if (depth !== 0) {
    return [];
  }

  result.push(value.slice(start).trim());
  return result.filter(Boolean);
};

const parseGradientInputToList = (value: string): GradientItem[] => {
  const text = value.trim();
  const matched = text.match(/^background\s*:\s*([\s\S]+);$/i);
  if (!matched) {
    return [];
  }

  const gradientBody = matched[1].trim();
  const layers = splitByTopLevelComma(gradientBody);
  if (!layers.length) {
    return [];
  }

  return layers.map((layer) =>
    createGradientItem({
      color: layer,
      opacity: 100,
      isShowColor: true
    })
  );
};

const syncValue = () => {
  const nextValue = colorData.value.map((item) => ({
    ...item
  }));
  emit("update:modelValue", nextValue);
  emit("change", nextValue);
};

const handleAdd = () => {
  const lastItem = colorData.value[colorData.value.length - 1];
  colorData.value.push(
    createGradientItem({
      color: lastItem?.color,
      opacity: lastItem?.opacity,
      isShowColor: true
    })
  );
  syncValue();
};

const getIconType = (showIcon: boolean) => {
  return showIcon ? "iconfont-yanjing" : "iconfont-biyanjing";
};

const handleDel = (id: string) => {
  colorData.value = colorData.value.filter((item) => item.id !== id);
  syncValue();
};

const toggleVisible = (id: string) => {
  colorData.value = colorData.value.map((item) => {
    if (item.id !== id) {
      return item;
    }
    return {
      ...item,
      isShowColor: !item.isShowColor
    };
  });
  syncValue();
};

const handleChange = () => {
  syncValue();
};
const handleCopy = () => {
  dialog({
    DialogProps: {
      title: "复制渐变色",
      width: "400px",
      modalClass: "upload-menu-ignore"
    },
    componentProps: {},
    component: createInput,
    center: true,
    closeBefore: async (componentData, done) => {
      const res = await componentData.validate();
      if (!res?.success || !res?.name) {
        return;
      }

      const nextList = parseGradientInputToList(res.name);
      if (!nextList.length) {
        return;
      }

      colorData.value = nextList;
      syncValue();
      done();
    }
  });
};

watch(() => props.modelValue, applyExternalValue, { deep: true, immediate: true });
</script>
<style lang="scss">
.sw-multi-gradient-item-left {
  padding: 0 4px;
  background-color: #0f1014 !important;
  border-radius: 4px;
  .sw-color-picker {
    border: none !important;
  }
  .inputBox {
    top: -2px;
    .el-input__wrapper {
      border: none !important;
    }
  }
}
</style>
<style lang="scss" scoped>
.mr-right {
  margin-right: 8px;
}
.sw-multi-gradient {
  width: 100%;
}
.sw-multi-gradient-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  height: 32px;
  .sw-icon {
    cursor: pointer;
  }
}
.sw-multi-gradient-item {
  margin-bottom: 8px;
  &:last-child {
    margin-bottom: 0;
  }
}
.sw-multi-gradient-item-right {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: 10px;
  .sw-multi-gradient-item-icon {
    cursor: pointer;

    &.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}
</style>
