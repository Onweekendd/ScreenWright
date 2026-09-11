<template>
  <div class="point-timeline-timeLine">
    <SwCoordinateTabs v-model="tabsActive" :option="coordinateOption" />
    <SwCollapseItem title="轴点" open>
      <template #content>
        <el-form-item label="图片" :label-width="secondLabelWidth">
          <SwUpload
            @change="update"
            @delete="update"
            v-model="selectTargetData[0].option.timeLineConfig[tabsActive].axialPointImgSrc"
          />
        </el-form-item>
        <el-form-item label="尺寸" :label-width="secondLabelWidth">
          <div class="flex flex-center-between">
            <SwInputNumber
              v-model="selectTargetData[0].option.timeLineConfig[tabsActive].axialPointWidth"
              unit="px"
              bottomLabel="宽度"
              @change="update"
            />
            <SwInputNumber
              v-model="selectTargetData[0].option.timeLineConfig[tabsActive].axialPointHeight"
              unit="px"
              bottomLabel="高度"
              @change="update"
            />
          </div>
        </el-form-item>

        <el-form-item label="偏移" :label-width="secondLabelWidth">
          <div class="flex flex-center-between">
            <SwInputNumber
              v-model="selectTargetData[0].option.timeLineConfig[tabsActive].axialPointTranslateX"
              unit="px"
              bottomLabel="X"
              @change="update"
            />
            <SwInputNumber
              v-model="selectTargetData[0].option.timeLineConfig[tabsActive].axialPointTranslateY"
              unit="px"
              bottomLabel="Y"
              @change="update"
            />
          </div>
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="标签轴" open>
      <template #content>
        <el-form-item label="宽度" :label-width="secondLabelWidth">
          <SwInputNumber
            v-model.number="selectTargetData[0].option.timeLineConfig[tabsActive].axialSpindleWidth"
            unit="px"
          />
        </el-form-item>

        <el-form-item label="文本样式" :label-width="secondLabelWidth">
          <configTextStyle v-model="input" @change="handleConfigTextChange">
            <template #append>
              <SwInputNumber
                v-model="selectTargetData[0].option.timeLineConfig[tabsActive].axialSpindleTextLetterSpacing"
                @change="update"
                bottomLabel="字距"
                unit="px"
                width="60"
                style="margin-left: 12px"
              />
              <SwInputNumber
                v-model="selectTargetData[0].option.timeLineConfig[tabsActive].axialSpindleTextLineHeight"
                @change="update"
                bottomLabel="行距"
                unit="px"
                width="60"
                style="margin-left: 12px"
              />
            </template>
          </configTextStyle>
        </el-form-item>

        <ItemSelectAlign
          label="水平方式"
          v-model="selectTargetData[0].option.timeLineConfig[tabsActive].axialSpindleTextAlign"
          @change="update"
          :type="typeAttrs.default"
          :label-width="secondLabelWidth"
        />
        <el-form-item label="偏移" :label-width="secondLabelWidth">
          <div class="flex flex-center-between">
            <SwInputNumber
              v-model="selectTargetData[0].option.timeLineConfig[tabsActive].axialSpindleTranslateX"
              unit="px"
              bottomLabel="X"
              @change="update"
            />
            <SwInputNumber
              v-model="selectTargetData[0].option.timeLineConfig[tabsActive].axialSpindleTranslateY"
              unit="px"
              bottomLabel="Y"
              @change="update"
            />
          </div>
        </el-form-item>
      </template>
    </SwCollapseItem>

    <SwCollapseItem title="标题" open>
      <template #content>
        <el-form-item label="宽度" :label-width="secondLabelWidth">
          <SwInputNumber
            v-model.number="selectTargetData[0].option.timeLineConfig[tabsActive].axialTitleWidth"
            unit="px"
            @change="update"
          />
        </el-form-item>

        <el-form-item label="文本样式" :label-width="secondLabelWidth">
          <configTextStyle v-model="inputTitle" @change="handleTitleChange">
            <template #append>
              <SwInputNumber
                v-model="selectTargetData[0].option.timeLineConfig[tabsActive].axialTitleTextLetterSpacing"
                @change="update"
                bottomLabel="字距"
                unit="px"
                width="60"
                style="margin-left: 12px"
              />
              <SwInputNumber
                v-model="selectTargetData[0].option.timeLineConfig[tabsActive].axialTitleTextLineHeight"
                @change="update"
                bottomLabel="行距"
                unit="px"
                width="60"
                style="margin-left: 12px"
              />
            </template>
          </configTextStyle>
        </el-form-item>

        <ItemSelectAlign
          label="水平方式"
          v-model="selectTargetData[0].option.timeLineConfig[tabsActive].axialTitleTextAlign"
          @change="update"
          :type="typeAttrs.default"
          :label-width="secondLabelWidth"
        />

        <el-form-item label="偏移" :label-width="secondLabelWidth">
          <div class="flex flex-center-between">
            <SwInputNumber
              v-model.number="selectTargetData[0].option.timeLineConfig[tabsActive].axialTitleTranslateX"
              unit="px"
              bottomLabel="X"
              @change="update"
            />

            <SwInputNumber
              v-model.number="selectTargetData[0].option.timeLineConfig[tabsActive].axialTitleTranslateY"
              unit="px"
              bottomLabel="Y"
              @change="update"
            />
          </div>
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from "vue";

import { SwCollapseItem as SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwCoordinateTabs as SwCoordinateTabs } from "@screenwright/ui/coordinate-tabs";
import { SwInputNumber as SwInputNumber } from "@screenwright/ui/input-number";
import SwUpload from "@editor/base/SwUpload/index.vue";
import ItemSelectAlign from "@editor/textComponent/textConfig/ItemComponent/ItemSelectAlign/index.vue";
import { typeAttrs } from "@editor/textComponent/textConfig/ItemComponent/ItemSelectAlign/ItemSelectAlign";

import configTextStyle from "../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../components/configTextStyle/useTextStyleAttrs";
import { secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const tabsActive = ref("defaultObj");
const coordinateOption = ref([
  {
    label: "默认",
    value: "defaultObj"
  },
  {
    label: "选中",
    value: "activeObj"
  }
]);
watch(
  () => tabsActive.value,
  () => {
    getInitValue(`timeLineConfig.${tabsActive.value}`);
    getTitleInitValue(`timeLineConfig.${tabsActive.value}`);
  }
);
const { input, handleConfigTextChange, getInitValue } = useFontStyleAttrs({
  fontFamily: "axialSpindleTextFontFamily",
  fontStyle: "axialSpindleTextFontStyle",
  fontWeight: "axialSpindleTextFontWeight",
  fontSize: "axialSpindleTextFontSize",
  color: "axialSpindleTextColor",
  attrs: `timeLineConfig.${tabsActive.value}`
});

const {
  input: inputTitle,
  handleConfigTextChange: handleTitleChange,
  getInitValue: getTitleInitValue
} = useFontStyleAttrs({
  fontFamily: "axialTitleTextFontFamily",
  fontStyle: "axialTitleTextFontStyle",
  fontWeight: "axialTitleTextFontWeight",
  fontSize: "axialTitleTextFontSize",
  color: "axialTitleTextColor",
  attrs: `timeLineConfig.${tabsActive.value}`
});
</script>
