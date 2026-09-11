<template>
  <div class="raster-progress-bar-interval">
    <SwCollapseItem title="数据区间" open>
      <template #icon>
        <Icon type="CirclePlus" @click="handleAdd" size="14" />
        <Icon type="Delete" @click="handleDelete" size="14" />
      </template>
      <template #content>
        <ScreenwrightSeriesTabs
          v-model="activeTab"
          :tabs="selectTargetData[0].option.sectionList.map((sl: any) => sl.sectionName)"
        />
        <div v-for="(sl, slIndex) in selectTargetData[0].option.sectionList" :key="slIndex">
          <div v-if="sl.sectionName === activeTab">
            <el-form-item label="范围" :label-width="secondLabelWidth">
              <div class="flex flex-center-between" style="width: 100%">
                <sw-input-number v-model="sl.sectionMin" :step="0.1" bottomLabel="最小值" @change="update" width="90" />
                <sw-input-number v-model="sl.sectionMax" :step="0.1" bottomLabel="最大值" @change="update" width="90" />
              </div>
            </el-form-item>
            <el-form-item label="栅格前景色" :label-width="secondLabelWidth">
              <sw-color-picker
                :options="{ colorTypeOption: 'linear-gradient,single' }"
                v-model:color="sl.sectionBgColor"
                v-model:opacity="sl.sectionOpacity"
                field="sectionBgColor"
                @change="update"
              />
            </el-form-item>
            <SwCollapseItem title="指标" open>
              <template #content>
                <el-form-item label="文本样式" title="文本样式" :label-width="38">
                  <configTextStyle
                    @change="
                      (key, value) => {
                        handleConfigTextChange(slIndex, key, value);
                      }
                    "
                    :model-value="getInput(sl)"
                    style="margin-left: 10px"
                  />
                </el-form-item>
                <SwCollapseItem title="背景" open>
                  <template #content>
                    <el-form-item label="图片" :label-width="38">
                      <sw-upload v-model="sl.seriesBgImgSrc" />
                      <div class="flex flex-center-between" style="width: 100%">
                        <sw-input-number v-model="sl.seriesBgImgWidth" bottomLabel="宽度" @change="update" width="90" />
                        <sw-input-number
                          v-model="sl.seriesBgImgHeight"
                          bottomLabel="高度"
                          @change="update"
                          width="90"
                        />
                      </div>
                    </el-form-item>
                    <el-form-item label="偏移" :label-width="38">
                      <div class="flex flex-center-between" style="width: 100%">
                        <sw-input-number
                          controls
                          v-model="sl.seriesBgImgTranslateX"
                          bottomLabel="x"
                          @change="update"
                          width="90"
                        />
                        <sw-input-number
                          v-model="sl.seriesBgImgTranslateY"
                          bottomLabel="y"
                          @change="update"
                          width="90"
                          controls
                        />
                      </div>
                    </el-form-item>
                  </template>
                </SwCollapseItem>
              </template>
            </SwCollapseItem>
          </div>
        </div>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";

import { cloneDeep } from "lodash-es";

import { ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwColorPicker } from "@screenwright/ui/color-picker";
import { SwInputNumber } from "@screenwright/ui/input-number";
import SwUpload from "@editor/base/SwUpload/index.vue";
import Icon from "@editor/base/Icon/index.vue";

import configTextStyle from "../../components/configTextStyle/index.vue";
import { secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const activeTab = ref("区间1");
const handleConfigTextChange = (index: number, key: string, value: any) => {
  const attrsMap: Record<string, any> = {
    color: "seriesColor",
    fontSize: "seriesFontSize",
    fontWeight: "seriesFontWeight",
    fontStyle: "seriesFontStyle",
    fontFamily: "seriesFontFamily"
  };
  selectTargetData.value[0].option.sectionList[index][attrsMap[key]] = value[key];
  update();
};
const getInput = (sl: any) => {
  return {
    color: sl.seriesColor,
    fontSize: sl.seriesFontSize,
    fontWeight: sl.seriesFontWeight,
    fontStyle: sl.seriesFontStyle,
    fontFamily: sl.seriesFontFamily
  };
};
const handleAdd = () => {
  const target = selectTargetData.value[0].option.sectionList.find((item: any) => item.sectionName === activeTab.value);
  if (target) {
    const addData = cloneDeep(target);
    addData.sectionName = `区间${selectTargetData.value[0].option.sectionList.length + 1}`;
    selectTargetData.value[0].option.sectionList.push(addData);
    activeTab.value = addData.sectionName;
    update();
  }

  console.log(selectTargetData.value[0].option.sectionList, "selectTargetData[0].option.sectionList");
};
const handleDelete = () => {
  if (selectTargetData.value[0].option.sectionList.length <= 1) {
    return;
  }
  const index = selectTargetData.value[0].option.sectionList.findIndex(
    (item: any) => item.sectionName === activeTab.value
  );
  if (index !== -1) {
    selectTargetData.value[0].option.sectionList.splice(index, 1);

    selectTargetData.value[0].option.sectionList.forEach((item: any, idx: number) => {
      item.sectionName = `区间${idx + 1}`;
    });

    if (selectTargetData.value[0].option.sectionList.length === 1) {
      activeTab.value =
        selectTargetData.value[0].option.sectionList[
          selectTargetData.value[0].option.sectionList.length - 1
        ].sectionName;
    }
    if (index === selectTargetData.value[0].option.sectionList.length) {
      activeTab.value = selectTargetData.value[0].option.sectionList[index - 1].sectionName;
    }

    update();
  }
};
onMounted(() => {
  activeTab.value = selectTargetData.value[0].option.sectionList[0]?.sectionName || "区间1";
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
