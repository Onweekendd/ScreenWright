<template>
  <div class="raster-progress-bar-indicator">
    <el-form-item label="文本样式" title="文本样式" :label-width="firstLabelWidth">
      <configTextStyle v-model="input" @change="handleConfigTextChange">
        <template #append>
          <div style="flex: 1; margin-left: 8px" class="flex flex-justify-between">
            <SwInputNumber
              @change="update"
              v-model="selectTargetData[0].option.seriesConfig.seriesLetterSpacing"
              unit="px"
              bottomLabel="字距"
            />
            <SwInputNumber
              @change="update"
              v-model="selectTargetData[0].option.seriesConfig.seriesLineHeight"
              unit="px"
              bottomLabel="行距"
            />
          </div>
        </template>
      </configTextStyle>
    </el-form-item>
    <el-form-item label="保留小数" :label-width="firstLabelWidth">
      <sw-input-number
        @change="update"
        v-model="selectTargetData[0].option.seriesConfig.decimalPlace"
        unit="位"
        :min="0"
      />
    </el-form-item>

    <el-form-item label="偏移" :label-width="firstLabelWidth">
      <div class="flex flex-center-between" style="width: 100%">
        <sw-input-number
          v-model.number="selectTargetData[0].option.seriesConfig.seriesTranslateX"
          unit="px"
          bottomLabel="X"
          width="90"
          @change="update"
        />
        <sw-input-number
          v-model="selectTargetData[0].option.seriesConfig.seriesTranslateY"
          unit="px"
          bottomLabel="Y"
          width="90"
          @change="update"
        />
      </div>
    </el-form-item>
    <SwCollapseItem title="背景">
      <template #content>
        <el-form-item label="图片" :label-width="secondLabelWidth">
          <SwUpload v-model="selectTargetData[0].option.seriesConfig.bgImgSrc" @delete="update" @change="update" />
          <div class="flex flex-center-between" style="width: 100%">
            <sw-input-number
              v-model="selectTargetData[0].option.seriesConfig.bgImgWidth"
              bottomLabel="宽度"
              width="90"
              @change="update"
            />
            <sw-input-number
              v-model="selectTargetData[0].option.seriesConfig.bgImgHeight"
              bottomLabel="高度"
              width="90"
              @change="update"
            />
          </div>
        </el-form-item>

        <el-form-item label="偏移" :label-width="secondLabelWidth">
          <div class="flex flex-center-between" style="width: 100%">
            <sw-input-number
              v-model="selectTargetData[0].option.seriesConfig.bgImgTranslateX"
              unit="px"
              bottomLabel="X"
              width="90"
              @change="update"
            />
            <sw-input-number
              v-model="selectTargetData[0].option.seriesConfig.bgImgTranslateY"
              unit="px"
              bottomLabel="Y"
              width="90"
              @change="update"
            />
          </div>
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="后缀">
      <template #content>
        <el-form-item label="文本" :label-width="secondLabelWidth">
          <sw-input @change="update" v-model="selectTargetData[0].option.seriesConfig.unitText" />
        </el-form-item>

        <el-form-item label="偏移" :label-width="secondLabelWidth">
          <div class="flex flex-center-between" style="width: 100%">
            <sw-input-number
              v-model="selectTargetData[0].option.seriesConfig.unitTranslateX"
              unit="px"
              bottomLabel="X"
              width="90"
              @change="update"
            />
            <sw-input-number
              v-model="selectTargetData[0].option.seriesConfig.unitTranslateY"
              unit="px"
              bottomLabel="Y"
              width="90"
              @change="update"
            />
          </div>
        </el-form-item>

        <el-form-item label="自定义样式" :label-width="secondLabelWidth">
          <el-checkbox @change="update" v-model="selectTargetData[0].option.seriesConfig.isUnitCustomStyle" />
        </el-form-item>
        <el-form-item
          label="文本样式"
          v-if="selectTargetData[0].option.seriesConfig.isUnitCustomStyle"
          title="文本样式"
          :label-width="secondLabelWidth"
        >
          <configTextStyle v-model="inputCustomStyle" @change="handleCustomStyleChange">
            <template #append>
              <div style="flex: 1; margin-left: 8px" class="flex flex-justify-between">
                <SwInputNumber
                  @change="update"
                  v-model="selectTargetData[0].option.seriesConfig.unitLetterSpacing"
                  unit="px"
                  bottomLabel="字距"
                />
                <SwInputNumber
                  @change="update"
                  v-model="selectTargetData[0].option.seriesConfig.unitLineHeight"
                  unit="px"
                  bottomLabel="行距"
                />
              </div>
            </template>
          </configTextStyle>
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="标签" show-icon @change="update" v-model="selectTargetData[0].option.seriesConfig.tagShow">
      <template #content>
        <el-form-item label="文本样式" title="文本样式" :label-width="secondLabelWidth">
          <configTextStyle v-model="inputLabelStyle" @change="handleLabelStyleChange">
            <template #append>
              <div style="flex: 1; margin-left: 8px" class="flex flex-justify-between">
                <SwInputNumber
                  @change="update"
                  v-model="selectTargetData[0].option.seriesConfig.tagLetterSpacing"
                  unit="px"
                  bottomLabel="字距"
                />
                <SwInputNumber
                  @change="update"
                  v-model="selectTargetData[0].option.seriesConfig.tagLineHeight"
                  unit="px"
                  bottomLabel="行距"
                />
              </div>
            </template>
          </configTextStyle>
        </el-form-item>
        <el-form-item label="偏移" :label-width="secondLabelWidth">
          <div class="flex flex-center-between" style="width: 100%">
            <sw-input-number
              v-model="selectTargetData[0].option.seriesConfig.tagTranslateX"
              unit="px"
              bottomLabel="X"
              width="90"
              @change="update"
            />
            <sw-input-number
              v-model="selectTargetData[0].option.seriesConfig.tagTranslateY"
              unit="px"
              bottomLabel="Y"
              width="90"
              @change="update"
            />
          </div>
        </el-form-item>
        <SwCollapseItem title="后缀">
          <template #content>
            <el-form-item label="文本" :label-width="thirdLabelWidth">
              <sw-input v-model="selectTargetData[0].option.seriesConfig.tagUnitText" @change="update" />
            </el-form-item>
            <el-form-item label="偏移" :label-width="thirdLabelWidth">
              <div class="flex flex-center-between" style="width: 100%">
                <sw-input-number
                  v-model="selectTargetData[0].option.seriesConfig.tagUnitTranslateX"
                  unit="px"
                  bottomLabel="X"
                  width="90"
                  @change="update"
                />
                <sw-input-number
                  v-model="selectTargetData[0].option.seriesConfig.tagUnitTranslateY"
                  unit="px"
                  bottomLabel="Y"
                  width="90"
                  @change="update"
                />
              </div>
            </el-form-item>
            <el-form-item label="自定义样式" title="自定义样式" :label-width="thirdLabelWidth">
              <el-checkbox @change="update" v-model="selectTargetData[0].option.seriesConfig.isTagUnitCustomStyle" />
            </el-form-item>

            <el-form-item
              label="文本样式"
              title="文本样式"
              :label-width="38"
              v-if="selectTargetData[0].option.seriesConfig.isTagUnitCustomStyle"
            >
              <configTextStyle v-model="inputTagUnitStyle" @change="handleTagUnitChange" style="margin-left: 10px">
                <template #append>
                  <div style="flex: 1; margin-left: 8px" class="flex flex-justify-between">
                    <SwInputNumber
                      @change="update"
                      v-model="selectTargetData[0].option.seriesConfig.tagUnitLetterSpacing"
                      unit="px"
                      bottomLabel="字距"
                    />
                    <SwInputNumber
                      @change="update"
                      v-model="selectTargetData[0].option.seriesConfig.tagUnitLineHeight"
                      unit="px"
                      bottomLabel="行距"
                    />
                  </div>
                </template>
              </configTextStyle>
            </el-form-item>
          </template>
        </SwCollapseItem>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber } from "@screenwright/ui/input-number";
import SwUpload from "@editor/base/SwUpload/index.vue";

import configTextStyle from "../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../components/configTextStyle/useTextStyleAttrs";
import { firstLabelWidth, secondLabelWidth, thirdLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "seriesFontFamily",
  fontStyle: "seriesFontStyle",
  fontWeight: "seriesFontWeight",
  fontSize: "seriesFontSize",
  color: "seriesColor",
  attrs: "seriesConfig"
});

const { input: inputCustomStyle, handleConfigTextChange: handleCustomStyleChange } = useFontStyleAttrs({
  fontFamily: "unitFontFamily",
  fontStyle: "unitFontStyle",
  fontWeight: "unitFontWeight",
  fontSize: "unitFontSize",
  color: "unitColor",
  attrs: "seriesConfig"
});
const { input: inputLabelStyle, handleConfigTextChange: handleLabelStyleChange } = useFontStyleAttrs({
  fontFamily: "tagFontFamily",
  fontStyle: "tagFontStyle",
  fontWeight: "tagFontWeight",
  fontSize: "tagFontSize",
  color: "tagColor",
  attrs: "seriesConfig"
});

const { input: inputTagUnitStyle, handleConfigTextChange: handleTagUnitChange } = useFontStyleAttrs({
  fontFamily: "tagUnitFontFamily",
  fontStyle: "tagUnitFontStyle",
  fontWeight: "tagUnitFontWeight",
  fontSize: "tagUnitFontSize",
  color: "tagUnitColor",
  attrs: "seriesConfig"
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
