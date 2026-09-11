<template>
  <div class="iot-subtabs-global">
    <el-form-item label="默认选中项值" :label-width="firstLabelWidth">
      <sw-input v-model="selectTargetData[0].option.active" placeholder="选中项 value 的数值" @change="update" />
    </el-form-item>
    <div class="flex flex-wrap">
      <el-form-item label="是否关联" :label-width="firstLabelWidth">
        <template #label>
          <span
            >是否关联
            <el-tooltip class="item" effect="dark" placement="right">
              <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
              <template #content>
                <p>若设置启动关联的选项卡，则它们会共用一个选中项值</p>
              </template>
            </el-tooltip>
          </span>
        </template>
        <el-checkbox v-model="selectTargetData[0].option.related" @change="update" />
      </el-form-item>
      <el-form-item
        label="是否关联隔离"
        v-if="selectTargetData[0].option.related && panelId"
        :label-width="firstLabelWidth"
      >
        <el-checkbox v-model="selectTargetData[0].option.isIsolated" />
      </el-form-item>
      <el-form-item label="取消选中" :label-width="firstLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.isCancelSelected" @change="update" />
      </el-form-item>
      <el-form-item label="高度跟随行数" :label-width="firstLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.setMinHeight" @change="update" />
      </el-form-item>
      <el-form-item label="选中项不变" :label-width="firstLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.isFixedSelectedItem" @change="update" />
      </el-form-item>
      <el-form-item label="跟随画布滑动" :label-width="firstLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.followCanvasSlide" @change="update" />
      </el-form-item>
    </div>

    <sw-collapse-item title="文字">
      <template #content>
        <el-form-item label="边距" :label-width="secondLabelWidth">
          <div class="flex flex-center-between">
            <sw-input-number
              v-model.number="selectTargetData[0].option.paddingTop"
              bottomLabel="上"
              unit="px"
              @change="update"
            />
            <sw-input-number
              v-model.number="selectTargetData[0].option.paddingBottom"
              bottomLabel="下"
              unit="px"
              @change="update"
            />
            <sw-input-number
              v-model.number="selectTargetData[0].option.paddingLeft"
              bottomLabel="左"
              unit="px"
              @change="update"
            />
            <sw-input-number
              v-model.number="selectTargetData[0].option.paddingRight"
              bottomLabel="右"
              unit="px"
              @change="update"
            />
          </div>
        </el-form-item>
        <el-form-item label="文字方向" :label-width="secondLabelWidth">
          <sw-radio
            direction="row"
            v-model="selectTargetData[0].option.writingMode"
            :option="writingList"
            @change="update"
          />
        </el-form-item>
        <ItemSelectAlign
          :label-width="secondLabelWidth"
          label="水平对齐"
          v-if="selectTargetData[0].option.writingMode == 'horizontal-tb'"
          :type="typeAttrs.flex"
          v-model="selectTargetData[0].option.alignItems"
          @change="update"
        />
        <ItemSelectAlign
          :label-width="secondLabelWidth"
          label="垂直对齐"
          v-if="selectTargetData[0].option.writingMode == 'tb-rl'"
          :type="typeAttrs.flex"
          v-model="selectTargetData[0].option.alignItems"
          @change="update"
        />
      </template>
    </sw-collapse-item>
    <sw-collapse-item title="网格布局">
      <template #content>
        <el-form-item label="布局" :label-width="secondLabelWidth">
          <div class="flex flex-center-between">
            <sw-input-number
              v-model="selectTargetData[0].option.rows"
              bottomLabel="行数"
              :min="1"
              @change="update"
              controls
            />
            <sw-input-number
              v-model="selectTargetData[0].option.columns"
              controls
              bottomLabel="列数"
              :min="1"
              @change="update"
            />
          </div>
        </el-form-item>
        <el-form-item label="间隔" :label-width="secondLabelWidth">
          <div class="flex flex-center-between">
            <sw-input-number
              v-model="selectTargetData[0].option.rowGap"
              unit="px"
              :controls="false"
              bottomLabel="行距"
              @change="update"
            />
            <sw-input-number
              v-model="selectTargetData[0].option.columnGap"
              unit="px"
              :controls="false"
              bottomLabel="列距"
              @change="update"
            />
          </div>
        </el-form-item>
      </template>
    </sw-collapse-item>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";

import { has } from "lodash-es";

import { SwCollapseItem } from "@screenwright/ui";
import { SwInput } from "@screenwright/ui";
import { SwInputNumber } from "@screenwright/ui";
import { SwRadio } from "@screenwright/ui";
import Icon from "@editor/base/Icon/index.vue";
import { ItemSelectAlign } from "../../../text";
import { typeAttrs } from "../../../text";

import { firstLabelWidth, secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const route = useRoute();

const { selectTargetData, update } = useUpdateInstance();
const panelId = ref<number | null>(null);

const writingList = ref([
  { label: "横排", value: "horizontal-tb" },
  { label: "竖排", value: "tb-rl" }
]);
const initData = () => {
  const activeDFObj = {
    textTranslateX: 0,
    textTranslateY: 0,
    isBorder: true,
    borderWidth: 2,
    borderColor: "rgba(138, 86, 232, 0.9)",
    backgroundColor: "rgba(139, 88, 231, 0.6)",
    backgroundImage: "",
    backgroundImageType: "100% 100%",
    backgroundType: "color",
    fontSize: 16,
    fontWeight: false,
    fontStyle: false,
    fontFamily: "sans-serif",
    fontColor: "rgba(255, 255, 255, 1)",
    isTextShadow: false,
    textShadow: {
      x: 0,
      y: 0,
      blur: 0,
      color: "rgba(255, 255, 255, 1)",
      extend: 0
    }
  };
  if (!has(selectTargetData.value[0].option, "seriesTabsList")) {
    const seriesListData: any[] = [];
    for (let i = 0; i < selectTargetData.value[0].data.length; i++) {
      seriesListData.push({
        activeObj: {
          ...activeDFObj
        },
        defaultObj: {
          ...activeDFObj,
          borderColor: "rgba(160,169,184,0.30)",
          backgroundColor: "rgba(15,22,34,0.60)"
        },
        hoverObj: {
          ...activeDFObj
        },
        name: "系列" + (i + 1)
      });
    }

    (selectTargetData.value[0].option as any).seriesTabsList = seriesListData;
  }
};

onMounted(() => {
  initData();
  panelId.value = route && route.params.cid ? Number(route.params.cid as string) : null;
});
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();
</style>
