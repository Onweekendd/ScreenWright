<template>
  <div class="ft-qachat-global">
    <div class="fs-14" style="color: red">注意：该功能仅在预览/发布状态下可正常使用！</div>
    <el-form-item label="启用" :label-width="firstLabelWidth">
      <el-checkbox v-model="selectTargetData[0].option.aiChatShow" @change="update" />
    </el-form-item>
    <template v-if="selectTargetData[0].option.aiChatShow">
      <el-form-item label="内容推荐" :label-width="firstLabelWidth">
        <template #label>
          <span
            >内容推荐
            <el-tooltip class="item" effect="dark" placement="right">
              <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
              <template #content>
                <p>显示内容推荐，会在回答完毕后，然后基于回答内容给出3个可能感兴趣的问题</p>
              </template>
            </el-tooltip>
          </span>
        </template>
        <el-checkbox v-model="selectTargetData[0].option.questionAsk" @change="update" />
      </el-form-item>
      <el-form-item label="初始化提问" :label-width="firstLabelWidth">
        <template #label>
          <span
            >默认提问词
            <el-tooltip class="item" effect="dark" placement="right">
              <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
              <template #content>
                <p>如默认提问词不为空，初始化完成时，会自动提问一次默认提问词</p>
              </template>
            </el-tooltip>
          </span>
        </template>
        <sw-input v-model="selectTargetData[0].option.defaultAsk" @change="update" />
      </el-form-item>
      <el-form-item label="窗口大小" :label-width="firstLabelWidth">
        <div class="flex flex-center-between">
          <sw-input-number
            v-model="selectTargetData[0].option.boxWidth"
            unit="px"
            :controls="false"
            bottomLabel="宽度"
            @change="update"
          />
          <sw-input-number
            v-model="selectTargetData[0].option.boxHeight"
            unit="px"
            :controls="false"
            bottomLabel="高度"
            @change="update"
          />
        </div>
      </el-form-item>
      <el-form-item label="窗口偏移" :label-width="firstLabelWidth">
        <div class="flex flex-center-between">
          <sw-input-number
            v-model="selectTargetData[0].option.boxX"
            unit="px"
            :controls="false"
            bottomLabel="X"
            @change="update"
          />
          <sw-input-number
            v-model="selectTargetData[0].option.boxY"
            unit="px"
            :controls="false"
            bottomLabel="Y"
            @change="update"
          />
        </div>
      </el-form-item>
      <sw-collapse-item title="内容文字" open>
        <template #content>
          <el-form-item label="文本样式" :label-width="secondLabelWidth">
            <configTextStyle v-model="fontInput" :isShowFontStyle="false" @change="handleFontChange" />
          </el-form-item>
          <el-form-item label="文本样式" :label-width="secondLabelWidth">
            <div class="flex flex-center-between">
              <sw-input-number
                v-model="selectTargetData[0].option.boxCompWidth"
                unit="px"
                :controls="false"
                bottomLabel="宽度"
                @change="update"
              />
              <sw-input-number
                v-model="selectTargetData[0].option.boxCompHeight"
                unit="px"
                :controls="false"
                bottomLabel="高度"
                @change="update"
              />
            </div>
          </el-form-item>
        </template>
      </sw-collapse-item>
      <sw-collapse-item title="背景" open>
        <template #content>
          <el-form-item label="类型" :label-width="secondLabelWidth">
            <el-select
              popper-class="sw-select-dropdown"
              class="sw-select"
              v-model="selectTargetData[0].option.backgroundType"
              @change="update"
            >
              <el-option v-for="item in backgroundType" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item
            label="背景颜色"
            :label-width="secondLabelWidth"
            v-if="selectTargetData[0].option.backgroundType === 'color'"
          >
            <sw-single-color-picker v-model="selectTargetData[0].option.backgroundColor" @change="update" />
          </el-form-item>
          <el-form-item label="图片" :label-width="secondLabelWidth" v-else>
            <sw-upload
              v-model="selectTargetData[0].option.backgroundImage"
              :multiple="false"
              :showFileList="false"
              @change="update"
              @delete="update"
            />
          </el-form-item>
          <el-form-item label="圆角" :label-width="secondLabelWidth">
            <sw-slider
              v-model="selectTargetData[0].option.borderRadius"
              :min="0"
              :max="100"
              :step="1"
              unit="px"
              @change="update"
            />
          </el-form-item>
        </template>
      </sw-collapse-item>
    </template>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { SwCollapseItem } from "@screenwright/ui";
import { SwInput } from "@screenwright/ui";
import { SwInputNumber } from "@screenwright/ui";
import { SwSingleColorPicker } from "@screenwright/ui";
import { SwSlider } from "@screenwright/ui";
import SwUpload from "@editor/base/SwUpload/index.vue";
import Icon from "@editor/base/Icon/index.vue";

import configTextStyle from "../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../components/configTextStyle/useTextStyleAttrs";
import { firstLabelWidth, secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();

const { input: fontInput, handleConfigTextChange: handleFontChange } = useFontStyleAttrs({
  fontFamily: "fontFamily",
  fontStyle: "fontSize",
  fontWeight: "fontWeight",
  fontSize: "fontSize",
  color: "fontColor"
});

const backgroundType = ref([
  { label: "颜色", value: "color" },
  { label: "自定义", value: "custom" }
]);
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();
.fs-14 {
  font-size: 14px;
}
</style>
