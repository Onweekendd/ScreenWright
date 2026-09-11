<template>
  <sw-collapse-item title="数据路线" open>
    <template #icon>
      <Icon type="CirclePlus" @click="addLink" />
      <Icon type="Delete" @click="deleteLink" />
    </template>
    <template #content>
      <ScreenwrightSeriesTabs v-model="linkTabs" :tabs="selectTargetData[0].option.linkName" />

      <el-form-item label="节点" :label-width="secondLabelWidth">
        <div class="fullWidth flex flex-center-between">
          <el-select
            @change="update"
            style="width: 90px"
            v-model="selectTargetData[0].option.links[currentIndex].source"
            popper-class="sw-select-dropdown"
          >
            <el-option v-for="item in pointOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <el-select
            @change="update"
            style="width: 90px"
            v-model="selectTargetData[0].option.links[currentIndex].target"
            popper-class="sw-select-dropdown"
          >
            <el-option v-for="item in pointOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>
      </el-form-item>
      <el-form-item label="宽度" :label-width="secondLabelWidth">
        <sw-input-number
          @change="update"
          v-model="selectTargetData[0].option.links[currentIndex].value"
          :controls="false"
        />
      </el-form-item>
      <el-form-item label="颜色类型" :label-width="secondLabelWidth">
        <el-select
          @change="update"
          v-model="selectTargetData[0].option.links[currentIndex].color"
          popper-class="sw-select-dropdown"
        >
          <el-option v-for="item in graphLineColorType" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="路线类型" :label-width="secondLabelWidth">
        <el-select
          @change="update"
          v-model="selectTargetData[0].option.seriesLinksLineType[currentIndex]"
          popper-class="sw-select-dropdown"
        >
          <el-option v-for="item in lineType" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
    </template>
  </sw-collapse-item>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import { ScreenwrightSeriesTabs as ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";
import Icon from "@editor/base/Icon/index.vue";

import { secondLabelWidth } from "../../../constants";
import { graphLineColorType, lineType } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";
import { useSeries } from "../../ItemComponent/ItemSeries/useSeries";

const { selectTargetData, update } = useUpdateInstance();

const linkTabs = ref("路线1");

const currentIndex = computed(() => {
  return selectTargetData.value[0].option.linkName.indexOf(linkTabs.value);
});

const pointOptions = computed(() => {
  return selectTargetData.value[0].data.map((item: any) => {
    return {
      label: item.name,
      value: item.name
    };
  });
});
const { handleAddSeries: handleAddLink, handleDeleteSeries: handleDeleteLink } = useSeries({
  list: ["links", "seriesLinksLineType"],
  activeTab: linkTabs,
  seriesName: "linkName",
  limitNum: 1,
  sName: "路线"
});
const addLink = () => {
  handleAddLink();
};

const deleteLink = () => {
  handleDeleteLink();
};
</script>
<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
</style>
