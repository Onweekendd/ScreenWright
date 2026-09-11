<template>
  <div class="sort-ratio-bar-series">
    <SwCollapseItem title="数据系列" open>
      <template #icon>
        <Icon type="CirclePlus" size="14" @click="handleAdd" />
        <Icon type="Delete" size="14" @click="handleDelete" />
      </template>
      <template #content>
        <ScreenwrightSeriesTabs
          v-model="activeSeriesTabsName"
          :tabs="selectTargetData[0].option.seriesList.map((sl: any) => sl.seriesName)"
        />
        <div v-for="(sl, slIndex) in selectTargetData[0].option.seriesList" :key="slIndex">
          <div v-if="sl.seriesName === activeSeriesTabsName">
            <el-form-item label="系列名" :label-width="secondLabelWidth">
              <sw-input v-model="sl.seriesKeyValue" @change="update" />
            </el-form-item>
            <el-form-item label="颜色" :label-width="secondLabelWidth">
              <sw-color-picker
                :options="{ colorTypeOption: 'linear-gradient,single' }"
                v-model:color="sl.seriesBgColor"
                v-model:opacity="sl.seriesOpacity"
                field="seriesBgColor"
                @change="update"
              />
            </el-form-item>

            <el-form-item label="文本样式" title="文本样式" :label-width="secondLabelWidth">
              <configTextStyle
                @change="
                  (key, value) => {
                    handleConfigTextChange(slIndex, key, value);
                  }
                "
                :model-value="getInput(sl)"
              >
                <template #append>
                  <div class="flex flex-center-between" style="width: 100%">
                    <sw-input-number
                      style="margin-left: 12px"
                      v-model="sl.seriesLetterSpacing"
                      bottomLabel="字距"
                      @change="update"
                      width="60"
                    />
                    <sw-input-number v-model="sl.seriesLineHeight" bottomLabel="行距" @change="update" width="60" />
                  </div>
                </template>
              </configTextStyle>
            </el-form-item>

            <el-form-item label="偏移" :label-width="secondLabelWidth">
              <div class="flex flex-center-between" style="width: 100%">
                <sw-input-number width="100" v-model="sl.seriesTranslateX" unit="px" bottomLabel="X" @change="update" />
                <sw-input-number width="100" v-model="sl.seriesTranslateY" unit="px" bottomLabel="Y" @change="update" />
              </div>
            </el-form-item>
            <SwCollapseItem title="后缀" open>
              <template #content>
                <el-form-item label="文本" :label-width="thirdLabelWidth">
                  <sw-input v-model="sl.unitText" @change="update" />
                </el-form-item>
                <el-form-item label="偏移" :label-width="thirdLabelWidth">
                  <div class="flex flex-center-between" style="width: 100%">
                    <sw-input-number
                      width="100"
                      v-model="sl.unitTranslateX"
                      controls
                      bottomLabel="X"
                      @change="update"
                    />
                    <sw-input-number
                      width="100"
                      v-model="sl.unitTranslateY"
                      controls
                      bottomLabel="Y"
                      @change="update"
                    />
                  </div>
                </el-form-item>

                <el-form-item title="自定义样式" label="自定义样式" :label-width="38">
                  <el-checkbox style="margin-left: 10px" v-model="sl.isUnitCustomStyle" @change="update" />
                </el-form-item>
                <el-form-item label="文本样式" :label-width="38" v-if="sl.isUnitCustomStyle">
                  <configTextStyle
                    @change="
                      (key, value) => {
                        handleUnitTextChange(slIndex, key, value);
                      }
                    "
                    :model-value="getUnitInput(sl)"
                    style="margin-left: 10px"
                  >
                    <template #append>
                      <div class="flex flex-center-between" style="width: 100%">
                        <sw-input-number
                          style="margin-left: 12px"
                          v-model="sl.unitLetterSpacing"
                          bottomLabel="字距"
                          @change="update"
                          width="60"
                        />
                        <sw-input-number v-model="sl.unitLineHeight" bottomLabel="行距" @change="update" width="60" />
                      </div>
                    </template>
                  </configTextStyle>
                </el-form-item>
              </template>
            </SwCollapseItem>
          </div>
        </div>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { onMounted } from "vue";

import { cloneDeep } from "lodash-es";

import { ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwColorPicker } from "@screenwright/ui/color-picker";
import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber } from "@screenwright/ui/input-number";
import Icon from "@editor/base/Icon/index.vue";

import configTextStyle from "../../components/configTextStyle/index.vue";
import { secondLabelWidth, thirdLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const activeSeriesTabsName = ref("系列1");
const handleConfigTextChange = (index: number, key: string, value: any) => {
  const attrsMap: Record<string, any> = {
    color: "seriesColor",
    fontSize: "seriesFontSize",
    fontWeight: "seriesFontWeight",
    fontStyle: "seriesFontStyle",
    fontFamily: "seriesFontFamily"
  };
  selectTargetData.value[0].option.seriesList[index][attrsMap[key]] = value[key];
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

const getUnitInput = (sl: any) => {
  return {
    color: sl.unitColor,
    fontSize: sl.unitFontSize,
    fontWeight: sl.unitFontWeight,
    fontStyle: sl.unitFontStyle,
    fontFamily: sl.unitFontFamily
  };
};
const handleUnitTextChange = (index: number, key: string, value: any) => {
  const attrsMap: Record<string, any> = {
    color: "unitColor",
    fontSize: "unitFontSize",
    fontWeight: "unitFontWeight",
    fontStyle: "unitFontStyle",
    fontFamily: "unitFontFamily"
  };
  selectTargetData.value[0].option.seriesList[index][attrsMap[key]] = value[key];
  update();
};

const handleAdd = () => {
  const target = selectTargetData.value[0].option.seriesList.find(
    (item: any) => item.seriesName === activeSeriesTabsName.value
  );
  if (target) {
    const addData = cloneDeep(target);
    addData.seriesName = `系列${selectTargetData.value[0].option.seriesList.length + 1}`;
    selectTargetData.value[0].option.seriesList.push(addData);
    activeSeriesTabsName.value = addData.seriesName;
    update();
  }

  console.log(selectTargetData.value[0].option.seriesList, "selectTargetData[0].option.sectionList");
};
const handleDelete = () => {
  if (selectTargetData.value[0].option.seriesList.length <= 1) {
    return;
  }
  const index = selectTargetData.value[0].option.seriesList.findIndex(
    (item: any) => item.seriesName === activeSeriesTabsName.value
  );
  if (index !== -1) {
    selectTargetData.value[0].option.seriesList.splice(index, 1);
    selectTargetData.value[0].option.seriesList.forEach((item: any, idx: number) => {
      item.seriesName = `系列${idx + 1}`;
    });
    if (selectTargetData.value[0].option.seriesList.length === 1) {
      activeSeriesTabsName.value =
        selectTargetData.value[0].option.seriesList[selectTargetData.value[0].option.seriesList.length - 1].seriesName;
    }
    if (index === selectTargetData.value[0].option.seriesList.length) {
      activeSeriesTabsName.value = selectTargetData.value[0].option.seriesList[index - 1].seriesName;
    }
    update();
  }
};

onMounted(() => {
  if (selectTargetData.value.length > 0) {
    const seriesList = selectTargetData.value[0].option.seriesList;
    if (seriesList && seriesList.length > 0) {
      activeSeriesTabsName.value = seriesList[0].seriesName;
    }
  }
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
