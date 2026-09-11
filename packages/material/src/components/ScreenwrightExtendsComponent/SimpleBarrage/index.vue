<template>
  <div
    :class="{
      'simple-barrage': true,
      'component-bind-events': true,
      'has-bind': element.events?.length,
      'has-encode': element.encodes?.length
    }"
    :style="element.styleSizeName"
    ref="barrage"
  >
    <!-- 签名图片组件 -->
    <barrage-signature-image
      :id="element.id"
      :show-image="showSignatureImage"
      :image-url="signatureImageUrl"
      :zoom-out-target-height="insertImageHeight"
      :image-width="option.imageWidth"
      :image-height="option.imageHeight"
      :scale-ratio="option.scale"
      @signature-animation-complete="onSignatureAnimationComplete"
    />

    <!-- 弹幕容器 - 使用ref传递实例便于调用方法 -->
    <barrage-container
      v-if="!isLoading"
      :key="barrageKey"
      :id="element.id"
      :option="option"
      :width="element.component.width"
      :height="element.component.height"
      :barrage-data="barrageData"
      :signature-data="signatureData"
      :pre-add-data="preAddData"
      :editable="editable"
      :screen-scale="screenScale"
      @on-round-complete="onRoundComplete"
    />
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

// 导入工具函数和API
import { cloneDeep } from "lodash-es";

import { useActionEvent } from "@screenwright/composables";
import { useBaseData } from "@screenwright/composables";
import { setMinioUrl } from "@screenwright/composables";
import type { ExhibitEnumType } from "@screenwright/types";
import { ExtendsEnum } from "@screenwright/types";
import type { ComponentType } from "@screenwright/types";

import { simpleBarrageList } from "./api";
import BarrageContainer from "./components/BarrageContainer.vue";
// 导入子组件
import BarrageSignatureImage from "./components/BarrageSignatureImage.vue";
import type { DataItem, Option } from "./type";

const { addEvent } = useActionEvent();

const props = defineProps<{
  element: ComponentType<ExhibitEnumType, Option>;
}>();
// 获取 props.element
const { dataChart, option, initData } = useBaseData<ExhibitEnumType, Option, DataItem[] | DataItem>(props.element);

// 响应式数据
const barrageData = ref<DataItem[]>([]);
const signatureData = ref<DataItem[]>([]);
const preAddData = ref<DataItem[]>([]);
const editable = ref<boolean>(false);
const signatureImageUrl = ref<string>("");
const showSignatureImage = ref<boolean>(false);
const clearImageTimer = ref<NodeJS.Timeout | null>(null);
const insertImageHeight = ref<number>(0);
const screenScale = ref<number>(1);
const isLoading = ref<boolean>(false);
const barrageKey = ref<number>(0);

// refs
const barrage = ref<HTMLDivElement>();

// 监听器
watch(
  () => dataChart.value,
  (newValue) => {
    if (newValue) {
      // 转换数据为数组格式
      const newData = Array.isArray(newValue) ? newValue : [newValue];

      // 更新数据
      barrageData.value = cloneDeep(newData);
    } else {
      // 只清空数据
      barrageData.value = [];
    }
  }
);

// 方法
const setScreenScale = () => {
  screenScale.value = getScaleValueFromContent(".view-wrapper") ?? 1;
};

const handleClick = async () => {
  await initData();
  barrageKey.value++;
};

const onSignaturePadSave = ({ imageUrl }: { imageUrl: string }) => {
  signatureImageUrl.value = setMinioUrl(imageUrl);
};

const onSignatureAnimationComplete = ({ imageUrl }: { imageUrl: string }) => {
  if (!imageUrl) return;

  preAddData.value.push({
    type: "image",
    text: setMinioUrl(imageUrl)
  });
};

const onRoundComplete = () => {
  preAddData.value.forEach((item) => {
    barrageData.value.push(item);
  });
  preAddData.value = [];
};

const getScaleValueFromContent = (selector: string): number | null => {
  const content = document.querySelector(selector) as HTMLElement;
  if (content) {
    const transformValue = content.style.transform;
    const scaleMatch = transformValue.match(/scale\(([^)]+)\)/);
    return scaleMatch ? parseFloat(scaleMatch[1]) : null;
  }
  return null;
};
const initSystemInterface = async () => {
  const res = await simpleBarrageList({
    size: 100,
    layerScrollId: props.element.id
  });
  console.log(res, "resresres");

  const {
    result: { records }
  } = res;

  signatureData.value = records.map((item) => ({
    text: setMinioUrl(item.signUrl),
    type: "image" as const
  }));
};
// 初始化数据加载
const initializeData = async () => {
  isLoading.value = true;
  try {
    if (option.value.importType === "systemInterface") {
      await initSystemInterface();
    }

    if (option.value.importType === "customInterface") {
      const { apiUrl, method, headers, body } = option.value.importConfig;
      console.log(apiUrl, "apiUrlapiUrlapiUrl");
      if (!apiUrl) {
        await initSystemInterface();
        isLoading.value = false;
        return;
      }
      try {
        // 处理headers：转换为纯键值对对象，避免包含非字符串属性
        const requestHeaders: Record<string, string> = {
          "Content-Type": "application/json", // 默认headers
          ...(headers ? Object.fromEntries(Object.entries(headers).filter(([value]) => typeof value === "string")) : {})
        };

        // 发起fetch请求
        const response = await fetch(apiUrl, {
          method: method?.toUpperCase() || "GET", // 确保方法是大写
          headers: requestHeaders,
          body: method && !["GET", "HEAD"].includes(method.toUpperCase()) ? JSON.stringify(body) : undefined
        });

        if (!response.ok) {
          throw new Error(`请求失败: ${response.status} ${response.statusText}`);
        }

        const res: { result: { records: Array<{ signUrl: string }> } } = await response.json();
        const {
          result: { records }
        } = res;

        signatureData.value = records.map((item) => ({
          text: setMinioUrl(item.signUrl),
          type: "image" as const
        }));
      } catch (error) {
        console.error("接口请求失败:", error);
      }
    }
  } finally {
    isLoading.value = false;
  }
};
watch(
  () => [option.value.importConfig, option.value.importType],
  () => {
    initializeData();
  },
  {
    deep: true
  }
);

// 生命周期
onMounted(async () => {
  await nextTick();
  setScreenScale();

  window.addEventListener("resize", setScreenScale);

  // 初始化数据
  initializeData();

  addEvent({
    [`${ExtendsEnum.SimpleBarrage}-${props.element.id}`]: {
      onSignaturePadSave,
      handleClick
    }
  });
});

onBeforeUnmount(() => {
  // 清除定时器
  if (clearImageTimer.value) {
    clearTimeout(clearImageTimer.value);
    clearImageTimer.value = null;
  }

  window.removeEventListener("resize", setScreenScale);
});
</script>

<style lang="scss" scoped>
.simple-barrage {
  color: #ffffff;
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
}
</style>
