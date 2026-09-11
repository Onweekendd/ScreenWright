<template>
  <div class="custom-config build-render-ignore" style="width: 100%">
    <div
      class="custom-config-item__title"
      :class="{
        'is-open': actionVisible,
        'is-bg': !isAction || hasBg
      }"
      @click.stop="changeVisible"
    >
      <Icon :type="actionVisible ? 'ArrowDown' : 'ArrowRight'" size="12" />
      <span v-show="!editVisible">{{ title }}</span>
      <div class="title-edit flex flex-center" v-if="editable">
        <sw-input
          v-model="titleValue"
          size="small"
          v-show="editVisible"
          @blur.stop="onAlters(titleValue)"
          @click.stop="onFocus"
        />
        <Icon type="EditPen" class="btn-edit" size="12" @click.stop="editVisibleHandle" />
        <span class="not-saved" v-if="notSaved"> 未保存 </span>
      </div>
      <div class="title__control flex flex-center" v-show="actionVisible && hasCtrl">
        <Icon
          v-for="item in ctrlList"
          :key="item.value"
          size="12"
          :type="item.icon"
          @click.stop="handleAction(item.value)"
        />
      </div>
    </div>
    <el-collapse-transition>
      <div v-show="actionVisible">
        <slot />
      </div>
    </el-collapse-transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

import SwInput from "@/components/SwInput/index.vue";
import Icon from "@/components/Icon/index.vue";

interface Props {
  title?: string;
  hasBg?: boolean;
  isAction?: boolean;
  hasCtrl?: boolean;
  editable?: boolean;
  notSaved?: boolean;
  ctrlList?: Array<{
    name: string;
    value: string;
    icon: string;
  }>;
  // 控制折叠/展开状态的外部属性
  visible?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: "",
  hasBg: false,
  isAction: false,
  hasCtrl: true,
  editable: false,
  notSaved: false,
  visible: undefined, // 允许外部控制，undefined 时由内部状态管理
  ctrlList: () => [
    { name: "添加", value: "add", icon: "CirclePlus" },
    { name: "删除", value: "delete", icon: "Delete" }
  ]
});

const emit = defineEmits<{
  (e: "changeActionVisible", value: boolean): void;
  (e: "onEvent", type: string): void;
  (e: "changeValue", value: string): void;
}>();

const actionVisible = ref(props.isAction);
const editVisible = ref(false);
const titleValue = ref(props.title);

// 监听外部 visible prop 变化
watch(
  () => props.visible,
  (newVal) => {
    if (newVal !== undefined) {
      actionVisible.value = newVal;
    }
  }
);

const changeVisible = () => {
  actionVisible.value = !actionVisible.value;
  emit("changeActionVisible", actionVisible.value);
};

const handleAction = (type: string) => {
  emit("onEvent", type);
};

const onFocus = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target && target.select) {
    target.select();
  }
};
const editVisibleHandle = () => {
  editVisible.value = !editVisible.value;
};

const onAlters = (title: string) => {
  editVisible.value = false;
  emit("changeValue", title);
};
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-input__wrapper");
.custom-config-item__title {
  font-size: 12px;
  position: relative;
  height: 30px;
  line-height: 30px;
  padding: 0 10px 0 10px;
  margin-bottom: 5px;
  color: #ffffff;
  display: flex;
  align-items: center;
  &.is-bg {
    background-color: #2d2f38;
    border-bottom: 1px solid #393b4a;
  }
  &:hover .title-edit .btn-edit {
    visibility: visible;
  }
  .sw-icon {
    margin-right: 5px;
  }
  .title-edit,
  .title-edit .btn-edit,
  .title-edit .not-saved {
    position: absolute;
    top: 0px;
  }
  .btn-edit {
    position: absolute;
    top: 8px !important;
  }
  .title-edit {
    width: 160px;
    left: 20px;
    display: flex;
    .btn-edit {
      visibility: hidden;
      cursor: pointer;
      right: -20px;
    }
    .not-saved {
      right: -80px;
      padding-left: 10px;
      &::before {
        content: "";
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #ff3c38;
        position: absolute;
        left: 0;
        top: 50%;
        transform: translate(0, -50%);
      }
    }
  }
  .title__control {
    position: absolute;
    right: 4px;
    & > i {
      cursor: pointer;
    }
  }
}
</style>
