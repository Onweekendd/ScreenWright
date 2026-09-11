<template>
  <div class="key-value-editor">
    <config-item :label="title" :show-tooltip="showTooltip" :tooltip-content="tooltipContent">
      <div class="key-value-list">
        <div v-for="(item, index) in items" :key="index" class="key-value-row">
          <el-input
            v-model="item.key"
            size="small"
            placeholder="键"
            class="key-input"
            @change="updateKeyValuePair({ index, type: 'key', value: $event })"
          />
          <el-input
            v-model="item.value"
            size="small"
            placeholder="值"
            class="value-input"
            @change="updateKeyValuePair({ index, type: 'value', value: $event })"
          />
          <el-button
            type="danger"
            size="small"
            :icon="Delete"
            circle
            class="delete-btn"
            @click="removeKeyValuePair(index)"
          />
        </div>

        <div class="add-item-wrapper">
          <el-button type="primary" size="small" :icon="Plus" class="add-btn" @click="addKeyValuePair">
            添加参数
          </el-button>
        </div>
      </div>
    </config-item>
  </div>
</template>

<script setup lang="ts">
import { Delete, Plus } from "@element-plus/icons-vue";

import ConfigItem from "./ConfigItem.vue";

/** @description 键值对类型 */
interface KeyValueItem {
  key: string;
  value: string;
}

/** @description 更新参数类型 */
interface UpdateParams {
  index: number;
  type: "key" | "value";
  value: string | number;
}

/** @description 组件属性定义 */
interface Props {
  /** @description 标题，如"请求头"、"请求体" */
  title: string;
  /** @description 数据项数组 */
  items: KeyValueItem[];
  /** @description 是否显示提示 */
  showTooltip?: boolean;
  /** @description 提示内容 */
  tooltipContent?: string;
}

/** @description 组件事件定义 */
interface Emits {
  (e: "add-item"): void;
  (e: "remove-item", index: number): void;
  (e: "update-item", params: UpdateParams): void;
}

// 定义props和emits
withDefaults(defineProps<Props>(), {
  items: () => [],
  showTooltip: false,
  tooltipContent: ""
});

const emit = defineEmits<Emits>();

// 方法定义
/**
 * 添加一个新的键值对
 */
const addKeyValuePair = (): void => {
  emit("add-item");
};

/**
 * 移除键值对
 * @param index 索引
 */
const removeKeyValuePair = (index: number): void => {
  emit("remove-item", index);
};

/**
 * 更新键值对
 * @param params 更新参数
 */
const updateKeyValuePair = (params: UpdateParams): void => {
  emit("update-item", params);
};
</script>

<style lang="scss" scoped>
.key-value-editor {
  display: flex;

  gap: 10px;

  .editor-header {
    width: 20%;

    .title {
      font-size: 14px;
      font-weight: 500;
      color: #ffffff;
      border: none !important;
    }
  }

  .key-value-list {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .key-value-row {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    gap: 8px;

    .key-input,
    .value-input {
      flex: 1;
    }

    .delete-btn {
      transition: all 0.3s;
      &:hover {
        transform: scale(1.05);
      }
    }
  }

  .add-item-wrapper {
    display: flex;
    justify-content: center;
    width: 100%;

    .add-btn {
      width: 120px;
      transition: all 0.3s;
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }
    }
  }
}
</style>
