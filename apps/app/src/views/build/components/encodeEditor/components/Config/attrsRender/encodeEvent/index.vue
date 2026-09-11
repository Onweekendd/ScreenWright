<template>
  <div class="layout-item">
    <configCustom title="远程控制" @onEvent="handleOnEvent($event)">
      <div
        class="content-pad-row"
        v-if="selectTargetData[0].encodes && selectTargetData[0].encodes.length && currentEncodeEvent"
      >
        <configTabsItem
          @tabs-change="handleTabs($event)"
          :eventList="encodeEventOptions"
          :currentTab="currentEncodeEventId"
        />
        <el-form-item label="事件类型" :label-width="85">
          <configSelect
            field="encodeEventType"
            :labelFormat="onLabelFormat"
            v-model="currentEncodeEvent.trigger"
            :excludes="eventExcludes"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="条件" :label-width="85">
          <configCondition
            :conditions="currentEncodeEvent.conditions"
            :conditionType="currentEncodeEvent.conditionType"
            @changeValue="handleChangeVisible"
            @addCondition="handleCondition()"
          />
        </el-form-item>
        <configCustom title="控制" :is-action="true" @onEvent="handleOnActionEvent($event)">
          <div class="content-pad-row" v-if="currentEncodeEvent.actions.length > 0 && currentEncodeAction">
            <configTabsItem
              :isSecond="true"
              :draggable="true"
              @tabs-change="handleActionTabs($event)"
              @list-change="handleActionList($event)"
              :eventList="currentEncodeEvent.actions"
              :currentTab="currentEncodeActionId"
            />
            <el-form-item label="组件" :label-width="85">
              <configSelect
                :multiple="false"
                :hasTree="false"
                :checkStrictly="true"
                :isCheckbox="false"
                :isComp="true"
                :filterable="true"
                :option="remoteControlComponent"
                :modelValue="currentEncodeAction.component[0]"
                @update:modelValue="onComponentChange"
                @change="update"
              />
            </el-form-item>

            <el-form-item label="控制项名称" :label-width="85" v-if="showControlItemSelect">
              <configSelect
                :multiple="false"
                :hasTree="false"
                :isCheckbox="false"
                :option="currentComponentControlItem"
                :modelValue="currentEncodeAction.encodeValue[0]"
                @update:modelValue="onEncodeValueChange"
              />
            </el-form-item>
          </div>
          <div v-else style="padding: 0 0.2rem; font-size: 12px">{{ defaultMgs }}</div>
        </configCustom>
      </div>
      <div v-else style="padding: 0 0.2rem; font-size: 12px">{{ defaultMgs }}</div>
      <condition-config ref="conditionConfigRef" />
    </configCustom>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { cloneDeep } from "lodash-es";

import { extractComponentId } from "@/utils/utils.js";
import configCustom from "@/views/build/components/buildConfig/attrsRender/components/interactiveConfig/components/configCustom.vue";
import configSelect from "@/views/build/components/buildConfig/attrsRender/components/interactiveConfig/components/configSelect.vue";
import configTabsItem from "@/views/build/components/buildConfig/attrsRender/components/interactiveConfig/components/configTabsItem.vue";
import type { ConfigSelectOption } from "@/views/build/components/buildConfig/attrsRender/components/interactiveConfig/components/useConfigSelect";
import configCondition from "@/views/build/components/buildConfig/attrsRender/components/interactiveConfig/conditionView.vue";
import { templateConditions } from "@/views/build/components/buildConfig/attrsRender/components/interactiveConfig/options";

import conditionConfig from "./conditionConfig.vue";
import { useEncodeEventConfig } from "./useEncodeEventConfig";

// 使用新的useEncodeEvent hooks
const {
  // 状态变量
  currentEncodeEvent,
  currentEncodeAction,
  currentEncodeEventId,
  currentEncodeActionId,

  // 计算属性
  currentComponentControlItem,
  encodeEventOptions,
  eventExcludes,

  remoteControlComponent,

  // 方法
  handleEncodeEventSelect,
  handleEncodeActionTabs,
  initEncodeEvent,
  isNoControlItemComponent,

  // 事件和动作处理方法
  handleOnEvent,
  handleOnActionEvent,

  // 继承的状态和方法
  selectTargetData,
  update
} = useEncodeEventConfig();

const defaultMgs = "列表为空";

// 计算是否显示控制项名称选择框
const showControlItemSelect = computed(() => {
  return (
    currentEncodeAction.value.component &&
    currentEncodeAction.value.component.length &&
    !isNoControlItemComponent(currentEncodeAction.value.component[0]) &&
    currentComponentControlItem.value.length > 0
  );
});

const isSelectComp = computed(() => {
  if (
    ["ft-customselect", "ft-cascader", "ft-legend", "ft-singleSelectedLegend"].includes(
      selectTargetData.value[0].component.name
    )
  ) {
    return true;
  }
  return false;
});
const setSelectTargetDataRelateId = (stringArray: string[]) => {
  if (selectTargetData.value && selectTargetData.value.length > 0) {
    let targetData = selectTargetData.value[0];
    if (stringArray && stringArray.length > 0) {
      const relateComponentId = stringArray.map((item) => {
        return extractComponentId(item);
      });
      targetData.option.relateComponentId = relateComponentId;
      return;
    }
    targetData.option.relateComponentId = [];
  }
};
const onComponentChange = (val: string | string[] | number[]) => {
  if (Array.isArray(val)) {
    currentEncodeAction.value.component = val.map((v) => String(v));
  } else {
    currentEncodeAction.value.component = [val];
  }
  setSelectTargetDataRelateId(currentEncodeAction.value.component);

  update();
};

const onEncodeValueChange = (val: string | string[] | number[]) => {
  if (Array.isArray(val)) {
    currentEncodeAction.value.encodeValue = val.map((v) => Number(v));
  } else {
    currentEncodeAction.value.encodeValue = [Number(val)];
  }

  update();
};

const onLabelFormat = (item: ConfigSelectOption) => {
  if (isSelectComp.value && item.value == "click") {
    return "选中值改变";
  }
  return item.label;
};
const handleTabs = (val: any) => {
  handleEncodeEventSelect(val);
};

const handleActionTabs = (val: any) => {
  handleEncodeActionTabs(val);
};

const handleActionList = (val: any) => {
  currentEncodeEvent.value.actions = val;
  currentEncodeAction.value = currentEncodeEvent.value.actions[0];
  currentEncodeActionId.value = currentEncodeAction.value.id;
};

const conditionConfigRef = ref();
const handleCondition = () => {
  const temp = cloneDeep(templateConditions()) as any;
  Object.assign(temp, {
    notSaved: true,
    isExists: false,
    tempPool: {}
  });
  conditionConfigRef.value.visible = true;
  currentEncodeEvent.value.conditions.push(temp);
};

const handleChangeVisible = () => {
  conditionConfigRef.value.visible = true;
};

onMounted(() => {
  initEncodeEvent();
});
</script>
