<template>
  <div class="http-config-editor">
    <el-form-item :label="type === 'headers' ? '请求头' : '请求体'" :label-width="firstLabelWidth">
      <template #label v-if="showTooltip">
        <span
          >请求体
          <el-tooltip class="item" effect="dark" placement="right">
            <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
            <template #content>
              <p>{{ tooltipContent }}</p>
            </template>
          </el-tooltip>
        </span>
      </template>
      <div class="add-item-wrapper">
        <el-button type="primary" size="small" class="add-btn" @click="addKeyValue">
          <Icon type="Plus" style="font-size: 14px" /> 添加参数
        </el-button>
      </div>
      <div class="key-value-list">
        <div v-for="(item, index) in selectTargetData[0].option.exportConfig[type]" :key="index" class="key-value-row">
          <div class="flex flex-align-center">
            <sw-input v-model="item.key" size="small" placeholder="键" class="key-input" @change="updateKeyValue" />-
            <sw-input v-model="item.value" size="small" placeholder="值" class="value-input" @change="updateKeyValue" />
            <el-button
              type="danger"
              size="small"
              style="margin-left: 5px"
              circle
              class="delete-btn"
              @click="removeKeyValue(index)"
            >
              <Icon type="delete" style="font-size: 14px" />
            </el-button>
          </div>
        </div>
      </div>
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { toRefs } from "vue";

import { SwInput } from "@screenwright/ui";
import Icon from "@editor/base/Icon/index.vue";

import { firstLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();

interface Props {
  type?: string;
  showTooltip?: boolean;
  tooltipContent?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: "headers",
  showTooltip: false,
  tooltipContent: ""
});

const { type } = toRefs(props);

const addKeyValue = () => {
  selectTargetData.value[0].option.exportConfig[type.value].push({ key: "", value: "" });
  update();
};
const removeKeyValue = (index: number) => {
  selectTargetData.value[0].option.exportConfig[type.value].splice(index, 1);
  update();
};
const updateKeyValue = () => {
  console.log(selectTargetData.value[0].option.exportConfig[type.value]);
  update();
};
</script>

<style lang="scss" scoped>
.http-config-editor {
  margin-top: 24px;
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
      margin-bottom: 10px;
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
        flex: 0;
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
}
</style>
