import type { ComponentType } from "@screenwright/types";
import { cloneDeep } from "lodash-es";
import type { Ref } from "vue";
import { computed, nextTick, ref, watch } from "vue";

export interface TimerShaftStateOptions {
  element: ComponentType;
  option: Ref<Record<string, any>>;
  dataChart: Ref<any[] | undefined>;
  events: Ref<any[] | undefined>;
  setActive: (idx: number, distance?: number, isAutoPlay?: boolean) => void;
}

export const useTimerShaftState = (options: TimerShaftStateOptions) => {
  const { option, dataChart, setActive } = options;

  // 响应式状态
  const recent = ref(0);
  const stepTimer = ref<ReturnType<typeof setInterval> | null>(null);
  const dataList = ref<any[]>([]);
  const playStatus = ref(false);
  const moveTranslate = ref(0);
  const currentSelect = ref<any>({});
  const CurrentYear = new Date().getFullYear();

  // 计算属性
  const percentSize = computed(() => {
    return 100 / option.value.size;
  });

  // 暂停播放
  const setPause = () => {
    if (stepTimer.value) {
      clearInterval(stepTimer.value);
    }
    playStatus.value = false;
  };

  // 播放设置
  const setPlay = () => {
    if (stepTimer.value) {
      clearInterval(stepTimer.value);
    }

    if (playStatus.value) {
      setActive(0); // 置为默认 0
      stepTimer.value = setInterval(() => {
        setPage("next", true);
      }, option.value.interval * 1000);
    }
  };

  // 设置页码
  const setPage = (type: string, isAutoPlay = false) => {
    const { index } = currentSelect.value;
    let cIndex = index;
    let cMove;
    console.log(type, "typetype");

    switch (type) {
      case "next":
        cIndex = index + 1;
        if (cIndex >= 0 && cIndex < recent.value) {
          cMove = moveTranslate.value + percentSize.value;
        }
        break;
      case "prev":
        cIndex = index - 1;
        if (cIndex >= 0 && cIndex < recent.value) {
          cMove = moveTranslate.value - percentSize.value;
        }
        break;
      default:
        break;
    }

    if (
      cMove !== undefined &&
      cMove >= 0 &&
      cMove < (recent.value - option.value.size + 1) * percentSize.value
    ) {
      setActive(cIndex, cMove, isAutoPlay);
    } else {
      if (cIndex > recent.value - 1 || cIndex < 0) {
        setActive(0);
      } else {
        setActive(cIndex, undefined, isAutoPlay);
      }

      if (!playStatus.value) {
        return;
      }
      if (cIndex === recent.value - 1 && !option.value.loop) {
        setPause();
      }
    }
  };

  // 控制函数
  const onControl = (type: string) => {
    switch (type) {
      case "prev":
        setPage("prev");
        break;
      case "next":
        setPage("next");
        break;
      case "control":
        playStatus.value = !playStatus.value;
        setPlay();
        break;
      default:
        break;
    }
  };

  // 初始化数据
  const initData = () => {
    let yearList = [];
    if (dataChart.value && dataChart.value.length) {
      yearList = cloneDeep(dataChart.value);
    } else {
      for (let i = recent.value - 1; i >= 0; i -= 1) {
        yearList.push({
          label: String(CurrentYear - i),
          value: CurrentYear - i,
        });
      }
    }

    dataList.value = yearList.map((item: any, i: number) => {
      return {
        label: item.label,
        value: item.value,
        index: i,
        active: i === option.value.active - 1,
      };
    });

    currentSelect.value = cloneDeep(
      dataList.value[option.value.active - 1] || {},
    );
  };

  // 初始化
  const init = () => {
    recent.value = cloneDeep(dataChart.value?.length || 0);

    const isActive = option.value.active - 1;
    if (isActive) {
      moveTranslate.value =
        (isActive - (option.value.size - 1)) * percentSize.value;
    }

    if (option.value.autoPlay) {
      playStatus.value = option.value.autoPlay;
      setPlay();
    } else {
      setPause();
    }
  };

  // 监听数据
  watch(
    () => dataChart.value,
    (val) => {
      if (val) {
        if (Array.isArray(val)) {
          nextTick(() => {
            init();
            initData();
          });
        }

        const curInfo = val.find(
          (c: any) => c.value == option.value.defaultActive,
        );
        if (curInfo) {
          // const info = { value: cloneDeep(curInfo) }
          // TODO: 事件发布
          // handleEventAndCallbackEvent(element, info, false, "dataChange")
        }
      } else {
        nextTick(() => {
          init();
          initData();
        });
      }
    },
    { deep: true },
  );

  // 选择事件
  const onSelect = (event: Event, info: any) => {
    event.stopPropagation();
    if (currentSelect.value === info) {
      return;
    }

    currentSelect.value = cloneDeep(info);
    setActive(info.index);
    setPause();
  };

  // 清理
  const cleanup = () => {
    setPause();
  };

  return {
    recent,
    stepTimer,
    dataList,
    playStatus,
    moveTranslate,
    currentSelect,
    percentSize,
    setPause,
    setPlay,
    setPage,
    onControl,
    init,
    initData,
    onSelect,
    cleanup,
  };
};
