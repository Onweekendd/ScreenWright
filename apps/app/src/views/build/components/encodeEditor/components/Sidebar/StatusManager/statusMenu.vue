<template>
  <transition name="el-zoom-in-top">
    <div ref="buildMenuRef" id="status-context-menu" class="build-menu" :style="buildStyle" v-show="statusMenuShow">
      <div
        v-for="item in menuOptions"
        :key="item.key"
        class="build-menu-item flex flex-center"
        :class="{ 'is-disabled': item.disabled }"
        @click="handleClick(item)"
      >
        <Icon :type="item.icon" size="12" :color="item.disabled ? '#a8abb2' : '#ddd'" />
        <span class="menu-item-text">
          {{ item.label }}
        </span>
      </div>
    </div>
  </transition>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import { onClickOutside } from "@vueuse/core";

import Icon from "@/components/Icon/index.vue";

import type { StatusMenuOptionsItemType } from "./useStatueMenuOption";
import { useStatusMenuAction } from "./useStatusMenuAction";

const { mousePosition, menuOptions, statusMenuShow, setStatusMenuShow } = useStatusMenuAction();
const buildMenuRef = ref();
onClickOutside(buildMenuRef, () => {
  setStatusMenuShow(false);
});

const handleClick = (item: StatusMenuOptionsItemType) => {
  if (item.disabled) return;
  item.fnHandle && item.fnHandle();
  setStatusMenuShow(false);
};

const buildStyle = computed(() => {
  return {
    left: mousePosition.value.x + "px",
    top: mousePosition.value.y + "px"
  };
});
</script>
<style lang="scss" scoped>
.build-menu {
  width: 100px;
  position: fixed;
  z-index: 99999;
  list-style: none;

  -webkit-box-shadow: 0 2px 6px rgb(0 0 0 / 10%);
  box-shadow: 0 2px 6px rgb(0 0 0 / 10%);
  padding: 0;
  background: #232630;
  color: #b4b7c1;
  .build-menu-item {
    z-index: 10000;
    list-style: none;
    padding: 8px 12px;
    cursor: pointer;
    position: relative;
    font-size: 12px;
    text-align: center;
    color: #ddd;
    &:hover {
      background-image: linear-gradient(180deg, #8b58e7 0%, #642cff 100%);
      color: #fff;
    }
    &.is-disabled {
      cursor: not-allowed;
      .menu-item-text {
        color: #a8abb2;
      }
    }
  }
  .menu-item-text {
    margin-left: 5px;
  }
}
</style>
