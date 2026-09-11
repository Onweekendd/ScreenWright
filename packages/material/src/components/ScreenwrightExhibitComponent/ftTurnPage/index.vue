<template>
  <div class="ft-turn-page" style="width: 100%; height: 100%" ref="ftTurnPageRef" @click="handleContainerClick" />
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

import { useActionEvent } from "@screenwright/composables";
import { useBaseData } from "@screenwright/composables";
import { setMinioUrl } from "@screenwright/composables";
import { sleep } from "@screenwright/core";
import { EventTypeEnum } from "@screenwright/types";
import type { ImageItem } from "@editor/exhibitComponent/types";
import { ExhibitEnum } from "@screenwright/types";

import { FtTurnPage } from "./ftTurnPage";
import type { ftTurnPageProps } from "./ftTurnPageProps";
import { FtTurnPageEmits } from "./ftTurnPageProps";

const defaultTime = 500;
const props = defineProps<ftTurnPageProps>();
const { isBuild, handleEventAndCallbackEvent } = useBaseData(props.element);
const { addEvent } = useActionEvent();
const ftTurnPageRef = ref<HTMLElement | null>(null);
const isInitLoad = ref(false);
let timer: NodeJS.Timer | null = null;
let ftTurnPage: FtTurnPage | null = null;
const emits = defineEmits(FtTurnPageEmits);
type TurnPageImageItem = {
  img?: string;
  text?: string;
  name?: string;
};
const imageList = computed(() => {
  const transformImageList = props.element.option.imageList.map((v: TurnPageImageItem) => {
    const imgSrc = setMinioUrl(v.img || "");
    const json = {
      src: imgSrc,
      title: v.text,
      id: v.img,
      url: imgSrc,
      name: v.name
    };
    return json;
  }) as ImageItem[];
  return transformImageList.map((v) => v.src).filter((src) => src && src.length > 0);
});
const imageListLength = computed(() => {
  return imageList.value.length;
});
watch(imageList, (newList) => {
  if (ftTurnPage) {
    ftTurnPage.updateFromImages(newList);
  }
});
watch(
  () => props.element.option.defaultPage,
  () => {
    if (ftTurnPage) {
      turnPage();
    }
  }
);

const handleInit = async () => {
  emits("init", props.element);
  if (isBuild.value) {
    return;
  }
  if (ftTurnPage && props.element.option.autoPlay) {
    await sleep(defaultTime);
    ftTurnPage.flipNext();
  }
  addEvent({
    [`${ExhibitEnum.FtTurnPage}-${props.element.id}`]: {
      handlePrevClick: () => {
        if (ftTurnPage) {
          ftTurnPage.flipPrev();
        }
      },
      handleNextClick: () => {
        if (ftTurnPage) {
          ftTurnPage.flipNext();
        }
      }
    }
  });
  handleEventAndCallbackEvent({
    id: props.element.id,
    triggerType: EventTypeEnum.DataChange,
    events: props.element.events,

    throwValue: props.element
  });
  // 标记初始加载完成
  isInitLoad.value = true;
};
const startInterval = () => {
  if (timer) {
    clearInterval(timer);
  }
  timer = setInterval(() => {
    if (ftTurnPage) {
      const pageCollection = ftTurnPage.getPageCollection();
      if (pageCollection) {
        const currentSpreadIndex = pageCollection.getCurrentSpreadIndex();
        const landscapeSpread = Math.ceil(imageListLength.value / 2);
        if (currentSpreadIndex + 1 >= landscapeSpread) {
          if (timer) {
            clearInterval(timer);
          }
        }
      }
      const state = ftTurnPage.getState();
      if (state !== "flipping") {
        ftTurnPage.flipNext();
      }
    }
  }, props.element.option.duration + defaultTime);
};
const handleChangeState = () => {
  if (isBuild.value) {
    return;
  }
  if (ftTurnPage && props.element.option.autoPlay) {
    const state = ftTurnPage.getState();
    if (state === "read") {
      startInterval();
    }
  }
};

const turnPage = (targetPage?: number) => {
  if (!ftTurnPage) {
    return;
  }
  const defaultPage = targetPage || props.element.option.defaultPage;
  if ((defaultPage - 1) * 2 <= imageListLength.value) {
    const convertedPage = (defaultPage - 1) * 2 + 1; // 取奇数页作为起始点
    if (convertedPage > imageListLength.value) {
      ftTurnPage.turnToPage(1);
    } else {
      ftTurnPage.turnToPage(convertedPage);
    }
  } else {
    ftTurnPage.turnToPage(1);
  }
};

const handleOnflip = (e: unknown) => {
  if (isBuild.value || !isInitLoad.value) {
    return;
  }
  // data: 0 =>> 1, 2 =>> 2, 4 =>> 3, 6 =>> 4, ... n =>> (n/2 + 1)
  const { data } = e as { data: number };
  console.log(data, "data");
  const currentPage = data / 2 + 1;
  const isFinal = currentPage === Math.ceil(imageListLength.value / 2);
  console.log("event flip Page:", currentPage);
  // handleEventAndCallbackEvent({
  //   throwValue: {
  //     value: currentPage,
  //     page: currentPage,
  //     isFinal
  //   },
  //   events: props.element.events,
  //   triggerType: EventTypeEnum.Click,
  //   id: props.element.id
  // });
  // 翻书到最后一页时
  if (isFinal) {
    handleEventAndCallbackEvent({
      throwValue: {
        value: currentPage,
        page: currentPage,
        isFinal
      },
      events: props.element.events,
      triggerType: EventTypeEnum.flipTheBookFinalPage,
      id: props.element.id
    });
  }
};

const getCurrentPage = () => {
  if (!ftTurnPage) {
    return 1;
  }
  const pageCollection = ftTurnPage.getPageCollection();
  if (!pageCollection) {
    return 1;
  }
  // spread index 从 0 开始，对业务侧页码按 1 开始返回
  return pageCollection.getCurrentSpreadIndex() + 1;
};

const handleContainerClick = (event: MouseEvent) => {
  if (isBuild.value || !isInitLoad.value || !ftTurnPage) {
    return;
  }
  const container = ftTurnPageRef.value;
  if (!container) {
    return;
  }
  const currentPage = getCurrentPage();
  const totalPage = Math.ceil(imageListLength.value / 2);
  const rect = container.getBoundingClientRect();
  const isRightSide = event.clientX >= rect.left + rect.width / 2;
  const targetPage = isRightSide ? Math.min(currentPage + 1, totalPage) : Math.max(currentPage - 1, 1);
  const state = ftTurnPage.getState();
  if (state !== "flipping") {
    if (isRightSide) {
      ftTurnPage.flipNext();
    } else {
      ftTurnPage.flipPrev();
    }
  }
  const isFinal = targetPage === totalPage;
  console.log("click target Page:", targetPage);
  handleEventAndCallbackEvent({
    id: props.element.id,
    triggerType: EventTypeEnum.Click,
    events: props.element.events,
    throwValue: {
      value: targetPage,
      page: targetPage,
      isFinal
    }
  });
};

const init = () => {
  if (!ftTurnPageRef.value) return;
  ftTurnPage = new FtTurnPage(ftTurnPageRef.value as HTMLElement, {
    size: "fixed",
    width: props.element.component.width / 2,
    height: props.element.component.height,
    autoSize: false,
    disableFlipByClick: true,
    flippingTime: props.element.option.duration,
    minHeight: 1,
    minWidth: 1,
    onInit: handleInit,
    onUpdate: FtTurnPageEmits.update,
    onFlip: handleOnflip, //FtTurnPageEmits.flip,
    onChangeOrientation: FtTurnPageEmits.changeOrientation,
    onChangeState: handleChangeState
  });

  ftTurnPage.loadFromImages(imageList.value);
  turnPage();
};

onMounted(() => {
  init();
});
onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer);
  }
});
</script>
<style lang="scss">
#canvasBook {
  height: 100%;
}
</style>
