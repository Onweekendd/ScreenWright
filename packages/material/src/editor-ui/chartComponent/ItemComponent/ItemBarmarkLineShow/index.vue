<template>
  <sw-collapse-item
    title="数据标线"
    v-model="selectTargetData[0].option.markLineShow[currentIndex]"
    showIcon
    @change="update"
  >
    <template #content>
      <div class="third_collapse">
        <sw-collapse-item title="数据" open>
          <template #content>
            <el-form-item label="类型" title="类型" :label-width="fourthLabelWidth">
              <el-select
                v-model="selectTargetData[0].option.markLineDataType[currentIndex]"
                popper-class="sw-select-dropdown"
                @change="update"
              >
                <el-option v-for="item in markLineDataType" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item
              label="数值"
              title="数值"
              :label-width="fourthLabelWidth"
              v-if="selectTargetData[0].option.markLineDataType[currentIndex] === 'custom'"
            >
              <sw-input-number
                v-model.number="selectTargetData[0].option.markLineData[currentIndex]"
                :min="0"
                :controls="false"
                @change="update"
              />
            </el-form-item>
          </template>
        </sw-collapse-item>
      </div>
      <div class="third_collapse">
        <sw-collapse-item title="线" open>
          <template #content>
            <el-form-item label="颜色" title="颜色" :label-width="fourthLabelWidth">
              <sw-single-color-picker
                @change="update"
                v-model="selectTargetData[0].option.markLineLineColor[currentIndex]"
              />
            </el-form-item>
            <el-form-item label="粗细" title="粗细" :label-width="fourthLabelWidth">
              <sw-input-number
                v-model.number="selectTargetData[0].option.markLineLineWidth[currentIndex]"
                unit="px"
                :min="0"
                :controls="false"
                @change="update"
              />
            </el-form-item>
            <el-form-item label="类型" title="类型" :label-width="fourthLabelWidth">
              <el-select
                v-model="selectTargetData[0].option.markLineLineType[currentIndex]"
                popper-class="sw-select-dropdown"
                @change="update"
              >
                <el-option v-for="item in lineType" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </template>
        </sw-collapse-item>
      </div>
      <div class="third_collapse">
        <sw-collapse-item title="两端标记" open>
          <template #content>
            <el-form-item label="起点图形" title="起点图形" :label-width="fourthLabelWidth">
              <el-select
                v-model="selectTargetData[0].option.markLineSymbolStart[currentIndex]"
                popper-class="sw-select-dropdown"
                @change="update"
              >
                <el-option v-for="item in seriesSymbol" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item
              label="图片"
              title="图片"
              :label-width="fourthLabelWidth"
              v-if="selectTargetData[0].option.markLineSymbolStart[currentIndex] === 'image'"
            >
              <sw-upload
                v-model="selectTargetData[0].option.markLineSymbolStartImage[currentIndex]"
                :multiple="false"
                :showFileList="false"
                @change="update"
                @delete="update"
              />
            </el-form-item>
            <el-form-item label="终点图形" title="终点图形" :label-width="fourthLabelWidth">
              <el-select
                v-model="selectTargetData[0].option.markLineSymbolEnd[currentIndex]"
                popper-class="sw-select-dropdown"
                @change="update"
              >
                <el-option v-for="item in seriesSymbol" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item
              label="图片"
              title="图片"
              :label-width="fourthLabelWidth"
              v-if="selectTargetData[0].option.markLineSymbolEnd[currentIndex] === 'image'"
            >
              <sw-upload
                v-model="selectTargetData[0].option.markLineSymbolEndImage[currentIndex]"
                :multiple="false"
                :showFileList="false"
                @change="update"
                @delete="update"
              />
            </el-form-item>
            <el-form-item label="尺寸" title="尺寸" :label-width="fourthLabelWidth">
              <div class="fullWidth flex flex-center-between">
                <sw-input-number
                  v-model.number="selectTargetData[0].option.markLineSymbolWidth[currentIndex]"
                  unit="px"
                  bottomLabel="宽度"
                  :min="0"
                  :controls="false"
                  width="90"
                  @change="update"
                />
                <sw-input-number
                  v-model.number="selectTargetData[0].option.markLineSymbolHeight[currentIndex]"
                  unit="px"
                  bottomLabel="高度"
                  :min="0"
                  width="90"
                  :controls="false"
                  @change="update"
                />
              </div>
            </el-form-item>
          </template>
        </sw-collapse-item>
      </div>
      <sw-collapse-item
        title="文本标签"
        @change="update"
        v-model="selectTargetData[0].option.markLineLabelShow[currentIndex]"
        showIcon
      >
        <template #content>
          <el-form-item label="起点图形" title="起点图形" :label-width="fourthLabelWidth">
            <el-select
              v-model="selectTargetData[0].option.markLineLabelPosition[currentIndex]"
              popper-class="sw-select-dropdown"
              @change="update"
            >
              <el-option
                v-for="item in markLineLabelPosition"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="文本样式" title="文本样式" :label-width="fourthLabelWidth">
            <ConfigTextStyle v-model="textStyleinput" @change="handleConfigTextChange" />
          </el-form-item>
          <!-- <el-form-item label="文本自定义" title="文本自定义" :label-width="fourthLabelWidth">
            <div class="flex flex-center">
              <sw-input v-model="selectTargetData[0].option.markLineLabelCustom[currentIndex]" style="flex: 1" />
              <el-popover placement="top-end" effect="dark" width="200" trigger="hover">
                <template #reference>
                  <Icon class="custom-icon" type="QuestionFilled" size="16" color="rgb(180, 183, 193)" />
                </template>
                <div>
                  <div>字符串模板 模板变量有：</div>
                  <div>{a}：系列名。</div>
                  <div>{b}：数据名。</div>
                  <div>{c}：数据值。</div>
                  <div>{@xxx}：数据中名为 'xxx' 的维度的值，如 {@product} 表示名为 'product' 的维度的值。</div>
                  <div>{@[n]}：数据中维度 n 的值，如 {@[3]} 表示维度 3 的值，从 0 开始计数</div>
                </div>
              </el-popover>
            </div>
          </el-form-item> -->
          <!-- 文本自定义 -->
          <ItemTextDynamic :currentIndex="currentIndex" :labelWidth="fourthLabelWidth" />
          <el-form-item label="距离" :label-width="fourthLabelWidth">
            <sw-input-number
              v-model.number="selectTargetData[0].option.markLineLabelDistance[currentIndex]"
              unit="px"
              :controls="false"
              @change="update"
            />
          </el-form-item>
          <el-form-item label="边距" :label-width="fourthLabelWidth">
            <div class="fullWidth flex flex-center-between">
              <sw-input-number
                v-model.number="selectTargetData[0].option.markLineLabelPaddingTop[currentIndex]"
                bottomLabel="上"
                :controls="false"
                width="40"
                @change="update"
              />
              <sw-input-number
                v-model.number="selectTargetData[0].option.markLineLabelPaddingBottom[currentIndex]"
                bottomLabel="下"
                :controls="false"
                width="40"
                @change="update"
              />
              <sw-input-number
                v-model.number="selectTargetData[0].option.markLineLabelPaddingLeft[currentIndex]"
                bottomLabel="左"
                :controls="false"
                width="40"
                @change="update"
              />
              <sw-input-number
                v-model.number="selectTargetData[0].option.markLineLabelPaddingRight[currentIndex]"
                bottomLabel="右"
                :controls="false"
                width="40"
                @change="update"
              />
            </div>
          </el-form-item>
        </template>
      </sw-collapse-item>
    </template>
  </sw-collapse-item>
</template>

<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import SwUpload from "@editor/base/SwUpload/index.vue";

import ConfigTextStyle from "../../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../../components/configTextStyle/useTextStyleAttrs";
import { fourthLabelWidth } from "../../../constants";
import { lineType, markLineDataType, markLineLabelPosition, seriesSymbol } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";
import ItemTextDynamic from "../ItemTextDynamic/index.vue";

const { selectTargetData, update } = useUpdateInstance();
const props = defineProps<{
  currentIndex: number;
}>();
const { input: textStyleinput, handleConfigTextChange } = useFontStyleAttrs(
  {
    fontFamily: "markLineLabelFontFamily",
    fontSize: "markLineLabelFontSize",
    color: "markLineLabelColor",
    fontStyle: "markLineLabelFontStyle",
    fontWeight: "markLineLabelFontWeight"
  },
  props.currentIndex
);
</script>
<style scoped lang="scss">
.custom-icon {
  margin-left: 10px;
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
