<template>
  <div class="layout-item">
    <config-custom
      title="自定义事件"
      ref="customEventRef"
      @onEvent="handleOnEvent($event)"
      @changeActionVisible="handleChangeActionVisible"
      v-if="selectTargetData[0].events"
    >
      <div>
        <div class="content-pad-row" v-if="selectTargetData[0].events.length && currentEvent">
          <config-tabs-item
            @tabs-change="handleEventSelect($event)"
            @list-change="handleList($event)"
            :candraggable="true"
            :eventList="eventOptions"
            :currentTab="currentEvent.id"
          />

          <el-form-item label="事件类型" :label-width="85">
            <config-select
              v-model="currentEvent.trigger"
              :labelFormat="onLabelFormat"
              :excludes="eventExcludes"
              field="eventType"
              @change="update"
            />
          </el-form-item>
          <template v-if="componentType === 'customTableList' && currentEvent.trigger === EventTypeEnum.Click">
            <el-form-item label="按钮对象" :label-width="85">
              <el-select v-model="currentEvent.btnObjs" popper-class="sw-select-dropdown" @change="update">
                <el-option
                  v-for="item in btnObjsOptions"
                  :key="item.value"
                  :data-translate="item.label"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </template>

          <template v-if="['threescene', 'industryscene'].includes(componentProp)">
            <el-form-item label="选择对象" :label-width="85" v-if="currentEvent.trigger === 'modelClick'">
              <configSelect
                :multiple="true"
                :hasTree="true"
                handleChangeAssets
                nodeKey="value"
                :option="eventSceneModels"
                v-model="currentEvent.model"
                @change="handleChangeAssets"
              />
            </el-form-item>
            <el-form-item
              label="id关键词"
              :label-width="85"
              v-if="['multiplyModelClick', 'multiplyIconClick'].includes(currentEvent.trigger)"
            >
              <sw-input v-model="currentEvent.modelIdKeyword" placeholder="请输入场景对象名称关键词" />
            </el-form-item>
            <el-form-item label="选择节点" :label-width="85" v-if="currentEvent.trigger === 'modelNodeClick'">
              <configSelect
                :multiple="true"
                :hasTree="true"
                nodeKey="id"
                :option="eventSceneModelNodes"
                v-model="currentEvent.modelNodeList"
                @change="handleChangeModelNodeList"
                :isReserveCheckedGroup="true"
              />
            </el-form-item>
          </template>

          <template v-if="componentProp === 'maptalks'">
            <el-form-item
              label="选择图层"
              :label-width="85"
              v-if="['modelClick', 'layerClick', 'vectorClick', '3DTilesClick'].includes(currentEvent.trigger)"
            >
              <configSelect
                :multiple="true"
                :hasTree="true"
                nodeKey="value"
                :option="eventSceneLayers"
                v-model="currentEvent.layer"
                @change="handleChangeAssetsLayer"
              />
            </el-form-item>
            <el-form-item
              label="id关键词"
              :label-width="85"
              v-if="['multiplyModelClick', 'multiplyIconClick'].includes(currentEvent.trigger)"
            >
              <sw-input v-model="currentEvent.modelIdKeyword" placeholder="请输入场景对象名称关键词" />
              />
            </el-form-item>
          </template>

          <el-form-item label="条件" :label-width="85" v-if="unConditionalJudgment">
            <conditionView
              :conditions="currentEvent.conditions"
              :conditionType="currentEvent.conditionType"
              @changeValue="drawerVisible"
              @addCondition="handleCondition"
            />
          </el-form-item>

          <configCustom title="动作" :is-action="true" @onEvent="handleOnActionEvent($event)">
            <div class="action-container" v-if="currentAction && currentEvent.actions.length">
              <div class="content-pad-row" v-if="currentAction.id">
                <configTabsItem
                  :isSecond="true"
                  :draggable="true"
                  @tabs-change="handleActionTabs($event)"
                  @list-change="handleActionList($event)"
                  :eventList="currentEvent.actions"
                  :currentTab="currentAction.id"
                />
                <el-form-item label="类型" :label-width="85">
                  <sw-radio
                    direction="row"
                    :option="customActionTypeOptions"
                    v-model="currentAction.customActionType"
                    @change="update"
                  />
                </el-form-item>
                <!-- 动作部分 -->
                <div v-if="currentAction.customActionType === 'component'" key="component">
                  <ComponentActionConfigs />
                </div>

                <div v-else-if="currentAction.customActionType === 'message'" key="message" style="width: 100%">
                  <MessageActionConfigs />
                </div>

                <div
                  v-else-if="currentAction.customActionType === 'statusAnimation'"
                  key="statusAnimation"
                  style="width: 100%"
                >
                  <StatusAnimationConfigs />
                </div>
              </div>
            </div>
            <div v-else style="padding: 0 0.2rem; font-size: 12px">{{ defaultMgs }}</div>
          </configCustom>
        </div>
        <div v-else style="padding: 0 0.2rem; font-size: 12px">{{ defaultMgs }}</div>

        <condition-config ref="conditionConfigRef" type="events" />
      </div>
    </config-custom>
  </div>
</template>
<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";

import { cloneDeep } from "lodash-es";

import SwInput from "@/components/SwInput/index.vue";
import SwRadio from "@/components/SwRadio/index.vue";
import { uuid } from "@/utils/utils";
import ComponentActionConfigs from "@/views/build/components/buildConfig/attrsRender/components/interactiveConfig/componentActionConfigs/index.vue";
import conditionConfig from "@/views/build/components/buildConfig/attrsRender/components/interactiveConfig/components/conditionConfig.vue";
import configCustom from "@/views/build/components/buildConfig/attrsRender/components/interactiveConfig/components/configCustom.vue";
import configSelect from "@/views/build/components/buildConfig/attrsRender/components/interactiveConfig/components/configSelect.vue";
import ConfigTabsItem from "@/views/build/components/buildConfig/attrsRender/components/interactiveConfig/components/configTabsItem.vue";
import conditionView from "@/views/build/components/buildConfig/attrsRender/components/interactiveConfig/conditionView.vue";
import MessageActionConfigs from "@/views/build/components/buildConfig/attrsRender/components/interactiveConfig/messageActionConfigs/index.vue";
import {
  createTemplateAction,
  templateActions,
  templateConditions,
  templateEvents
} from "@/views/build/components/buildConfig/attrsRender/components/interactiveConfig/options";
import StatusAnimationConfigs from "@/views/build/components/buildConfig/attrsRender/components/interactiveConfig/statusAnimationConfigs/index.vue";
import { useCustomEvent } from "@/views/build/components/buildConfig/attrsRender/components/interactiveConfig/useCustomEvent";
import { ActionTypeEnum } from "@/views/build/components/buildConfig/constants/action";
import { EventTypeEnum } from "@/views/build/components/buildConfig/constants/event";
import { customActionTypeOptions } from "@/views/build/components/buildConfig/constants/index";
// import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore"
import { useUpdateInstance } from "@/views/build/components/buildConfig/useUpdateInstance";
import type { Action, Condition } from "@/views/build/components/buildRender/type";

// const { componentList } = useEditStore()
const componentProp = computed(() => {
  return selectTargetData.value[0].component.prop as string;
});
const eventOptions = computed(() => {
  return selectTargetData.value[0].events;
});

const {
  eventSceneModels,
  eventSceneModelNodes,
  eventSceneLayers,
  unConditionalJudgment,
  eventExcludes,

  // 导入全局状态
  currentAction,
  currentEvent,
  currentIndex,

  // 导入方法
  handleEventSelect,
  handleActionTabs,
  setInitialEvent,
  init,

  handleChangeAssets,
  handleChangeModelNodeList,
  handleChangeAssetsLayer
} = useCustomEvent();

const defaultMgs = "列表为空";
const { update, selectTargetData } = useUpdateInstance();

const componentType = computed(() => {
  return selectTargetData.value[0].component.prop as string;
});

const btnObjsOptions = computed(() => {
  const options: { label: string; value: string }[] = [];
  selectTargetData.value[0].option.column.forEach((item: any, index: any) => {
    if (item.seriesYContentType === "btn") {
      options.push({
        label: `按钮${index}-${item.btnWord}`,
        value: item.id || index
      });
    }
  });
  return options;
});

const addEvent = async () => {
  const obj = ["threeScene", "facotyScene"].includes(selectTargetData.value[0].component.prop as string)
    ? { trigger: EventTypeEnum.ModelClick }
    : {};
  let temp = templateEvents(obj);

  // 如果已有事件，基于最后一个事件创建新事件
  if (selectTargetData.value[0].events?.length) {
    const lastEvent = selectTargetData.value[0].events[selectTargetData.value[0].events.length - 1];
    temp = cloneDeep({
      ...lastEvent,
      id: "event_" + uuid()
    });
  }

  selectTargetData.value[0].events.push(temp);
  await nextTick();
  currentIndex.value = selectTargetData.value[0].events.length - 1;
  currentEvent.value = selectTargetData.value[0].events[currentIndex.value];
  currentAction.value = currentEvent.value.actions[0] as Action;
  update();
};

const deleteEvent = () => {
  if (!currentEvent.value?.id) {
    return;
  }
  const delIndex = eventOptions.value.findIndex((item: any) => item.id === currentEvent.value?.id);
  const prevIndex = delIndex > 0 ? delIndex - 1 : 0;
  selectTargetData.value[0].events.splice(delIndex, 1);
  if (selectTargetData.value[0].events.length) {
    currentIndex.value = prevIndex;
    currentEvent.value = selectTargetData.value[0].events[currentIndex.value];
    currentAction.value = currentEvent.value.actions[0] as Action;
  } else {
    currentIndex.value = 0;
    currentEvent.value = templateEvents({});
    currentAction.value = templateActions();
  }
  update();
};

const handleList = (val: any) => {
  selectTargetData.value[0].events = val;
};

const handleActionList = (val: any) => {
  if (currentEvent.value) {
    currentEvent.value.actions = val;
  }
};

const addAction = () => {
  if (!currentEvent.value) {
    return;
  }

  const newAction = currentEvent.value.actions?.length
    ? cloneDeep({
        ...currentEvent.value.actions[currentEvent.value.actions.length - 1],
        id: "action_" + uuid()
      })
    : (createTemplateAction(ActionTypeEnum.Default) as Action);

  currentEvent.value.actions.push(newAction);
  handleActionTabs(newAction.id);
  update();
};

const deleteAction = () => {
  if (!currentAction.value?.id || !currentEvent.value) {
    return;
  }

  const delId = currentAction.value.id;
  const delIndex = currentEvent.value.actions.findIndex((item: any) => item.id === delId);
  const prevIndex = delIndex > 0 ? delIndex - 1 : 0;
  currentEvent.value.actions.splice(delIndex, 1);
  if (currentEvent.value.actions.length > 0) {
    handleActionTabs(currentEvent.value.actions[prevIndex].id);
  }
  update();
};

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

const onLabelFormat = (item: any) => {
  if (isSelectComp.value && item.value == "click") {
    return "选中值改变";
  }
  return item.label;
};

const handleChangeActionVisible = (val: boolean) => {
  console.log(val, "val");
};

const handleOnEvent = (evt: string) => {
  if (evt === "add") {
    addEvent();
  } else if (evt === "delete") {
    deleteEvent();
  }
};

const handleOnActionEvent = (evt: string) => {
  if (evt === "add") {
    addAction();
  } else if (evt === "delete") {
    deleteAction();
  }
};

const handleCondition = () => {
  if (!currentEvent.value) {
    return;
  }

  const temp = cloneDeep(templateConditions()) as Condition;
  Object.assign(temp, {
    notSaved: true,
    isExists: false,
    tempPool: {}
  });
  conditionConfigRef.value.visible = true;
  currentEvent.value.conditions.push(temp);
};

const conditionConfigRef = ref();
const drawerVisible = () => {
  conditionConfigRef.value.visible = true;
  console.log("drawerVisible");
};

watch(
  () => selectTargetData.value[0]?.events,
  (newVal) => {
    if (!newVal) {
      return;
    }
    const currentEventIndex = newVal.findIndex((item) => item.id === currentEvent.value?.id);
    const currentActionIndex = currentEvent.value?.actions.findIndex((item) => item.id === currentAction.value?.id);
    if (currentEventIndex !== -1) {
      currentEvent.value = newVal[currentEventIndex];
      if (currentActionIndex !== -1) {
        currentAction.value = currentEvent.value.actions[currentActionIndex] as Action;
      }
    }
  }
);

// 在Vue组件中初始化
onMounted(() => {
  // 初始化数据结构
  init();
  // 设置初始事件
  setInitialEvent();
});

watch(
  () => selectTargetData.value[0] && selectTargetData.value[0].id,
  (newVal) => {
    if (!newVal) {
      return;
    }

    setInitialEvent();
  }
);
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include common-element-style(".el-textarea__inner");

.content-pad-row {
  width: 100%;
  box-sizing: border-box;
}
.button-item {
  width: fit-content;
  padding: 5px 5px;
  text-align: center;
  color: #8a56e8;
  border: 1px solid #8a56e8;
  border-radius: 4px 4px;
  cursor: pointer;
  line-height: 18px;
  font-size: 12px;
}
</style>
