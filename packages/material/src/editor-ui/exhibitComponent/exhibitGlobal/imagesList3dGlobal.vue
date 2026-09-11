<template>
  <div class="imagesList-3d-global">
    <el-form-item label="相机位置" :label-width="firstLabelWidth">
      <div class="flex">
        <sw-input-number
          v-model="selectTargetData[0].option.translateX"
          bottomLabel="X"
          :controls="false"
          @change="update"
        />
        <sw-input-number
          v-model="selectTargetData[0].option.translateY"
          bottomLabel="Y"
          :controls="false"
          @change="update"
        />
        <sw-input-number
          v-model="selectTargetData[0].option.translateZ"
          bottomLabel="Z"
          :controls="false"
          @change="update"
        />
      </div>
    </el-form-item>
    <sw-collapse-item title="相机角度" open>
      <template #content>
        <el-form-item label="绕X轴" :label-width="secondLabelWidth">
          <sw-slider
            v-model="selectTargetData[0].option.rotateX"
            :max="180"
            :min="-180"
            :step="0.1"
            unit="°"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="绕Y轴" :label-width="secondLabelWidth">
          <sw-slider
            v-model="selectTargetData[0].option.rotateY"
            :max="180"
            :min="-180"
            :step="0.1"
            unit="°"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="绕Z轴" :label-width="secondLabelWidth">
          <sw-slider
            v-model="selectTargetData[0].option.rotateZ"
            :max="180"
            :min="-180"
            :step="0.1"
            unit="°"
            @change="update"
          />
        </el-form-item>
      </template>
    </sw-collapse-item>
    <el-form-item label="视图距离" :label-width="firstLabelWidth">
      <sw-input-number v-model="selectTargetData[0].option.perspective" unit="px" :controls="false" @change="update" />
    </el-form-item>
    <el-form-item label="半径" :label-width="firstLabelWidth">
      <sw-input-number v-model="selectTargetData[0].option.radius" unit="px" :controls="false" @change="update" />
    </el-form-item>
    <el-form-item label="轮播方向" :label-width="firstLabelWidth">
      <sw-radio
        v-model="selectTargetData[0].option.rotateDirection"
        :option="directionList"
        @change="update"
        direction="row"
      />
    </el-form-item>
    <el-form-item label="轮播时速" :label-width="firstLabelWidth">
      <template #label>
        <span
          >轮播时速
          <el-tooltip class="item" effect="dark" placement="right">
            <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
            <template #content>
              <p>设置轮播时速为0s,则不自动轮播</p>
            </template>
          </el-tooltip>
        </span>
      </template>
      <sw-input-number v-model="selectTargetData[0].option.rotateSpeed" :controls="false" unit="s" @change="update" />
    </el-form-item>
    <el-form-item label="停留时长" :label-width="firstLabelWidth">
      <template #label>
        <span
          >停留时长
          <el-tooltip class="item" effect="dark" placement="right">
            <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
            <template #content>
              <p>
                点击选择某个图片旋转到正视角，<br />
                停留设置的时长后会继续轮播
              </p>
            </template>
          </el-tooltip>
        </span>
      </template>
      <sw-input-number
        v-model="selectTargetData[0].option.durationOfStay"
        :min="2"
        :controls="false"
        unit="s"
        @change="update"
      />
    </el-form-item>
    <sw-collapse-item title="文字样式" open>
      <template #content>
        <SwCoordinateTabs v-model="placardType" :option="coordinateOption" />

        <sw-collapse-item title="标题文字" open>
          <template #content>
            <el-form-item label="文本样式" :label-width="38" title="文本样式">
              <configTextStyle v-model="TitleFontInput" @change="handleTitleChange" style="margin-left: 10px">
                <template #append>
                  <sw-input-number
                    v-model.number="currentDataObj.letterSpacing"
                    unit="px"
                    bottomLabel="字距"
                    :controls="false"
                    @change="update"
                  /> </template
              ></configTextStyle>
            </el-form-item>
            <el-form-item label="边距" :label-width="thirdLabelWidth">
              <div class="flex flex-center-between">
                <sw-input-number
                  v-model="currentDataObj.paddingTop"
                  :step="0.1"
                  bottomLabel="上边距"
                  :min="0"
                  :controls="true"
                  @change="update"
                />
                <sw-input-number
                  v-model="currentDataObj.paddingBottom"
                  :step="0.1"
                  bottomLabel="下边距"
                  :min="0"
                  :controls="true"
                  @change="update"
                />
              </div>
            </el-form-item>
            <el-form-item label="偏移" :label-width="thirdLabelWidth">
              <div class="flex flex-center-between">
                <sw-input-number
                  v-model.number="currentDataObj.textTranslateX"
                  unit="px"
                  bottomLabel="X"
                  :controls="false"
                  @change="update"
                />
                <sw-input-number
                  v-model.number="currentDataObj.textTranslateY"
                  unit="px"
                  bottomLabel="Y"
                  :controls="false"
                  @change="update"
                />
              </div>
            </el-form-item>
            <el-form-item label="阴影" :label-width="thirdLabelWidth">
              <el-checkbox v-model="currentDataObj.isTextShadow" @change="update" />
            </el-form-item>
            <el-form-item label="文本阴影" v-if="currentDataObj.isTextShadow" :label-width="thirdLabelWidth">
              <div class="flex flex-left-between">
                <sw-single-color-picker v-model="currentDataObj.textShadow.color" @change="update" />
              </div>
              <div class="flex flex-left-between">
                <sw-input-number
                  v-model="currentDataObj.textShadow.x"
                  bottomLabel="X"
                  :controls="false"
                  @change="update"
                />
                <sw-input-number
                  v-model="currentDataObj.textShadow.y"
                  bottomLabel="Y"
                  :controls="false"
                  @change="update"
                />
                <sw-input-number
                  v-model="currentDataObj.textShadow.blur"
                  bottomLabel="模糊"
                  :controls="false"
                  @change="update"
                />
                <sw-input-number
                  v-model="currentDataObj.textShadow.extend"
                  bottomLabel="扩展"
                  :controls="false"
                  disabled
                  @change="update"
                />
              </div>
            </el-form-item>
            <!--  -->
          </template>
        </sw-collapse-item>
        <sw-collapse-item title="内容文字" open>
          <template #content>
            <el-form-item label="文本样式" :label-width="38" title="文本样式">
              <configTextStyle v-model="fontInput" @change="handleFontChange" style="margin-left: 10px">
                <template #append>
                  <sw-input-number
                    v-model="currentDataObj.letterSpacing2"
                    unit="px"
                    bottomLabel="字距"
                    :controls="false"
                    @change="update"
                  />
                </template>
              </configTextStyle>
            </el-form-item>
            <el-form-item label="偏移" :label-width="thirdLabelWidth">
              <div class="flex flex-center-between">
                <sw-input-number
                  v-model="currentDataObj.textTranslateX2"
                  unit="px"
                  bottomLabel="X"
                  :controls="false"
                  @change="update"
                />
                <sw-input-number
                  v-model="currentDataObj.textTranslateY2"
                  unit="px"
                  bottomLabel="Y"
                  :controls="false"
                  @change="update"
                />
              </div>
            </el-form-item>
            <el-form-item label="阴影" :label-width="thirdLabelWidth">
              <el-checkbox v-model="currentDataObj.isTextShadow2" @change="update" />
            </el-form-item>
            <el-form-item label="文本阴影" v-if="currentDataObj.isTextShadow2" :label-width="thirdLabelWidth">
              <div class="flex flex-left-between">
                <sw-single-color-picker v-model="currentDataObj.textShadow2.color" @change="update" />
              </div>
              <div class="flex flex-left-between">
                <sw-input-number
                  v-model="currentDataObj.textShadow2.x"
                  bottomLabel="X"
                  :controls="false"
                  @change="update"
                />
                <sw-input-number
                  v-model="currentDataObj.textShadow2.y"
                  bottomLabel="Y"
                  :controls="false"
                  @change="update"
                />
                <sw-input-number
                  v-model="currentDataObj.textShadow2.blur"
                  bottomLabel="模糊"
                  :controls="false"
                  @change="update"
                />
                <sw-input-number
                  v-model="currentDataObj.textShadow2.extend"
                  bottomLabel="扩展"
                  :controls="false"
                  disabled
                  @change="update"
                />
              </div>
            </el-form-item>
            <!--  -->
          </template>
        </sw-collapse-item>
      </template>
    </sw-collapse-item>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch } from "vue";

import { SwCollapseItem } from "@screenwright/ui";
import { SwCoordinateTabs } from "@screenwright/ui";
import { SwInputNumber } from "@screenwright/ui";
import { SwRadio } from "@screenwright/ui";
import { SwSingleColorPicker } from "@screenwright/ui";
import { SwSlider } from "@screenwright/ui";
import Icon from "@editor/base/Icon/index.vue";

import configTextStyle from "../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../components/configTextStyle/useTextStyleAttrs";
import { firstLabelWidth, secondLabelWidth, thirdLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();

const directionList = ref([
  { label: "顺时针", value: 1 },
  { label: "逆时针", value: 0 }
]);

const placardType = ref("defaultObj");
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

const currentDataObj = computed(() => {
  return selectTargetData.value[0].option[placardType.value];
});

watch(
  () => placardType.value,
  () => {
    const pathAttrs = placardType.value;
    TitleInit(pathAttrs);
    fontInit(pathAttrs);
  }
);

const {
  input: TitleFontInput,
  handleConfigTextChange: handleTitleChange,
  getInitValue: TitleInit
} = useFontStyleAttrs({
  fontFamily: "fontFamily",
  fontStyle: "fontStyle",
  fontWeight: "fontWeight",
  fontSize: "fontSize",
  color: "fontColor",
  attrs: placardType.value
});

const {
  input: fontInput,
  handleConfigTextChange: handleFontChange,
  getInitValue: fontInit
} = useFontStyleAttrs({
  fontFamily: "fontFamily2",
  fontStyle: "fontStyle2",
  fontWeight: "fontWeight2",
  fontSize: "fontSize2",
  color: "fontColor2",
  attrs: placardType.value
});
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();
:deep(.el-form-item__label) {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 0;
  display: inline-block;
  margin-right: 1px;
}
</style>
