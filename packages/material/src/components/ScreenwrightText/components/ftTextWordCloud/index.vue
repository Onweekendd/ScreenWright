<!-- 词云 -->
<template>
  <div :class="classNames" :style="styleSizeName">
    <svg :width="component.width" :height="component.height">
      <a class="flex flex-justify-center" v-for="(tag, index) in tags" :key="`tag-${index}`">
        <text
          :id="tag.id"
          :x="tag.x"
          :y="tag.y"
          :fill="tag.fill"
          :font-size="getFontSize(tag)"
          :fill-opacity="(400 + tag.z) / 600"
          @mousemove="listenerMove"
          @mouseout="listenerOut"
          @click="() => handleClick(tag)"
          :style="textStyle"
          v-html="tag.text"
          :data-translate="tag.text"
        />
      </a>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

import { EventTypeEnum, textEnum, type ComponentType } from "@screenwright/types";

import { useActionEvent, useBaseData } from "@screenwright/composables";

defineOptions({
  name: "ftTextWordCloud"
});
const props = defineProps<{ element: ComponentType }>();

const emit = defineEmits(["click"]);

const { option, dataChart, component, height, width, events, encodes, isBuild, handleEventAndCallbackEvent } =
  useBaseData(props.element);
const { addEvent } = useActionEvent();
// 响应式状态
const tags = ref<any[]>([]);
const speedX = Math.PI / 360 / 1.5;
const speedY = Math.PI / 360 / 1.5;

// 计算属性
const CX = computed(() => width.value / 2);
const CY = computed(() => height.value / 2);
const RADIUS = computed(() => height.value / 2);
const classNames = computed(() => ({
  "ft-textWordCloud": true,
  "world-cloud-3d": true,
  "component-bind-events": true,
  "has-bind": events.value.length && isBuild.value,
  "has-encode": encodes.value.length && isBuild.value
}));
const styleSizeName = computed(() => ({
  width: `${width.value}px`,
  height: `${height.value}px`
}));

const textStyle = computed(() => ({
  fontFamily: option.value.fontFamily,
  cursor: "pointer"
}));

// 方法
const getFontSize = (item: any) => {
  return option.value.textFontSize * ((height.value + item.z) / height.value);
};

const initData = () => {
  const tagArr: any[] = [];
  const data = dataChart.value.slice(0, option.value.maxNumber);
  const tagsNum = data.length;

  for (let i = 0; i < data.length; i++) {
    const randomIndex = Math.floor(Math.random() * option.value.seriesColor.length);
    const k = -1 + (2 * (i + 1) - 1) / tagsNum;
    const a = Math.acos(k);
    const b = a * Math.sqrt(tagsNum * Math.PI);

    const tag = {
      text: data[i].text,
      x: CX.value + RADIUS.value * Math.sin(a) * Math.cos(b),
      y: CY.value + RADIUS.value * Math.sin(a) * Math.sin(b),
      z: RADIUS.value * Math.cos(a),
      fill: option.value.seriesColor[randomIndex],
      id: i
    };
    tagArr.push(tag);
  }
  tags.value = tagArr;
  console.log(tags.value);
};

const rotateX = (angleX: number) => {
  const cos = Math.cos(angleX);
  const sin = Math.sin(angleX);
  tags.value = tags.value.map((tag: { y: number; z: number }) => {
    const y1 = (tag.y - CY.value) * cos - tag.z * sin + CY.value;
    const z1 = tag.z * cos + (tag.y - CY.value) * sin;
    return { ...tag, y: y1, z: z1 };
  });
};

const rotateY = (angleY: number) => {
  const cos = Math.cos(angleY);
  const sin = Math.sin(angleY);
  tags.value = tags.value.map((tag: { x: number; z: number }) => {
    const x1 = (tag.x - CX.value) * cos - tag.z * sin + CX.value;
    const z1 = tag.z * cos + (tag.x - CX.value) * sin;
    return { ...tag, x: x1, z: z1 };
  });
};
const timer = ref();
const runTags = () => {
  if (timer.value) {
    clearInterval(timer.value);
  }
  timer.value = setInterval(() => {
    rotateX(speedX);
    rotateY(speedY);
  }, option.value.speed);
};
const listenerMove = () => {
  clearInterval(timer.value);
};

const listenerOut = () => {
  runTags();
};

const handleClick = (info: any) => {
  emit("click", info);
  handleEventAndCallbackEvent({
    id: props.element.id,
    triggerType: EventTypeEnum.Click,
    events: props.element.events,

    throwValue: info
  });
};

// 监听属性变化
watch(
  [
    () => dataChart.value, // 保持深度监听
    () => ({
      maxNumber: option.value.maxNumber,
      seriesColor: option.value.seriesColor
    }),
    () => [width.value, height.value]
  ],
  () => {
    initData();
    handleEventAndCallbackEvent({
      id: props.element.id,
      triggerType: EventTypeEnum.DataChange,
      events: props.element.events,

      throwValue: dataChart.value
    });
  },
  {
    deep: true // 仅对dataChart.value生效
  }
);
watch(
  () => option.value.speed,
  () => {
    runTags();
  }
);

// 生命周期钩子
onMounted(() => {
  initData();
  runTags();
  handleEventAndCallbackEvent({
    id: props.element.id,
    triggerType: EventTypeEnum.DataChange,
    events: props.element.events,

    throwValue: dataChart.value
  });

  // 注册组件事件到全局事件系统
  addEvent({
    [`${textEnum.FtTextWordCloud}-${props.element.id}`]: {
      handleClick
    }
  });
});

onBeforeUnmount(() => {
  clearInterval(timer.value);
  // tags.value = []
});
</script>
