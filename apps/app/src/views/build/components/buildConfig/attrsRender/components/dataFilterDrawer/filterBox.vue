<template>
  <div
    class="filter-box"
    :class="{ 'fill-height': fillHeight }"
    v-for="filter in currentFilter"
    :key="filter.id || filter.name"
  >
    <div class="filter-box-header flex flex-justify-between flex-align-center">
      <div class="filter-box-header-left flex flex-align-center">
        <Icon type="iconfont-zuoyouduiqi" :size="12" style="margin-right: 8px" />
        <el-checkbox
          v-if="shouldShowCheckbox(filter, needCheckBox)"
          :modelValue="getFilterUsageStatus(filter)"
          @change="handleFilterCheckChange(filter, $event)"
        />
        <Icon
          :style="{ transform: filter.show ? 'rotate(-90deg)' : 'rotate(0deg)' }"
          @click.stop="handleClickShow(filter)"
          type="ArrowDown"
          :size="14"
          class="header-arrow"
        />
        <span class="title" v-if="!filter.notSaved">
          {{ filter.name }}
        </span>
        <SwInput width="120" v-else v-model="filter.name" placeholder="请输入过滤器名称" />
        <span class="filter-state" v-if="filter.notSaved"> 未保存 </span>
      </div>
      <div class="filter-box-header-right flex flex-align-center">
        <el-popover
          v-if="!filter.notSaved"
          placement="bottom"
          :width="280"
          trigger="hover"
          :disabled="!filter.bindComponent || filter.bindComponent.length === 0"
          popper-class="filter-components-popover"
          :popper-options="{ strategy: 'fixed' }"
        >
          <template #reference>
            <span class="use-component"> {{ filter.bindComponent.length || 0 }} 个组件正在使用 </span>
          </template>
          <div class="using-components-list">
            <div class="list-header">使用该过滤器的组件：</div>
            <div
              v-for="component in getUsingComponents(filter)"
              :key="component.id"
              class="component-item"
              @click="handleClickComponent(component.id)"
            >
              <span class="component-id">ID: {{ component.id }}</span>
              <span class="component-name">{{ component.name }}</span>
            </div>
            <div v-if="getUsingComponents(filter).length === 0" class="empty-tip">暂无组件使用</div>
          </div>
        </el-popover>
        <Icon type="iconfont-shanchu" size="12" @click="handleFilterDelete(filter)" />
      </div>
    </div>
    <el-collapse-transition>
      <div class="filter-box-content" v-show="filter.show">
        <filterCallBackItem :modelValue="filter.callBack" @update:modelValue="handleUpdateCallBack(filter, $event)" />

        <div class="filter-format">
          <p>function filter(data,callbackArgs){</p>
          <div class="format-editor">
            <MonacoEditor
              language="javascript"
              ref="monacoEditorRef"
              :injectSdkTypes="true"
              :wrapHeader="FILTER_FN_WRAP_HEADER"
              :wrapFooter="FILTER_FN_WRAP_FOOTER"
              :modelValue="filter.dataFormatter"
              @change="(value) => onFilterCodeChange(filter, value)"
            />
          </div>
          <p>}</p>
          <div class="icon-position">
            <Icon type="iconfont-fangda" @click="openCodeDialog(filter)" />
          </div>
        </div>
        <div class="filter-box-content-bottom flex flex-justify-between">
          <div class="filter-button" v-if="shouldShowTest(filter, props.needTest)" @click="handleClickTest(filter)">
            测试
          </div>
          <div class="filter-button-group flex">
            <div class="filter-button" @click="handleCancel(filter)">取消</div>
            <div class="filter-button highlight" @click="handleClickSave(filter)">
              {{ filter.id ? "添加" : "保存" }}
            </div>
          </div>
        </div>
      </div>
    </el-collapse-transition>
  </div>
</template>
<script setup lang="ts">
import { type ComponentPublicInstance, onMounted, ref } from "vue";
import { useVModel } from "@vueuse/core";

import type { CheckboxValueType } from "element-plus";

import SwInput from "@/components/SwInput/index.vue";
import Icon from "@/components/Icon/index.vue";
import MonacoEditor from "@/components/MonacoEditor/index.vue";
import {
  FILTER_FN_WRAP_FOOTER,
  FILTER_FN_WRAP_HEADER,
  setupCallbackArgsTypes
} from "@/components/MonacoEditor/setupCallbackArgsTypes";
import { useCallbackArguments } from "@/hooks/callbackArguments/useCallbackArguments";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";
import type { ChildComponent, ComponentType, Filter } from "@/views/build/components/buildRender/type";
import { FilterResultCollector } from "@/views/build/FilterResultCollector";
import { useDataFilter } from "@/views/build/useDataFilter";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

import filterCallBackItem from "./filterCallBackItem.vue";

const props = withDefaults(
  defineProps<{
    modelValue: Filter[];
    needCheckBox?: boolean;
    needTest?: boolean;
    targetComponent?: ComponentType | ChildComponent;
    /** 让展开的过滤器卡片占满父容器剩余高度(父容器需为纵向 flex);全局过滤器列表保持默认固定高度 */
    fillHeight?: boolean;
  }>(),
  {
    needCheckBox: false,
    needTest: false,
    targetComponent: undefined,
    fillHeight: false
  }
);
const monacoEditorRef = ref<ComponentPublicInstance<InstanceType<typeof MonacoEditor>> | null>(null);
const emit = defineEmits<{
  handleClickTest: [filter: Filter];
  handleFilterCheckChange: [
    payload: { filter: Filter; value: boolean; component: ComponentType | ChildComponent | undefined }
  ];
  handleClickShow: [filter: Filter];
  handleFilterDelete: [filter: Filter]; // 删除过滤器
  handleClickSave: [filter: Filter]; // 保存
  handleCancel: [filter: Filter]; // 取消
  handleUpdateCallBack: [filter: Filter]; // 更新回调字段
  openCodeDialog: [filter: Filter];
  "update:modelValue": [value: Filter[]];
}>();

const currentFilter = useVModel(props, "modelValue", emit);
const {
  updateCallbackArgumentToFilter,
  onFilterCodeChange,
  shouldShowTest,
  shouldShowCheckbox,
  getFilterInComponentIndex
} = useDataFilter();
const { allComponentMap } = useGlobalComponentData();
const { setTargetSelectChart } = useEditStore();
const { callbackArgumentsManager } = useCallbackArguments();

/**
 * 递归推断单个值的 TS 类型(支持嵌套):
 * - 基础类型 → number/string/boolean
 * - 数组 → 按第一个非空项推断,得到 `T[]`
 * - 对象 → 内联对象类型,推断它的所有 key
 * - null/复杂/超深 → any
 */
const inferValueType = (value: unknown, depth = 0): string => {
  if (value === null || value === undefined || depth > 5) {
    return "any";
  }
  if (Array.isArray(value)) {
    const first = value.find((v) => v !== null && v !== undefined);
    return first === undefined ? "any[]" : `${inferValueType(first, depth + 1)}[]`;
  }
  const t = typeof value;
  if (t === "number" || t === "string" || t === "boolean") {
    return t;
  }
  if (t === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      return "Record<string, any>";
    }
    const members = entries.map(([k, v]) => `${JSON.stringify(k)}: ${inferValueType(v, depth + 1)}`).join("; ");
    return `{ ${members} }`;
  }
  return "any";
};

/**
 * 按一列的样本值推断 TS 类型:全是基础类型则做联合(如 string | number);
 * 出现对象/数组则按第一个非空值递归推断(含嵌套 key)。
 */
const inferFieldType = (values: unknown[]): string => {
  const nonNull = values.filter((v) => v !== null && v !== undefined);
  if (nonNull.length === 0) {
    return "any";
  }
  const allPrimitive = nonNull.every((v) => {
    const t = typeof v;
    return t === "number" || t === "string" || t === "boolean";
  });
  if (allPrimitive) {
    return [...new Set(nonNull.map((v) => typeof v))].join(" | ");
  }
  return inferValueType(nonNull[0]);
};

/**
 * 推断 data 每行的「列名 -> 类型」:优先用 FilterResultCollector 里喂给过滤器的真实样本行
 * (SQL/API 跑完后的结果,正是 data 形参),拿不到再回落组件自身的 data;按样本值推断列类型。
 */
const getFilterRowFields = (): Record<string, string> => {
  const target = props.targetComponent;
  if (!target) {
    return {};
  }
  const collectorRows = FilterResultCollector.getInstance()
    .getResults(target)
    ?.flat()
    .find((item) => item.inputData?.length)?.inputData;
  const sampleRows = collectorRows ?? (target.data as unknown);
  if (!Array.isArray(sampleRows)) {
    return {};
  }
  const valuesByKey = new Map<string, unknown[]>();
  for (const row of sampleRows.slice(0, 20)) {
    if (row && typeof row === "object") {
      for (const [k, v] of Object.entries(row)) {
        const list = valuesByKey.get(k) ?? [];
        list.push(v);
        valuesByKey.set(k, list);
      }
    }
  }
  const fields: Record<string, string> = {};
  for (const [k, vals] of valuesByKey) {
    fields[k] = inferFieldType(vals);
  }
  return fields;
};

onMounted(() => {
  // 注入数据过滤器编辑器里 callbackArgs 的动态 key 与 data 行「列名->推断类型」的类型提示
  setupCallbackArgsTypes(Object.keys(callbackArgumentsManager.value), getFilterRowFields());
});
const openCodeDialog = (item: Filter) => {
  emit("openCodeDialog", item);
};

const handleClickTest = (item: Filter) => {
  emit("handleClickTest", item);
};

const handleFilterCheckChange = async (filter: Filter, value: CheckboxValueType) => {
  emit("handleFilterCheckChange", { filter, value: Boolean(value), component: props.targetComponent });
};

const handleFilterDelete = async (item: Filter) => {
  // 只显示一次确认提示框
  emit("handleFilterDelete", item);
};

const handleClickShow = (item: Filter) => {
  emit("handleClickShow", item);
};

const handleClickSave = async (item: Filter) => {
  emit("handleClickSave", item);
};

const handleCancel = async (item: Filter) => {
  emit("handleCancel", item);
};

const handleUpdateCallBack = (item: Filter, value: string[]) => {
  updateCallbackArgumentToFilter(item, value);
};

/**
 * 获取过滤器在组件中的使用状态
 * @param filter 过滤器对象
 * @returns 使用状态布尔值
 */
const getFilterUsageStatus = (filter: Filter): boolean => {
  try {
    // 安全检查：确保 selectTargetData 存在且不为空
    if (!props.targetComponent) {
      return false;
    }

    // 安全检查：确保第一个目标数据存在 listenArgs
    const targetData = props.targetComponent;
    if (!targetData?.listenArgs) {
      return false;
    }

    // 获取过滤器在组件中的索引
    const filterIndex = getFilterInComponentIndex(filter);

    // 安全检查：确保索引有效且对应的监听参数存在
    if (filterIndex < 0 || !targetData.listenArgs[filterIndex]) {
      return false;
    }

    // 返回使用状态，确保返回布尔值
    return Boolean(targetData.listenArgs[filterIndex].usageStatus);
  } catch (error) {
    console.warn("获取过滤器使用状态时出错:", error);
    return false;
  }
};

/**
 * 获取使用该过滤器的组件列表信息
 * @param filter 过滤器对象
 * @returns 组件信息数组，包含 id 和名称
 */
const getUsingComponents = (filter: Filter) => {
  try {
    if (!filter.bindComponent || filter.bindComponent.length === 0) {
      return [];
    }

    return filter.bindComponent
      .map((bindComp) => {
        const component = allComponentMap.value.get(`${bindComp.id}`);
        if (component) {
          return {
            id: component.id,
            name: component.name || bindComp.label || "未命名组件"
          };
        }
        return null;
      })
      .filter((item) => item !== null);
  } catch (error) {
    console.warn("获取使用组件列表时出错:", error);
    return [];
  }
};

/**
 * 点击组件项，选中该组件
 * @param componentId 组件ID
 */
const handleClickComponent = (componentId: number) => {
  try {
    const component = allComponentMap.value.get(`${componentId}`);
    if (component) {
      setTargetSelectChart(`${component.id}`);
    }
  } catch (error) {
    console.warn("选中组件时出错:", error);
  }
};
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";

// 过滤器弹出框颜色变量
$popover-bg-primary: #1a1d26;
$popover-bg-secondary: #0d0e12;
$popover-bg-hover: #252831;
$popover-border-color: #393b4a;
$popover-text-primary: #8b8d98;
$popover-text-secondary: #6b6d7a;
$popover-text-purple: var(--sw-theme-color);
$popover-text-purple-light: #a855f7;

.filter-box {
  background-color: #1a1d26;
  padding: 12px;
  @include checkbox-style();

  // 仅当父容器是纵向 flex 时生效:展开卡片吃满剩余高度,编辑器随之撑满
  // (全局过滤器列表父容器是 block,这些 flex 属性自动失效,保持固定 202px)
  &.fill-height {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    border-radius: 8px;
    overflow: hidden;

    .filter-box-content {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }
    .filter-format {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }
    .format-editor {
      flex: 1;
      min-height: 0;
      height: auto;
      border-radius: 6px;
      overflow: hidden;
    }
  }
  .filter-box-header {
    width: 100%;
    padding-left: 16px;
    padding-right: 8px;
    background-color: #292c35;
    color: #ffffff;
    position: relative;
    height: 30px;
    .header-arrow {
      cursor: pointer;
      transition: all 0.3s;
    }
  }
  .title {
    margin-left: 10px;
  }
  .filter-state {
    margin-left: 24px;
    color: #b4b7c1;
    position: relative;
    &::before {
      content: "●";
      position: absolute;
      left: -14px;
      width: 8px;
      font-size: 12px;
      color: #e74949;
      top: 50%;
      transform: translateY(-50%);
    }
  }
  .filter-box-header-right {
    cursor: pointer;
    .use-component {
      margin-right: 8px;
      cursor: pointer;
      &:hover {
        color: #409eff;
      }
    }
  }
  .filter-format {
    position: relative;
    .icon-position {
      position: absolute;
      right: 15px;
      bottom: 25px;
      cursor: pointer;
    }
  }
  .filter-box-content {
    width: 100%;
    padding: 12px 12px 20px 33px;
    border: 1px solid #393b4a;
    background-color: #1a1d26 !important;
  }
  .format-editor {
    width: 100%;
    height: 202px;
  }
  .filter-button {
    cursor: pointer;
    letter-spacing: 4px;
    width: 70px;
    height: 24px;
    line-height: 24px;
    margin-right: 10px;
    background-image: url("@/assets/image/button/btn-bground.png");
    background-repeat: no-repeat;
    background-size: cover;
    text-align: center;
    border-radius: 4px;
    &.highlight {
      color: #ffffff;
      background-image: url("@/assets/image/button/btn-bground-hightlight.png");
    }
  }

  .filter-button-group {
    flex: 1;
    justify-content: flex-end;
  }
}

.using-components-list {
  max-height: 300px;
  overflow-y: auto;
  background-color: $popover-bg-primary;
  padding: 8px;

  .list-header {
    font-size: 14px;
    font-weight: 600;
    color: $popover-text-primary;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid $popover-border-color;
  }

  .component-item {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    margin-bottom: 4px;
    background-color: $popover-bg-secondary;
    border-radius: 4px;
    transition: background-color 0.2s;
    cursor: pointer;

    &:hover {
      background-color: $popover-bg-hover;
    }

    .component-id {
      font-size: 12px;
      color: $popover-text-purple;
      margin-right: 12px;
      min-width: 60px;
      font-weight: 500;
    }

    .component-name {
      font-size: 13px;
      color: $popover-text-purple-light;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .empty-tip {
    text-align: center;
    color: $popover-text-secondary;
    font-size: 13px;
    padding: 20px 0;
  }
}
</style>

<style lang="scss">
// 全局样式，覆盖 el-popover 的默认背景
.filter-components-popover {
  background-color: #1a1d26 !important;
  border: 1px solid #393b4a !important;
  padding: 0 !important;

  .el-popover__arrow::before {
    background-color: #1a1d26 !important;
    border: 1px solid #393b4a !important;
  }
}
</style>
