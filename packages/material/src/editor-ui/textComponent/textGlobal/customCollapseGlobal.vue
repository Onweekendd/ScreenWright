<template>
  <div class="custom-collapse-global">
    <!-- 默认展开 -->
    <el-form-item :label-width="firstLabelWidth">
      <template #label>
        <span
          >默认展开
          <el-tooltip class="item" effect="dark" placement="right">
            <Icon type="QuestionFilled" :size="12" />
            <template #content>
              <p style="width: 150px">填写数值，英文逗号隔开，如第1个展开是1，第1、2个都展开是1,2；以此类推</p>
            </template>
          </el-tooltip>
        </span>
      </template>
      <sw-input v-model="selectTargetData[0].option.accordionKeys" @change="update" />
    </el-form-item>
    <!-- 背景图 -->
    <ItemBackgroudImage />
    <!-- 尺寸类型 -->
    <ItemBackgroudSize />
    <!-- 面板边距 -->
    <ItemPadding />
    <!-- 标题配置 -->
    <TextCustomCollapseTitle />
    <!-- 内容 -->
    <TextCustomCollapseContent />
  </div>
</template>

<script setup lang="ts">
import { SwInput } from "@screenwright/ui/input";
import Icon from "@editor/base/Icon/index.vue";

import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
import TextCustomCollapseContent from "./../textConfig/components/TextSwCustomCollapseConfig/TextCustomCollapseContent.vue";
import TextCustomCollapseTitle from "./../textConfig/components/TextSwCustomCollapseConfig/TextCustomCollapseTitle.vue";
import ItemBackgroudImage from "./../textConfig/ItemComponent/ItemBackgroudImage/index.vue";
import ItemBackgroudSize from "./../textConfig/ItemComponent/ItemBackgroudSize/index.vue";
import ItemPadding from "./../textConfig/ItemComponent/ItemPadding/index.vue";

const { selectTargetData, update } = useUpdateInstance();
</script>

<style lang="scss" scoped></style>
