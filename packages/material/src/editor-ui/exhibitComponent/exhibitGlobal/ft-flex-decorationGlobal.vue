<template>
  <div class="ft-flex-decoration-global">
    <el-form-item label="配置方式" :label-width="firstLabelWidth">
      <sw-radio
        v-model="selectTargetData[0].option.configType"
        direction="row"
        :option="flexDecorationConfig.ConfigType"
        @change="update"
      />
    </el-form-item>

    <ItemSelectAlign
      :labelWidth="firstLabelWidth"
      label="布局类型"
      v-model="currFlextype"
      :type="typeAttrs.custom"
      @change="(val: any) => handleChange(val)"
      :customOptions="flexDecorationConfig.FlexTypes"
    />
    <div class="group" v-if="selectTargetData[0].option.configType === 'preset'">
      <el-form-item label="预设风格" :label-width="firstLabelWidth">
        <div class="cust-popper">
          <el-dropdown
            :teleported="false"
            trigger="click"
            @command="handlePresetStyle"
            popper-class="sw-popper"
            placement="top-end"
            :max-height="300"
          >
            <span class="el-select__wrapper">
              {{ selectTargetData[0].option.preset }}
              <Icon type="ArrowDown" size="10" style="position: relative; color: #8b58e7" />
            </span>
            <template #dropdown>
              <div class="preset-menu">
                <el-dropdown-menu>
                  <el-dropdown-item v-for="(item, index) in presetArr" :key="`${item.label}_${index}`" :command="item">
                    <div class="preset-item">
                      <p>{{ item.label }}</p>
                      <img :src="setMinioUrl(item.preview)" :alt="item.preview" />
                    </div>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </div>
            </template>
          </el-dropdown>
        </div>
      </el-form-item>

      <StatusSelector label="透明度" :label-width="firstLabelWidth" :properties="['opacity']">
        <FtSlide v-model="selectTargetData[0].option.opacityGlobal" :min="0" :max="100" :step="1" @change="update" />
      </StatusSelector>
    </div>

    <div class="group" v-if="selectTargetData[0].option.configType === 'custom'">
      <ftFlexDecoLineStyle v-if="selectTargetData[0].option.flexType !== 'corner'" />
      <ftFlexDecoRectStyle v-else />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import { typeAttrs } from "../../../text";

import { SwRadio } from "@screenwright/ui";
import { SwSlider as FtSlide } from "@screenwright/ui";
import Icon from "@editor/base/Icon/index.vue";
import { setMinioUrl } from "@screenwright/composables";

import StatusSelector from "../../attrsRender/components/statusAnimation/components/StatusSelector.vue";
import { firstLabelWidth, flexDecorationConfig } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
import ftFlexDecoLineStyle from "../components/ftFlexDecoLineStyle.vue";
import ftFlexDecoRectStyle from "../components/ftFlexDecoRectStyle.vue";
import { ItemSelectAlign } from "../../../text";

const { selectTargetData, update } = useUpdateInstance();
const presets = flexDecorationConfig.DecorationPreset;
const currFlextype = ref(selectTargetData.value[0].option.flexType || flexDecorationConfig.FlexTypes[0]);
const presetArr = computed(() => {
  const type = selectTargetData.value[0].option.flexType === "corner" ? "rect" : "line";
  return presets[type];
});

const handleChange = (val: any) => {
  selectTargetData.value[0].option.flexType = val;
  update();
};

const handlePresetStyle = (item: any) => {
  selectTargetData.value[0].option.preset = item.label;
  const config = item.config;
  if (config) {
    const keys = Object.keys(config);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      try {
        selectTargetData.value[0].option[key] = config[key];
      } catch (e) {
        console.log(e);
      }
    }
  }
  // 将flexType置为当前项
  selectTargetData.value[0].option.flexType = currFlextype.value;
  update();
};
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();

:deep(.el-select__icon) {
  color: #eee;
}

.cust-popper {
  width: 100%;
  padding: 0;
  background: transparent;
  :deep(.el-popper) {
    padding: 10px 0px 10px 10px;
    background: #22242d;
    border-radius: 5px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.9);
  }
  :deep(.el-dropdown .el-select__wrapper) {
    width: 207px;
    justify-content: space-between;
  }
}
.preset-menu {
  :deep(.el-dropdown-menu) {
    width: 300px;
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    gap: 5px;
  }
  :deep(.el-dropdown-menu__item) {
    padding: 5px;
    border-radius: 5px;
  }
}
.preset-item {
  position: relative;
  width: 130px;
  height: 75px;
  border-radius: 3px;
  overflow: hidden;
  user-select: none;
  p {
    width: 100%;
    padding: 2px 4px;
    box-sizing: border-box;
    position: absolute;
    text-align: center;
    background-image: linear-gradient(to top, rgba(0, 0, 0, 0), rgba(255, 255, 255, 0.23));
    color: rgba($color: #ffffff, $alpha: 0.82);
  }
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}
</style>
