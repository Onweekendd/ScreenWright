<template>
  <div class="custom-table-list-item">
    <sw-collapse-item title="子项内容" open>
      <template #icon>
        <Icon type="circlePlus" @click="handleItem('add')" size="16" />
        <Icon type="Delete" @click="handleItem('delete')" size="16" />
      </template>
      <template #content>
        <ScreenwrightSeriesTabs
          v-model="seriesYTabs"
          :tabs="selectTargetData[0].option.column.map((co: any) => co.seriesYTabsName)"
        />
        <el-form-item label="内容类型" :label-width="secondLabelWidth">
          <el-select
            v-model="selectTargetData[0].option.column[currentColumnIndex].seriesYContentType"
            popper-class="sw-select-dropdown"
            @change="update"
          >
            <el-option v-for="item in contentOption" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <div class="flex flex-between">
          <el-form-item label="是否映射" :label-width="secondLabelWidth">
            <el-checkbox
              v-model="selectTargetData[0].option.column[currentColumnIndex].seriesYIsMapping"
              @change="update"
            />
          </el-form-item>
          <el-form-item
            label="是否外链"
            v-if="selectTargetData[0].option.column[currentColumnIndex].seriesYContentType === 'btn'"
          >
            <el-checkbox v-model="selectTargetData[0].option.column[currentColumnIndex].isLink" @change="update" />
          </el-form-item>
        </div>
        <el-form-item
          label="字段名"
          v-if="selectTargetData[0].option.column[currentColumnIndex].seriesYIsMapping"
          :label-width="secondLabelWidth"
        >
          <sw-input v-model="selectTargetData[0].option.column[currentColumnIndex].alias" @change="update" />
        </el-form-item>
        <!-- 文字 -->
        <WordItem
          ref="wordRef"
          :index="currentColumnIndex"
          v-if="selectTargetData[0].option.column[currentColumnIndex].seriesYContentType === 'word'"
        />
        <!-- 图片 -->
        <ImageItem
          v-if="selectTargetData[0].option.column[currentColumnIndex].seriesYContentType === 'image'"
          :index="currentColumnIndex"
        />
        <!-- 按钮 -->
        <ButtonItem
          v-if="selectTargetData[0].option.column[currentColumnIndex].seriesYContentType === 'btn'"
          :index="currentColumnIndex"
        />
        <!-- 开关 -->
        <SwitchItem
          v-if="selectTargetData[0].option.column[currentColumnIndex].seriesYContentType === 'switch'"
          :index="currentColumnIndex"
        />
      </template>
    </sw-collapse-item>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";

import { cloneDeep } from "lodash-es";

import { ScreenwrightSeriesTabs as ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput } from "@screenwright/ui/input";
import Icon from "@editor/base/Icon/index.vue";

import { useUpdateInstance } from "../../useUpdateInstance";
import ButtonItem from "../textConfig/components/TextFtCustomTableListConfig/Item/ButtonItem.vue";
import ImageItem from "../textConfig/components/TextFtCustomTableListConfig/Item/ImageItem.vue";
import SwitchItem from "../textConfig/components/TextFtCustomTableListConfig/Item/SwitchItem.vue";
import WordItem from "../textConfig/components/TextFtCustomTableListConfig/Item/WordItem.vue";
import { contentType } from "../textConfig/constants";
import { secondLabelWidth } from "../textConfig/textConfig";

const { update, selectTargetData } = useUpdateInstance();
const seriesYTabs = ref("内容1");
const currentColumnIndex = computed(() => {
  return selectTargetData.value[0].option.column.findIndex((it: any) => it.seriesYTabsName === seriesYTabs.value);
});
const wordRef = ref<InstanceType<typeof WordItem> | null>(null);
const handleItem = (type: string) => {
  if (type == "add") {
    const last = cloneDeep(selectTargetData.value[0].option.column[currentColumnIndex.value]);
    last.seriesYTabsName = `内容${selectTargetData.value[0].option.column.length + 1}`;
    last.id = `${selectTargetData.value[0].option.column.length + 1}`;
    selectTargetData.value[0].option.column.push(last);
    seriesYTabs.value = last.seriesYTabsName;
    if (wordRef.value && wordRef.value.initConfig && last.seriesYContentType === "word") {
      wordRef.value.initConfig();
    }
    update();
  } else {
    if (selectTargetData.value[0].option.column.length > 1) {
      const index = selectTargetData.value[0].option.column.findIndex((item: any) => {
        return item.seriesYTabsName === seriesYTabs.value;
      });
      selectTargetData.value[0].option.column.splice(index, 1);

      selectTargetData.value[0].option.column.forEach((item: any, idx: number) => {
        item.seriesYTabsName = `内容${idx + 1}`;
      });

      if (selectTargetData.value[0].option.column.length === 1) {
        seriesYTabs.value =
          selectTargetData.value[0].option.column[selectTargetData.value[0].option.column.length - 1].seriesYTabsName;
      }
      if (index === selectTargetData.value[0].option.column.length) {
        seriesYTabs.value = selectTargetData.value[0].option.column[index - 1].seriesYTabsName;
      }

      // seriesYTabs.value = `内容${selectTargetData.value[0].option.column.length}`

      update();
    }
  }
};
const contentOption = [
  ...contentType.filter((it) => ["word", "image", "btn"].includes(it.value)),
  { label: "开关", value: "switch" }
];

onMounted(async () => {
  await nextTick();
  // 初始化
  if (wordRef.value && wordRef.value.initConfig) {
    wordRef.value.initConfig();
  }
});
</script>

<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

.sw-icon {
  color: #b4b7c1;
  cursor: pointer;
}
</style>
