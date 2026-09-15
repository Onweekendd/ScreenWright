<template>
  <sw-collapse-item title="列" open>
    <template #icon>
      <Icon type="CirclePlus" @click="changeYSeries('add')" size="14" />
      <Icon type="Delete" @click="changeYSeries('delete')" size="14" />
    </template>
    <template #content>
      <ScreenwrightSeriesTabs v-model="seriesYTabs" :tabs="selectTargetData[0].option.seriesYTabsName" />
      <div v-for="(item, index) in selectTargetData[0].option.seriesYTabsName" :key="index">
        <div v-if="selectTargetData[0].option.seriesYTabsName[index] === seriesYTabs">
          <!-- {{ seriesYTabs }} -->
          <el-form-item label="映射" :label-width="labelWidth">
            <div class="flex flex-center-between">
              <sw-input v-model="selectTargetData[0].option.column[index].alias" bottomLabel="字段名" />
              <sw-input v-model="selectTargetData[0].option.column[index].name" bottomLabel="显示名" />
            </div>
          </el-form-item>
          <el-form-item label="表头图标" :label-width="labelWidth">
            <sw-upload
              v-model="selectTargetData[0].option.column[index].icon"
              :multiple="false"
              :showFileList="false"
              @change="update"
              @delete="update"
            />
          </el-form-item>
          <el-form-item label="列宽" :label-width="labelWidth">
            <sw-input-number
              v-model.number="selectTargetData[0].option.seriesYWidth[index]"
              unit="px"
              :controls="false"
            />
          </el-form-item>
          <el-form-item label="列间距" :label-width="labelWidth">
            <sw-input-number
              v-model.number="selectTargetData[0].option.seriesYMarginLeft[index]"
              unit="px"
              :controls="false"
              @change="update"
            />
          </el-form-item>
          <el-form-item label="偏移" :label-width="labelWidth">
            <div class="flex flex-center-between">
              <sw-input-number
                v-model.number="selectTargetData[0].option.seriesYOffsetX[index]"
                unit="px"
                bottomLabel="X"
                :controls="false"
                @change="update"
              />
              <sw-input-number
                v-model.number="selectTargetData[0].option.seriesYOffsetY[index]"
                unit="px"
                bottomLabel="Y"
                :controls="false"
                @change="update"
              />
            </div>
          </el-form-item>

          <el-form-item label="内容类型" :label-width="labelWidth">
            <el-select
              v-model="selectTargetData[0].option.seriesYContentType[index]"
              popper-class="sw-select-dropdown"
              @change="update"
            >
              <el-option
                v-for="item in contentType.slice(0, 3)"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <sw-collapse-item
            title="状态配置"
            v-if="selectTargetData[0].option.seriesYContentType[index] === 'statusImg'"
          >
            <template #icon>
              <Icon type="CirclePlus" @click="changeStatus('add', index)" />
              <Icon type="Delete" @click="changeStatus('delete', index)" />
            </template>
            <template #content>
              <template
                v-if="
                  selectTargetData[0].option.statusConfigName[index].length > 0 &&
                  selectTargetData[0].option.statusConfigValue[index].length > 0
                "
              >
                <ScreenwrightSeriesTabs v-model="statusTabs" :tabs="selectTargetData[0].option.statusConfigName[index]" />
                <div
                  v-for="(styleItem, styleIndex) in selectTargetData[0].option.statusConfigName[index]"
                  :key="styleIndex"
                >
                  <div v-if="selectTargetData[0].option.statusConfigName[index][styleIndex] === statusTabs">
                    <el-form-item label="状态值">
                      <sw-input
                        v-model="selectTargetData[0].option.statusConfigValue[index][styleIndex]"
                        @change="update"
                      />
                    </el-form-item>
                    <el-form-item label="图片">
                      <sw-upload
                        v-model="selectTargetData[0].option.statusConfigImg[index][styleIndex]"
                        :multiple="false"
                        :showFileList="false"
                        @change="update"
                        @delete="update"
                      />
                    </el-form-item>
                    <el-form-item label="尺寸">
                      <div class="flex flex-center-between">
                        <sw-input-number
                          v-model.number="selectTargetData[0].option.statusConfigWidth[index][styleIndex]"
                          unit="px"
                          bottomLabel="宽度"
                          :controls="false"
                          @change="update"
                        />
                        <sw-input-number
                          v-model.number="selectTargetData[0].option.statusConfigHeight[index][styleIndex]"
                          unit="px"
                          bottomLabel="高度"
                          :controls="false"
                          @change="update"
                        />
                      </div>
                    </el-form-item>
                  </div>
                </div>
              </template>
              <el-form-item label="列表为空" v-else />
            </template>
          </sw-collapse-item>
          <div v-else-if="selectTargetData[0].option.seriesYContentType[index] !== 'image'">
            <el-form-item
              label="文字溢出"
              :label-width="labelWidth"
              v-if="selectTargetData[0].option.seriesYContentType[index] === 'word'"
            >
              <el-select
                v-model="selectTargetData[0].option.seriesYOverFlow[index]"
                popper-class="sw-select-dropdown"
                @change="update"
              >
                <el-option v-for="item in textOverFlow" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="文本样式" :label-width="labelWidth">
              <configTextStyle
                v-model="seriesYConfig[index]"
                @change="(key: string, val: any) => handleSwitchFontStyleChange(key, val, index, 'seriesY')"
              />
            </el-form-item>
            <template v-if="selectTargetData[0].option.seriesYContentType[index] === 'number'">
              <el-form-item label="保留小数" :label-width="labelWidth">
                <sw-input-number
                  v-model="selectTargetData[0].option.decimalSave[index]"
                  unit="位"
                  :controls="false"
                  @change="update"
                />
              </el-form-item>
              <el-form-item label="百分比化" :label-width="labelWidth">
                <el-checkbox v-model="selectTargetData[0].option.percentageShow[index]" @change="update" />
              </el-form-item>
              <el-form-item label="千分位分割" :label-width="labelWidth">
                <el-checkbox v-model="selectTargetData[0].option.thousandSplit[index]" @change="update" />
              </el-form-item>
              <sw-collapse-item title="后缀" v-model="selectTargetData[0].option.suffixShow[index]" showIcon>
                <template #content>
                  <el-form-item label="内容" :label-width="secendWidth">
                    <sw-input v-model="selectTargetData[0].option.suffixContent[index]" @change="update" />
                  </el-form-item>
                  <el-form-item label="文本样式" :label-width="secendWidth">
                    <configTextStyle
                      v-model="suffixConfig[index]"
                      @change="(key: string, val: any) => handleSwitchFontStyleChange(key, val, index, 'suffix')"
                    />
                  </el-form-item>
                  <el-form-item label="偏移" :label-width="secendWidth">
                    <div class="flex flex-center-between">
                      <sw-input-number
                        v-model.number="selectTargetData[0].option.suffixOffsetX[index]"
                        unit="px"
                        bottomLabel="X"
                        :controls="false"
                        @change="update"
                      />
                      <sw-input-number
                        v-model.number="selectTargetData[0].option.suffixOffsetY[index]"
                        unit="px"
                        bottomLabel="Y"
                        :controls="false"
                        @change="update"
                      />
                    </div>
                  </el-form-item>
                </template>
              </sw-collapse-item>
            </template>
          </div>
        </div>
      </div>
    </template>
  </sw-collapse-item>
</template>

<script lang="ts" setup>
import { ref } from "vue";

import { clone, cloneDeep, isArray, isPlainObject } from "lodash-es";

import { ScreenwrightSeriesTabs as ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber } from "@screenwright/ui/input-number";
import SwUpload from "@editor/base/SwUpload/index.vue";
import Icon from "@editor/base/Icon/index.vue";

import { capitalizeFirstLetter } from "@editor/utils";
import configTextStyle from "@editor/components/configTextStyle/index.vue";
import { useUpdateInstance } from "../../useUpdateInstance";
import { contentType, textOverFlow } from "../textConfig/constants";

const { selectTargetData, update } = useUpdateInstance();
const seriesYTabs = ref("列1");
const statusTabs = ref();
const labelWidth = 73;
const secendWidth = 48;
const seriesYConfig = ref<any[]>([]);
const suffixConfig = ref<any[]>([]);
const list = [
  "seriesYWidth",
  "seriesYMarginLeft",
  "seriesYOffsetX",
  "seriesYBackground",
  "seriesYOffsetY",
  "seriesYTOverFlow",
  "seriesYFontFamily",
  "seriesYFontSize",
  "seriesYlineHeight",
  "seriesYletterSpacing",
  "seriesYFontStyle",
  "seriesYFontWeight",
  "seriesYColor",
  "seriesYContentType",
  "column",
  "styleAssignKeyValue",
  "styleAssignFontFamily",
  "styleAssignFontSize",
  "styleAssignHeight",
  "styleAssignletterSpacing",
  "styleAssignColor",
  "styleAssignFontStyle",
  "styleAssignFontWeight",
  "styleAssignName",
  "statusConfigValue",
  "statusConfigImg",
  "statusConfigWidth",
  "statusConfigHeight",
  "statusConfigName",
  "maskImage",
  "imageWidth",
  "imageHeight",
  "suffixShow",
  "thousandSplit",
  "percentageShow",
  "suffixFontSize",
  "suffixFontFamily",
  "suffixletterSpacing",
  "suffixFontStyle",
  "suffixFontWeight",
  "suffixColor",
  "suffixlineHeight",
  "suffixOffsetY",
  "suffixContent"
];
const changeYSeries = (type: string) => {
  const index = selectTargetData.value[0].option.seriesYTabsName.findIndex((itemName: string) => {
    return itemName === seriesYTabs.value;
  });
  if (type === "add") {
    const lastSeriesYTabsName = `列${selectTargetData.value[0].option.seriesYTabsName.length + 1}`;
    selectTargetData.value[0].option.seriesYTabsName.push(lastSeriesYTabsName);
    for (let i = 0; i < list.length; i++) {
      const itemName = list[i];

      if (isArray(selectTargetData.value[0].option[itemName])) {
        const cp = isPlainObject(selectTargetData.value[0].option[itemName][index])
          ? cloneDeep(selectTargetData.value[0].option[itemName][index])
          : clone(selectTargetData.value[0].option[itemName][index]);
        selectTargetData.value[0].option[itemName].push(cp);
      }
    }
    seriesYTabs.value = lastSeriesYTabsName;
  } else {
    if (selectTargetData.value[0].option.seriesYTabsName.length > 1) {
      selectTargetData.value[0].option.seriesYTabsName.splice(index, 1);
      for (let i = 0; i < list.length; i++) {
        const itemName = list[i];
        if (isArray(selectTargetData.value[0].option[itemName])) {
          selectTargetData.value[0].option[itemName].splice(index, 1);
        }
      }

      selectTargetData.value[0].option.column.forEach((_item: string, idx: number) => {
        selectTargetData.value[0].option.seriesYTabsName[idx] = "列" + (idx + 1);
      });

      if (selectTargetData.value[0].option.seriesYTabsName.length === 1) {
        seriesYTabs.value = selectTargetData.value[0].option.seriesYTabsName[0];
      }
      if (index === selectTargetData.value[0].option.seriesYTabsName.length && index > 0) {
        seriesYTabs.value = selectTargetData.value[0].option.seriesYTabsName[index - 1];
      }
    }
  }
  update();
};
const changeStatus = (type: string, index: number) => {
  const list = ["statusConfigValue", "statusConfigImg", "statusConfigWidth", "statusConfigHeight"];
  const len = selectTargetData.value[0].option.statusConfigName[index].length;
  if (type === "add") {
    selectTargetData.value[0].option.statusConfigName[index].push(`状态${len + 1}`);

    if (len === 0) {
      selectTargetData.value[0].option.statusConfigValue[index].push("");
      selectTargetData.value[0].option.statusConfigImg[index].push("");
      selectTargetData.value[0].option.statusConfigWidth[index].push(12);
      selectTargetData.value[0].option.statusConfigHeight[index].push(12);
    } else {
      list.forEach((item) => {
        selectTargetData.value[0].option[item][index].push(selectTargetData.value[0].option[item][index][len - 1]);
      });
    }
  } else if (type === "delete" && len > 0) {
    const deleteIndex = selectTargetData.value[0].option.statusConfigName[index].findIndex(
      (it: string) => it === statusTabs.value
    );
    list.forEach((item) => {
      if (deleteIndex !== -1) {
        selectTargetData.value[0].option[item]?.[index]?.splice(deleteIndex, 1);
      }
    });
    selectTargetData.value[0].option.statusConfigName[index].splice(deleteIndex, 1);
    selectTargetData.value[0].option.statusConfigName[index] = selectTargetData.value[0].option.statusConfigName[
      index
    ].map((_it: any, idx: number) => {
      return `状态${idx + 1}`;
    });
  }
};
const handleSwitchFontStyleChange = (key: string, val: any, index: number, preFiled: string) => {
  selectTargetData.value[0].option[`${preFiled}${capitalizeFirstLetter(key)}`][index] = val[key];
  update();
};
const init = () => {
  seriesYConfig.value = selectTargetData.value[0].option.seriesYTabsName.map((item: any, index: number) => {
    return {
      fontWeight: selectTargetData.value[0].option.seriesYFontWeight[index],
      fontSize: selectTargetData.value[0].option.seriesYFontSize[index],
      fontFamily: selectTargetData.value[0].option.seriesYFontFamily[index],
      fontStyle: selectTargetData.value[0].option.seriesYFontStyle[index],
      color: selectTargetData.value[0].option.seriesYColor[index],
      lineHeight: selectTargetData.value[0].option.seriesYlineHeight[index],
      letterSpacing: selectTargetData.value[0].option.seriesYletterSpacing[index]
    };
  });
  suffixConfig.value = selectTargetData.value[0].option.seriesYTabsName.map((item: any, index: number) => {
    return {
      fontWeight: selectTargetData.value[0].option.suffixFontWeight[index],
      fontSize: selectTargetData.value[0].option.suffixFontSize[index],
      fontFamily: selectTargetData.value[0].option.suffixFontFamily[index],
      fontStyle: selectTargetData.value[0].option.suffixFontStyle[index],
      color: selectTargetData.value[0].option.suffixColor[index],
      lineHeight: selectTargetData.value[0].option.suffixlineHeight[index],
      letterSpacing: selectTargetData.value[0].option.suffixletterSpacing[index]
    };
  });
};
init();
</script>
<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

.inputBox + .inputBox {
  margin-left: 16px;
}
</style>
