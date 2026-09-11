<template>
  <div class="ft-weather-global">
    <el-form-item label="数据类型" :label-width="firstLabelWidth">
      <SwRadio
        class="config-padding"
        direction="row"
        :option="weatherType"
        v-model="selectTargetData[0].option.weatherType"
        @change="update"
      />
    </el-form-item>
    <div class="flex flex-wrap">
      <el-form-item label="显示图标" :label-width="firstLabelWidth" style="margin-right: 23px">
        <el-checkbox v-model="selectTargetData[0].option.isIcon" @change="update" />
      </el-form-item>
      <el-form-item label="显示天气" :label-width="firstLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.isWeather" @change="update" />
      </el-form-item>
      <el-form-item label="显示气温" :label-width="firstLabelWidth" style="margin-right: 23px">
        <el-checkbox v-model="selectTargetData[0].option.isTemperature" @change="update" />
      </el-form-item>
      <el-form-item label="显示风力" :label-width="firstLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.isWind" @change="update" />
      </el-form-item>
    </div>
    <el-form-item label="排列方式" :label-width="firstLabelWidth">
      <SwRadio
        class="config-padding"
        direction="row"
        :option="orientList"
        v-model="selectTargetData[0].option.direction"
        @change="update"
      />
    </el-form-item>
    <el-form-item label="当前天气" :label-width="firstLabelWidth">
      <!-- <el-cascader
        v-model="selectTargetData[0].option.currentCity"
        placeholder="请选择所在城市"
        :options="cityOptions"
        :props="{ checkStrictly: true }"
        popper-class="weather-city-cascader build-render-ignore"
        style="width: 100%"
        clearable
        placement="bottom-start"
        :popper-options="{
          modifiers: [{ name: 'offset', options: { offset: [0, 10] } }]
        }"
        @change="update"
      /> -->

      <el-select
        popper-class="sw-select-dropdown"
        v-model="selectTargetData[0].option.currentCity"
        filterable
        placeholder="请选择所在城市"
        @change="update"
      >
        <el-option v-for="item in weatherGlobalCity" :key="item.value" :label="item.name" :value="item.value" />
      </el-select>
    </el-form-item>
    <SwCollapseItem title="气温信息">
      <template #content>
        <el-form-item
          label="连接符"
          v-if="selectTargetData[0].option.weatherType === weatherType[1].value"
          :label-width="secondLabelWidth"
        >
          <sw-input v-model="selectTargetData[0].option.connector" placeholder="默认连接符 ~ " @change="update" />
        </el-form-item>
        <el-form-item label="后缀" :label-width="secondLabelWidth">
          <sw-input v-model="selectTargetData[0].option.suffix" placeholder="默认后缀 ℃ " @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="图标配置">
      <template #content>
        <el-form-item label="尺寸" :label-width="secondLabelWidth">
          <div class="flex flex-center-between">
            <sw-input-number
              v-model="selectTargetData[0].option.iconWidth"
              bottomLabel="宽度"
              :min="1"
              @change="update"
            />
            <sw-input-number
              v-model="selectTargetData[0].option.iconHeight"
              bottomLabel="高度"
              :min="1"
              @change="update"
            />
          </div>
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>

<script setup lang="ts">
import { onBeforeMount, ref } from "vue";

import { SwCollapseItem } from "@screenwright/ui";
import { SwInput } from "@screenwright/ui";
import { SwInputNumber } from "@screenwright/ui";
import { SwRadio } from "@screenwright/ui";

import { firstLabelWidth, secondLabelWidth } from "@editor/constants";
import { weatherGlobalCity } from "@editor/constants/weatherCity";
import { useUpdateInstance } from "@editor/useUpdateInstance";
import { orientList, weatherType } from "../dict";
import { aMapGlobalCity, setGlobalCity } from "./mapGlobalCity";

const { update, selectTargetData } = useUpdateInstance();

const cityOptions = ref([]);

onBeforeMount(() => {
  cityOptions.value = setGlobalCity(aMapGlobalCity);
});
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();

:deep(.el-cascader) {
  .el-input__wrapper {
    height: 28px;
    background-color: #181b24cc !important;
    box-shadow: none !important;
    border: 1px solid #393b4a !important;
    border: none !important;
    font-size: 12px;
    border-radius: 0;
  }

  .el-input__inner {
    height: 28px;
    font-size: 12px;
    color: #b4b7c1 !important;
  }

  .el-input__suffix {
    font-size: 12px;
    color: #b4b7c1 !important;
  }
}
</style>

<style lang="scss">
/* 全局样式，确保下拉面板样式生效 */
.weather-city-cascader.el-popper {
  width: 700px;
  background-color: #2a2c35 !important;
  color: #b4b7c7 !important;
  border: none !important;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.5) !important;

  .el-cascader-panel {
    font-size: 12px;
    padding: 10px 0;
    width: calc(100% - 0px);
    overflow: hidden;
    background-color: #2a2c35;
  }

  .el-popper__arrow::after {
    border-bottom-color: #2a2c35 !important;
  }

  .el-cascader-menu {
    width: 100%;
    background-color: #2a2c35;
    border-right-color: #383b47;
  }

  .el-cascader-menu .el-cascader-node,
  .el-cascader-menu .el-cascader-node.is-active,
  .el-cascader-menu .el-cascader-node.in-active-path {
    padding: 0 10px;
    height: 30px !important;
    line-height: 30px !important;
    color: #b4b7c7;

    &:hover {
      background-color: #383b47;
    }

    .el-icon-check {
      display: none;
    }

    .el-radio {
      width: 20px !important;
      .el-radio__input {
        font-size: 12px;
        font-family:
          Source Han Sans CN-Normal,
          Source Han Sans CN;
        font-weight: 400;
        color: #b4b7c1;
        .el-radio__inner {
          width: 12px;
          height: 12px;
          border: 1px solid #333543;
          background-color: #232630;
        }
      }
      .is-checked {
        .el-radio__inner {
          border: 1px solid rgb(100, 44, 255);
          background-color: #232630;
          &::after {
            background-color: rgb(100, 44, 255);
          }
        }
      }
    }

    .el-cascader-node__label {
      line-height: 30px !important;
    }
  }

  .el-cascader-menu .el-cascader-node.is-active,
  .el-cascader-menu .el-cascader-node.in-active-path {
    background-color: #383b47 !important;
    .el-cascader-node__label {
      color: #6c5ce7;
    }
  }
}
</style>
