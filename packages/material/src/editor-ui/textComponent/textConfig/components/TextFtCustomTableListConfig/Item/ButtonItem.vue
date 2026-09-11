<template>
  <div class="button-item-container">
    <el-form-item label="按钮文本" :label-width="secondLabelWidth">
      <sw-input v-model="selectTargetData[0].option.column[index].btnWord" @change="update" />
    </el-form-item>
    <el-form-item label="层级" :label-width="secondLabelWidth">
      <sw-input-number
        v-model="selectTargetData[0].option.column[index].seriesYZIndex"
        :controls="false"
        :min="1"
        @change="update"
      />
    </el-form-item>
    <el-form-item label="按钮尺寸" :label-width="secondLabelWidth">
      <div class="input-wrap flex flex-center-between">
        <sw-input-number
          v-model="selectTargetData[0].option.column[index].seriesYOffsetWidth"
          unit="px"
          bottomLabel="宽度"
          :controls="false"
          @change="update"
          width="90"
        />
        <sw-input-number
          v-model="selectTargetData[0].option.column[index].seriesYOffsetHeight"
          unit="px"
          bottomLabel="高度"
          :controls="false"
          @change="update"
          width="90"
        />
      </div>
    </el-form-item>
    <el-form-item label="按钮位置" :label-width="secondLabelWidth">
      <div class="input-wrap flex flex-center-between">
        <sw-input-number
          v-model="selectTargetData[0].option.column[index].seriesYOffsetX"
          unit="px"
          bottomLabel="X"
          :controls="false"
          @change="update"
          width="90"
        />
        <sw-input-number
          v-model="selectTargetData[0].option.column[index].seriesYOffsetY"
          unit="px"
          bottomLabel="Y"
          :controls="false"
          @change="update"
          width="90"
        />
      </div>
    </el-form-item>
    <el-form-item label="文字方向" :label-width="secondLabelWidth">
      <sw-radio
        v-model="selectTargetData[0].option.column[index].seriesYTextWritingMode"
        :option="writingList"
        direction="row"
        @change="update"
      />
    </el-form-item>

    <ItemSelectAlign
      label="水平对齐"
      v-if="selectTargetData[0].option.column[index].seriesYTextWritingMode == 'horizontal-tb'"
      v-model="selectTargetData[0].option.column[index].seriesYTextAlign"
      :type="typeAttrs.flex"
      @change="update"
    />

    <ItemSelectAlign
      v-if="selectTargetData[0].option.column[index].seriesYTextWritingMode == 'tb-rl'"
      v-model="selectTargetData[0].option.column[index].seriesYTextAlign"
      :type="typeAttrs.flex"
      @change="update"
    />
    <sw-collapse-item title="样式" open>
      <template #content>
        <ItemSelectAlign
          v-model="seriesYContentTypeBtnTab"
          :type="typeAttrs.custom"
          label=""
          label-width="0"
          :customOptions="btnStyleTabs"
          @change="handleTabsChange"
        />
        <el-form-item label="启用" v-if="seriesYContentTypeBtnTab === 'hoverObj'" :label-width="thirdLabelWidth">
          <el-checkbox v-model="selectTargetData[0].option.column[index].btnIsHovered" @change="update" />
        </el-form-item>
        <sw-collapse-item title="文字" :disabled="false" open>
          <template #content>
            <el-form-item label="样式" :label-width="thirdLabelWidth">
              <div class="flex flex-center-between" style="width: 100%">
                <configTextStyle v-model="input" @change="handleConfigTextChange" :selectWidth="110" :colorWidth="80">
                  <template #append>
                    <div class="flex" style="margin-left: 10px">
                      <sw-input-number
                        v-model="selectTargetData[0].option.column[index][seriesYContentTypeBtnTab].seriesYLineHeight"
                        unit="px"
                        bottomLabel="字距"
                        @change="update"
                        width="50"
                        style="margin-right: 4px"
                      />
                      <sw-input-number
                        v-model="
                          selectTargetData[0].option.column[index][seriesYContentTypeBtnTab].seriesYLetterSpacing
                        "
                        unit="px"
                        bottomLabel="行距"
                        @change="update"
                        width="50"
                      />
                    </div>
                  </template>
                </configTextStyle>
              </div>
            </el-form-item>
            <el-form-item label="偏移" :label-width="thirdLabelWidth">
              <div class="input-wrap flex flex-center-between">
                <sw-input-number
                  v-model="selectTargetData[0].option.column[index][seriesYContentTypeBtnTab].textTranslateX"
                  unit="px"
                  :controls="false"
                  bottomLabel="X"
                  @change="update"
                  width="90"
                />
                <sw-input-number
                  v-model="selectTargetData[0].option.column[index][seriesYContentTypeBtnTab].textTranslateY"
                  unit="px"
                  :controls="false"
                  bottomLabel="Y"
                  @change="update"
                  width="90"
                />
              </div>
            </el-form-item>
            <el-form-item label="阴影" :label-width="thirdLabelWidth">
              <el-checkbox
                v-model="selectTargetData[0].option.column[index][seriesYContentTypeBtnTab].isTextShadow"
                @change="update"
              />
            </el-form-item>

            <el-form-item
              label="文本阴影"
              :label-width="38"
              v-if="selectTargetData[0].option.column[index][seriesYContentTypeBtnTab].isTextShadow"
            >
              <div class="flex flex-left-between" style="margin-left: 10px">
                <el-color-picker
                  class="colorPicker"
                  style="position: relative; top: 4px; left: -4px"
                  :show-alpha="true"
                  v-model="selectTargetData[0].option.column[index][seriesYContentTypeBtnTab].textShadowColor"
                  @change="selectTargetData[0].option.column[index][seriesYContentTypeBtnTab].textShadowColor = $event"
                />
                <sw-input-number
                  v-model="selectTargetData[0].option.column[index][seriesYContentTypeBtnTab].textShadowX"
                  bottomLabel="X"
                  @change="update"
                />
                <sw-input-number
                  v-model="selectTargetData[0].option.column[index][seriesYContentTypeBtnTab].textShadowY"
                  bottomLabel="Y"
                  @change="update"
                />
                <sw-input-number
                  v-model="selectTargetData[0].option.column[index][seriesYContentTypeBtnTab].textShadowBlur"
                  bottomLabel="模糊"
                  @change="update"
                />
              </div>
            </el-form-item>
          </template>
        </sw-collapse-item>
        <sw-collapse-item title="背景" :disabled="false">
          <template #content>
            <el-form-item label="填充方式" :label-width="thirdLabelWidth">
              <el-select
                v-model="selectTargetData[0].option.column[index][seriesYContentTypeBtnTab].backgroundType"
                @change="update"
                popper-class="sw-select-dropdown"
              >
                <el-option v-for="item in backgroundType" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item
              label="颜色"
              v-if="selectTargetData[0].option.column[index][seriesYContentTypeBtnTab].backgroundType == 'color'"
              :label-width="thirdLabelWidth"
            >
              <sw-single-color-picker
                field="backgroundColor"
                v-model="selectTargetData[0].option.column[index][seriesYContentTypeBtnTab].backgroundColor"
                :presetColor="selectTargetData[0].option.column[index][seriesYContentTypeBtnTab].backgroundColor"
                @change="update"
              />
            </el-form-item>
            <template
              v-if="selectTargetData[0].option.column[index][seriesYContentTypeBtnTab].backgroundType == 'custom'"
            >
              <el-form-item label="类型" :label-width="thirdLabelWidth">
                <el-select
                  v-model="selectTargetData[0].option.column[index][seriesYContentTypeBtnTab].backgroundImageType"
                  @change="update"
                  popper-class="sw-select-dropdown"
                >
                  <el-option
                    v-for="item in backgroundImageType"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="图片" :label-width="thirdLabelWidth">
                <sw-upload
                  v-model="selectTargetData[0].option.column[index][seriesYContentTypeBtnTab].backgroundImage"
                  :multiple="false"
                  :showFileList="false"
                  @change="update"
                  @delete="update"
                />
              </el-form-item>
            </template>
          </template>
        </sw-collapse-item>
        <sw-collapse-item
          title="描边"
          v-model="selectTargetData[0].option.column[index][seriesYContentTypeBtnTab].btnBorderShow"
          showIcon
          @change="update"
        >
          <template #content>
            <el-form-item label="线条类型" :label-width="thirdLabelWidth">
              <el-select
                v-model="selectTargetData[0].option.column[index][seriesYContentTypeBtnTab].borderLineType"
                popper-class="sw-select-dropdown"
                @change="update"
              >
                <el-option v-for="item in lineType" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="粗细" :label-width="thirdLabelWidth">
              <sw-input-number
                v-model="selectTargetData[0].option.column[index][seriesYContentTypeBtnTab].borderWidth"
                :controls="false"
                unit="px"
                @change="update"
              />
            </el-form-item>
            <el-form-item label="颜色" :label-width="thirdLabelWidth">
              <sw-single-color-picker
                :field="`borderColor`"
                v-model="selectTargetData[0].option.column[index][seriesYContentTypeBtnTab].borderColor"
                :presetColor="selectTargetData[0].option.column[index][seriesYContentTypeBtnTab].borderColor"
                @change="update"
              />
            </el-form-item>
          </template>
        </sw-collapse-item>
        <sw-collapse-item
          title="阴影"
          v-model="selectTargetData[0].option.column[index][seriesYContentTypeBtnTab].btnShadowShow"
          showIcon
          @change="update"
        >
          <template #content>
            <el-form-item label="内阴影" :label-width="38" title="内阴影">
              <div class="flex flex-left-between" style="margin-left: 10px; width: 100%">
                <ScreenwrightColorPicker
                  v-model="selectTargetData[0].option.column[index][seriesYContentTypeBtnTab].btnShadowInColor"
                  @change="update"
                  :border="false"
                  style="top: 5px; margin-right: 10px"
                />
                <sw-input-number
                  v-model="selectTargetData[0].option.column[index][seriesYContentTypeBtnTab].btnShadowInX"
                  bottomLabel="X"
                  @change="update"
                />
                <sw-input-number
                  v-model="selectTargetData[0].option.column[index][seriesYContentTypeBtnTab].btnShadowInY"
                  bottomLabel="Y"
                  @change="update"
                />
                <sw-input-number
                  v-model="selectTargetData[0].option.column[index][seriesYContentTypeBtnTab].btnShadowInBlur"
                  bottomLabel="模糊"
                  @change="update"
                />
              </div>
            </el-form-item>
            <el-form-item label="外阴影" :label-width="38" title="外阴影">
              <div class="flex flex-left-between" style="margin-left: 10px; width: 100%">
                <ScreenwrightColorPicker
                  v-model="selectTargetData[0].option.column[index][seriesYContentTypeBtnTab].btnShadowOutColor"
                  @change="update"
                  :border="false"
                  style="top: 5px; margin-right: 10px"
                />
                <sw-input-number
                  v-model="selectTargetData[0].option.column[index][seriesYContentTypeBtnTab].btnShadowOutX"
                  bottomLabel="X"
                  @change="update"
                />
                <sw-input-number
                  v-model="selectTargetData[0].option.column[index][seriesYContentTypeBtnTab].btnShadowOutY"
                  bottomLabel="Y"
                  @change="update"
                />
                <sw-input-number
                  v-model="selectTargetData[0].option.column[index][seriesYContentTypeBtnTab].btnShadowOutBlur"
                  bottomLabel="模糊"
                  @change="update"
                />
              </div>
            </el-form-item>
          </template>
        </sw-collapse-item>
        <sw-collapse-item v-show="selectTargetData[0].option.column[index].seriesYIsMapping" title="样式指定" open>
          <template #icon>
            <div class="flex flex-center">
              <Icon type="circlePlus" @click="handleSeriesYIsMapping('add')" size="14" />
              <Icon type="Delete" @click="handleSeriesYIsMapping('delete')" size="14" />
            </div>
          </template>
          <template #content>
            <template
              v-if="
                selectTargetData[0].option.column[index][seriesYContentTypeBtnTab].styleAssignList &&
                selectTargetData[0].option.column[index][seriesYContentTypeBtnTab].styleAssignList.length > 0
              "
            >
              <ScreenwrightSeriesTabs
                v-model="seriesYStyleAssignTabs"
                :tabs="
                  selectTargetData[0].option.column[index][seriesYContentTypeBtnTab].styleAssignList.map(
                    (sa: any, saIndex: number) => saIndex + 1
                  )
                "
              />
              <div
                v-for="(styleItem, styleIndex) in selectTargetData[0].option.column[index][seriesYContentTypeBtnTab]
                  .styleAssignList"
                :key="styleIndex"
              >
                <div v-if="styleIndex + 1 === seriesYStyleAssignTabs">
                  <el-form-item label="状态" title="状态" :label-width="thirdLabelWidth">
                    <sw-input v-model="styleItem.styleAssignKeyValue" @change="update" />
                  </el-form-item>
                  <el-form-item label="图片" :label-width="thirdLabelWidth">
                    <sw-upload
                      @change="update"
                      @delete="update"
                      v-model="styleItem.styleAssignBgImg"
                      :multiple="false"
                      :showFileList="false"
                    />
                  </el-form-item>
                  <el-form-item label="尺寸" :label-width="thirdLabelWidth">
                    <div class="flex flex-center-between">
                      <sw-input-number
                        v-model="styleItem.styleAssignWdith"
                        unit="px"
                        bottomLabel="宽度"
                        :controls="false"
                        @change="update"
                      />
                      <sw-input-number
                        v-model="styleItem.styleAssignHeight"
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
      </template>
    </sw-collapse-item>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

import { cloneDeep } from "lodash-es";

import { ScreenwrightColorPicker } from "@screenwright/ui";
// import seriesYIsMapping from "./seriesYIsMapping.vue"
import { ScreenwrightSeriesTabs as ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwRadio } from "@screenwright/ui/radio";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import SwUpload from "@editor/base/SwUpload/index.vue";
// import { StyleProps } from "@editor/components/configTextStyle/configTextStyle"
import Icon from "@editor/base/Icon/index.vue";
import { useFontStyleAttrs } from "@editor/components/configTextStyle/useTextStyleAttrs";

import configTextStyle from "@editor/components/configTextStyle/index.vue";
import { useUpdateInstance } from "../../../../../useUpdateInstance";
import { backgroundImageType, backgroundType, btnStyleTabs, lineType, writingList } from "../../../constants";
import ItemSelectAlign from "../../../ItemComponent/ItemSelectAlign/index.vue";
import { typeAttrs } from "../../../ItemComponent/ItemSelectAlign/ItemSelectAlign";
import type { ShadowProps } from "../../../ItemComponent/ItemTextShadow/type";
import { secondLabelWidth, thirdLabelWidth } from "../../../textConfig";
// import { capitalizeFirstLetter } from "../../../../../../buildConfig/attrsRender/utils"
import { seriesYContentType_btn_defaultObj } from "./config";

const { update, selectTargetData } = useUpdateInstance();
const props = defineProps<{
  index: number;
}>();
const textShadow = ref<ShadowProps[]>([]);
const btnShadowIn = ref<ShadowProps[]>([]);
const btnShadowOut = ref<ShadowProps[]>([]);
const seriesYStyleAssignTabs = ref(1);
const seriesYContentTypeBtnTab = ref("defaultObj");

const handleSeriesYIsMapping = (val: "add" | "delete") => {
  const targetCol = selectTargetData.value[0].option.column[props.index];
  let list: any;
  if (["btn"].includes(targetCol.seriesYContentType)) {
    list = seriesYContentType_btn_defaultObj;
    if (!targetCol[seriesYContentTypeBtnTab.value].styleAssignList) {
      selectTargetData.value[0].option.column[props.index][seriesYContentTypeBtnTab.value].styleAssignList = [];
    }
    const len = targetCol[seriesYContentTypeBtnTab.value].styleAssignList.length;

    if (val === "add") {
      let pushObj: any = {};
      if (len === 0) {
        list.map((listObj: any) => {
          pushObj[listObj.key] = {
            ...listObj.defaultValue
          };
        });
        pushObj = {
          ...pushObj,
          styleAssignBgImg: targetCol.backgroundImage || "",
          styleAssignWdith: targetCol.seriesYOffsetWidth || "",
          styleAssignHeight: targetCol.seriesYOffsetHeight || ""
        };
      } else {
        pushObj = cloneDeep(targetCol[seriesYContentTypeBtnTab.value].styleAssignList[len - 1]);
      }
      selectTargetData.value[0].option.column[props.index][seriesYContentTypeBtnTab.value].styleAssignList.push(
        pushObj
      );

      seriesYStyleAssignTabs.value = len + 1;
    } else if (val === "delete" && len > 0) {
      const targetIndex = targetCol[seriesYContentTypeBtnTab.value].styleAssignList.findIndex(
        (it: any, idx: number) => idx + 1 === seriesYStyleAssignTabs.value
      );
      if (targetIndex !== -1) {
        selectTargetData.value[0].option.column[props.index][seriesYContentTypeBtnTab.value].styleAssignList.splice(
          targetIndex,
          1
        );
      }
      if (targetIndex === len - 1) {
        seriesYStyleAssignTabs.value = targetCol[seriesYContentTypeBtnTab.value].styleAssignList.length;
      }
    }
  }
  update();
};
const { input, handleConfigTextChange, getInitValue } = useFontStyleAttrs({
  fontFamily: "seriesYFontFamily",
  fontSize: "seriesYFontSize",
  color: "seriesYColor",
  fontStyle: "seriesYFontStyle",
  fontWeight: "seriesYFontWeight",
  attrs: `column[${props.index}][${seriesYContentTypeBtnTab.value}]`
});

watch(
  () => seriesYContentTypeBtnTab.value,
  () => {
    const pathAttrs = `column[${props.index}][${seriesYContentTypeBtnTab.value}]`;
    getInitValue(pathAttrs);
  }
);

const styleSeriesYConfig = ref<any[]>([]);
const handleTabsChange = () => {
  selectTargetData.value[0].option.column.forEach((item: any) => {
    item[seriesYContentTypeBtnTab.value].btnShadowInColor = item[seriesYContentTypeBtnTab.value].btnShadowInColor =
      item[seriesYContentTypeBtnTab.value].btnShadowInColor || "rgba(255,255,255,1)";
    item[seriesYContentTypeBtnTab.value].btnShadowOutColor =
      item[seriesYContentTypeBtnTab.value].btnShadowOutColor || "rgba(255,255,255,1)";
  });
};
const initConfig = () => {
  styleSeriesYConfig.value = [];
  btnShadowIn.value = [];
  btnShadowOut.value = [];
  selectTargetData.value[0].option.column.forEach((item: any, index: number) => {
    styleSeriesYConfig.value.push([]);
    btnStyleTabs.forEach((subitem: any) => {
      styleSeriesYConfig.value[index][subitem.value] = {
        fontWeight: item[subitem.value].seriesYFontWeight,
        fontSize: item[subitem.value].seriesYFontSize,
        fontFamily: item[subitem.value].seriesYFontFamily,
        fontStyle: item[subitem.value].seriesYFontStyle,
        color: item[subitem.value].seriesYColor,
        lineHeight: item[subitem.value].seriesYLineHeight,
        letterSpacing: item[subitem.value].seriesYLetterSpacing
      };
      btnShadowIn.value.push({
        color: item[subitem.value].btnShadowInColor,
        x: item[subitem.value].btnShadowInX,
        y: item[subitem.value].btnShadowInY,
        blur: item[subitem.value].btnShadowInBlur
      });
      btnShadowOut.value.push({
        color: item[subitem.value].btnShadowOutColor,
        x: item[subitem.value].btnShadowOutX,
        y: item[subitem.value].btnShadowOutY,
        blur: item[subitem.value].btnShadowOutBlur
      });
    });
    textShadow.value.push({
      color: item.textShadowColor,
      x: item.textShadowX,
      y: item.textShadowY,
      blur: item.textShadowBlur
    });
  });
};

watch(
  () => selectTargetData.value[0],
  (nval, oval) => {
    if (nval && (nval.id == oval?.id || oval == null) && nval.option.column.length != oval?.option.column.length) {
      initConfig();
    }
  },
  {
    immediate: true
  }
);
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
}
:deep(.el-color-picker__trigger) {
  border: none !important;
  width: 28px !important;
  height: 28px !important;
}
.button-item-container {
  width: 100%;
  .input-wrap {
    width: 100%;
  }
}
</style>
