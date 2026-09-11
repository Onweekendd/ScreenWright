<template>
  <sw-collapse-item
    title="行状态"
    v-model="selectTargetData[0].option.rowConfig.listRowStatusShow"
    showIcon
    @change="update"
  >
    <template #title>
      行状态
      <el-tooltip effect="dark" content="开启行状态后，优先取行状态配置，其次是行的默认配置" placement="top">
        <Icon type="QuestionFilled" size="12" />
      </el-tooltip>
    </template>
    <template #content>
      <el-form-item label="映射字段" :label-width="secondLabelWidth">
        <sw-input v-model="selectTargetData[0].option.rowConfig.listRowMappingKey" @change="update" />
      </el-form-item>
      <sw-collapse-item title="状态值" open>
        <template #icon>
          <Icon type="CirclePlus" @click="handleSeriesXChange('add')" size="14" />
          <Icon type="Delete" @click="handleSeriesXChange('delete')" size="14" />
        </template>
        <template #content>
          <template
            v-if="
              selectTargetData[0].option.rowConfig.listRowStatusList &&
              selectTargetData[0].option.rowConfig.listRowStatusList.length > 0
            "
          >
            <ScreenwrightSeriesTabs
              v-model="seriesXTabs"
              :tabs="selectTargetData[0].option.rowConfig.listRowStatusList.map((lrsl: any) => lrsl.seriesXTabsName)"
            />
            <div v-for="(item, index) in selectTargetData[0].option.rowConfig.listRowStatusList" :key="index">
              <div v-if="item.seriesXTabsName === seriesXTabs">
                <el-form-item label="状态值" :label-width="thirdLabelWidth">
                  <sw-input v-model="item.seriesXBackgroundMappingStatus" @change="update" />
                </el-form-item>
                <sw-collapse-item class="second_collapse" title="背景" open>
                  <template #content>
                    <el-form-item label="填充方式" :label-width="28" title="填充方式">
                      <el-select
                        v-model="item.seriesXBackgroundType"
                        popper-class="sw-select-dropdown"
                        @change="update"
                      >
                        <el-option
                          v-for="item in backgroundType"
                          :key="item.value"
                          :label="item.label"
                          :value="item.value"
                        />
                      </el-select>
                    </el-form-item>
                    <el-form-item
                      label="颜色"
                      v-if="item.seriesXBackgroundType === 'color'"
                      :label-width="thirdLabelWidth"
                    >
                      <sw-single-color-picker
                        field="seriesXBackgroundColor"
                        v-model="item.seriesXBackgroundColor"
                        @change="update"
                      />
                    </el-form-item>
                    <el-form-item
                      label="图片"
                      v-if="item.seriesXBackgroundType === 'custom'"
                      :label-width="thirdLabelWidth"
                    >
                      <sw-upload
                        v-model="item.seriesXBackgroundImage"
                        :multiple="false"
                        :showFileList="false"
                        @change="update"
                        @delete="update"
                      />
                    </el-form-item>
                  </template>
                </sw-collapse-item>
              </div>
            </div>
          </template>
          <el-form-item label="列表为空" v-else />
        </template>
      </sw-collapse-item>
    </template>
  </sw-collapse-item>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { ScreenwrightSeriesTabs as ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput } from "@screenwright/ui/input";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import SwUpload from "@editor/base/SwUpload/index.vue";
import Icon from "@editor/base/Icon/index.vue";

import { useUpdateInstance } from "../../../../../useUpdateInstance";
import { backgroundType } from "../../../constants";
import { secondLabelWidth, thirdLabelWidth } from "../../../textConfig";

const { update, selectTargetData } = useUpdateInstance();
const seriesXTabs = ref("状态1");
const handleSeriesXChange = (val: string) => {
  console.log(val);
  const defaultItem = {
    seriesXTabsName: "状态",
    seriesXBackgroundMappingStatus: "",
    seriesXBackgroundType: "",
    seriesXBackgroundColor: "rgba(255,255,255,1)",
    seriesXBackgroundImage: ""
  };
  if (val === "add") {
    defaultItem.seriesXTabsName = "状态" + (selectTargetData.value[0].option.rowConfig.listRowStatusList.length + 1);
    seriesXTabs.value = defaultItem.seriesXTabsName;
    selectTargetData.value[0].option.rowConfig.listRowStatusList.push(defaultItem);
  } else {
    const index = selectTargetData.value[0].option.rowConfig.listRowStatusList.findIndex((item: any) => {
      return item.seriesXTabsName === seriesXTabs.value;
    });

    selectTargetData.value[0].option.rowConfig.listRowStatusList.splice(index, 1);

    selectTargetData.value[0].option.rowConfig.listRowStatusList.forEach((item: any, idx: number) => {
      item.seriesXTabsName = "状态" + (idx + 1);
    });

    if (selectTargetData.value[0].option.rowConfig.listRowStatusList.length === 1) {
      seriesXTabs.value = selectTargetData.value[0].option.rowConfig.listRowStatusList[0].seriesXTabsName;
    }
    if (index === selectTargetData.value[0].option.rowConfig.listRowStatusList.length && index > 0) {
      seriesXTabs.value = selectTargetData.value[0].option.rowConfig.listRowStatusList[index - 1].seriesXTabsName;
    }
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
  margin-right: 1px;
}
</style>
