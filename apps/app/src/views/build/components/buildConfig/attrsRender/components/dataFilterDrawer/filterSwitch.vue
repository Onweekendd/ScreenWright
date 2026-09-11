<template>
  <div class="filter-switch flex flex-align-center">
    <span class="filter-label">开启过滤器:</span>
    <el-switch v-model="selectTargetData[0].openFilter" @change="handleOpenFilter" class="ft-switch" />
    <el-tooltip popper-class="sw-tooltip" effect="dark" placement="top">
      <template #content>
        <div class="theme-tip">
          <pre style="width: 360px; white-space: pre-line">
                {{
              `#开启过滤器后常用的处理集合数据的2种示例#

                    1.过滤数据：比如返回数值value大于10(或者是大于回调参数count)的数据\n
                      (data, callbackArgs) => {
                        &nbsp;const num = callbackArgs.count || 10;
                        &nbsp;return data.filter(a => a.value > num)
                      }
                    
                    2.处理数据：比如把原始数据返回字段name改为label\n
                    (data, callbackArgs) => {
                      &nbsp;return data.map(a => {
                        &nbsp;&nbsp;return {
                          &nbsp;&nbsp;&nbsp;label: a.name,
                          &nbsp;&nbsp;&nbsp;value: a.value
                        &nbsp;&nbsp;}
                      &nbsp;})
                    }
                  `
            }}
              </pre
          >
        </div>
      </template>
      <Icon type="QuestionFilled" class="tooltip-icon" size="14" />
    </el-tooltip>
  </div>
</template>
<script setup lang="ts">
import Icon from "@/components/Icon/index.vue";
import { useCallbackArguments } from "@/hooks/callbackArguments/useCallbackArguments";

import { useUpdateInstance } from "../../../useUpdateInstance";

const { emitFilterTrigger } = useCallbackArguments();
const { selectTargetData, update } = useUpdateInstance({
  history: false
});
const handleOpenFilter = () => {
  update();
  // selectTargetData.value[0].option.refreshKey = !selectTargetData.value[0].option.refreshKey
  emitFilterTrigger(`${selectTargetData.value[0].id}`);
};
</script>
<style lang="scss" scoped>
.filter-switch {
  margin-bottom: 16px;
  .filter-label {
    height: 20px;
    line-height: 20px;
    margin-right: 20px;
  }
  .ft-switch {
    margin-right: 8px;
  }
}
</style>
