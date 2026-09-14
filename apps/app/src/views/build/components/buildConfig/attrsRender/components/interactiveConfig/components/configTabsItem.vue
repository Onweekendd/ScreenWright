<template>
  <div class="config-tabs-item">
    <div class="tabs-control" :class="{ 'is-bg': isSecond }">
      <Icon type="ArrowLeft" class="fl" @click="handleSlide('prev')" />
      <Icon type="ArrowRight" class="fr" @click="handleSlide('next')" />
    </div>
    <div class="tabs-content" ref="contentRef">
      <ul class="tabs-list" ref="ulBox" :style="{ transform: `translateX(-${translateX}px)` }">
        <VueDraggable
          ref="dragRef"
          v-model="dragItems"
          @sort.stop="releaseComponent"
          :move="updateElement"
          :disabled="!draggable"
          :animation="300"
          @end="onEndElement"
          item-key="id"
          handle=".list-item"
          ghost-class="ghost-item"
          chosen-class="chosen-item"
        >
          <template #item="{ element, index }">
            <li
              :class="{ 'list-item': true, 'is-active': currentTab == element.id }"
              @click="handleTabs($event, element)"
              @mousedown="handleMouseDown"
              @mouseup="handleMouseUp"
              :id="element.id"
              :label="element.name"
              :title="`${element.name}`"
            >
              <span>{{ element.name }} {{ index + 1 }}</span>
            </li>
          </template>
        </VueDraggable>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import VueDraggable from "vuedraggable";

import { cloneDeep } from "lodash-es";

import Icon from "@/components/Icon/index.vue";

// import { DragSort } from '@/page/build/utils/dragsort.js';

interface TabItem {
  id: string;
  name: string;
  [key: string]: any;
}

defineOptions({
  name: "configTabsItem"
});

const props = defineProps({
  eventList: {
    type: Array as () => TabItem[],
    required: false,
    default: () => []
  },
  currentTab: {
    type: String,
    required: false,
    default: ""
  },
  isSecond: {
    type: Boolean,
    required: false,
    default: false
  },
  candraggable: {
    type: Boolean,
    default: true
  },
  boundaryLeft: {
    type: Number,
    default: 290
  },
  boundaryRight: {
    type: Number,
    default: 40
  }
});

const emit = defineEmits(["tabs-change", "list-change"]);

const translateX = ref(0);
const _targetId = ref<string | null>(null);
const sourceId = ref<string | null>(null);
const isMove = ref<boolean | NodeJS.Timeout | null>(false);
const _count = ref(0);
const dragSort = ref<any>(null);
const liWidth = ref(60);
const contentRef = ref<HTMLElement | null>(null);
const ulBox = ref<HTMLElement | null>(null);
const dragRef = ref<any>(null);

// 为VueDraggable创建v-model绑定
const dragItems = computed({
  get: () => props.eventList,
  set: (val) => {
    emit("list-change", val);
  }
});

// 计算 draggable prop
const draggable = computed(() => {
  return props.candraggable;
});

watch(
  () => props.eventList,
  (v) => {
    if (dragSort.value) {
      dragSort.value.config.data = v;
    }
  },
  { deep: true, immediate: true }
);

watch(
  () => props.eventList.length,
  (newVal) => {
    if (newVal < 5) {
      translateX.value = 0;
    } else {
      nextTick(() => {
        const currentIndex = props.eventList.findIndex((it) => it.id === props.currentTab);
        translateX.value = liWidth.value * 4 * Math.floor(currentIndex / 4);
      });
    }
  }
);

onBeforeUnmount(() => {
  if (dragSort.value) dragSort.value.destroy();
});

onMounted(() => {
  // 确保拖拽功能正确初始化
  nextTick(() => {
    // 这里可以初始化任何需要的拖拽相关配置
    if (dragRef.value) {
      console.log("拖拽组件初始化完成");
    }
  });
});

function handleTabs(event: Event, tab: TabItem) {
  if (!tab?.id) return;
  emit("tabs-change", tab.id);
}

function handleSlide(type: string) {
  if (!ulBox.value || !contentRef.value) return;

  const total = ulBox.value.querySelectorAll(".list-item").length;
  const containerWidth = liWidth.value * 4;
  const maxMove = Math.ceil(total / 4) * containerWidth - contentRef.value.clientWidth;

  const x = translateX.value;
  if (type === "prev" && x === 0) return;
  if (type === "next" && (x >= maxMove || total === 4)) return;
  if (type === "prev") {
    translateX.value -= containerWidth;
  } else {
    translateX.value += containerWidth;
  }
}

function onEndElement(e: any) {
  if (isMove.value) return;
  dragAndSlide(e.originalEvent.x, e.originalEvent.x + e.originalEvent.target.clientWidth);
  isMove.value = false;
}

function dragAndSlide(left: number, right: number) {
  // 拖拽调整顺序时翻页
  if (!isMove.value) {
    let tag: string | false = false;
    if (right >= window.innerWidth - props.boundaryRight) {
      tag = "next";
    } else if (left <= window.innerWidth - props.boundaryLeft) {
      tag = "prev";
    }
    if (tag) {
      isMove.value = setTimeout(() => {
        isMove.value = null;
        handleSlide(tag as string);
      }, 500);
    }
  }
}

function updateElement(e: any) {
  dragAndSlide(e.relatedRect.left, e.relatedRect.right);
}

function releaseComponent(event: any) {
  const { to } = event;
  let index = null;

  if (sourceId.value) {
    // 使用dataset或ID来识别元素
    to.querySelectorAll(".list-item").forEach((a: HTMLElement, i: number) => {
      if (a.id === sourceId.value) index = i;
    });

    // 如果找不到对应元素，使用event中的索引
    if (index === null && event.newIndex !== undefined) {
      index = event.newIndex;
    }

    updateEventList(index);
  }
}

function handleMouseDown(e: MouseEvent) {
  // 鼠标按下时保存源ID
  sourceId.value = (e.currentTarget as HTMLElement).id;
}

function handleMouseUp() {}

function updateEventList(index: number | null) {
  if (!sourceId.value || index === null) return;
  const dataList = cloneDeep(props.eventList);
  const sourceIndex = dataList.findIndex((a) => a.id === sourceId.value);
  const sourceItem = dataList[sourceIndex];
  dataList.splice(sourceIndex, 1); // 先去除
  dataList.splice(index, 0, sourceItem); // 再添加
  emit("list-change", dataList);
  sourceId.value = null;
}
</script>

<style lang="scss">
@import "src/style/mixins/element.scss";

.config-tabs-item {
  width: 100%;
  font-size: 12px;
  margin-bottom: 10px;
  height: 30px;
  line-height: 30px;
  padding: 0 20px 0 20px;
  position: relative;
  .tabs-control {
    width: 100%;
    position: absolute;
    top: 0px;
    height: 30px;
    left: 0;
    &.is-bg {
      background-color: rgba(45, 47, 56, 0.8);
    }
    .fl {
      position: absolute;
      top: 5px;
      left: 0;
      cursor: pointer;
      color: #fff;
    }
    .fr {
      position: absolute;
      top: 5px;
      right: 0;
      cursor: pointer;
      color: #fff;
    }
  }
  .tabs-content {
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
    &::before {
      content: "";
      width: 100%;
      height: 2px;
      background-color: #383b47;
      position: absolute;
      bottom: 0;
      left: 0;
    }
  }
  .tabs-list {
    float: left;
    list-style: none;
    white-space: nowrap;
    position: relative;
    transition: transform 0.3s;
    margin: 0;
    padding: 0;
    line-height: 30px;
    .list-item {
      display: inline-block;
      text-align: center;
      width: 60px;
      cursor: pointer;
      position: relative;
      color: #b4b7c1;
      &.is-active {
        color: var(--sw-theme-color);
      }
      &.is-active::after {
        content: "";
        width: 100%;
        height: 2px;
        background-color: var(--sw-theme-color);
        position: absolute;
        bottom: 0;
        left: 0;
        z-index: 2;
      }
      & > span {
        pointer-events: none;
        user-select: none;
      }
    }
    .ghost-item {
      opacity: 0.5;
      background: #c8ebfb;
    }
    .chosen-item {
      cursor: move;
    }
  }
}
</style>
