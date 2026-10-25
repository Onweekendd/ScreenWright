<template>
  <sw-collapse-item title="列" open>
    <template #icon>
      <Icon type="CirclePlus" @click="changeColumn('add')" size="14" />
      <Icon type="Delete" @click="changeColumn('delete')" size="14" />
    </template>
    <template #content>
      <ScreenwrightSeriesTabs v-model="activeTab" :tabs="tabNames" />
      <div v-for="(name, index) in tabNames" :key="index">
        <div v-if="name === activeTab">
          <el-form-item label="字段名" :label-width="labelWidth">
            <sw-input v-model="columns[index].key" @change="update" />
          </el-form-item>
          <el-form-item label="表头文本" :label-width="labelWidth">
            <sw-input v-model="columns[index].title" @change="update" />
          </el-form-item>
          <el-form-item label="列宽" :label-width="labelWidth">
            <sw-input-number
              v-model="columns[index].width"
              unit="px"
              :controls="false"
              placeholder="留空按比例自动分配"
              @change="update"
            />
          </el-form-item>
          <el-form-item label="对齐方式" :label-width="labelWidth">
            <el-select v-model="columns[index].align" popper-class="sw-select-dropdown" clearable @change="update">
              <el-option label="居左" value="left" />
              <el-option label="居中" value="center" />
              <el-option label="居右" value="right" />
            </el-select>
          </el-form-item>

          <sw-collapse-item title="样式覆盖" showIcon @change="update" v-model="overrideEnabled[columns[index].key]">
            <template #content>
              <el-form-item label="文字颜色" :label-width="labelWidth">
                <sw-single-color-picker v-model="overrideOf(columns[index].key).color" @change="update" />
              </el-form-item>
              <el-form-item label="背景色" :label-width="labelWidth">
                <sw-single-color-picker v-model="overrideOf(columns[index].key).background" @change="update" />
              </el-form-item>
              <el-form-item label="字号" :label-width="labelWidth">
                <sw-input-number
                  v-model="overrideOf(columns[index].key).fontSize"
                  unit="px"
                  :controls="false"
                  @change="update"
                />
              </el-form-item>
            </template>
          </sw-collapse-item>
        </div>
      </div>
    </template>
  </sw-collapse-item>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";

import { ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import Icon from "@editor/base/Icon/index.vue";

import { useUpdateInstance } from "../../useUpdateInstance";

interface SwScrollColumn {
  key: string;
  title: string;
  width?: number;
  align?: "left" | "center" | "right";
}

const { update, selectTargetData } = useUpdateInstance();
const labelWidth = 73;

const columns = computed<SwScrollColumn[]>(() => selectTargetData.value[0].option.columns);

if (!selectTargetData.value[0].option.columnStyleOverrides) {
  selectTargetData.value[0].option.columnStyleOverrides = {};
}

// 覆盖样式按 column.key 存取，不是下标——插入/删除列不会导致覆盖样式错位
const overrideOf = (key: string) => {
  const overrides = selectTargetData.value[0].option.columnStyleOverrides;
  if (!overrides[key]) {
    overrides[key] = {};
  }
  return overrides[key];
};

// 每列「样式覆盖」collapse 的展开状态：有覆盖内容就默认展开
const overrideEnabled = reactive<Record<string, boolean>>({});
for (const column of columns.value) {
  overrideEnabled[column.key] = Object.keys(selectTargetData.value[0].option.columnStyleOverrides[column.key] ?? {}).length > 0;
}

// tab 名字只按位置生成（"列1"/"列2"...），与用户可编辑的 title/key 解耦，避免改名导致 tab 错位
const tabNames = computed(() => columns.value.map((_, index) => `列${index + 1}`));
const activeTab = ref(tabNames.value[0]);

let nextColumnSeq = columns.value.length + 1;

const changeColumn = (type: "add" | "delete") => {
  if (type === "add") {
    columns.value.push({ key: `field${nextColumnSeq}`, title: `列${nextColumnSeq}` });
    nextColumnSeq += 1;
    activeTab.value = tabNames.value[tabNames.value.length - 1];
  } else {
    if (columns.value.length <= 1) {
      return;
    }
    const index = tabNames.value.indexOf(activeTab.value);
    const [removed] = columns.value.splice(index, 1);
    if (removed) {
      delete selectTargetData.value[0].option.columnStyleOverrides[removed.key];
    }
    const nextIndex = Math.min(index, columns.value.length - 1);
    activeTab.value = tabNames.value[nextIndex];
  }
  update();
};
</script>

<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

:deep(.el-form-item__label) {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 0;
  display: inline-block;
  margin-right: 12px;
}
</style>
