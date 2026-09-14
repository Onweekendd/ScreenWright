<template>
  <el-drawer
    class="config-drawer"
    title="自定义条件编辑"
    v-model="visible"
    direction="rtl"
    :append-to-body="false"
    :destroy-on-close="true"
    :modal-append-to-body="false"
    @close="onClose"
  >
    <template #default>
      <el-form-item label="判断类型" :label-width="85">
        <sw-radio direction="row" :option="judgeType" v-model="currentEncodeEvent.conditionType" />
      </el-form-item>
      <div class="condition-control" @click="addCondition">
        <span> + 添加条件</span>
      </div>
      <div class="condition-list">
        <configCustom
          :title="item.name"
          :editable="true"
          :notSaved="item.notSaved"
          :visible="getConditionVisibility(item.id)"
          v-for="(item, index) in currentEncodeEvent.conditions"
          :key="item.id"
          :is-action="true"
          :ctrlList="conditionCtrl"
          @changeValue="item.name = $event"
          @onEvent="onDeleteCondition(item.id)"
          @change-action-visible="(value) => onConditionVisibilityChange(item.id, value)"
        >
          <div class="content-pad-row">
            <el-form-item label="类型" :label-width="85">
              <configSelect field="conditionType" v-model="item.type" @change="onConditionTypeChange(index)" />
            </el-form-item>
            <el-form-item label="设置条件" :label-width="85" v-if="item.type == 'field'">
              <div class="flex flex-center condition-field">
                <SwSearchInput
                  ref="ftSearchInputRef"
                  @select="onFieldConditionChange(index)"
                  @change="onFieldConditionChange(index)"
                  v-model="item.field"
                  :query-data="conditionFields"
                  class="callback-edit"
                  placeholder="字段名"
                  clearable
                />
                <configSelect field="conditionCompare" v-model="item.compare" @change="onFieldConditionChange(index)" />
                <sw-input v-model="item.expected" placeholder="预期值" @change="onFieldConditionChange(index)" />
              </div>
            </el-form-item>
            <div class="editor-view" v-if="item.type == 'custom'">
              <MonacoEditor v-model="item.code" language="javascript" @change="onCodeChange(index)" />
            </div>
            <div class="condition-btn">
              <div class="btn-cancel fr" @click="onCancelCondition(item)">取消</div>
              <div class="btn-define fr" @click="onSaveCondition(item)">保存</div>
            </div>
          </div>
        </configCustom>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { SwSearchInput } from "@screenwright/ui/search-input";

import SwInput from "@/components/SwInput/index.vue";
import SwRadio from "@/components/SwRadio/index.vue";
import MonacoEditor from "@/components/MonacoEditor/index.vue";
import configCustom from "@/views/build/components/buildConfig/attrsRender/components/interactiveConfig/components/configCustom.vue";
import configSelect from "@/views/build/components/buildConfig/attrsRender/components/interactiveConfig/components/configSelect.vue";
import { useConditionConfig } from "@/views/build/components/buildConfig/attrsRender/components/interactiveConfig/components/useConditionConfig";

import { useEncodeEventConfig } from "./useEncodeEventConfig";

const { currentEncodeEvent } = useEncodeEventConfig();

const {
  visible,
  judgeType,
  conditionCtrl,
  conditionFields,
  getConditionVisibility,
  onClose,
  addCondition,
  onDeleteCondition,
  onSaveCondition,
  onCancelCondition,
  onConditionTypeChange,
  onFieldConditionChange,
  onCodeChange,
  onConditionVisibilityChange
} = useConditionConfig(currentEncodeEvent);

defineExpose({
  visible
});
</script>

<style lang="scss">
.config-drawer {
  margin-top: 60px;
  color: #b4b7c1;
  width: 450px !important;
  font-size: 12px;
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
