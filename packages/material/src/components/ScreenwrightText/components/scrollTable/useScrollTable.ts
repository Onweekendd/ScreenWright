import { setMinioUrl } from "@material/minioUrl";
import { lineargradientHandle } from "@screenwright/core";
import type { ComponentType } from "@screenwright/types";
import { cloneDeep, isArray } from "lodash-es";
import type { Ref } from "vue";
import { computed, nextTick, ref, watch } from "vue";

export function useScrollTable(
  element: ComponentType,
  dataChart: Ref<any[]>,
  option: Ref<any>,
  scrollContainerRef: Ref<any>,
) {
  const listData = ref<any[]>([]);
  const activeList = ref<number[]>([]);
  const active = ref<number>(-1);
  const listLabel = ref<any[]>([]);

  const isAnimateScroll = computed(
    () => option.value.animationShow && option.value.scroll,
  );

  const currentList = computed(() => {
    const curData = cloneDeep(listData.value);
    return (
      isScrollComputed.value ? listData.value.concat(curData) : listData.value
    ).map((it, i) => ({
      ...it,
      _idx: i,
    }));
  });

  const isScrollComputed = computed(() => {
    const totalHeight =
      element.component.height - option.value.headerlineHeight;
    const itemHeight =
      (totalHeight / option.value.count) * listData.value.length;
    return isAnimateScroll.value && totalHeight <= itemHeight;
  });

  const scrollYBarStyle = computed(() => ({
    trackWidth: option.value.globalScrollYTrackWidth + "px",
    trackBackground: option.value.globalScrollYTrackBackground,
    trackBorderRadius:
      (Number(option.value?.globalScrollYTrackBorderRadius || 0) *
        Number(option.value?.globalScrollYTrackWidth || 0)) /
        100 /
        2 +
      "px",
    thumbWidth: option.value.globalScrollYThumbWidth + "px",
    thumbBackground: option.value.globalScrollYThumbBackground,
    thumbBorderRadius:
      (Number(option.value?.globalScrollYThumbBorderRadius || 0) *
        Number(option.value?.globalScrollYThumbWidth || 0)) /
        100 /
        2 +
      "px",
  }));

  // unit 加个默认值 ‘’
  const getKeyValueIndex = (
    index: number,
    value: any,
    name: string,
    unit = "",
  ) => {
    let result = -1;
    if (option.value.styleAssignKeyValue[index]?.length > 0) {
      result = option.value.styleAssignKeyValue[index].indexOf(value);
    }
    return result > -1
      ? option.value[`styleAssign${name}`]?.[index]
        ? option.value[`styleAssign${name}`][index][result] + unit
        : ""
      : option.value[`seriesY${name}`]
        ? option.value[`seriesY${name}`][index] + unit
        : "";
  };

  const getSpanIndex = (index: number) => {
    // 实现useSpanIndex逻辑
    return option.value.rowShow ? index - 1 : index;
  };

  const initRowList = () => {
    clearRowList();
    if (option.value.rowShow) {
      let index = option.value.initialValue;
      const list = cloneDeep(listData.value);

      listLabel.value.unshift({
        name: option.value.rowTitle,
        alias: "rowId",
        flex: 1,
      });
      listData.value = list.map((item) => ({
        rowId: index++,
        ...item,
      }));
      nextTick(() => {
        setDefaultActive();
        initRowIdStyle();
      });
    } else {
      nextTick(() => {
        setDefaultActive();
      });
    }
  };

  watch(
    () => option.value.activeKeys,
    async () => {
      await nextTick();
      setDefaultActive();
    },
  );
  const setStyle = (dom: HTMLElement) => {
    if (!dom) {
      return;
    }
    dom.classList.add("active");
    const childNodes = [...Array.from(dom.childNodes)];
    childNodes.forEach((span) => {
      if (span instanceof HTMLElement) {
        span.style.fontWeight = option.value.selectedFontWeight;
        span.style.fontStyle = option.value.selectedFontStyle;
        span.style.color = option.value.selectedColor;
        span.style.fontFamily = option.value.selectedFontFamily;
        span.style.fontSize = `${option.value.selectedFontSize}px`;
        span.style.letterSpacing = `${option.value.selectedletterSpacing}px`;
      }
    });
    dom.style.textShadow = option.value.shadowShow
      ? `${option.value.shadowColor} ${option.value.shadowX}px ${option.value.shadowY}px ${option.value.shadowFuzzy}px`
      : "";
    dom.style.background =
      option.value.selectedBgType === "color"
        ? `${lineargradientHandle(option.value.selectedBgColor)}`
        : `url(${setMinioUrl(option.value.selectedBgImage)})`;
    dom.style.backgroundRepeat = "no-repeat";
    dom.style.backgroundPosition = "center";
    dom.style.backgroundSize = "100% 100%";
  };
  const setDefaultActive = () => {
    if (!option.value.activeKeys) {
      return;
    }
    const selectIndexs = `${option.value.activeKeys}`
      .split(",")
      .map((it: string) => parseInt(it) - 1);
    const parentDom = document.getElementById(`parts-table-${element.id}`);
    if (!parentDom) {
      return;
    }
    selectIndexs.forEach((index: number) => {
      const dom = parentDom.getElementsByClassName(`scroll-table-row-${index}`);
      if (dom && dom.length > 0) {
        setStyle(dom[0] as HTMLElement);
      }
    });
  };

  const clearRowList = () => {
    listLabel.value = cloneDeep(option.value.column);
    listData.value = isArray(dataChart.value) ? cloneDeep(dataChart.value) : [];
  };

  const initRowIdStyle = () => {
    const domList = document.getElementsByClassName(
      `serial-item ${element.id}`,
    );
    Array.from(domList).forEach((dom: any) => {
      dom.style.width = `${option.value.rowWidth}px`;
      dom.style.marginLeft = `${option.value.rowSpace}px`;
      dom.style.textAlign = option.value.rowAlign;
      if (
        option.value.rowName.length > 0 &&
        option.value.rowKey.indexOf(dom.innerText) > -1
      ) {
        const index = option.value.rowKey.indexOf(dom.innerText);
        dom.style.fontFamily = option.value.rowFontFamily[index];
        dom.style.fontStyle = option.value.rowFontStyle[index];
        dom.style.fontWeight = option.value.rowFontWeight[index];
        dom.style.color = option.value.rowColor[index];
        dom.style.fontSize = `${option.value.rowFontSize[index]}px`;
        dom.style.lineHeight = `${option.value.rowlineHeight[index]}px`;
        dom.style.letterSpacing = `${option.value.rowletterSpacing[index]}px`;
        dom.style.transform = `translate3d(${option.value.rowOffsetX[index]}px,${option.value.rowOffsetY[index]}px,0px)`;
        dom.style.background =
          option.value.rowBgType[index] === "color"
            ? `${lineargradientHandle(option.value.rowBgColor[index])}`
            : `url(${setMinioUrl(option.value.rowBgImage[index])})`;
        dom.style.backgroundRepeat = "no-repeat";
        dom.style.backgroundPosition = "center";
        dom.style.backgroundSize = `${option.value.rowBgWidth[index]}px ${option.value.rowBgHeight[index]}px`;
      } else {
        dom.style.fontWeight = getKeyValueIndex(
          getSpanIndex(1),
          undefined,
          "FontWeight",
        );
        dom.style.fontFamily = getKeyValueIndex(
          getSpanIndex(1),
          undefined,
          "FontWeight",
        );
        dom.style.fontSize = getKeyValueIndex(
          getSpanIndex(1),
          undefined,
          "FontSize",
          "px",
        );
        dom.style.letterSpacing = getKeyValueIndex(
          getSpanIndex(1),
          undefined,
          "letterSpacing",
          "px",
        );
        dom.style.color = getKeyValueIndex(getSpanIndex(1), undefined, "Color");
        dom.style.fontStyle = getKeyValueIndex(
          getSpanIndex(1),
          undefined,
          "FontStyle",
        );
        dom.style.transform = "";
        dom.style.background = "";
      }
    });
  };

  const cursorShow = computed(() => {
    return option.value.cursorShow ? "visible" : "hidden";
  });
  const handleSelection = (rowId: number) => {
    let isChecked = true;
    const len = listData.value.length;

    if (option.value.selectedMode === "single") {
      activeList.value = [];
      if (active.value >= 0) {
        const olds = [active.value];
        if (isScrollComputed.value) {
          olds.push(active.value + len);
        }

        clearRowStyle(olds);
      }
      const ids = [rowId];
      if (isScrollComputed.value) {
        ids.push(rowId + len);
      }
      if (rowId === active.value) {
        active.value = -1;
        isChecked = false;
      } else {
        setRowStyle(ids);
        active.value = rowId;
      }
    } else {
      active.value = -1;
      if (activeList.value.includes(rowId)) {
        activeList.value = activeList.value.filter((i) => i !== rowId);
        clearRowStyle([rowId, rowId + len]);
        isChecked = false;
      } else {
        activeList.value.push(rowId);
        setRowStyle([rowId, rowId + len]);
      }
    }

    return isChecked;
  };

  const clearRowStyle = (indexes: number[]) => {
    indexes.forEach((index) => {
      const ulBox = scrollContainerRef.value?.$refs
        .ulBox as unknown as HTMLElement;
      const dom = ulBox?.children[index] as HTMLElement | null;
      if (dom) {
        dom.removeAttribute("data-type");
        if (option.value.textStyleShow) {
          Array.from(dom.childNodes).forEach((span, spanIndex) => {
            if (span instanceof HTMLElement) {
              const style: any = setListItemStyle(
                currentList.value[index],
                listLabel.value[spanIndex],
                spanIndex,
              );
              for (const k in style) {
                span.style[k as any] = style[k];
              }
            }
          });
        }
        dom.style.textShadow = "none";
        dom.style.background =
          option.value.seriesXbackgroundType[
            index % option.value.seriesXTabsName.length
          ] === "color"
            ? `${option.value.seriesXBackground[index % option.value.seriesXTabsName.length]}`
            : `url(${setMinioUrl(
                option.value.seriesXbackgroundImage[
                  index % option.value.seriesXbackgroundImage.length
                ],
              )}) no-repeat center/100% 100%`;
      }
    });
  };

  const setListItemStyle = (item: any, current: any, currentIndex: number) => {
    return {
      display: "inline-block",
      width: `${option.value.seriesYWidth[getSpanIndex(currentIndex)]}px`,
      marginLeft: `${option.value.seriesYMarginLeft[getSpanIndex(currentIndex)]}px`,
      transform: `translate3d(${option.value.seriesYOffsetX[getSpanIndex(currentIndex)]}px, ${
        option.value.seriesYOffsetY[getSpanIndex(currentIndex)]
      }px, 0px)`,
      textAlign: option.value.seriesYTextAlign[getSpanIndex(currentIndex)],
      fontSize: getKeyValueIndex(
        getSpanIndex(currentIndex),
        item[current.alias],
        "FontSize",
        "px",
      ),
      fontFamily: getKeyValueIndex(
        getSpanIndex(currentIndex),
        item[current.alias],
        "FontFamily",
      ),
      backgroundImage: `url(${setMinioUrl(
        getKeyValueIndex(
          getSpanIndex(currentIndex),
          item[current.alias],
          "BgImg",
        ),
      )})`,
      backgroundSize: `${getKeyValueIndex(
        getSpanIndex(currentIndex),
        item[current.alias],
        "BgWdith",
        "px",
      )} ${getKeyValueIndex(getSpanIndex(currentIndex), item[current.alias], "BgHeight", "px")}`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: `${
        getKeyValueIndex(
          getSpanIndex(currentIndex),
          item[current.alias],
          "BgLeft",
          "px",
        ) || "left"
      } center`,
      letterSpacing: getKeyValueIndex(
        getSpanIndex(currentIndex),
        item[current.alias],
        "letterSpacing",
        "px",
      ),
      fontStyle: getKeyValueIndex(
        getSpanIndex(currentIndex),
        item[current.alias],
        "FontStyle",
      ),
      fontWeight: getKeyValueIndex(
        getSpanIndex(currentIndex),
        item[current.alias],
        "FontWeight",
      ),
      color: getKeyValueIndex(
        getSpanIndex(currentIndex),
        item[current.alias],
        "Color",
      ),
      lineHeight: `${option.value.seriesYlineHeight[getSpanIndex(currentIndex)]}px`,
    };
  };

  const setRowStyle = (indexes: number[]) => {
    indexes.forEach((index) => {
      const ulBox = scrollContainerRef.value?.$refs
        .ulBox as unknown as HTMLElement | null;
      const dom = ulBox?.children[index] as HTMLElement | null;
      if (dom) {
        dom.setAttribute("data-type", "active");
        if (option.value.textStyleShow) {
          Array.from(dom.childNodes).forEach((span) => {
            if (span instanceof HTMLElement) {
              span.style.fontWeight = option.value.selectedFontWeight;
              span.style.fontStyle = option.value.selectedFontStyle;
              span.style.color = option.value.selectedColor;
              span.style.fontFamily = option.value.selectedFontFamily;
              span.style.fontSize = `${option.value.selectedFontSize}px`;
              span.style.letterSpacing = `${option.value.selectedletterSpacing}px`;
            }
          });
        }
        dom.style.textShadow = option.value.shadowShow
          ? `${option.value.shadowColor} ${option.value.shadowX}px ${option.value.shadowY}px ${option.value.shadowFuzzy}px`
          : "";
        dom.style.background =
          option.value.selectedBgType === "color"
            ? `${option.value.selectedBgColor}`
            : `url(${setMinioUrl(option.value.selectedBgImage)}) no-repeat center/100% 100%`;
      }
    });
  };

  const setInit = () => {
    scrollContainerRef.value?.setInit();
  };

  watch(
    () => option.value.column,
    (val) => {
      if (val) {
        listLabel.value = cloneDeep(val);
        initRowList();
      }
    },
    { deep: true, immediate: true },
  );

  watch(
    () => dataChart.value,
    (val) => {
      if (isArray(val)) {
        listData.value = cloneDeep(val);
      } else {
        listData.value = [];
      }
      initRowList();
    },
    { deep: true },
  );

  watch(
    [() => element.height, () => option.value, () => element.display],
    () => {
      if (element.display) {
        setInit();
        initRowList();
      }
    },
    { deep: true },
  );

  return {
    listLabel,
    listData,
    active,
    activeList,
    isAnimateScroll,
    currentList,
    scrollYBarStyle,
    cursorShow,
    initRowList,
    clearRowList,
    initRowIdStyle,
    setInit,
    setDefaultActive,
    handleSelection,
    clearRowStyle,
    setRowStyle,
    setListItemStyle,
  };
}
