<template>
  <div class="ue-vessel-global">
    <el-form-item label="消息名称" :label-width="firstLabelWidth">
      <sw-input v-model="currentChildrenItem.option.funName" placeholder="当接收到ue4对应的消息名称" @change="update" />
    </el-form-item>
    <SwCollapseItem title="文本样式" open>
      <template #content>
        <el-form-item label="字体配置" :label-width="secondLabelWidth">
          <ConfigTextStyle v-model="input" @change="handleChange" />
        </el-form-item>
        <el-form-item label="背景色" :label-width="secondLabelWidth">
          <sw-single-color-picker v-model="backgroundColor" field="seriesColor" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <el-form-item label="消息提示" :label-width="firstLabelWidth">
      <template #label>
        <span
          >消息提示
          <el-tooltip class="item" effect="dark" placement="right">
            <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
            <template #content>
              <p>当接收到ue消息时，显示消息内容</p>
            </template>
          </el-tooltip>
        </span>
      </template>
      <el-checkbox v-model="showMessageTip" @change="update" />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import SwCollapseItem from "@/components/SwCollapseItem/index.vue";
import SwInput from "@/components/SwInput/index.vue";
import SwSingleColorPicker from "@/components/SwSingleColorPicker/index.vue";
import Icon from "@/components/Icon/index.vue";

import type { StyleProps } from "../../../../components/configTextStyle/configTextStyle";
import ConfigTextStyle from "../../../../components/configTextStyle/index.vue";
import { firstLabelWidth, secondLabelWidth } from "../../../../constants";
import { useUpdateInstance } from "../../../../useUpdateInstance";
import { useChildrenDrawer } from "../../useChildrenDrawer";

const { currentChildrenItem, currentParentItem } = useChildrenDrawer();
const { update } = useUpdateInstance();

// 计算属性处理可能为 null 的情况
const backgroundColor = computed({
  get: () => currentParentItem.value?.option.backgroundColor,
  set: (value) => {
    if (currentParentItem.value) {
      currentParentItem.value.option.backgroundColor = value;
    }
  }
});

const showMessageTip = computed({
  get: () => currentParentItem.value?.option.showMessageTip,
  set: (value) => {
    if (currentParentItem.value) {
      currentParentItem.value.option.showMessageTip = value;
    }
  }
});

const input = ref({
  fontSize: currentParentItem.value?.option.fontSize,
  fontFamily: currentParentItem.value?.option.fontFamily,
  fontWeight: currentParentItem.value?.option.fontWeight,
  fontStyle: currentParentItem.value?.option.fontStyle,
  color: currentParentItem.value?.option.fontColor
});
const handleChange = (key: string, value: StyleProps) => {
  if (currentParentItem.value) {
    currentParentItem.value.option.fontColor = value.color;
    currentParentItem.value.option.fontSize = value.fontSize;
    currentParentItem.value.option.fontFamily = value.fontFamily;
    currentParentItem.value.option.fontWeight = value.fontWeight;
    currentParentItem.value.option.fontStyle = value.fontStyle;
    update();
  }
};
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();
.ue-vessel-global {
  box-sizing: border-box;
  padding: 0 16px;
}
</style>
