<template>
  <div class="font-style-item-config">
    <SwCollapseItem title="字体配置">
      <template #content>
        <el-form-item label="字体" :label-width="secondLabelWidth">
          <configTextStyle v-model="input" @change="handleConfigTextChange" :isShowFontStyle="false" />
        </el-form-item>
        <el-form-item label="文本偏移" :label-width="secondLabelWidth">
          <div class="flex flex-justify-between" style="width: 100%">
            <SwInputNumber
              v-model="selectTargetData[0].option.textTranslateX"
              bottomLabel="X"
              width="100"
              controls
              @change="update"
            />
            <SwInputNumber
              v-model="selectTargetData[0].option.textTranslateY"
              bottomLabel="Y"
              width="100"
              controls
              @change="update"
            />
          </div>
        </el-form-item>
        <StatusSelector label="背景" :label-width="secondLabelWidth" :properties="['image']">
          <SwUpload v-model="selectTargetData[0].option.bgImage" @delete="update" @change="update" />
        </StatusSelector>

        <el-form-item label="悬浮指针" :label-width="secondLabelWidth">
          <el-checkbox v-model="selectTargetData[0].option.isCursorPointer" @change="update" />
        </el-form-item>
        <el-form-item label="点击效果" :label-width="secondLabelWidth">
          <el-checkbox v-model="selectTargetData[0].option.isClickBubble" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";

import { SwCollapseItem as SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber as SwInputNumber } from "@screenwright/ui/input-number";
import SwUpload from "@editor/base/SwUpload/index.vue";

import StatusSelector from "../../../attrsRender/components/statusAnimation/components/StatusSelector.vue";
import configTextStyle from "../../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../../components/configTextStyle/useTextStyleAttrs";
import { secondLabelWidth } from "../../../textComponent/textConfig/textConfig";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "fontFamily",
  fontStyle: "legendFontStyle",
  fontWeight: "legendFontWeight",
  fontSize: "fontSize",
  color: "fontColor"
});
onMounted(() => {
  if (selectTargetData.value && selectTargetData.value[0]) {
    const isCursorPointer = selectTargetData.value[0].option.isCursorPointer;
    if (isCursorPointer === "") {
      selectTargetData.value[0].option.isCursorPointer = false;
    }
  }
});
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include checkbox-style();
</style>
