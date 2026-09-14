<template>
  <div class="style-config">
    <el-form-item label="默认启用">
      <template #label>
        <span class="label-with-icon"
          >默认启用
          <el-tooltip class="item" effect="dark" placement="right">
            <Icon type="QuestionFilled" class="tooltip-icon" size="14" />
            <template #content>
              <div>
                <p style="width: 200px">点击切换启动状态，可更新发布后的名称（默认为创建时的名称）</p>
              </div>
            </template>
          </el-tooltip>
        </span>
      </template>
      <el-checkbox v-model="terminalControlOption.enableOpen" @change="onTerminalControlEnableChange" />
    </el-form-item>
    <el-form-item label="是否溢出滚动">
      <el-checkbox v-model="terminalControlOption.enableScroll" @change="debouncedUpdate" />
    </el-form-item>
    <div class="panelBtn" @click.stop="openEncodeEditor">编辑终端交互</div>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";

import type { CheckboxValueType } from "element-plus";
import { debounce } from "lodash-es";

import Icon from "@/components/Icon/index.vue";
import { useHistoryData } from "@/views/build/command/useHistoryData";
import type { EncodePanelProps } from "@/views/build/components/buildRender/core/SystemComponent/panel/EncodePanel";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

import { PanelType } from "../../../buildRender/core/SystemComponent/type";
import { useEditStore } from "../../../buildRender/hooks/useEditStore";
import { updateDataEnum } from "../../type";
import { useUpdateInstance } from "../../useUpdateInstance";

const router = useRouter();
const { editConfig, updateEditConfig } = useEditStore();
const { encodeComponentMap } = useGlobalComponentData();
const { update, selectTargetData } = useUpdateInstance({
  type: updateDataEnum.GROUP
});
const { clearHistory } = useHistoryData();

const encodePanels = computed(() => {
  return Array.from(encodeComponentMap.value.values()).filter((item) => item.component.prop === PanelType.encodePanel);
});

const filterTerminalEnableArr = (terminalEnableArr: Record<string, string>) => {
  const result = { ...terminalEnableArr };
  // 获取所有 encodePanels 的 id 集合
  const validIds = new Set(encodePanels.value.map((panel) => String(panel.id)));
  // 过滤掉 key 不在 validIds 中的项
  Object.keys(result).forEach((key) => {
    if (!validIds.has(key)) {
      delete result[key];
    }
  });
  return result;
};

// 创建防抖版本的update和updateEditConfig
const debouncedUpdate = debounce(() => {
  update();
  updateEditConfig();
}, 500);

const onTerminalControlEnableChange = (value: CheckboxValueType) => {
  editConfig.value.terminalEnableArr = filterTerminalEnableArr(editConfig.value.terminalEnableArr);

  const isEnable = value as boolean;

  if (isEnable) {
    editConfig.value.terminalEnableArr[selectTargetData.value[0].id] = selectTargetData.value[0].name;
  } else {
    delete editConfig.value.terminalEnableArr[selectTargetData.value[0].id];
  }

  debouncedUpdate();
};

const terminalControlOption = computed(() => {
  return selectTargetData.value[0]?.option as EncodePanelProps["option"];
});

/**
 * @description 打开动态面板编辑器
 */
const openEncodeEditor = () => {
  if (selectTargetData.value[0].isLock) {
    return;
  }
  clearHistory();
  router.push({
    name: "encode",
    params: { cid: selectTargetData.value[0]?.id }
  });
};
</script>
<style lang="scss" scoped>
.w-100 {
  width: 100%;
}
.mb-10 {
  margin-bottom: 10px;
}
.style-config {
  .config-base-form {
    padding: 0 16px;
  }

  :deep(.el-form-item__label) {
    padding: 0 !important;
    color: #b4b7c1 !important;
    font-size: 12px;
    font-family:
      Source Han Sans CN-Normal,
      Source Han Sans CN;
    font-weight: 400;
  }
}

.label-with-icon {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.panelBtn {
  text-align: center;
  background: linear-gradient(180deg, var(--sw-theme-color) 0%, var(--sw-theme-color) 100%);
  border-radius: 5px 5px;
  padding: 8px 0;
  margin: 5px 20px 0;
  font-size: 12px;
  font-family:
    Source Han Sans CN-Regular,
    Source Han Sans CN;
  color: #fff;
  cursor: pointer;
}
</style>
