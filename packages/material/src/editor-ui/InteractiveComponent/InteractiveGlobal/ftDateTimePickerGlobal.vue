<template>
  <div class="ft-date-time-picker-global">
    <el-form-item label="日期格式" :label-width="firstLabelWidth">
      <el-select
        style="width: 100%"
        popper-class="sw-select-dropdown"
        v-model="selectTargetData[0].option.dateFormat"
        @change="update"
      >
        <el-option v-for="item in dateFormat" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>

    <el-form-item label="时间格式" :label-width="firstLabelWidth">
      <el-select
        style="width: 100%"
        popper-class="sw-select-dropdown"
        v-model="selectTargetData[0].option.timeFormat"
        @change="update"
        :disabled="timeDisabled"
      >
        <el-option v-for="item in timeFormat" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from "vue";

import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const dateFormat = ref([
  { label: "无", value: "" },
  { label: "2023年1月1日", value: "yyyy年MM月dd日" },
  { label: "2023年1月", value: "yyyy年MM月" },
  { label: "2023年", value: "yyyy年" },
  { label: "3月1日", value: "MM月dd日" },
  { label: "1(月)", value: "MM月" },
  { label: "1(日)", value: "dd日" },
  { label: "2023-1-1", value: "yyyy-MM-dd" },
  { label: "2023/1/1", value: "yyyy/MM/dd" },
  { label: "2023.1.1", value: "yyyy.MM.dd" },
  { label: "2023-1", value: "yyyy-MM" },
  { label: "2023/1", value: "yyyy/MM" },
  { label: "2023.1", value: "yyyy.MM" },
  { label: "2023", value: "yyyy" }
]);
const timeFormat = ref([
  { label: "无", value: "" },
  { label: "8时0分0秒", value: "H时m分s秒" },
  { label: "8时0分", value: "H时m分" },
  { label: "8时", value: "H时" },
  { label: "0分", value: "m分" },
  { label: "0秒", value: "s秒" },
  { label: "08:00:00", value: "HH:mm:ss" },
  { label: "08:00", value: "HH:mm" },
  { label: "08(时)", value: "HH" }
]);
const timeDisabled = ref(false);
watch(
  () => selectTargetData.value[0] && selectTargetData.value[0].option.dateFormat,
  (n) => {
    if (!n) {
      timeDisabled.value = true;
      if (selectTargetData.value[0]) {
        selectTargetData.value[0].option.timeFormat = "";
      }
      return;
    }
    if (n === "yyyy年MM月dd日" || n === "MM月dd日" || n === "yyyy-MM-dd" || n === "yyyy/MM/dd" || n === "yyyy.MM.dd") {
      timeDisabled.value = false;
    } else {
      timeDisabled.value = true;
      if (selectTargetData.value[0]) {
        selectTargetData.value[0].option.timeFormat = "";
      }
    }
  },
  {
    deep: true,
    immediate: true
  }
);
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
</style>
