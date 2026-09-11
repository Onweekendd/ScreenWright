<template>
  <el-form-item>
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
</template>
<script setup lang="ts">
import { SwInput } from "@screenwright/ui/input";
import Icon from "@editor/base/Icon/index.vue";
import { useUpdateInstance } from "@editor/useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
</script>
