<template>
  <SwCollapseItem title="自定义位置" open>
    <template #content>
      <el-form-item label="启用" :label-width="secondLabelWidth">
        <template #label>
          <span
            >启用
            <el-tooltip class="item" effect="dark" placement="right">
              <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
              <template #content>
                <p>启用自定义位置，该面板则以自定义位置为优先</p>
              </template>
            </el-tooltip>
          </span>
        </template>
        <el-checkbox v-model="dynamicPanelOption.customPosition" @change="handleChange" />
      </el-form-item>
      <el-form-item label="位置类型" :label-width="secondLabelWidth">
        <sw-radio
          v-model="dynamicPanelOption.customPositionType"
          :option="customPositionTypeOption"
          @change="handleChange"
        />
      </el-form-item>
      <template v-if="[customPositionTypeEnum.toCustom].includes(dynamicPanelOption.customPositionType)">
        <el-form-item label="位置" :label-width="secondLabelWidth">
          <div class="flex flex-center-between fullWidth">
            <sw-input-number
              v-model.number="dynamicPanelOption.customPositionX"
              unit="%"
              bottomLabel="X"
              :controls="false"
              @change="handleChange"
              width="98"
            />
            <sw-input-number
              v-model.number="dynamicPanelOption.customPositionY"
              unit="%"
              bottomLabel="Y"
              :controls="false"
              @change="handleChange"
              width="98"
            />
          </div>
        </el-form-item>
      </template>

      <template
        v-if="
          [customPositionTypeEnum.toLeft, customPositionTypeEnum.toRight].includes(
            dynamicPanelOption.customPositionType
          )
        "
      >
        <el-form-item label="位置" :label-width="secondLabelWidth">
          <div class="flex flex-center-between custom-position fullWidth">
            <sw-input-number
              v-model="dynamicPanelOption.customPositionLeft"
              unit="%"
              bottomLabel="左"
              :controls="false"
              @change="handleChange"
              width="98"
              :disabled="dynamicPanelOption.customPositionType === customPositionTypeEnum.toRight"
            />
            <sw-input-number
              v-model="dynamicPanelOption.customPositionRight"
              unit="%"
              bottomLabel="右"
              :controls="false"
              @change="handleChange"
              width="98"
              :disabled="dynamicPanelOption.customPositionType === customPositionTypeEnum.toLeft"
            />
          </div>
        </el-form-item>
      </template>

      <template
        v-if="
          [customPositionTypeEnum.toCenterTop, customPositionTypeEnum.toCenterBottom].includes(
            dynamicPanelOption.customPositionType
          )
        "
      >
        <el-form-item label="位置" :label-width="secondLabelWidth">
          <div class="flex flex-center-between fullWidth">
            <sw-input-number
              :disabled="dynamicPanelOption.customPositionType === customPositionTypeEnum.toCenter"
              v-model="dynamicPanelOption.customPositionTop"
              unit="%"
              bottomLabel="上"
              :controls="false"
              @change="handleChange"
              width="98"
            />
            <sw-input-number
              v-model="dynamicPanelOption.customPositionBottom"
              :disabled="dynamicPanelOption.customPositionType === customPositionTypeEnum.toCenterTop"
              unit="%"
              bottomLabel="下"
              :controls="false"
              @change="handleChange"
              width="98"
            />
          </div>
        </el-form-item>
      </template>
    </template>
  </SwCollapseItem>
</template>

<script setup lang="ts">
import { useVModel } from "@vueuse/core";

import SwCollapseItem from "@/components/SwCollapseItem/index.vue";
import SwInputNumber from "@/components/SwInputNumber/index.vue";
import SwRadio from "@/components/SwRadio/index.vue";
import Icon from "@/components/Icon/index.vue";

import type { DynamicPanelProps } from "../../../../buildRender/core/SystemComponent/panel/DynamicPanel";
import { customPositionTypeEnum } from "../../../../buildRender/core/SystemComponent/panel/DynamicPanel";
import { secondLabelWidth } from "../../../constants";

interface Props {
  modelValue: DynamicPanelProps["option"];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:modelValue": [value: DynamicPanelProps["option"]];
  change: [];
}>();

const dynamicPanelOption = useVModel(props, "modelValue", emit, {
  eventName: "update:dynamicPanelOption",
  passive: true
});

const handleChange = () => {
  emit("change");
};
const customPositionTypeOption = [
  {
    label: "靠左",
    value: customPositionTypeEnum.toLeft
  },
  {
    label: "靠右",
    value: customPositionTypeEnum.toRight
  },
  {
    label: "居中",
    value: customPositionTypeEnum.toCenter
  },
  {
    label: "居中靠上",
    value: customPositionTypeEnum.toCenterTop
  },
  {
    label: "居中靠下",
    value: customPositionTypeEnum.toCenterBottom
  },
  {
    label: "自定义",
    value: customPositionTypeEnum.toCustom
  }
];
</script>

<style lang="scss" scoped>
.flex {
  display: -ms-flexbox;
  display: -webkit-box;
  display: flex;
}

.flex-center-between {
  justify-content: space-between;
  align-items: center;
}

.fullWidth {
  width: 100%;
}
</style>
