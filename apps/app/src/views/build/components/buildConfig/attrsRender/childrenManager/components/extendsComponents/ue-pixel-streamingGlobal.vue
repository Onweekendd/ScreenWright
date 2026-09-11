<template>
  <div class="ue-pixel-streaming-global">
    <el-form class="echarts-config-form" label-width="90px" label-position="left">
      <el-form-item label="消息名称" :label-width="firstLabelWidth">
        <sw-input
          v-model="currentChildrenItem.option.funName"
          placeholder="接收UE像素流对应的消息名称"
          @change="update"
        />
      </el-form-item>
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
        <el-checkbox v-model="currentChildrenItem.option.showMessageTip" @change="update" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import SwInput from "@/components/SwInput/index.vue";
import Icon from "@/components/Icon/index.vue";

import { firstLabelWidth } from "../../../../constants";
import { useUpdateInstance } from "../../../../useUpdateInstance";
import { useChildrenDrawer } from "../../useChildrenDrawer";

const { currentChildrenItem } = useChildrenDrawer();
const { update } = useUpdateInstance();
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();
.ue-pixel-streaming-global {
  padding: 0 16px;
  box-sizing: border-box;
}
</style>
