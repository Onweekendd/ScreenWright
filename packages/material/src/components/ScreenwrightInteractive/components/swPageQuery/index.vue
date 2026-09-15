<!-- 分页 -->
<template>
  <div
    :class="{
      'ft-pageQuery': true,
      ...componentClasses
    }"
    :style="styleSizeName"
  >
    <!-- 总条数 -->
    <span class="my-page-total" v-if="showTotal">共{{ total }}条</span>
    <ul class="page-list">
      <!-- 上一页 -->
      <SwPageItem
        content="ArrowLeft"
        :style="bottonStyle"
        :isDisabled="currentPage <= 1"
        @click="handleBeforOrAfterClick('before')"
      >
        <Icon type="ArrowLeft" />
      </SwPageItem>

      <!-- 中间页码数据 -->
      <template v-for="(pageItem, index) in pageList" :key="index">
        <!-- 向前5页或向后5页 -->
        <SwPageItem v-if="pageItem == 'prev' || pageItem == 'next'" :content="pageItem" :style="bottonStyle" isSpecial>
          <Icon type="MoreFilled" />
        </SwPageItem>

        <!-- 正常页码 -->
        <SwPageItem
          v-else
          :content="pageItem"
          :isActive="currentPage == pageItem"
          :style="bottonStyle"
          :activeStyle="checkedStyle"
          :hoverStyle="hoverStyle"
          :isHovering="moveCurrent === pageItem"
          @click="handlePageItemClick"
          @mousemove="handleMove"
          @mouseleave="handleLeave"
        />
      </template>

      <!-- 下一页 -->
      <SwPageItem
        content="ArrowRight"
        :style="bottonStyle"
        :isDisabled="currentPage >= totalPage && totalPage > 0"
        @click="handleBeforOrAfterClick('after')"
      >
        <Icon type="ArrowRight" />
      </SwPageItem>
    </ul>

    <!-- 跳到目标页 -->
    <SwPageJumper
      v-if="showJumper"
      :currentPage="currentPage"
      :totalPage="totalPage"
      :style="pageJumperStyle"
      :inputStyle="pageJumperInputStyle"
      @change="handleJumperCurrentChange"
    />
  </div>
</template>

<script setup lang="ts">
import Icon from "@editor/base/Icon/index.vue";
import type { ComponentType } from "@screenwright/types";

import SwPageItem from "./components/SwPageItem.vue";
import SwPageJumper from "./components/SwPageJumper.vue";
import { usePagination } from "./hooks/usePagination";

defineOptions({
  name: "ftPageQuery"
});

// 定义props
const props = defineProps<{
  element: ComponentType;
}>();

// 使用自定义分页hooks
const {
  currentPage,
  total,
  totalPage,
  pageList,
  styleSizeName,
  bottonStyle,
  hoverStyle,
  checkedStyle,
  pageJumperStyle,
  pageJumperInputStyle,
  showJumper,
  moveCurrent,
  showTotal,
  componentClasses,
  handlePageItemClick,
  handleBeforOrAfterClick,
  handleMove,
  handleLeave,
  handleJumperCurrentChange
} = usePagination(props);
</script>

<style lang="scss" scoped>
.ft-pageQuery {
  display: flex;
  align-items: center;
  .page-list {
    .page-list-item {
      display: inline-block;
      vertical-align: middle;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
      min-width: 32px;
      height: 32px;
      line-height: 30px;
      list-style: none;
      text-align: center;
      cursor: pointer;
      color: #666;
      font-family: Arial;
      border: 1px solid #dcdee2;
      border-radius: 4px;
      transition: all 0.2s ease-in-out;
      margin-right: 6px;
      margin-left: 6px;
      &:hover {
        border-color: #2d8cf0;
        color: #2d8cf0;
      }
      &.disbled {
        opacity: 0.5;
      }
    }
    .page-list-item-prev,
    .page-list-item-next {
      border: none !important;
      background-image: none !important;
      background-color: transparent !important;
    }
    .active.page-list-item {
      border-color: #2d8cf0;
      color: #fff;
      background-color: #2d8cf0;
    }
    .disbled.page-list-item {
      cursor: not-allowed;
      background-color: #fff;
      color: #dcdee2;
    }
    .disbled:hover {
      border-color: #dcdee2;
    }
  }
  .page-jumper {
    display: flex;
    align-items: center;
    padding: 0 2px;
    margin: 0 2px;
    position: relative;
    input {
      display: inline-block;
      height: 100%;
      width: 50px;
      border-radius: 4px;
      background: none !important;
      text-align: center;
      &:focus,
      &:focus-within,
      &:focus-visible,
      &:target,
      &:hover,
      &:active,
      &:visited {
        outline: none;
      }
    }
  }
}
</style>
