<template>
  <div class="ft-scroll-row-column">
    <sw-collapse-item title="列" open>
      <template #icon>
        <Icon type="CirclePlus" @click="columnHandle('add')" size="14" />
        <Icon type="Delete" @click="columnHandle('delete')" size="14" />
      </template>
      <template #content>
        <ScreenwrightSeriesTabs v-model="activeTab" :tabs="selectTargetData[0].option.seriesYTabsName" />
        <div v-for="(item, index) in selectTargetData[0].option.seriesYTabsName" :key="index">
          <div v-if="selectTargetData[0].option.seriesYTabsName[index] === activeTab">
            <!-- {{ seriesYTabs }} -->
            <el-form-item label="映射" :label-width="secondLabelWidth">
              <div class="input-wrap flex flex-center-between">
                <sw-input
                  v-model="selectTargetData[0].option.column[index].alias"
                  bottomLabel="字段名"
                  @change="update"
                  width="90"
                />
                <sw-input
                  v-model="selectTargetData[0].option.column[index].name"
                  bottomLabel="显示名"
                  @change="update"
                  width="90"
                />
              </div>
            </el-form-item>

            <el-form-item label="列宽" :label-width="secondLabelWidth">
              <sw-input-number
                v-model.number="selectTargetData[0].option.seriesYWidth[index]"
                unit="px"
                :controls="false"
                @change="update"
              />
            </el-form-item>
            <el-form-item label="列间距" :label-width="secondLabelWidth">
              <sw-input-number
                v-model.number="selectTargetData[0].option.seriesYMarginLeft[index]"
                unit="px"
                :controls="false"
                @change="update"
              />
            </el-form-item>
            <el-form-item label="偏移" :label-width="secondLabelWidth">
              <div class="input-wrap flex flex-center-between">
                <sw-input-number
                  v-model.number="selectTargetData[0].option.seriesYOffsetX[index]"
                  unit="px"
                  bottomLabel="X"
                  :controls="false"
                  @change="update"
                  width="90"
                />
                <sw-input-number
                  v-model.number="selectTargetData[0].option.seriesYOffsetY[index]"
                  unit="px"
                  bottomLabel="Y"
                  :controls="false"
                  @change="update"
                  width="90"
                />
              </div>
            </el-form-item>
            <ItemSelectAlign
              v-model="selectTargetData[0].option.seriesYTextAlign[index]"
              :type="typeAttrs.default"
              @change="update"
            />
            <el-form-item label="内容类型" :label-width="secondLabelWidth">
              <el-select
                popper-class="sw-select-dropdown"
                v-model="selectTargetData[0].option.seriesYContentType[index]"
                @change="update"
              >
                <el-option v-for="item in contentType" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <!-- 状态配置 -->
            <sw-collapse-item
              title="状态配置"
              v-if="selectTargetData[0].option.seriesYContentType[index] === 'statusImg'"
            >
              <template #icon>
                <Icon type="CirclePlus" @click="changeStatus('add', index)" size="14" />
                <Icon type="Delete" size="14" @click="changeStatus('delete', index)" />
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
                      <el-form-item label="状态值" :label-width="thirdLabelWidth">
                        <sw-input
                          v-model="selectTargetData[0].option.statusConfigValue[index][styleIndex]"
                          @change="update"
                        />
                      </el-form-item>
                      <el-form-item label="图片" :label-width="thirdLabelWidth">
                        <sw-upload
                          v-model="selectTargetData[0].option.statusConfigImg[index][styleIndex]"
                          :multiple="false"
                          :showFileList="false"
                          @change="update"
                        />
                      </el-form-item>
                      <el-form-item label="尺寸" :label-width="thirdLabelWidth">
                        <div class="input-wrap flex flex-center-between">
                          <sw-input-number
                            v-model.number="selectTargetData[0].option.statusConfigWidth[index][styleIndex]"
                            unit="px"
                            bottomLabel="宽度"
                            :controls="false"
                            width="90"
                            @change="update"
                          />
                          <sw-input-number
                            v-model.number="selectTargetData[0].option.statusConfigHeight[index][styleIndex]"
                            unit="px"
                            bottomLabel="高度"
                            :controls="false"
                            width="90"
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
            <div v-else-if="selectTargetData[0].option.seriesYContentType[index] === 'progress'">
              <progressConfig :index="index" />
            </div>
            <div v-else-if="selectTargetData[0].option.seriesYContentType[index] === 'image'">
              <el-form-item label="遮罩" :label-width="thirdLabelWidth">
                <sw-upload
                  v-model="selectTargetData[0].option.maskImage[index]"
                  :multiple="false"
                  :showFileList="false"
                  @change="update"
                />
              </el-form-item>
              <el-form-item label="尺寸" :label-width="thirdLabelWidth">
                <div class="input-wrap flex flex-center-between">
                  <sw-input-number
                    v-model.number="selectTargetData[0].option.imageWidth[index]"
                    unit="px"
                    bottomLabel="宽度"
                    :controls="false"
                    width="90"
                    @change="update"
                  />
                  <sw-input-number
                    v-model.number="selectTargetData[0].option.imageHeight[index]"
                    unit="px"
                    bottomLabel="高度"
                    :controls="false"
                    width="90"
                    @change="update"
                  />
                </div>
              </el-form-item>
            </div>
            <div v-else>
              <el-form-item
                label="文字溢出"
                v-if="selectTargetData[0].option.seriesYContentType[index] === 'word'"
                :label-width="thirdLabelWidth"
              >
                <el-select
                  style="margin-left: 25px"
                  popper-class="sw-select-dropdown"
                  v-model="selectTargetData[0].option.seriesYOverFlow[index]"
                  @change="update"
                >
                  <el-option v-for="item in textOverFlow" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>

              <el-form-item
                label="文本样式"
                :label-width="secondLabelWidth"
                title="文本样式"
                v-if="selectTargetData[0].option.seriesYContentType[index] !== 'progress'"
              >
                <configTextStyle
                  v-model="seriesY[index]"
                  @change="(key, value) => handleConfigTextChange(key, value, index)"
                >
                  <template #append>
                    <div class="input-wrap flex flex-center-between">
                      <sw-input-number
                        v-model.number="selectTargetData[0].option.seriesYletterSpacing[index]"
                        unit="px"
                        bottomLabel="字距"
                        :controls="false"
                        @change="update"
                      />
                      <sw-input-number
                        v-model.number="selectTargetData[0].option.seriesYlineHeight[index]"
                        unit="px"
                        bottomLabel="行距"
                        :controls="false"
                        @change="update"
                      />
                    </div>
                  </template>
                </configTextStyle>
              </el-form-item>
              <template v-if="selectTargetData[0].option.seriesYContentType[index] === 'number'">
                <el-form-item label="千分位分割" :label-width="thirdLabelWidth">
                  <el-checkbox
                    style="margin-left: 26px"
                    v-model="selectTargetData[0].option.thousandSplit[index]"
                    @change="update"
                  />
                </el-form-item>
                <sw-collapse-item
                  title="后缀"
                  show-icon
                  v-model="selectTargetData[0].option.suffixShow[index]"
                  @change="update"
                >
                  <template #content>
                    <el-form-item label="内容" :label-width="thirdLabelWidth">
                      <sw-input v-model="selectTargetData[0].option.suffixContent[index]" @change="update" />
                    </el-form-item>
                    <el-form-item label="文本样式" :label-width="38" title="文本样式">
                      <configTextStyle
                        v-model="suffixInput[index]"
                        @change="(key, value) => handleSuffixChange(key, value, index)"
                        style="margin-left: 10px"
                      >
                        <template #append>
                          <div class="input-wrap flex flex-center-between" style="margin-left: 10px">
                            <sw-input-number
                              v-model.number="selectTargetData[0].option.suffixletterSpacing[index]"
                              unit="px"
                              bottomLabel="字距"
                              :controls="false"
                              @change="update"
                              width="60"
                            />
                            <sw-input-number
                              v-model.number="selectTargetData[0].option.suffixlineHeight[index]"
                              unit="px"
                              bottomLabel="行距"
                              :controls="false"
                              @change="update"
                              width="60"
                            />
                          </div>
                        </template>
                      </configTextStyle>
                    </el-form-item>
                    <el-form-item label="偏移" :label-width="thirdLabelWidth">
                      <div class="input-wrap flex flex-center-between">
                        <sw-input-number
                          v-model.number="selectTargetData[0].option.suffixOffsetX[index]"
                          unit="px"
                          bottomLabel="X"
                          :controls="false"
                          width="90"
                          @change="update"
                        />
                        <sw-input-number
                          v-model.number="selectTargetData[0].option.suffixOffsetY[index]"
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
              </template>
              <!-- 样式指定 -->
              <sw-collapse-item title="样式指定" open>
                <template #icon>
                  <Icon type="CirclePlus" @click="styleAssignHandle('add', index)" size="14" />
                  <Icon type="Delete" @click="styleAssignHandle('delete', index)" size="14" />
                </template>
                <template #content>
                  <template
                    v-if="
                      selectTargetData[0].option.styleAssignName[index].length > 0 &&
                      selectTargetData[0].option.styleAssignKeyValue[index].length > 0
                    "
                  >
                    <ScreenwrightSeriesTabs v-model="styleTabs" :tabs="selectTargetData[0].option.styleAssignName[index]" />
                    <div
                      v-for="(styleItem, styleIndex) in selectTargetData[0].option.styleAssignName[index]"
                      :key="styleIndex"
                    >
                      <div v-if="selectTargetData[0].option.styleAssignName[index][styleIndex] === styleTabs">
                        <el-form-item label="字段值" :label-width="thirdLabelWidth">
                          <sw-input
                            v-model="selectTargetData[0].option.styleAssignKeyValue[index][styleIndex]"
                            @change="update"
                          />
                        </el-form-item>
                        <el-form-item label="文本样式" :label-width="38">
                          <configTextStyle
                            style="margin-left: 10px"
                            v-model="styleAssignInput[index][styleIndex]"
                            @change="(key, value) => handleStyleAssignChange(key, value, index, styleIndex)"
                          >
                            <template #append>
                              <div class="input-wrap flex flex-center-between" style="margin-left: 10px">
                                <sw-input-number
                                  v-model.number="
                                    selectTargetData[0].option.styleAssignletterSpacing[index][styleIndex]
                                  "
                                  unit="px"
                                  bottomLabel="字距"
                                  :controls="false"
                                  @change="update"
                                  width="60"
                                />
                                <sw-input-number
                                  v-model.number="selectTargetData[0].option.styleAssignHeight[index][styleIndex]"
                                  unit="px"
                                  bottomLabel="行距"
                                  :controls="false"
                                  @change="update"
                                  width="60"
                                />
                              </div>
                            </template>
                          </configTextStyle>
                        </el-form-item>
                        <template v-if="selectTargetData[0].option.styleAssignBgImg">
                          <el-form-item
                            label="背景图片"
                            :label-width="38"
                            v-if="
                              selectTargetData[0].option.styleAssignBgImg &&
                              selectTargetData[0].option.styleAssignBgImg[index].length > 0
                            "
                          >
                            <sw-upload
                              style="margin-left: 10px"
                              v-model="selectTargetData[0].option.styleAssignBgImg[index][styleIndex]"
                              @change="update"
                            />
                          </el-form-item>
                          <el-form-item label="尺寸" :label-width="thirdLabelWidth">
                            <div class="input-wrap flex flex-center-between">
                              <sw-input-number
                                v-model.number="selectTargetData[0].option.styleAssignBgWdith[index][styleIndex]"
                                unit="px"
                                bottomLabel="宽度"
                                :controls="false"
                                width="90"
                                @change="update"
                              />
                              <sw-input-number
                                v-model.number="selectTargetData[0].option.styleAssignBgHeight[index][styleIndex]"
                                unit="px"
                                bottomLabel="高度"
                                :controls="false"
                                width="90"
                                @change="update"
                              />
                            </div>
                          </el-form-item>
                          <el-form-item
                            label="左间距"
                            v-if="
                              selectTargetData[0].option.styleAssignBgLeft &&
                              selectTargetData[0].option.styleAssignBgLeft[index]
                            "
                            :label-width="thirdLabelWidth"
                          >
                            <sw-input-number
                              v-model.number="selectTargetData[0].option.styleAssignBgLeft[index][styleIndex]"
                              unit="px"
                              @change="update"
                            />
                          </el-form-item>
                        </template>
                      </div>
                    </div>
                  </template>
                  <el-form-item label="列表为空" v-else />
                </template>
              </sw-collapse-item>
            </div>
          </div>
        </div>
      </template>
    </sw-collapse-item>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";

import { cloneDeep, debounce, isArray } from "lodash-es";

import { ScreenwrightSeriesTabs as ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber } from "@screenwright/ui/input-number";
import SwUpload from "@editor/base/SwUpload/index.vue";
import Icon from "@editor/base/Icon/index.vue";
import { capitalizeFirstLetter } from "@editor/utils";
import type { DataRemark } from "@screenwright/types";

import type { StyleProps } from "@editor/components/configTextStyle/configTextStyle";
import configTextStyle from "@editor/components/configTextStyle/index.vue";
import { useUpdateInstance } from "../../../../../useUpdateInstance";
import { contentType, textOverFlow } from "../../../constants";
import ItemSelectAlign from "../../../ItemComponent/ItemSelectAlign/index.vue";
import { typeAttrs } from "../../../ItemComponent/ItemSelectAlign/ItemSelectAlign";
import { secondLabelWidth, thirdLabelWidth } from "../../../textConfig";
import progressConfig from "./progressConfig.vue";

const activeTab = ref("列1");
const statusTabs = ref("状态1");
const styleTabs = ref("1");
const { selectTargetData, update } = useUpdateInstance();

const columnHandle = (type: string) => {
  const index = selectTargetData.value[0].option.seriesYTabsName.findIndex((item: any) => {
    return item === activeTab.value;
  });

  if (type === "add") {
    handleChangeSeries(type, index);
    const lastName = "列" + selectTargetData.value[0].option.column.length;
    selectTargetData.value[0].option.seriesYTabsName.push(lastName);
    activeTab.value = lastName;
  } else {
    if (selectTargetData.value[0].option.column.length > 1) {
      handleChangeSeries(type, index);
      selectTargetData.value[0].option.seriesYTabsName.splice(index, 1);
      selectTargetData.value[0].option.column.forEach((_item: any, i: number) => {
        selectTargetData.value[0].option.seriesYTabsName[i] = "列" + (i + 1);
      });
      if (selectTargetData.value[0].option.column.length === 1) {
        activeTab.value =
          selectTargetData.value[0].option.seriesYTabsName[selectTargetData.value[0].option.seriesYTabsName.length - 1];
      }
      if (index === selectTargetData.value[0].option.column.length) {
        activeTab.value = selectTargetData.value[0].option.seriesYTabsName[index - 1];
      }
    }
  }
  update();
};

const handleChangeSeries = (type: string, index: number) => {
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
    "seriesYTextAlign",
    "seriesYletterSpacing",
    "seriesYFontStyle",
    "seriesYFontWeight",
    "seriesYContentType",
    "seriesYColor",
    "column",
    "styleAssignKeyValue",
    "styleAssignFontFamily",
    "styleAssignFontSize",
    "styleAssignHeight",
    "styleAssignletterSpacing",
    "styleAssignColor",
    "styleAssignFontStyle",
    "styleAssignFontWeight",
    "styleAssignBgImg",
    "styleAssignBgWdith",
    "styleAssignBgHeight",
    "styleAssignBgLeft",
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
    "suffixFontSize",
    "suffixFontFamily",
    "suffixletterSpacing",
    "suffixFontStyle",
    "suffixFontWeight",
    "suffixColor",
    "suffixlineHeight",
    "suffixOffsetY",
    "suffixContent",
    "suffixOffsetX",
    "suffixOffsetY"
  ];
  if (type === "add") {
    for (let i = 0; i < list.length; i++) {
      const itemStr: string = list[i];
      if (isArray(selectTargetData.value[0].option[itemStr])) {
        const target = cloneDeep(selectTargetData.value[0].option[itemStr][index]);
        selectTargetData.value[0].option[itemStr].push(target);
      }
    }
    // const seriesYContentType = selectTargetData.value[0].option.seriesYContentType[index];
    const targetProgress = cloneDeep(selectTargetData.value[0].option.progressYConfig?.[index] || {});
    selectTargetData.value[0].option.progressYConfig.push(targetProgress);
  } else {
    for (let i = 0; i < list.length; i++) {
      const itemStr: string = list[i];
      if (isArray(selectTargetData.value[0].option[itemStr])) {
        selectTargetData.value[0].option[itemStr].splice(index, 1);
      }
    }
    const seriesYContentType = selectTargetData.value[0].option.seriesYContentType[index];
    if (seriesYContentType === "progress") {
      selectTargetData.value[0].option.progressYConfig.splice(index, 1);
    }
  }
};

// 状态配置
const changeStatus = (val: string, index: number | string) => {
  const list = ["statusConfigValue", "statusConfigImg", "statusConfigWidth", "statusConfigHeight"];

  const len = selectTargetData.value[0].option.statusConfigName[index].length;
  const current = selectTargetData.value[0].option.statusConfigName[index].findIndex(
    (it: string) => it === statusTabs.value
  );
  if (val === "add") {
    const newStatus = `状态${len + 1}`;
    selectTargetData.value[0].option.statusConfigName[index].push(newStatus);

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
    statusTabs.value = newStatus;
  } else if (val === "delete" && len > 0) {
    list.forEach((item) => {
      selectTargetData.value[0].option[item][index].splice(current, 1);
    });
    selectTargetData.value[0].option.statusConfigName[index].splice(current, 1);
    selectTargetData.value[0].option.statusConfigName[index] = selectTargetData.value[0].option.statusConfigName[
      index
    ].map((it: string, i: number) => {
      return `状态${i + 1}`;
    });
    if (current === len - 1) {
      statusTabs.value =
        selectTargetData.value[0].option.statusConfigName[index][
          selectTargetData.value[0].option.statusConfigName[index].length - 1
        ];
    }
  }
  update();
};

// 样式指定
const styleAssignHandle = (type: string, index: number) => {
  const defaultObj = {
    styleAssignKeyValue: "",
    styleAssignFontFamily: "Source Han Sans CN-Normal, Source Han Sans CN",
    styleAssignFontSize: 12,
    styleAssignHeight: 12,
    styleAssignletterSpacing: 1,
    styleAssignColor: "rgba(241, 242, 245, 1)",
    styleAssignFontStyle: "normal",
    styleAssignFontWeight: "normal",
    styleAssignBgImg: "",
    styleAssignBgWdith: 20,
    styleAssignBgHeight: 20,
    styleAssignBgLeft: 0
  };
  if (type === "add") {
    selectTargetData.value[0].option.styleAssignKeyValue[index].push("");
    selectTargetData.value[0].option.styleAssignName[index].push(
      selectTargetData.value[0].option.styleAssignName[index].length + 1 + ""
    );
    styleTabs.value = selectTargetData.value[0].option.styleAssignName[index].length + "";
    Object.keys(defaultObj).forEach((key) => {
      selectTargetData.value[0].option[key][index].push(defaultObj[key as keyof typeof defaultObj]);
    });
  } else {
    const targetIndex = selectTargetData.value[0].option.styleAssignName[index].findIndex((item: string) => {
      return item === styleTabs.value;
    });
    if (targetIndex > -1) {
      selectTargetData.value[0].option.styleAssignName[index].splice(targetIndex, 1);
      selectTargetData.value[0].option.styleAssignName[index] = selectTargetData.value[0].option.styleAssignName[
        index
      ].map((it: string, i: number) => {
        return `${i + 1}`;
      });
      Object.keys(defaultObj).forEach((key) => {
        selectTargetData.value[0].option[key][index].splice(targetIndex, 1);
      });

      if (selectTargetData.value[0].option.styleAssignName[index].length === 1) {
        styleTabs.value = selectTargetData.value[0].option.styleAssignName[index].length + "";
      }
      if (selectTargetData.value[0].option.styleAssignName[index].length === targetIndex) {
        styleTabs.value = selectTargetData.value[0].option.styleAssignName[index][targetIndex - 1];
      }
    }
  }

  init();
  update();
};

// 字体
const init = () => {
  seriesY.value = selectTargetData.value[0].option.seriesYTabsName.map((_item: string, index: number) => {
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
  suffixInput.value = selectTargetData.value[0].option.seriesYTabsName.map((_item: string, index: number) => {
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

  selectTargetData.value[0].option.styleAssignName.forEach((_item: string, index: number) => {
    styleAssignInput.value[index] = [];
    selectTargetData.value[0].option.styleAssignName[index].forEach((_subItem: string, subIndex: number) => {
      styleAssignInput.value[index][subIndex] = {
        fontWeight: selectTargetData.value[0].option.styleAssignFontWeight[index][subIndex] || "",
        fontSize: selectTargetData.value[0].option.styleAssignFontSize[index][subIndex] || "",
        fontFamily: selectTargetData.value[0].option.styleAssignFontFamily[index][subIndex] || "",
        fontStyle: selectTargetData.value[0].option.styleAssignFontStyle[index][subIndex] || "",
        color: selectTargetData.value[0].option.styleAssignColor[index][subIndex] || ""
      };
    });
  });

  console.log("字体刷新", styleAssignInput.value);
};

const seriesY = ref<StyleProps[]>([]);
const suffixInput = ref<StyleProps[]>([]);
const styleAssignInput = ref<StyleProps[][]>([]);

const handleConfigTextChange = (key: string, val: any, index: number) => {
  selectTargetData.value[0].option[`seriesY${capitalizeFirstLetter(key)}`][index] = val[key];
  update();
};

const handleSuffixChange = (key: string, val: any, index: number) => {
  selectTargetData.value[0].option[`suffix${capitalizeFirstLetter(key)}`][index] = val[key];
  update();
};
const handleStyleAssignChange = (key: string, val: any, index: number, styleIndex: number) => {
  selectTargetData.value[0].option[`styleAssign${capitalizeFirstLetter(key)}`][index][styleIndex] = val[key];
  update();
};
// 数据
const forMatterDataRemark = (data: any) => {
  const dpData = cloneDeep(data);
  const dpRemark: DataRemark[] = cloneDeep(selectTargetData.value[0].dataRemark ?? []);
  const oldCol: any = {};

  dpRemark.forEach((it) => {
    oldCol[it.key] = it;
  });

  const newCol: any[] = [];
  const keyMap: any = {};
  dpData.forEach((it: any) => {
    if (!keyMap[it.alias]) {
      if (oldCol[it.alias]) {
        newCol.push(oldCol[it.alias]);
      } else
        newCol.push({
          key: it.alias,
          map: it.alias,
          decription: it.name
        });
      keyMap[it.alias] = true;
    }
  });

  return newCol;
};

const setDataRemark = async (data: DataRemark[]) => {
  selectTargetData.value[0].dataRemark = data;
  await update();
};

const debounceSetDataRemark = debounce((data) => setDataRemark(data), 1000);

watch(
  () => selectTargetData.value[0] && selectTargetData.value[0].option.column,
  (nv) => {
    if (nv) {
      const data = forMatterDataRemark(nv);
      init();
      debounceSetDataRemark(data);
    }
  },
  {
    deep: true
  }
);

watch(
  () => selectTargetData.value[0],
  (nval, oval) => {
    if (
      (nval?.id == oval?.id || oval == null) &&
      nval?.option.seriesYTabsName.length != oval?.option.seriesYTabsName.length
    ) {
      init();
    }
  },
  {
    immediate: true
  }
);
onMounted(() => {
  console.log("columnConfig onMounted");
});
</script>
<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

.input-wrap {
  width: 100%;
}

:deep(.el-form-item__label) {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 0;
  display: inline-block;
  margin-right: 1px;
}
</style>
