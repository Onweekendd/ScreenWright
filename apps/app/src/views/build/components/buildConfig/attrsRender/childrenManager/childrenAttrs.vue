<template>
  <div class="children-attrs style-description" v-if="currentChildrenItem && currentParentItem">
    <div class="component-name">{{ currentParentItem.title }}-{{ currentChildrenItem.title }}</div>
    <div class="component-description">
      v{{ navInfo.versionCode || "1.0.0" }} | {{ currentParentItem.id }} | {{ currentParentItem.zIndex }}
    </div>
    <div class="component-back">
      <div class="component-operation flex flex-center">
        <Icon type="iconfont-zuojiantou" size="14" @click="handleShowDrawer" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import Icon from "@/components/Icon/index.vue";

// import { useUpdateInstance } from "../../useUpdateInstance"
import { useLargeScreenInfo } from "../../../../useLargeScreenInfo";
import { useChildrenDrawer } from "./useChildrenDrawer";

const { currentChildrenItem, currentParentItem, handleShowDrawer } = useChildrenDrawer();
const { navInfo } = useLargeScreenInfo();
// const { selectTargetData,  } = useUpdateInstance()
</script>
<style lang="scss" scoped>
.style-description {
  box-sizing: border-box;
  font-size: 12px;
  padding: 8px 16px 26px 16px;
  position: relative;
  .component-name {
    width: 100%;
    display: inline-block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #ffffff;
    font-size: 12px;
  }
  .component-description {
    display: inline;
    color: #666666;
    padding-left: 4px;
    white-space: nowrap;
  }
  .component-back {
    position: absolute;
    top: 0;
    right: 16px;
  }
  .component-operation {
    width: 25px;
    height: 25px;
    line-height: 25px;
    background-color: rgba(55, 58, 71, 0.8);
    border-radius: 5px;
    cursor: pointer;
  }
}
</style>
