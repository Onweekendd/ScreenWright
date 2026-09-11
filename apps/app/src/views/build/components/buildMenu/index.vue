<template>
  <transition name="el-zoom-in-top">
    <div ref="buildMenuRef" id="edit-contextMenu" class="build-menu" :style="buildStyle" v-show="isRightMenuShow">
      <div
        v-for="item in menuOptions"
        :key="item.key"
        class="build-menu-item flex"
        :class="{ 'is-disabled': getDisabledByType(item.key) }"
        @click="handleClick(item, getDisabledByType(item.key))"
      >
        <Icon :type="item.icon" size="12" :color="item.disabled ? '#a8abb2' : '#ddd'" />
        <div class="menu-item-text">{{ item.label }}</div>
      </div>
    </div>
  </transition>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import { onClickOutside } from "@vueuse/core";

import Icon from "@/components/Icon/index.vue";

import { useActionDisabled } from "../buildRender/hooks/useActionDisabled";
import { useMenuAction } from "../buildRender/hooks/useMenuAction";
import type { MenuOptionsItemType } from "../buildRender/type";

const { isRightMenuShow, setRightMenuShow, mousePosition, menuOptions } = useMenuAction();
const { getDisabledByType } = useActionDisabled();
const buildMenuRef = ref();
onClickOutside(buildMenuRef, () => {
  setRightMenuShow(false);
});

const handleClick = (item: MenuOptionsItemType, disabled: boolean) => {
  if (disabled || !item.fnHandle) return;
  item.fnHandle();
  setRightMenuShow(false);
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
    text-align: left;
  }
}
</style>
