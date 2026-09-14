<template>
  <div class="data-select flex flex-justify-between">
    <el-form-item label="数据源">
      <el-select @change="handleChange" style="width: 130px" popper-class="sw-select-dropdown" v-model="input">
        <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-button type="primary" class="purple-btn" @click="newAdd" :disabled="cDisabledAdd">新建</el-button>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useVModel } from "@vueuse/core";

import { useCallbackArguments } from "@/hooks/callbackArguments/useCallbackArguments";
import { useUserStore } from "@/store/modules/user";
import type { DataSourceType } from "@/views/source/type";

import { useLargeScreenInfo } from "../../../../useLargeScreenInfo";
import { useUpdateInstance } from "../../useUpdateInstance";
import { useDataApi } from "./useDataApi";
import { useNewAddDialog } from "./useNewAddDialog";

const { emitFilterTrigger } = useCallbackArguments();
const { userInfo } = useUserStore();
const { navInfo } = useLargeScreenInfo();
const { selectTargetData } = useUpdateInstance();
interface Props {
  type: DataSourceType;
  modelValue: string | number;
}
const props = defineProps<Props>();

const cDisabledAdd = computed(() => {
  return navInfo.value.userId !== userInfo.id;
});

const emit = defineEmits({
  "update:modelValue": (value: string) => {
    return value !== undefined;
  },
  change: (value: any) => {
    return value !== undefined;
  }
});
const input = useVModel(props, "modelValue", emit);
const { options, setOptions } = useDataApi(props.type);
const { newAdd } = useNewAddDialog(props.type);
const handleChange = (val: string) => {
  const target = options.value.find((item) => `${item.value}` === `${val}`);
  if (target) {
    selectTargetData.value[0].dataSource = target;
  }
  // selectTargetData.value[0].option.refreshKey = !selectTargetData.value[0].option.refreshKey
  emit("change", target);
  emitFilterTrigger(`${selectTargetData.value[0].id}`);
};
onMounted(() => {
  setOptions(props.type);
});
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
.data-select {
  @include common-element-style(".el-select__wrapper");
  :deep(.el-select__wrapper) {
    min-height: 28px;
  }
  .purple-btn {
    background: linear-gradient(180deg, var(--sw-theme-color) 0%, var(--sw-theme-color) 100%) !important;
    color: #fff;
    border: 0px !important;
    border-radius: 3px 3px 3px 3px;
    padding: 7px 15px;
    height: 26px;
    position: relative;
    top: 3px;
  }
}
</style>
