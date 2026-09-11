<template>
  <div class="form-nav-menu-attrs">
    <el-form-item label="是否支持多选" :label-width="firstLabelWidth">
      <el-checkbox v-model="selectTargetData[0].option.checkboxTabs.multiple" @change="update" />
    </el-form-item>
    <template v-if="selectTargetData[0].option.checkboxTabs.multiple">
      <el-form-item label="支持选中父节点" :label-width="firstLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.checkboxTabs.selectParent" @change="update" />
      </el-form-item>
      <el-form-item :label-width="firstLabelWidth">
        <template #label>
          <span>父节点控制</span>
          <el-tooltip class="item" effect="dark" placement="right">
            <Icon type="QuestionFilled" size="14" style="position: relative; top: 2px; left: 2px" />
            <template #content>
              <p>父节点选中时，子项节点全部选中</p>
            </template>
          </el-tooltip>
        </template>
        <el-checkbox v-model="selectTargetData[0].option.checkboxTabs.parentControl" @change="update" />
      </el-form-item>
      <SwCollapseItem title="多选框样式">
        <template #content>
          <el-form-item label="尺寸" :label-width="secondLabelWidth">
            <div class="flex">
              <SwInputNumber
                v-model.number="selectTargetData[0].option.checkboxTabs.checkboxStyle.width"
                bottomLabel="宽"
                :max="50"
                @change="update"
              />
              <SwInputNumber
                v-model.number="selectTargetData[0].option.checkboxTabs.checkboxStyle.height"
                bottomLabel="高"
                :max="50"
                @change="update"
              />
            </div>
          </el-form-item>
          <el-form-item label="圆角" :label-width="secondLabelWidth">
            <div class="flex flex-column" style="width: 100%">
              <SwInputNumber
                v-model.number="selectTargetData[0].option.checkboxTabs.checkboxStyle.borderRadius"
                controls
                @change="update"
              />
              <SwSingleColorPicker
                @change="update"
                v-model="selectTargetData[0].option.checkboxTabs.checkboxStyle.borderColor"
              />
            </div>
          </el-form-item>

          <el-form-item label="选中框背景" :label-width="secondLabelWidth">
            <SwSingleColorPicker
              v-model="selectTargetData[0].option.checkboxTabs.checkboxStyle.backgroundColor"
              @change="update"
            />
          </el-form-item>
        </template>
      </SwCollapseItem>
    </template>

    <SwCollapseItem
      title="一级父节点前缀"
      show-icon
      v-model="selectTargetData[0].option.showParentPrefix"
      @change="update"
    >
      <template #content>
        <el-form-item label="是否数据优先" :label-width="disecondLabelWidth">
          <el-checkbox @change="update" v-model="selectTargetData[0].option.checkboxTabs.parentPrefix.isDataFirst" />
        </el-form-item>
        <el-form-item
          :label-width="disecondLabelWidth"
          label="图标"
          v-if="!selectTargetData[0].option.checkboxTabs.parentPrefix.isDataFirst"
        >
          <SwUpload
            v-model="selectTargetData[0].option.checkboxTabs.parentPrefix.url"
            @delete="update"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="图标尺寸" :label-width="disecondLabelWidth">
          <div class="flex">
            <SwInputNumber
              v-model="selectTargetData[0].option.checkboxTabs.parentPrefix.iconWidth"
              bottomLabel="宽"
              @change="update"
              :min="0"
              unit="px"
            />
            <SwInputNumber
              v-model="selectTargetData[0].option.checkboxTabs.parentPrefix.iconHeight"
              bottomLabel="高"
              @change="update"
              :min="0"
              unit="px"
            />
          </div>
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem
      @change="update"
      title="子级父节点前缀"
      show-icon
      v-model="selectTargetData[0].option.showChildPrefix"
    >
      <template #content>
        <el-form-item label="是否数据优先">
          <el-checkbox @change="update" v-model="selectTargetData[0].option.checkboxTabs.childPrefix.isDataFirst" />
        </el-form-item>
        <el-form-item label="图标" v-if="!selectTargetData[0].option.checkboxTabs.childPrefix.isDataFirst">
          <SwUpload
            @change="update"
            @delete="update"
            v-model="selectTargetData[0].option.checkboxTabs.childPrefix.url"
          />
        </el-form-item>

        <el-form-item label="图标尺寸">
          <div class="flex">
            <SwInputNumber
              @change="update"
              v-model="selectTargetData[0].option.checkboxTabs.childPrefix.iconWidth"
              bottomLabel="宽"
              unit="px"
            />
            <SwInputNumber
              @change="update"
              v-model="selectTargetData[0].option.checkboxTabs.childPrefix.iconHeight"
              bottomLabel="高"
              unit="px"
            />
          </div>
        </el-form-item>
        <el-form-item label="偏移量">
          <SwInputNumber
            @change="update"
            v-model="selectTargetData[0].option.checkboxTabs.childPrefix.offset"
            unit="px"
          />
        </el-form-item>
      </template>
    </SwCollapseItem>

    <SwCollapseItem
      @change="update"
      title="子级父节点后缀"
      show-icon
      v-model="selectTargetData[0].option.showChildSuffix"
    >
      <template #content>
        <el-form-item label="类型" title="类型" :label-width="disecondLabelWidth">
          <sw-radio
            @change="update"
            direction="row"
            v-model="selectTargetData[0].option.checkboxTabs.childSuffix.type"
            :option="suffixTypeOption"
            style="margin-left: 10px"
          />
        </el-form-item>
        <template v-if="selectTargetData[0].option.checkboxTabs.childSuffix.type == 'icon'">
          <el-form-item label="图标" title="图标" :label-width="disecondLabelWidth">
            <SwUpload
              v-model="selectTargetData[0].option.checkboxTabs.childSuffix.icon"
              @delete="update"
              @change="update"
            />
          </el-form-item>
          <el-form-item label="图标尺寸" title="图标尺寸" :label-width="disecondLabelWidth">
            <div class="flex">
              <SwInputNumber
                v-model="selectTargetData[0].option.checkboxTabs.childSuffix.iconStyle.iconWidth"
                bottomLabel="宽"
                @change="update"
                :min="0"
                unit="px"
              />
              <SwInputNumber
                v-model="selectTargetData[0].option.checkboxTabs.childSuffix.iconStyle.iconHeight"
                bottomLabel="高"
                @change="update"
                :min="0"
                unit="px"
              />
            </div>
          </el-form-item>
        </template>
        <template v-if="selectTargetData[0].option.checkboxTabs.childSuffix.type == 'text'">
          <el-form-item label="文本类型" title="文本类型" :label-width="disecondLabelWidth">
            <sw-radio
              @change="update"
              direction="row"
              v-model="selectTargetData[0].option.checkboxTabs.childSuffix.text"
              :option="suffixTextOption"
              style="margin-left: 10px"
            />
          </el-form-item>
          <el-form-item
            label="自定义字段"
            title="自定义字段"
            :label-width="disecondLabelWidth"
            v-if="selectTargetData[0].option.checkboxTabs.childSuffix.text === 'field'"
          >
            <sw-input @change="update" v-model="selectTargetData[0].option.checkboxTabs.childSuffix.customField" />
          </el-form-item>
          <el-form-item label="字体" title="字体" :label-width="disecondLabelWidth">
            <configTextStyle v-model="input" @change="handleChange" />
          </el-form-item>
          <el-form-item label="偏移量" title="偏移量" :label-width="disecondLabelWidth">
            <SwInputNumber
              v-model="selectTargetData[0].option.checkboxTabs.childSuffix.offset"
              @change="update"
              unit="px"
              :controls="false"
            />
          </el-form-item>
        </template>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { SwCollapseItem as SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput as SwInput } from "@screenwright/ui/input";
import { SwInputNumber as SwInputNumber } from "@screenwright/ui/input-number";
import { SwRadio as SwRadio } from "@screenwright/ui/radio";
import { SwSingleColorPicker as SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import SwUpload from "@editor/base/SwUpload/index.vue";
import Icon from "@editor/base/Icon/index.vue";

import type { StyleProps } from "../../components/configTextStyle/configTextStyle";
import configTextStyle from "../../components/configTextStyle/index.vue";
import { firstLabelWidth, secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const disecondLabelWidth = parseInt(secondLabelWidth) + 6;
const { selectTargetData, update } = useUpdateInstance();

const input = ref({
  fontSize: selectTargetData.value[0].option.checkboxTabs.childSuffix.textStyle.fontSize,
  fontFamily: selectTargetData.value[0].option.checkboxTabs.childSuffix.textStyle.fontFamily,
  fontWeight: selectTargetData.value[0].option.checkboxTabs.childSuffix.textStyle.fontWeight,
  fontStyle: selectTargetData.value[0].option.checkboxTabs.childSuffix.textStyle.fontStyle,
  color: selectTargetData.value[0].option.checkboxTabs.childSuffix.textStyle.color
});

const handleChange = (key: string, value: StyleProps) => {
  selectTargetData.value[0].option.checkboxTabs.childSuffix.textStyle.color = value.color;
  selectTargetData.value[0].option.checkboxTabs.childSuffix.textStyle.fontSize = value.fontSize;
  selectTargetData.value[0].option.checkboxTabs.childSuffix.textStyle.fontFamily = value.fontFamily;
  selectTargetData.value[0].option.checkboxTabs.childSuffix.textStyle.fontWeight = value.fontWeight;
  selectTargetData.value[0].option.checkboxTabs.childSuffix.textStyle.fontStyle = value.fontStyle;
  update();
};

const suffixTypeOption = ref([
  { label: "图标", value: "icon" },
  { label: "文字", value: "text" }
]);

const suffixTextOption = ref([
  { label: "子集长度", value: "length" },
  { label: "自定义字段", value: "field" }
]);
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include checkbox-style();
@include common-element-style(".el-select__wrapper");
:deep(.el-select__wrapper) {
  min-height: 28px;
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
