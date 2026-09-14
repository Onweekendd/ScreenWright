<template>
  <el-drawer
    class="style-config-drawer"
    title="组件样式"
    v-model="visibleRef"
    direction="rtl"
    :append-to-body="false"
    :destroy-on-close="true"
    :modal-append-to-body="true"
    @close="onConfigDrawerClose"
  >
    <el-form label-width="60px" label-position="left" size="small">
      <template v-if="validProp('colorList')">
        <el-form-item label="系统配色">
          <el-switch class="ft-switch" v-model="selectTargetData[0].option.switchTheme" @change="update" />
        </el-form-item>
        <el-form-item label="配色选择" v-if="selectTargetData[0].option.switchTheme">
          <el-select v-model="selectTargetData[0].option.theme" :dic="dicOption.themeList" @change="update">
            <el-option v-for="item in themeList" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </template>
      <ActionConfig />
    </el-form>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import { extractComponentId } from "@/utils/utils";
import { useUpdateInstance } from "@/views/build/components/buildConfig/useUpdateInstance";
import { useTargetData } from "@/views/build/components/buildRender/hooks/useTargetData";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

import ActionConfig from "../../ActionConfig.vue";

const themeList = ref<any[]>([
  { label: "默认配色", value: "avue" },
  { label: "紫色主题", value: "macarons" },
  { label: "绿色主题", value: "wonderland" }
]);

const { globalComponentMap } = useGlobalComponentData();
const { update, selectTargetData } = useUpdateInstance();
const { action, visibleRef, onConfigDrawerClose } = useTargetData();

const actionComponent = computed(() => {
  if (!action.value?.component) return;

  const $component = action.value.component.map((a) => extractComponentId(a));

  if (!$component?.length) return;
  const actionObj = globalComponentMap.value.get(`${$component[0]}`);
  if (!actionObj) return;

  return actionObj.component;
});

const dicOption: Record<string, string[]> = {
  colorList: ["bar", "pie", "line", "gauge", "funnel", "scatter", "radar"]
};
const validProp = (name: string, list?: any) => {
  if (!actionComponent.value) return false;

  if (list) {
    const prop = actionComponent.value?.prop || "";
    return list.includes(prop);
  }
  return dicOption[name].includes(actionComponent.value.prop);
};
</script>
<style lang="scss">
.style-config-drawer {
  margin-top: 60px;
  color: #b4b7c1;
  width: 340px !important;
  font-size: 12px;
  height: calc(100% - 60px) !important;
  .el-drawer__header {
    height: 36px;
    padding: 0 16px;
    margin: 0;
    font-size: 12px;
    color: #dfe0e3;
    background-color: #3d404c;
    .el-drawer__title {
      font-size: 12px;
    }
  }
  .el-drawer__body {
    width: 100%;
    background-color: var(--sw-panel-bg);
    padding: 0 !important;
  }
  .layout-config {
    .el-drawer.config-drawer {
      width: 350px !important;
    }
  }
  .condition-control {
    font-size: 12px;
    cursor: pointer;
    border: 1px solid var(--sw-theme-color);
    border-radius: 4px 4px;
    padding: 5px 5px;
    margin-bottom: 5px;
    text-align: center;
    color: var(--sw-theme-color);
  }
  .content-pad-row {
    display: flex;
    width: calc(100% - 20px);
    margin: 0 10px;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: nowrap;
    flex-direction: column;
  }
  .condition-field {
    display: flex;
    & > div {
      margin: 0 2px;
    }
  }
  .el-form-item {
    width: 100%;
  }
  .condition-btn {
    width: 100%;
    height: 28px;
    margin-bottom: 10px;
    display: flex;
    justify-content: flex-end;

    & > div {
      height: 28px;
      width: 46px;
      box-sizing: border-box;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 5px;
      border: 1px solid var(--sw-theme-color);
      font-size: 12px;
    }

    .btn-define {
      color: #ffffff;
      background-image: linear-gradient(180deg, var(--sw-theme-color) 0%, var(--sw-theme-color) 100%);
    }
  }
  .editor-view {
    width: 100%;
    height: 200px;
    padding: 20px 0;
    position: relative;

    &::before,
    &::after {
      content: "}";
      color: #b4b7c1;
      position: absolute;
      bottom: 0;
      left: 0;
    }

    &::before {
      content: "function filter(data){";
      top: 0;
    }

    .monaco_editor_container {
      margin: 0 0;
      border: 1px solid #393b4a;

      .margin {
        border-right: 1px solid #393b4a;
        box-sizing: border-box;
      }
    }
  }
}
</style>
