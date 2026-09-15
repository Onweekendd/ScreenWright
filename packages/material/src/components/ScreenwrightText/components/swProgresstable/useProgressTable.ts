import { useBaseFilter } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";
import { cloneDeep, isArray } from "lodash-es";
import { computed, onMounted, ref, watch } from "vue";

import type { ProgressTableRow } from "../types";

export const useProgressTable = (
  element: ComponentType,
  emit: (event: "row-click" | "data-change", ...args: any[]) => void,
  isBuild: boolean,
) => {
  const { inputData } = useBaseFilter(element);
  // 响应式状态
  const list = ref<ProgressTableRow[]>([]);
  const headerList = ref<any[]>([]);
  const rolling = ref(false);
  const isHoverScroll = ref(false);
  const scrollRef = ref<any>(null);
  const TableBox = ref<HTMLElement | null>(null);
  const timer = ref<NodeJS.Timeout | null>(null);

  // 计算属性
  const tableClasses = computed(() => ({
    "ft-table-box": true,
    "component-bind-events": true,
    "has-bind": element.option.events?.length && isBuild,
    "has-encode": element.option.encodes?.length && isBuild,
  }));

  const isAnimateScroll = computed(
    () => element.option.animationShow && element.option.scroll,
  );
  const onScrollTable = () => {
    // 实现滚动逻辑
    let current = 0;
    const rowheight =
      (element.component.height -
        element.option.headerlineHeight -
        element.option.lineMarginBottom * (element.option.count - 1)) /
        element.option.count +
      element.option.lineMarginBottom;
    return setInterval(
      () => {
        if (scrollRef?.value) {
          current += element.option.scrollStep || 1;

          scrollRef.value.wrapRef.scrollTop =
            current % (list.value.length * rowheight); // 40为行高假设值

          // 解决最后一个切换到第一个抽搐问题
          if (
            Math.floor(
              Math.floor(scrollRef.value.wrapRef.scrollTop) /
                Math.floor(rowheight),
            ) >=
            list.value.length / 2
          ) {
            scrollRef.value.wrapRef.style.scrollBehavior = `auto`;
            scrollRef.value.wrapRef.scrollTo(0, 0);
          }
          if (
            Math.floor(scrollRef.value.wrapRef.scrollTop) <
            scrollRef.value.wrapRef.scrollHeight / 2
          ) {
            scrollRef.value.wrapRef.style.scrollBehavior = `smooth`;
            scrollRef.value.wrapRef.scrollTo(
              0,
              Math.floor(
                Math.floor(scrollRef.value.wrapRef.scrollTop) /
                  Math.floor(rowheight),
              ) *
                Math.floor(rowheight) +
                Math.floor(rowheight),
            );
          } else {
            scrollRef.value.wrapRef.style.scrollBehavior = `auto`;
            setTimeout(() => {
              scrollRef.value.wrapRef.scrollTo(0, 0);
            });
          }
        }
      },
      element.option.scrollTime * 1000 || 2000,
    );
  };
  // 核心方法
  const init = () => {
    clearInterval(timer.value!);
    timer.value = null;

    // 初始化行数据
    list.value = cloneDeep(dataChartList.value).map((item, index) => ({
      ...item,
      _idx: index, // 添加唯一索引
      // 生成行ID逻辑
      id:
        element.option.rowIdType === "index"
          ? index + 1
          : item[element.option.rowIdField] || index,
    }));
    // 初始化表头
    headerList.value = cloneDeep(element.option.column);

    // 处理分页逻辑
    if (element.option.pagination) {
      const pageSize = element.option.pageSize || 10;
      list.value = list.value.slice(0, pageSize);
    }

    // 自动滚动处理
    if (isAnimateScroll.value) {
      scrollUp();
    }
  };

  const clearUp = () => {
    if (timer.value) {
      clearInterval(timer.value);
      timer.value = null;
    }
  };

  const scrollUp = () => {
    clearUp();
    timer.value = onScrollTable();
  };

  const handleRowClick = (params: { index: number; params: any }) => {
    emit("row-click", params);
  };

  const handleHoverScroll = (isHover: boolean) => {
    isHoverScroll.value = isHover;
    if (isHover) {
      clearUp();
    } else {
      scrollUp();
    }
  };

  // 计算数据列表
  const dataChartList = computed(() => {
    return isArray(inputData.value)
      ? cloneDeep([...inputData.value, ...inputData.value]).map((item, i) => ({
          ...item,
          _idx: i,
        }))
      : [];
  });

  // 监听数据变化
  watch([() => inputData.value, () => element.option], init, { deep: true });

  // 生命周期
  onMounted(init);

  return {
    list,
    headerList,
    rolling,
    isHoverScroll,
    scrollRef,
    TableBox,
    tableClasses,
    isAnimateScroll,
    dataChartList,
    init,
    clearUp,
    scrollUp,
    handleRowClick,
    handleHoverScroll,
  };
};
