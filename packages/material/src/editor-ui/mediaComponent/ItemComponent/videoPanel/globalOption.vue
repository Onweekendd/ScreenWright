<template>
  <div class="global-option">
    <el-form-item label="混合模式" :label-width="firstLabelWidth">
      <el-select
        style="width: 100%"
        popper-class="sw-select-dropdown"
        v-model="selectTargetData[0].option.mixBlendMode"
        @change="update"
      >
        <el-option v-for="item in mixBlendMode" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item label="布局" :label-width="firstLabelWidth">
      <div class="flex flex-center-between">
        <sw-input-number
          v-model.number="selectTargetData[0].option.rows"
          bottomLabel="行数"
          :min="1"
          @change="update"
        />
        <sw-input-number
          v-model.number="selectTargetData[0].option.columns"
          bottomLabel="列数"
          :min="1"
          @change="update"
        />
      </div>
    </el-form-item>
    <el-form-item label="边距" :label-width="firstLabelWidth" v-if="selectTargetData[0].option.padding">
      <div class="flex">
        <sw-input-number
          v-model.number="selectTargetData[0].option.padding[0]"
          bottomLabel="上"
          :min="1"
          :controls="false"
          @change="update"
        />
        <sw-input-number
          v-model.number="selectTargetData[0].option.padding[1]"
          bottomLabel="右"
          :min="1"
          :controls="false"
          @change="update"
        />
        <sw-input-number
          v-model.number="selectTargetData[0].option.padding[2]"
          bottomLabel="下"
          :min="1"
          :controls="false"
          @change="update"
        />
        <sw-input-number
          v-model.number="selectTargetData[0].option.padding[3]"
          bottomLabel="左"
          :min="1"
          :controls="false"
          @change="update"
        />
      </div>
    </el-form-item>
    <SwCollapseItem title="背景">
      <template #content>
        <el-form-item label="填充方式" :label-width="secondLabelWidth">
          <el-select
            style="width: 100%"
            popper-class="sw-select-dropdown"
            v-model="selectTargetData[0].option.backgroundType"
            @change="update"
          >
            <el-option v-for="item in backgroundType" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item
          :label-width="secondLabelWidth"
          label="颜色"
          v-if="selectTargetData[0].option.backgroundType == 'color'"
        >
          <sw-single-color-picker width="90" v-model="selectTargetData[0].option.backgroundColor" @change="update" />
        </el-form-item>
        <el-form-item
          :label-width="secondLabelWidth"
          label="类型"
          v-if="selectTargetData[0].option.backgroundType == 'custom'"
        >
          <el-select
            style="width: 100%"
            popper-class="sw-select-dropdown"
            v-model="selectTargetData[0].option.backgroundImageType"
            @change="update"
          >
            <el-option v-for="item in backgroundImageType" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item
          :label-width="secondLabelWidth"
          label="图片"
          v-if="selectTargetData[0].option.backgroundType == 'custom'"
        >
          <sw-upload
            v-model="selectTargetData[0].option.backgroundImage"
            :multiple="false"
            :showFileList="false"
            @change="update"
            @delete="update"
          />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="视频配置">
      <template #content>
        <div class="flex flex-center-between">
          <el-form-item :label-width="secondLabelWidth" label="自动播放">
            <el-checkbox v-model="selectTargetData[0].option.autoPlay" @change="update" />
          </el-form-item>
          <el-form-item :label-width="secondLabelWidth" label="循环播放">
            <el-checkbox v-model="selectTargetData[0].option.loopPlay" @change="update" />
          </el-form-item>
        </div>

        <div class="flex flex-center-between">
          <el-form-item :label-width="secondLabelWidth" label="控制条">
            <el-checkbox v-model="selectTargetData[0].option.controler" @change="update" />
          </el-form-item>
          <el-form-item :label-width="secondLabelWidth" label="静音">
            <el-checkbox v-model="selectTargetData[0].option.muted" @change="update" />
          </el-form-item>
        </div>

        <el-form-item label="尺寸类型" title="尺寸类型" :label-width="secondLabelWidth">
          <el-select
            style="width: 100%"
            popper-class="sw-select-dropdown"
            v-model="selectTargetData[0].option.objectFit"
            @change="update"
          >
            <el-option v-for="item in objectFit" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="视频窗口" :label-width="secondLabelWidth">
          <div class="flex flex-center-between">
            <sw-input-number
              v-model.number="selectTargetData[0].option.videoBoxWidth"
              bottomLabel="宽度"
              unit="%"
              :controls="false"
              @change="update"
            />
            <sw-input-number
              v-model.number="selectTargetData[0].option.videoBoxHeight"
              bottomLabel="高度"
              unit="%"
              :controls="false"
              @change="update"
            />
          </div>
        </el-form-item>

        <el-form-item label="hk播放模式" :label-width="secondLabelWidth">
          <el-select
            style="width: 100%"
            popper-class="sw-select-dropdown"
            v-model="selectTargetData[0].option.hkVideoPlayerMode"
            @change="update"
          >
            <el-option v-for="item in playerType" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <!-- <div class="flex flex-center-between flex-wrap">
        <el-form-item label="默认动作">
          <el-checkbox v-model="selectTargetData[0].option.openDelayLoading" @change="update" />
        </el-form-item>
        <el-form-item label="延迟加载">
          <sw-input-number
            v-model.number="selectTargetData[0].option.delayLoadingTime"
            :min="0"
            unit="s"
            @change="update"
          />
        </el-form-item>

        <el-form-item label="延迟播放">
          <sw-input-number
            v-model.number="selectTargetData[0].option.delayPlayTime"
            :min="0"
            unit="s"
            @change="update"
          />
        </el-form-item>

        <el-form-item label="自动隐藏">
          <el-checkbox
            v-model="selectTargetData[0].option.autoHidden"
            :disabled="selectTargetData[0].option.loopPlay"
            @change="update"
          />
        </el-form-item>
      </div> -->
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="视频边框">
      <template #content>
        <el-form-item label="边框图" :label-width="secondLabelWidth">
          <sw-upload
            v-model="selectTargetData[0].option.borderBgImage"
            :multiple="false"
            :showFileList="false"
            @change="update"
            @delete="update"
          />
        </el-form-item>
        <el-form-item label="尺寸类型" title="尺寸类型" :label-width="secondLabelWidth">
          <el-select
            style="width: 100%"
            popper-class="sw-select-dropdown"
            v-model="selectTargetData[0].option.borderBgSize"
            @change="update"
          >
            <el-option v-for="item in backgroundImageType" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="分页配置" v-model="selectTargetData[0].option.showPage" @change="update" showIcon>
      <template #content>
        <el-form-item label="自动翻页" :label-width="secondLabelWidth">
          <el-checkbox v-model="selectTargetData[0].option.autoPager" @change="update" />
        </el-form-item>
        <el-form-item label="翻页类型" :label-width="secondLabelWidth">
          <el-select
            style="width: 100%"
            popper-class="sw-select-dropdown"
            v-model="selectTargetData[0].option.pagerAni"
            @change="update"
          >
            <el-option v-for="item in pagerAniOption" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="间隔时长" :label-width="secondLabelWidth">
          <sw-input-number
            v-model.number="selectTargetData[0].option.pagerTime"
            unit="s"
            :controls="false"
            :min="0"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="分页高度" :label-width="secondLabelWidth">
          <sw-input-number
            v-model="selectTargetData[0].option.pagerHeight"
            :controls="false"
            unit="px"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="分页图标" :label-width="secondLabelWidth">
          <sw-upload
            v-model="selectTargetData[0].option.pageIcon"
            :multiple="false"
            :showFileList="false"
            @change="update"
            @delete="update"
          />
        </el-form-item>
        <el-form-item label="图标尺寸" :label-width="secondLabelWidth">
          <div class="flex flex-center-between">
            <sw-input-number
              v-model="selectTargetData[0].option.pagerIconWidth"
              bottomLabel="宽度"
              unit="px"
              :controls="false"
              @change="update"
            />
            <sw-input-number
              v-model="selectTargetData[0].option.pagerIconHeight"
              bottomLabel="高度"
              unit="px"
              :controls="false"
              @change="update"
            />
          </div>
        </el-form-item>
        <el-form-item label="当前页" :label-width="secondLabelWidth">
          <configTextStyle v-model="currentFontInput" @change="handleCurrentFontChange">
            <template #append>
              <div class="flex flex-center-between" style="width: 100%; margin-left: 13px">
                <sw-input-number
                  v-model.number="selectTargetData[0].option.pagerletterSpacing"
                  :min="0"
                  unit="px"
                  bottomLabel="字距"
                  @change="update"
                />
              </div>
            </template>
          </configTextStyle>
        </el-form-item>
        <el-form-item label="总页" :label-width="secondLabelWidth">
          <configTextStyle v-model="fontInput" @change="handleChange">
            <template #append>
              <div class="flex flex-center-between" style="width: 100%; margin-left: 13px">
                <sw-input-number
                  v-model.number="selectTargetData[0].option.pagerletterSpacing2"
                  :min="0"
                  unit="px"
                  bottomLabel="字距"
                  @change="update"
                  width="110"
                />
              </div>
            </template>
          </configTextStyle>
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive } from "vue";

import { has } from "lodash-es";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import SwUpload from "@editor/base/SwUpload/index.vue";

import configTextStyle from "../../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../../components/configTextStyle/useTextStyleAttrs";
import { firstLabelWidth, secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";
import { backgroundImageType, backgroundType, mixBlendMode, objectFit } from "../dict";
import type { dictNumber, dictString } from "../type";

const { update, selectTargetData } = useUpdateInstance();

const { input: currentFontInput, handleConfigTextChange: handleCurrentFontChange } = useFontStyleAttrs({
  fontFamily: "pagerfontFamily",
  fontStyle: "pagerfontStyle",
  fontWeight: "pagerfontWeight",
  fontSize: "pagerfontSize",
  color: "pagerfontColor"
});

const { input: fontInput, handleConfigTextChange: handleChange } = useFontStyleAttrs({
  fontFamily: "pagerfontFamily2",
  fontStyle: "pagerfontStyle2",
  fontWeight: "pagerfontWeight2",
  fontSize: "pagerfontSize2",
  color: "pagerfontColor2"
});

const pagerAniOption = reactive<dictString[]>([
  { label: "淡入淡出", value: "fading-ease-in" },
  { label: "从上到下", value: "entrance-in-top" },
  { label: "从下到上", value: "entrance-in-bottom" },
  { label: "从右到左", value: "entrance-in-right" },
  { label: "从左到右", value: "entrance-in-left" }
]);

const playerType = reactive<dictNumber[]>([
  { label: "普通模式", value: 0 },
  { label: "高级模式", value: 1 }
]);

interface TargetDataOption {
  seriesList?: any[];
  [key: string]: any;
}

const initData = async () => {
  if (!has(selectTargetData.value[0].option, "seriesList")) {
    const seriesListData: any[] = [];
    for (let i = 0; i < selectTargetData.value[0].data.length; i++) {
      seriesListData.push({
        tabsName: "系列" + (i + 1),
        title: selectTargetData.value[0].data[i].name,
        urlMode: "url",
        url: selectTargetData.value[0].data[i].url,
        customUrl: ""
      });
    }

    (selectTargetData.value[0].option as TargetDataOption).seriesList = seriesListData;
  }

  await update();
};
onMounted(() => {
  initData();
});
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
.sw-label-type {
  width: 100%;
  :deep(.el-select) {
    margin-right: 5px;
  }
  :deep(.el-select__wrapper) {
    min-height: 28px;
  }
  .sw-label-type-number {
    position: relative;
    top: -2px;
  }
}
</style>
