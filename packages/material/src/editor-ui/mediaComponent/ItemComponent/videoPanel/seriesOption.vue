<template>
  <div style="font-size: 14px; padding: 0 15px">tips: 优先使用"数据-数据接口"渲染视频面板，数据接口为空则使用系列</div>

  <SwCollapseItem title="系列">
    <template #icon>
      <Icon type="CirclePlus" style="color: #fff; margin-bottom: 10px; font-size: 15px" @click="handleAddSeries" />
      <Icon type="Delete" style="color: #fff; margin-bottom: 10px; font-size: 15px" @click="handleDeleteSeries" />
    </template>
    <template #content>
      <ScreenwrightSeriesTabs
        v-if="hasSeriesList"
        @change="updateSerice"
        title="卡片列表"
        v-model="activeSeriesTab"
        :tabs="tabList"
      />
      <div v-if="activeSeriesItem !== null">
        <el-form-item label="标签">
          <sw-input v-model="activeSeriesItem.title" type="text" @change="updateSerice" />
        </el-form-item>
        <el-form-item label="值类型">
          <el-select popper-class="sw-select-dropdown" v-model="activeSeriesItem.urlMode" @change="updateSerice">
            <el-option v-for="item in urlModeOption" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="值：url" v-if="activeSeriesItem.urlMode === 'url'">
          <sw-input
            v-model="activeSeriesItem.url"
            placeholder="例：version-test/assets/defaultImg/video.mp4"
            @change="updateSerice"
          />
        </el-form-item>
        <el-form-item label="值：自定义" v-if="activeSeriesItem.urlMode === 'custom'">
          <sw-upload
            v-model="activeSeriesItem.customUrl"
            :fileType="FileType.video"
            :multiple="false"
            :notImg="true"
            :showFileList="false"
            @change="updateSerice"
            @delete="update"
          />
        </el-form-item>
      </div>
    </template>
  </SwCollapseItem>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";

import { has } from "lodash-es";

import { ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput } from "@screenwright/ui/input";
import { FileType } from "@editor/base/SwUpload/SwUpload";
import SwUpload from "@editor/base/SwUpload/index.vue";
import Icon from "@editor/base/Icon/index.vue";

import { useUpdateInstance } from "../../../useUpdateInstance";
import type { dictString } from "../type";

const { update, selectTargetData } = useUpdateInstance();

const activeSeriesTab = ref<string>("系列1");
const activeSeriesItem = ref<any | null>(null);
const tabList = computed(() => {
  return selectTargetData.value[0].option.seriesList.map((item: any) => item.tabsName);
});

const getSeriesItem = () => {
  activeSeriesItem.value = selectTargetData.value[0].option.seriesList.find(
    (it: any) => it.tabsName === activeSeriesTab.value
  );
};

const handleAddSeries = () => {
  console.log("新增变化==》", selectTargetData.value[0]);
  if (has(selectTargetData.value[0].option, "seriesList")) {
    selectTargetData.value[0].option["seriesList"].push({
      tabsName: "系列" + (selectTargetData.value[0].option["seriesList"].length + 1),
      title: "video" + (selectTargetData.value[0].option["seriesList"].length + 1),
      urlMode: "url",
      url: "version-test/assets/defaultImg/video.mp4",
      customUrl: ""
    });

    selectTargetData.value[0].option["seriesList"].map((item: any) => {
      return {
        name: item.title,
        url: item.urlMode == "url" ? item.url : item.customUrl
      };
    });

    activeSeriesTab.value = "系列" + selectTargetData.value[0].option["seriesList"].length;

    getSeriesItem();

    update();
  }
};

const handleDeleteSeries = () => {
  if (
    has(selectTargetData.value[0].option, "seriesList") &&
    selectTargetData.value[0].option["seriesList"].length > 1
  ) {
    const index = selectTargetData.value[0].option["seriesList"].findIndex(
      (it: any) => it.tabsName === activeSeriesTab.value
    );
    selectTargetData.value[0].option["seriesList"].splice(index, 1);

    selectTargetData.value[0].option["seriesList"].forEach((item: any, index: number) => {
      item.tabsName = "系列" + (index + 1);
    });

    selectTargetData.value[0].option["seriesList"].map((item: any) => {
      return {
        name: item.title,
        url: item.urlMode == "url" ? item.url : item.customUrl
      };
    });

    if (selectTargetData.value[0].option.seriesList.length === 1) {
      activeSeriesTab.value =
        selectTargetData.value[0].option.seriesList[selectTargetData.value[0].option.seriesList.length - 1].tabsName;
    }
    if (index === selectTargetData.value[0].option.seriesList.length) {
      activeSeriesTab.value = selectTargetData.value[0].option.seriesList[index - 1].tabsName;
    }

    // activeSeriesTab.value = "系列" + selectTargetData.value[0].option["seriesList"].length
    getSeriesItem();
    update();
  }
};

const updateSerice = () => {
  if (has(selectTargetData.value[0].option, "seriesList")) {
    selectTargetData.value[0].option["seriesList"].map((item: any) => {
      return {
        name: item.title,
        url: item.urlMode == "url" ? item.url : item.customUrl
      };
    });
    getSeriesItem();
    update();
  }
};

const urlModeOption = reactive<dictString[]>([
  { label: "url", value: "url" },
  { label: "自定义", value: "custom" }
]);

const hasSeriesList = computed<boolean>(() => {
  return has(selectTargetData.value[0].option, "seriesList");
});

onMounted(() => {
  getSeriesItem();
});
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
.sw-label-type {
  width: 100%;
  :deep(.el-select) {
    margin-right: 5px;
  }
  :deep(.el-select__wrapper) {
    min-height: 28px;
  }
  .sw-label-type-number {
    position: relative;
    top: -2px;
  }
}
</style>
