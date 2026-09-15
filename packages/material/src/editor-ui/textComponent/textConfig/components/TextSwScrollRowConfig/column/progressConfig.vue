<template>
  <div
    class="progress-config"
    v-if="selectTargetData[0].option.progressYConfig && selectTargetData[0].option.progressYConfig[index]"
  >
    <el-form-item label="进度条类型" :label-width="secondLabelWidth">
      <el-select
        popper-class="sw-select-dropdown"
        v-model="selectTargetData[0].option.progressYConfig[index].type"
        placeholder="请选择进度条类型"
        @change="update"
      >
        <el-option label="线性进度条" value="line" />
        <el-option label="圆形进度条" value="circle" />
        <el-option label="仪表盘进度条" value="dashboard" />
      </el-select>
    </el-form-item>

    <template v-if="selectTargetData[0].option.progressYConfig[index].type === 'line'">
      <el-form-item label="颜色类型" :label-width="secondLabelWidth">
        <el-select
          popper-class="sw-select-dropdown"
          v-model="selectTargetData[0].option.progressYConfig[index].status"
          @change="update"
        >
          <el-option label="纯色" value="normal" />
          <el-option label="自定义" value="custom" />
        </el-select>
      </el-form-item>
      <el-form-item label="圆角" :label-width="secondLabelWidth">
        <SwInputNumber
          v-model="selectTargetData[0].option.progressYConfig[index].borderRadius"
          :min="0"
          :max="100"
          :step="1"
          unit="px"
          @change="update"
        />
      </el-form-item>

      <el-form-item label="背景颜色" :label-width="secondLabelWidth">
        <sw-single-color-picker
          @change="update"
          v-model="selectTargetData[0].option.progressYConfig[index].outerBgColor"
        />
      </el-form-item>
      <template v-if="selectTargetData[0].option.progressYConfig[index].status === 'normal'">
        <el-form-item label="进度条颜色" :label-width="secondLabelWidth">
          <sw-single-color-picker @change="update" v-model="selectTargetData[0].option.progressYConfig[index].color" />
        </el-form-item>
      </template>
      <template v-if="selectTargetData[0].option.progressYConfig[index].type === 'line'">
        <el-form-item
          label="进度条颜色"
          :label-width="secondLabelWidth"
          v-if="selectTargetData[0].option.progressYConfig[index].status === 'custom'"
        >
          <sw-color-picker
            :options="{ colorTypeOption: 'linear-gradient,single' }"
            v-model:color="selectTargetData[0].option.progressYConfig[index].linearGradientColor"
            @change="update"
            input-disabled
          />
        </el-form-item>
      </template>
    </template>
    <template v-else>
      <el-form-item label="背景颜色" :label-width="secondLabelWidth">
        <sw-single-color-picker
          @change="update"
          v-model="selectTargetData[0].option.progressYConfig[index].outerBgColor"
        />
      </el-form-item>
      <el-form-item label="进度条色值" :label-width="secondLabelWidth">
        <sw-single-color-picker
          @change="update"
          v-model="selectTargetData[0].option.progressYConfig[index].commonColor"
        />
      </el-form-item>
    </template>

    <el-form-item label="文字显示" :label-width="secondLabelWidth">
      <el-switch
        v-model="selectTargetData[0].option.progressYConfig[index].showText"
        @change="update"
        class="ft-switch"
      />
    </el-form-item>

    <el-form-item
      label="文字样式"
      :label-width="secondLabelWidth"
      v-if="selectTargetData[0].option.progressYConfig[index].showText"
    >
      <configTextStyle v-model="input" @change="handleConfigTextChange" />
    </el-form-item>

    <template v-if="selectTargetData[0].option.progressYConfig[index].type === 'line'">
      <el-form-item label="进度条动画" :label-width="secondLabelWidth">
        <el-switch
          v-model="selectTargetData[0].option.progressYConfig[index].indeterminate"
          @change="update"
          class="ft-switch"
        />
      </el-form-item>
      <el-form-item label="动画速度" :label-width="secondLabelWidth">
        <SwInputNumber
          v-model="selectTargetData[0].option.progressYConfig[index].duration"
          :min="1"
          :max="10"
          :step="1"
          :precision="0"
          unit="s"
          @change="update"
        />
      </el-form-item>
    </template>
  </div>
</template>
<script setup lang="ts">
import { SwColorPicker } from "@screenwright/ui/color-picker";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";

import configTextStyle from "@editor/components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "@editor/components/configTextStyle/useTextStyleAttrs";
import { useUpdateInstance } from "../../../../../useUpdateInstance";
import { secondLabelWidth } from "../../../textConfig";

const { selectTargetData, update } = useUpdateInstance();
interface Props {
  index: number;
}
const props = defineProps<Props>();
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "fontFamily",
  fontSize: "fontSize",
  color: "fontColor",
  fontStyle: "fontStyle",
  fontWeight: "fontWeight",
  attrs: `progressYConfig[${props.index}]`
});
</script>
