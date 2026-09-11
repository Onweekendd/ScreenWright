<template>
  <div class="item-zebra2-tooltip">
    <sw-collapse-item title="提示框" open>
      <template #content>
        <el-form-item label="偏移" :label-width="secondLabelWidth">
          <div class="fullWidth flex flex-center-between">
            <sw-input-number
              v-model.number="selectTargetData[0].option.tooltipOffsetX"
              unit="px"
              bottomLabel="X"
              :controls="false"
              width="90"
              @change="update"
            />
            <sw-input-number
              v-model.number="selectTargetData[0].option.tooltipOffsetY"
              unit="px"
              bottomLabel="Y"
              :controls="false"
              width="90"
              @change="update"
            />
          </div>
        </el-form-item>
        <el-form-item label="背景图" :label-width="secondLabelWidth">
          <sw-upload
            v-model="selectTargetData[0].option.tooltipBackground"
            :multiple="false"
            :showFileList="false"
            @change="update"
            @delete="update"
          />
        </el-form-item>
        <el-form-item label="背景尺寸" :label-width="secondLabelWidth">
          <div class="fullWidth flex flex-center-between">
            <sw-input-number
              v-model.number="selectTargetData[0].option.tooltipWidth"
              unit="W"
              bottomLabel="宽度"
              :min="0"
              :controls="false"
              width="90"
              @change="update"
            />
            <sw-input-number
              v-model.number="selectTargetData[0].option.tooltipHeight"
              unit="H"
              bottomLabel="高度"
              :min="0"
              :controls="false"
              width="90"
              @change="update"
            />
          </div>
        </el-form-item>
        <!-- 边距 -->
        <ItemConfigDistance type="zebra" :labelWidth="secondLabelWidth" />
        <div class="third_collapse">
          <sw-collapse-item title="框内数据" open>
            <template #content>
              <sw-collapse-item title="类目标签" open>
                <template #content>
                  <el-form-item label="文本样式" :label-width="fourthLabelWidth" title="文本样式">
                    <ConfigTextStyle v-model="tooltipNameInput" @change="handleTooltipNameChange" />
                  </el-form-item>
                  <ItemSelectAlign
                    v-model="selectTargetData[0].option.tooltipAlign"
                    @change="update"
                    :type="typeAttrs.defaultWithThree"
                    :labelWidth="fourthLabelWidth"
                  />
                  <el-form-item label="下间距" title="下间距" :label-width="fourthLabelWidth">
                    <sw-input-number
                      style="width: 100%"
                      v-model="selectTargetData[0].option.tooltipLabelGapSapce"
                      @change="update"
                      controls
                      :min="0"
                    />
                  </el-form-item>
                  <el-form-item label="偏移" :label-width="fourthLabelWidth">
                    <div class="fullWidth flex flex-center-between">
                      <sw-input-number
                        v-model.number="selectTargetData[0].option.tooltipNameOffsetX"
                        unit="px"
                        bottomLabel="X"
                        :controls="false"
                        width="90"
                        @change="update"
                      />
                      <sw-input-number
                        v-model.number="selectTargetData[0].option.tooltipNameOffsetY"
                        unit="px"
                        bottomLabel="Y"
                        :controls="false"
                        width="90"
                        @change="update"
                      />
                    </div>
                  </el-form-item>
                </template>
              </sw-collapse-item>
              <sw-collapse-item title="数据" open>
                <template #content>
                  <el-form-item label="行间距" title="行间距" :label-width="fourthLabelWidth">
                    <sw-input-number
                      v-model="selectTargetData[0].option.tooltipArrLineHeight"
                      controls
                      @change="update"
                    />
                  </el-form-item>
                  <el-form-item label="图标尺寸" title="图标尺寸" :label-width="fourthLabelWidth">
                    <sw-input-number v-model="selectTargetData[0].option.tooltipMarkerSize" controls @change="update" />
                  </el-form-item>
                  <el-form-item label="图标显示" title="图标显示" :label-width="fourthLabelWidth">
                    <el-switch
                      v-model="selectTargetData[0].option.tooltipMarkerShow"
                      @change="update"
                      class="ft-switch"
                    />
                  </el-form-item>
                  <el-form-item label="系列名称" title="系列名称" :label-width="fourthLabelWidth">
                    <ConfigTextStyle v-model="tooltipSeriesNameInput" @change="handleTooltipSeriesNameChange" />
                  </el-form-item>
                  <el-form-item label="偏移" :label-width="fourthLabelWidth" title="偏移">
                    <div class="fullWidth flex flex-center-between">
                      <sw-input-number
                        v-model.number="selectTargetData[0].option.tooltipLabelOffsetX"
                        unit="px"
                        bottomLabel="X"
                        :controls="false"
                        width="90"
                        @change="update"
                      />
                      <sw-input-number
                        v-model.number="selectTargetData[0].option.tooltipLabelOffsetY"
                        unit="px"
                        bottomLabel="Y"
                        :controls="false"
                        width="90"
                        @change="update"
                      />
                    </div>
                  </el-form-item>
                  <el-form-item label="系列值" title="系列值" :label-width="fourthLabelWidth">
                    <ConfigTextStyle v-model="tooltipValueInput" @change="handleTooltipValueChange" />
                  </el-form-item>
                  <el-form-item label="偏移" :label-width="fourthLabelWidth">
                    <div class="fullWidth flex flex-center-between">
                      <sw-input-number
                        v-model.number="selectTargetData[0].option.tooltipValueOffsetX"
                        unit="px"
                        bottomLabel="X"
                        :controls="false"
                        width="90"
                        @change="update"
                      />
                      <sw-input-number
                        v-model.number="selectTargetData[0].option.tooltipValueOffsetY"
                        unit="px"
                        bottomLabel="Y"
                        :controls="false"
                        width="90"
                        @change="update"
                      />
                    </div>
                  </el-form-item>
                  <div class="fourth_collapse">
                    <sw-collapse-item title="后缀" open>
                      <template #icon>
                        <Icon type="CirclePlus" @click="handleAddSeries" size="14" />
                        <Icon type="Delete" @click="handleDeleteSeries" size="14" />
                      </template>
                      <template #content>
                        <ScreenwrightSeriesTabs v-model="unitTabs" :tabs="selectTargetData[0].option.unitTabsName" />
                        <el-form-item label="映射" :label-width="fourthLabelWidth">
                          <div class="fullWidth flex flex-center-between">
                            <sw-input
                              v-model="selectTargetData[0].option.dataUnitName[currentIndex]"
                              bottomLabel="字段名"
                              width="90"
                              @change="update"
                            />
                            <sw-input
                              v-model="selectTargetData[0].option.unitTabsName[currentIndex].value"
                              bottomLabel="显示名"
                              width="90"
                              @change="update"
                            />
                          </div>
                        </el-form-item>
                        <el-form-item label="文本样式" title="文本样式" :label-width="fourthLabelWidth">
                          <ConfigTextStyle v-model="tooltipUnitInput" @change="handleTooltipUnitChange" />
                        </el-form-item>
                        <el-form-item label="偏移" :label-width="fourthLabelWidth">
                          <div class="fullWidth flex flex-center-between">
                            <sw-input-number
                              v-model.number="selectTargetData[0].option.tooltipUnitOffsetX"
                              unit="px"
                              bottomLabel="X"
                              :controls="false"
                              width="90"
                              @change="update"
                            />
                            <sw-input-number
                              v-model.number="selectTargetData[0].option.tooltipUnitOffsetY"
                              unit="px"
                              bottomLabel="Y"
                              :controls="false"
                              width="90"
                              @change="update"
                            />
                          </div>
                        </el-form-item>
                      </template>
                    </sw-collapse-item>
                  </div>
                </template>
              </sw-collapse-item>
            </template>
          </sw-collapse-item>
        </div>
      </template>
    </sw-collapse-item>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import { ScreenwrightSeriesTabs as ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber } from "@screenwright/ui/input-number";
import SwUpload from "@editor/base/SwUpload/index.vue";
import Icon from "@editor/base/Icon/index.vue";

import ConfigTextStyle from "../../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../../components/configTextStyle/useTextStyleAttrs";
import { fourthLabelWidth, secondLabelWidth } from "../../../constants";
import ItemSelectAlign from "../../../textComponent/textConfig/ItemComponent/ItemSelectAlign/index.vue";
import { typeAttrs } from "../../../textComponent/textConfig/ItemComponent/ItemSelectAlign/ItemSelectAlign";
import { useUpdateInstance } from "../../../useUpdateInstance";
import ItemConfigDistance from "../ItemConfigDistance/index.vue";
import { useSeries } from "../ItemSeries/useSeries";

const currentIndex = computed(() => {
  return selectTargetData.value[0].option.unitTabsName.findIndex((item: any) => item.name === unitTabs.value);
});
const { selectTargetData, update } = useUpdateInstance();
const unitTabs = ref("后缀1");

const { handleAddSeries, handleDeleteSeries } = useSeries({
  list: ["dataUnitName"],
  activeTab: unitTabs,
  seriesName: "unitTabsName",
  limitNum: 1,
  sName: "后缀"
});
const { input: tooltipNameInput, handleConfigTextChange: handleTooltipNameChange } = useFontStyleAttrs({
  fontFamily: "tooltipNameFontFamily",
  fontSize: "tooltipNameFontSize",
  fontWeight: "tooltipNameFontWeight",
  color: "tooltipNameColor",
  fontStyle: "tooltipNameFontStyle"
});
const { input: tooltipValueInput, handleConfigTextChange: handleTooltipValueChange } = useFontStyleAttrs({
  fontFamily: "tooltipValueFontFamily",
  fontSize: "tooltipValueFontSize",
  fontWeight: "tooltipValueFontWeight",
  color: "tooltipValueColor",
  fontStyle: "tooltipValueFontStyle"
});
const { input: tooltipUnitInput, handleConfigTextChange: handleTooltipUnitChange } = useFontStyleAttrs({
  fontFamily: "tooltipUnitFontFamily",
  fontSize: "tooltipUnitFontSize",
  fontWeight: "tooltipUnitFontWeight",
  color: "tooltipUnitColor",
  fontStyle: "tooltipUnitFontStyle"
});
const { input: tooltipSeriesNameInput, handleConfigTextChange: handleTooltipSeriesNameChange } = useFontStyleAttrs({
  fontFamily: "tooltipSeriesNameFontFamily",
  fontSize: "tooltipSeriesNameFontSize",
  fontWeight: "tooltipSeriesNameFontWeight",
  color: "tooltipSeriesNameColor",
  fontStyle: "tooltipSeriesNameFontStyle"
});
</script>
<style lang="scss" scoped>
:deep(.el-form-item__label) {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 0;
  display: inline-block;
  margin-right: 1px;
}
</style>
