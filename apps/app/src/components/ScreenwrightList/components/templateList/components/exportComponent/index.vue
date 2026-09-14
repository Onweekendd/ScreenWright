<template>
  <div class="export-component">
    <div class="export-control">请选择导出选项：</div>

    <div
      class="export-item"
      v-for="item in exportOption"
      :key="item.value"
      :class="{
        active: exportType === item.value,
        isDisabled: item.disabled
      }"
      @click.stop="handleSelect(item)"
    >
      {{ item.label }}
      <el-tooltip class="item" effect="dark" placement="right">
        <template #content>
          <span>{{ item.tooltip }}</span>
        </template>
        <span>{{ item.remark }}</span>
        <p>{{ item.tooltip }}</p>
      </el-tooltip>
    </div>

    <div class="select-content">
      已选中版本：
      <span>{{ item.name }} - V{{ selectVersionCode }}</span>
    </div>

    <versionList :listData="listData" v-model="selectVersionCode" />
    <div class="transfer-footer">
      <span @click="cancel">取消</span>
      <span class="button-primary" @click="confirm">确定</span>
    </div>
  </div>
</template>
<script setup lang="ts">
import { inject, onMounted } from "vue";

import { dialogInjectionKey } from "@/components/Dialog/constant";
import type { ScreenItem } from "@/model/Visual";

import versionList from "../selectVersion/versionList.vue";
import { exportOption, useExportComponent } from "./useExportComponent";

const { confirm, cancel } = inject(dialogInjectionKey)!;
interface Props {
  item: ScreenItem;
}
const props = defineProps<Props>();
const { exportType, selectVersionCode, listData, initData, validate, handleSelect } = useExportComponent(props.item);
onMounted(() => {
  initData();
});
defineExpose({
  validate
});
</script>
<style lang="scss" scoped>
.export-control {
  color: #999999;
}
.export-item {
  cursor: pointer;
  position: relative;
  text-indent: 20px;
  height: 30px;
  line-height: 30px;
  color: #999999;
  &::before {
    content: "";
    width: 8px;
    height: 8px;
    border: 1px solid #999999;
    border-radius: 50%;
    position: absolute;
    left: 5px;
    top: 50%;
    -webkit-transform: translate(0, -50%);
    transform: translate(0, -50%);
  }
  &.active {
    color: #ffffff;
    &::before {
      background: linear-gradient(180deg, var(--sw-theme-color) 0%, var(--sw-theme-color) 100%);
      border-color: #ffffff;
    }
  }
}
.select-content {
  margin: 10px 0 10px 0;
  color: #999999;
  display: flex;
  align-items: center;
}

.transfer-footer {
  text-align: right;
  padding: 20px 0px 10px 0px;
  span {
    color: #ffffff;
    cursor: pointer;
    padding: 5px 10px;
    margin: 0 5px;
    border-color: #3d404c;
    background-color: #3d404c;
  }
  .button-primary {
    border-color: var(--sw-theme-color);
    background: linear-gradient(180deg, var(--sw-theme-color) 0%, var(--sw-theme-color) 100%);
  }
}
</style>
