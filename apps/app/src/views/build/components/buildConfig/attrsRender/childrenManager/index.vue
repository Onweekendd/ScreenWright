<template>
  <div class="children-manager" ref="childrenManagerRef">
    <SwCollapseItem title="子组件管理">
      <template #content>
        <div class="children-manager-scroll">
          <div class="children-manager-item flex" v-for="item in listItem" :key="item.title">
            <Icon
              :type="item.show ? 'iconfont-yanjing' : 'iconfont-biyanjing'"
              size="14"
              class="manager-item-icon"
              @click="handleShowOperate(item)"
            />
            <SwInput
              @blur="handleBlurOperate"
              v-model="item.name"
              width="120"
              style="top: -3px"
              v-if="item.isEdit"
              ref="inputRef"
            />
            <span class="component-name" v-else @click="handleItemShowDrawer(item)">
              {{ item.name }}
            </span>
            <span class="sub-operation-list">
              <el-tooltip effect="light" placement="top" content="编辑">
                <Icon type="iconfont-bianji" size="14" @click="handleEditOperate(item)" />
              </el-tooltip>
              <el-tooltip effect="light" placement="top" content="复制" v-if="item.component.prop !== 'threeEarth'">
                <Icon type="iconfont-copy" size="14" @click="handleCopyOperate(item)" />
              </el-tooltip>
              <el-tooltip effect="light" placement="top" content="删除">
                <Icon type="iconfont-shanchu" size="14" @click="handleDeleteOperate(item)" />
              </el-tooltip>
            </span>
          </div>
        </div>
      </template>
      <template #icon>
        <el-dropdown trigger="click" popper-class="sw-popper build-render-ignore">
          <span class="el-dropdown-link">
            <Icon type="iconfont-xianshi_tianjia" color="#b4b7c1" size="16" class="sw-collapse-item-icon" />
          </span>
          <template v-slot:dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="item in dropDownComponentList"
                :key="item.title"
                @click.stop="handleAddChildComponent(item)"
              >
                <span>
                  {{ item.title }}
                </span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
    </SwCollapseItem>
    <!-- 侧边栏 -->
    <childrenDrawer />
  </div>
</template>
<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { onClickOutside } from "@vueuse/core";

import { cloneDeep } from "lodash-es";

import SwCollapseItem from "@/components/SwCollapseItem/index.vue";
import SwInput from "@/components/SwInput/index.vue";
import Icon from "@/components/Icon/index.vue";
import { useCallbackArguments } from "@/hooks/callbackArguments/useCallbackArguments";
import { uuid } from "@/utils/utils";
import { sceneEnumType } from "@/views/build/components/buildRender/core/SceneComponent/type";

import { ueStreamType } from "../../../buildRender/core/ExtendsComponents/type";
import type { ChildComponent } from "../../../buildRender/type";
import { useUpdateInstance } from "../../useUpdateInstance";
import childrenDrawer from "./childrenDrawer.vue";
import { ftUrealEnginList, peerStreamList, pixelStreamList, vesselList } from "./components/extendsComponents";
import { defaultData, defaultGlData } from "./defaultData";
import { threeMapExtraData } from "./threeMapExtraData";
import { useChildrenDrawer } from "./useChildrenDrawer";

const { handleShowDrawer, setCurrentChildrenItem } = useChildrenDrawer();
const { emitFilterTrigger } = useCallbackArguments();

const { selectTargetData, update } = useUpdateInstance({
  history: false
});
const inputRef = ref();
const childrenManagerRef = ref();

// 子组件配置模板类型
type ChildComponentTemplate = Record<string, unknown> & {
  name: string;
  title: string;
};

type ChildComponentNameLike = Record<string, unknown> & {
  type?: unknown;
  name?: unknown;
  title?: unknown;
};

const REGION_OUTLINE_NAME = "区域轮廓";
const REGION_OUTLINE_MOJIBAKE_NAME = "鍖哄煙杞粨";

const normalizeRegionOutlineLabel = (value: unknown) => {
  const text = String(value || "");
  if (!text) {
    return REGION_OUTLINE_NAME;
  }
  return text.split(REGION_OUTLINE_MOJIBAKE_NAME).join(REGION_OUTLINE_NAME);
};

const normalizeRegionOutlineName = (item: ChildComponentNameLike) => {
  if (!item || item.type !== "regionOutline") {
    return false;
  }

  const nextName = normalizeRegionOutlineLabel(item.name);
  const nextTitle = normalizeRegionOutlineLabel(item.title);
  const changed = item.name !== nextName || item.title !== nextTitle;
  item.name = nextName;
  item.title = nextTitle;
  return changed;
};

const normalizeRegionOutlineNames = (children: ChildComponent[]) => {
  let changed = false;
  for (let i = 0; i < children.length; i++) {
    changed = normalizeRegionOutlineName(children[i] as ChildComponentNameLike) || changed;
  }
  return changed;
};

onClickOutside(childrenManagerRef, () => allItemHide());
const listItem = computed(() => {
  if (!selectTargetData.value[0] || selectTargetData.value.length === 0) {
    return [];
  }
  if (!selectTargetData.value[0].presetChild) {
    return [];
  }
  const children = selectTargetData.value[0].presetChild as ChildComponent[];
  normalizeRegionOutlineNames(children);
  return children;
});
const handleItemShowDrawer = (item: ChildComponent) => {
  if (!selectTargetData.value[0]) {
    return;
  }
  handleShowDrawer();
  setCurrentChildrenItem(item, selectTargetData.value[0]);
};

const handleAddChildComponent = (item: ChildComponentTemplate) => {
  if (!selectTargetData.value[0] || !selectTargetData.value[0].presetChild) {
    return;
  }
  const cpItem = cloneDeep(item) as ChildComponent;
  cpItem.id = uuid();
  normalizeRegionOutlineName(cpItem as ChildComponentNameLike);
  selectTargetData.value[0].presetChild.push(cpItem);

  emitFilterTrigger(`${selectTargetData.value[0].id}`);
  update();
};

const dropDownComponentList = computed((): ChildComponentTemplate[] => {
  if (!selectTargetData.value[0] || selectTargetData.value.length === 0) {
    return [];
  }
  const props = selectTargetData.value[0].component.prop;
  const mapPropsToList: Partial<Record<sceneEnumType | ueStreamType, ChildComponentTemplate[]>> = {
    [sceneEnumType.EchartcommonMap]: defaultData.filter(
      (item: any) => !["mapPath", "fence"].includes(item.type)
    ) as ChildComponentTemplate[],
    [sceneEnumType.EchartGlmap]: [
      ...(defaultGlData as ChildComponentTemplate[]),
      ...threeMapExtraData
    ] as ChildComponentTemplate[],
    [ueStreamType.UePeerStreaming]: peerStreamList as ChildComponentTemplate[],
    [ueStreamType.UeVessel]: vesselList as ChildComponentTemplate[],
    [ueStreamType.FtUnrealEngine]: ftUrealEnginList as ChildComponentTemplate[], //新增ue模版
    [ueStreamType.UePixelStreaming]: pixelStreamList as ChildComponentTemplate[]
  };
  const result = mapPropsToList[props as sceneEnumType | ueStreamType];
  if (!result) {
    return [];
  }
  return result;
});

const handleBlurOperate = async () => {
  await nextTick();
  console.log("这里失去焦点");
  normalizeRegionOutlineNames(listItem.value as ChildComponent[]);
  update();
};

const allItemHide = () => {
  for (let i = 0; i < listItem.value.length; i++) {
    listItem.value[i].isEdit = false;
  }
};

const handleShowOperate = (item: ChildComponent) => {
  item.show = !item.show;
  update();
};

const handleCopyOperate = (item: ChildComponent) => {
  if (!selectTargetData.value[0].presetChild) {
    return;
  }

  const copyItem = JSON.parse(JSON.stringify(item));
  normalizeRegionOutlineName(copyItem as ChildComponentNameLike);
  copyItem.name = `${copyItem.name}(副本)`;
  copyItem.title = `${copyItem.title}(副本)`;
  selectTargetData.value[0].presetChild.push(copyItem);
  update();
};

const handleDeleteOperate = (item: ChildComponent) => {
  if (!selectTargetData.value[0] || !selectTargetData.value[0].presetChild) {
    return;
  }

  const index = listItem.value.findIndex((i) => i.id === item.id);
  if (index !== -1) {
    selectTargetData.value[0].presetChild.splice(index, 1);
    update();
  }
};

const handleEditOperate = async (item: ChildComponent) => {
  if (item.isEdit) {
    item.isEdit = false;
    return;
  }

  allItemHide();

  item.isEdit = !item.isEdit;
  await nextTick();
  if (!inputRef.value || !inputRef.value.length) {
    return;
  }
  for (let i = 0; i < inputRef.value.length; i++) {
    inputRef.value[i].focus();
  }
};
</script>
<style lang="scss" scoped>
.sw-collapse-item-icon {
  position: relative;
  right: 10px;
}
.children-manager-scroll {
  max-height: 212px;
  overflow-y: auto;
}
.children-manager-item {
  color: #b4b7c1;
  height: 29px;
  line-height: 30px;
  position: relative;
  border-bottom: 1px solid rgb(57, 59, 74);
  font-size: 12px;
  cursor: pointer;
  .sub-operation-list {
    position: absolute;
    width: fit-content;
    right: 16px;
    display: none;
    i {
      padding: 0 4px;
    }
  }
  &:hover {
    color: #fff;
    .sub-operation-list {
      display: inline-block;
    }
  }
  .manager-item-icon {
    font-size: 14px;
    margin-right: 6px;
  }
}
</style>
