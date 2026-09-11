<template>
  <div class="inputBox" :style="ftStyle">
    <el-input-number
      @focus="handleFocus"
      @blur="handleBlur"
      @change="handleChange"
      @input="handleInput"
      v-model="input"
      v-bind="omitProps"
      controls-position="right"
      :value-on-clear="0"
    >
      <template #decrease-icon>
        <el-icon>
          <ArrowDown />
        </el-icon>
      </template>
      <template #increase-icon>
        <el-icon>
          <ArrowUp />
        </el-icon>
      </template>
    </el-input-number>
    <div class="unit" v-if="unit">
      {{ unit }}
    </div>
    <div class="bottomLabel" v-if="bottomLabel && bottomLabel.length > 0">
      {{ bottomLabel }}
    </div>
  </div>
</template>
<script setup lang="ts">
import type { FtInputNumberProps } from "./SwInputNumber";
import { FtInputNumberEmits } from "./SwInputNumber";
import { useSwInputNumber } from "./useSwInputNumber";
import { ArrowDown, ArrowUp } from "@element-plus/icons-vue";
defineOptions({
  name: "SwInputNumber",
  inheritAttrs: true
});

const props = withDefaults(defineProps<FtInputNumberProps>(), {
  isInputChange: true
});
const emit = defineEmits(FtInputNumberEmits);
const { input, ftStyle, omitProps, handleFocus, handleBlur, handleChange, handleInput } = useSwInputNumber(props, emit);
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
.inputBox {
  position: relative;
  --el-component-size: 26px;
  --inputBox-height: 28px;
  --el-input-text-color: #859094;
  @include common-element-style(".el-input__wrapper", true, true);
  &:nth-child(1) {
    margin-left: 0px;
  }
  .bottomLabel {
    font-family:
      Source Han Sans CN-Normal,
      Source Han Sans CN;
    font-size: 12px;
    font-weight: 400;
    color: #b4b7c1;
    text-align: center;
    line-height: 18px;
  }
  :deep(.el-input-number) {
    width: 100% !important;
    .el-input__inner {
      text-align: left;
      font-size: 12px !important;
    }

    &.is-without-controls {
      .el-input__wrapper {
        padding-left: 6px !important;
      }
    }
    &.is-controls-right {
      .el-input-number__decrease,
      .el-input-number__increase {
        width: 14px;
        background: transparent;
        border-color: #333 !important;
        color: #fff;
        position: absolute;
      }
      :deep(.el-input-number__increase) {
        border-bottom-color: #333 !important;
      }
      .el-input__wrapper {
        // width: 62px;
        padding-left: 6px !important;
        padding-right: 0 !important;
        .el-input__inner {
          width: 100%;
          text-align: left;
        }
      }
    }
  }

  .unit {
    position: absolute;
    top: 0%;
    right: 8%;
    height: 12px;
    font-family:
      Source Han Sans CN-Normal,
      Source Han Sans CN;
    font-size: 12px;
    font-weight: 400;
    color: #525355;
  }
}
</style>
