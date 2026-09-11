<template>
  <div class="component-search-list" v-if="listData && listData.length > 0">
    <div
      class="menu-content-item"
      @dragstart="dragStartHandle($event, item)"
      @dragend="dragendHandle"
      draggable
      v-for="item in listData"
      :key="item.id"
      @click="handleClick(item)"
    >
      <div class="usehove">
        <div class="top-text">{{ item.title }}</div>
        <div class="inside-img" v-if="item.isVideo">
          <video :src="item.img" autoplay muted loop />
        </div>
        <div class="inside-img" v-else>
          <!-- url("/src/assets/image/bg/default_content_item.png") -->
          <img :src="setMinioUrl(item.img)" :alt="item.name" v-if="item.img" />
          <div v-else class="no-img" />
        </div>
      </div>
    </div>
  </div>
  <SwEmpty v-else />
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";

import { ElMessage } from "element-plus";

import SwEmpty from "@/components/SwEmpty/index.vue";
import { setMinioUrl } from "@/utils/config";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";
import { DragKeyEnum, EditCanvasTypeEnum } from "@/views/build/components/buildRender/type";
import type { MenuItemForRender } from "@/views/build/components/buildTabs/selectAssets/assetsMenuType";
import { NavListType } from "@/views/build/useNavAction";

import type { tabsItem } from "./type";

interface Props {
  apiGet: tabsItem["getApi"];
  params: {
    current: number;
    size: number;
    name: string;
  };
  active: string;
}
const props = defineProps<Props>();
const emits = defineEmits<{
  (e: "itemClick", item: any): void;
  (e: "dragStartHandle", mouseEvent: DragEvent, item: MenuItemForRender): void;
  (e: "dragendHandle"): void;
}>();
const listData = ref<Array<any>>();
const { setEditCanvas } = useEditStore();
const dragStartHandle = (e: DragEvent, item: MenuItemForRender) => {
  console.log("dragStartHandle", props.active);
  if (props.active === "layer") {
    return;
  }
  const isMaterialType = ["systemMaterial", "systemCase", "assetsCloud"].includes(props.active);
  const navListType = isMaterialType ? NavListType.MaterialLibrary : NavListType.Component;
  e!.dataTransfer!.setData(DragKeyEnum.DRAG_KEY, JSON.stringify(item));
  e!.dataTransfer!.setData("navListType", navListType);
  console.log(e, "fff");
  setEditCanvas(EditCanvasTypeEnum.IS_CREATE, true);
  emits("dragStartHandle", e, item);
};

/**
 * 拖拽结束处理
 */
const dragendHandle = () => {
  // setEditCanvas(EditCanvasTypeEnum.IS_CREATE, false);
  if (props.active === "layer") {
    ElMessage.error("该类型组件不可拖拽");
    return;
  }
  emits("dragendHandle");
};

const handleClick = (item: any) => {
  emits("itemClick", item);
};

const initData = async () => {
  if (!props.apiGet) {
    console.error("没有对应的 api");
    return;
  }
  console.log(props.params, "props.params");
  const data = await props.apiGet(props.params);
  console.log(data, "变化");
  listData.value = data.filter((v) => v.title.includes(props.params.name));
};
watch(
  () => props.apiGet,
  async () => {
    initData();
  }
);
watch(
  () => props.params.name,
  async () => {
    console.log("params name changed");
    initData();
  }
);

onMounted(() => {
  initData();
});
</script>
<style lang="scss" scoped>
.component-search-list {
  margin-top: 10px;
  max-height: 200px;
  overflow-y: scroll;
  /* 核心Grid布局修改 */
  display: grid;
  grid-template-columns: repeat(auto-fill, 151px);
  column-gap: 11px;

  .menu-content-item {
    background-color: #232630 !important;
    height: 98px !important;
    font-size: 12px;
    padding: 0 !important;
    position: relative;

    .usehove {
      /* 宽度与列宽一致，确保每个项目填满列宽 */
      width: 100%;
      height: 92px;
      border-radius: 4px;
      margin-bottom: 12px; /* 项目之间的垂直间距 */
      position: relative;
      background-color: #4b4d58 !important;
      overflow: hidden;
    }

    .top-text {
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
      width: 100%; /* 改为100%，适应列宽 */
      text-align: left;
      font-size: 12px;
      height: 20px;
      line-height: 20px;
      padding-left: 8px;
      color: #b4b7c1;
      &:hover {
        color: #ffffff;
      }
    }

    .inside-img {
      width: 100%;
      height: 72px;
      line-height: 68px;
      text-align: center;
      background-color: #000000;
      display: flex;
      align-items: center;
      justify-content: center;

      img {
        width: 100%;
        max-height: 72px;
        object-fit: contain;
      }
      video {
        width: 100%;
        max-height: 72px;
        object-fit: contain;
      }
    }
    .no-img {
      width: 100%;
      height: 100%;
      background: url("/src/assets/image/bg/default_content_item.png") no-repeat center;
    }
  }
}
</style>
