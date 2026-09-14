<template>
  <div class="component-search" ref="componentSearchRef">
    <el-tooltip class="item" effect="dark" placement="bottom">
      <Icon type="Search" size="14" @click="onSearchClick" />
      <template #content>
        <span>搜索组件</span>
      </template>
    </el-tooltip>

    <el-dialog
      v-model="visible"
      :show-close="false"
      width="500"
      modal-class="component-search-dialog build-render-ignore"
      @closed="handleClose"
    >
      <template #header>
        <div class="component-search-header">
          <sw-input
            @input="handleSearchTextChange"
            v-model="searchText"
            placeholder="请输入组件名称搜索图层名称或素材库"
            :height="32"
            clearable
            ref="searchInputRef"
          />
        </div>
      </template>
      <template v-if="searchText && searchText.length > 0">
        <componentSearchTab v-model="active" :tabs="tabs" />
        <componentSearchList
          :apiGet="apiGet"
          :params="currentParams"
          @itemClick="itemClick"
          @dragStartHandle="dragStartHandle"
          :active="active"
        />
      </template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { computed, nextTick, onBeforeMount, onMounted, ref, watch } from "vue";
import { onClickOutside, onKeyStroke, useVModel } from "@vueuse/core";

import { SwInput } from "@screenwright/ui/input";

import Icon from "@/components/Icon/index.vue";
import type { MenuItemForRender } from "@/views/build/components/buildTabs/selectAssets/assetsMenuType";

import componentSearchList from "./componentSearchList.vue";
import componentSearchTab from "./componentSearchTab.vue";
import type { tabsItem } from "./type";

interface Props {
  tabs: Array<tabsItem>;
  modelValue: string;
}
const props = defineProps<Props>();
let actionInstance: ReturnType<typeof onKeyStroke> | null = null;
const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "itemClick", item: any, active: string): void;
  (e: "dragStartHandle", mouseEvent: DragEvent, item: MenuItemForRender): void;
  (e: "dragendHandle"): void;
}>();
const active = useVModel(props, "modelValue", emit);
const visible = ref(false);
const searchText = ref("");
const searchInputRef = ref<InstanceType<typeof SwInput>>();
const currentParams = ref({
  current: 1,
  size: 1000,
  name: searchText.value
});

const componentSearchRef = ref();

const apiGet = computed(() => {
  const target = props.tabs.find((v) => v.value === active.value);
  return target ? target.getApi : async () => [];
});

const dragStartHandle = (e: DragEvent, item: any) => {
  emit("dragStartHandle", e, item);
};

const handleSearchTextChange = (val: string) => {
  currentParams.value.name = val;
};

const onSearchClick = () => {
  visible.value = !visible.value;
};
const handleClose = () => {
  visible.value = false;
  searchText.value = "";
  currentParams.value = {
    current: 1,
    size: 10,
    name: ""
  };
  active.value = props.tabs[0]?.value || "";
};

const itemClick = (item: any) => {
  visible.value = false;
  emit("itemClick", item, active.value);
};
watch(visible, (newVal) => {
  if (newVal) {
    nextTick(() => {
      if (searchInputRef.value) {
        setTimeout(() => {
          searchInputRef.value?.focus();
        }, 50);
      }
    });
  }
});

onMounted(async () => {
  await nextTick();
  searchText.value = "";
  actionInstance = onKeyStroke(
    ["f"],
    (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        if (visible.value) {
          return;
        }
        visible.value = true;
      }
    },
    { dedupe: true }
  );
  onClickOutside(componentSearchRef, () => {
    visible.value = false;
  });
});
onBeforeMount(() => {
  searchText.value = "";
  if (actionInstance) {
    actionInstance();
  }
});
</script>
<style lang="scss">
@import "src/style/mixins/element.scss";
@import "src/style/theme.scss";
.component-search {
  position: absolute;
  right: 10px;
  top: 10px;
  display: flex;
  align-items: center;
  cursor: pointer;
  color: $sw-text-dim;
  transition: color 0.15s;
  &:hover {
    color: var(--sw-theme-color);
  }
}
.component-search-dialog {
  .el-dialog {
    padding: 10px !important;
    background-color: var(--sw-panel-bg) !important;
    pointer-events: auto;
  }
  pointer-events: none;
}
</style>
