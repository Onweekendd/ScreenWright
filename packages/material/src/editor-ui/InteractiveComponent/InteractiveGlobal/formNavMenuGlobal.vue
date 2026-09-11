<template>
  <div class="form-nav-menu-global">
    <el-form-item :label-width="firstLabelWidth">
      <template #label>
        <span>只展开一个</span>
        <el-tooltip class="item" effect="dark" placement="right">
          <Icon type="QuestionFilled" size="14" style="position: relative; top: 10px" />
          <template #content>
            <p>只保持1个子菜单展开</p>
          </template>
        </el-tooltip>
      </template>
      <el-checkbox v-model="selectTargetData[0].option.uniqueOpened" @change="update" />
    </el-form-item>
    <el-form-item label="显示类型" :label-width="firstLabelWidth">
      <el-select popper-class="sw-select-dropdown" v-model="selectTargetData[0].option.type" @change="update">
        <el-option label="垂直模式" value="vertical" />
        <el-option label="水平模式" value="horizontal" />
      </el-select>
    </el-form-item>

    <el-form-item label="当前选中" :label-width="firstLabelWidth">
      <template #label>
        <span>
          当前选中项
          <el-tooltip class="item" effect="dark" placement="right">
            <Icon type="QuestionFilled" size="14" style="position: relative; top: 2px" />
            <template #content>
              <p>当前激活菜单的 value 值</p>
            </template>
          </el-tooltip>
        </span>
      </template>
      <SwInput v-model="selectTargetData[0].option.defaultActive" @change="update" />
    </el-form-item>
    <el-form-item
      :label-width="firstLabelWidth"
      label="菜单宽度"
      v-if="selectTargetData[0].option.type === 'horizontal'"
    >
      <SwInputNumber v-model="selectTargetData[0].option.popupwidth" unit="px" @change="update" />
    </el-form-item>
    <el-form-item label="行高" :label-width="firstLabelWidth">
      <SwInputNumber v-model="selectTargetData[0].option.lineHeight" unit="px" @change="update" />
    </el-form-item>

    <el-form-item label="背景色" :label-width="firstLabelWidth">
      <SwSingleColorPicker v-model="selectTargetData[0].option.backgroundColor" @change="update" />
    </el-form-item>

    <el-form-item label="字体默认色" :label-width="firstLabelWidth">
      <SwSingleColorPicker v-model="selectTargetData[0].option.textColor" @change="update" />
    </el-form-item>

    <el-form-item label="字体选中色" :label-width="firstLabelWidth">
      <SwSingleColorPicker v-model="selectTargetData[0].option.activeTextColor" @change="update" />
    </el-form-item>
    <SwCollapseItem title="文本配置">
      <template #content>
        <el-form-item label="样式" :label-width="secondLabelWidth">
          <configTextStyle v-model="input" @change="handleConfigTextChange" :isShowColorStyle="false">
            <template #append>
              <div style="flex: 1; margin-left: 8px" class="flex flex-justify-between">
                <SwInputNumber
                  @change="update"
                  v-model="selectTargetData[0].option.letterSpacing"
                  unit="px"
                  bottomLabel="字距"
                />
              </div>
            </template>
          </configTextStyle>
        </el-form-item>
        <el-form-item label="对齐方式" :label-width="secondLabelWidth">
          <el-select
            style="width: 100%"
            popper-class="sw-select-dropdown"
            v-model="selectTargetData[0].option.textAlign"
            @change="update"
          >
            <el-option v-for="item in textAlign" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <el-form-item :label-width="secondLabelWidth">
          <template #label>
            <span>
              间隙值
              <el-tooltip class="item" effect="dark" placement="right">
                <Icon type="QuestionFilled" size="14" style="position: relative; top: 2px" />
                <template #content>
                  <p>父级与子级字体大小间隙值</p>
                </template>
              </el-tooltip>
            </span>
          </template>
          <SwInputNumber v-model="selectTargetData[0].option.textSpace" unit="px" @change="update" />
        </el-form-item>

        <el-form-item label="阴影" :label-width="secondLabelWidth">
          <el-checkbox v-model="selectTargetData[0].option.isTextShadow" @change="update" />
        </el-form-item>

        <ItemTextShadow
          v-if="selectTargetData[0].option.isTextShadow"
          v-model="textShadowInput"
          label="文本阴影"
          @change="handleConfigTextShadowChange"
        />
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="选中背景色">
      <template #content>
        <el-form-item :label-width="secondLabelWidth" label="渐变角度">
          <SwInputNumber v-model="selectTargetData[0].option.backgroundRadius" unit="°" @change="update" />
        </el-form-item>

        <el-form-item :label-width="secondLabelWidth" label="渐变起始色">
          <SwSingleColorPicker v-model="selectTargetData[0].option.backgroundColor1" @change="update" />
        </el-form-item>

        <el-form-item :label-width="secondLabelWidth" label="渐变终点色">
          <SwSingleColorPicker v-model="selectTargetData[0].option.backgroundColor2" @change="update" />
        </el-form-item>

        <el-form-item label="圆角" :label-width="secondLabelWidth">
          <div class="flex">
            <SwInputNumber v-model.number="selectTargetData[0].option.radiusTop" bottomLabel="上" @change="update" />
            <SwInputNumber v-model.number="selectTargetData[0].option.radiusRight" bottomLabel="右" @change="update" />
            <SwInputNumber v-model.number="selectTargetData[0].option.radiusBottom" bottomLabel="下" @change="update" />
            <SwInputNumber v-model.number="selectTargetData[0].option.radiusLeft" bottomLabel="左" @change="update" />
          </div>
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";

import { isUndefined } from "lodash-es";

import { SwCollapseItem as SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput as SwInput } from "@screenwright/ui/input";
import { SwInputNumber as SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker as SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import Icon from "@editor/base/Icon/index.vue";
import ItemTextShadow from "@editor/textComponent/textConfig/ItemComponent/ItemTextShadow/index.vue";
import { useItemTextShadowAttrs } from "@editor/textComponent/textConfig/ItemComponent/ItemTextShadow/useItemTextShadow";

import configTextStyle from "../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../components/configTextStyle/useTextStyleAttrs";
import { firstLabelWidth, secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "fontFamily",
  fontStyle: "fontStyle",
  fontWeight: "fontWeight",
  fontSize: "fontSize",
  color: "fontColor"
});

const { input: textShadowInput, handleConfigTextShadowChange } = useItemTextShadowAttrs({
  preFied: "textShadow",
  color: "color",
  x: "x",
  y: "y",
  blur: "blur"
});
const textAlign = ref<Array<{ label: string; value: string }>>([
  { label: "居中", value: "center" },
  { label: "左对齐", value: "left" },
  { label: "右对齐", value: "right" }
]);

onMounted(() => {
  if (selectTargetData.value && selectTargetData.value[0]) {
    if (isUndefined(selectTargetData.value[0].option.popupwidth)) {
      selectTargetData.value[0].option.popupwidth = 200;
    }
  }
});
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
</style>
