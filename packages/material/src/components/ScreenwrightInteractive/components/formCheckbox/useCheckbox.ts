import { useBaseData } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";
import { EventTypeEnum } from "@screenwright/types";
import type { CSSProperties } from "vue";
import { computed, onMounted, ref, watch } from "vue";

interface Item {
  label: string;
  value: string;
  isChecked: boolean;
}

export function useCheckbox(element: ComponentType) {
  const {
    isBuild,
    events,
    encodes,
    option,
    dataChart,
    styleSizeName,
    handleEncode,
    handleEventAndCallbackEvent,
  } = useBaseData(element);

  const checkbox = ref<HTMLElement | null>(null);
  const checkList = ref<string[]>([]);
  const isFirst = ref(true);

  // 监听数据变化，设置默认选中项
  watch(
    () => dataChart.value,
    (val) => {
      if (!val) {
        return;
      }
      const defaultCheck = val.filter((item: Item) => item.isChecked);
      checkList.value = defaultCheck.map((it: Item) => it.label);
      isFirst.value = false;
      handleEventAndCallbackEvent({
        id: element.id,
        triggerType: EventTypeEnum.DataChange,
        events: element.events,

        throwValue:
          dataChart.value && dataChart.value.length > 0
            ? dataChart.value[0]
            : "",
      });
    },
    { deep: true, immediate: true },
  );

  // 监听属性变化，更新样式
  const listenChange = computed(() => {
    const {
      fontSize,
      fontWeight,
      fontColor,
      fillColor,
      textColor,
      sizeX,
      sizeY,
    } = option.value;
    return {
      fontSize,
      fontWeight,
      fontColor,
      fillColor,
      textColor,
      sizeX,
      sizeY,
    };
  });
  const fomrCheckBoxClasses = computed(() => {
    return {
      "checkbox-container": true,
      "component-bind-events": true,
      "has-bind": events.value.length && isBuild,
      "has-encode": encodes.value.length && isBuild,
    };
  });

  watch(
    () => listenChange.value,
    () => {
      setSliderProperty();
    },
  );

  // 容器样式
  const containerStyle = computed(() => {
    return {
      padding: `${option.value.paddingTop || 0}px ${option.value.paddingLeft || 0}px`,
    };
  });

  // 文本样式
  const textStyle = computed<CSSProperties>(() => {
    return {
      letterSpacing: `${option.value.letterSpacing || 0}px`,
      fontFamily: option.value.fontFamily,
      fontStyle: option.value.fontStyle ? "italic" : "normal",
      textShadow: option.value.isTextShadow
        ? `${option.value.textShadow.color} ${option.value.textShadow.x || 0}px ${option.value.textShadow.y || 0}px ${
            option.value.textShadow.blur
          }px`
        : "none",
    };
  });

  // 设置样式变量
  const setSliderProperty = () => {
    if (!checkbox.value) {
      return;
    }

    const { fontWeight } = option.value;
    const fields = ["fontSize", "sizeX", "sizeY"];
    fields.forEach((field) => {
      checkbox.value?.style.setProperty(
        `--${field}`,
        option.value[field] + "px",
      );
    });
    const colorFields = ["fontColor", "fillColor", "textColor"];
    colorFields.forEach((field) => {
      checkbox.value?.style.setProperty(
        `--${field}`,
        option.value[field],
        "important",
      );
    });

    checkbox.value.style.setProperty(`--fontWeight`, fontWeight);
  };

  // 处理选项变化
  const handleChange = (info: string[]) => {
    const activeCheck = dataChart.value.filter((a: any) =>
      info.includes(a.label),
    );
    const checkInfo = {
      label: [...info],
      value: activeCheck.map((b: any) => b.value),
      remark: activeCheck,
    };
    handleEventAndCallbackEvent({
      id: element.id,
      triggerType: EventTypeEnum.DataChange,
      events: element.events,

      throwValue: checkInfo,
    });
    handleEncode(checkInfo);
  };

  onMounted(() => {
    setSliderProperty();
  });

  return {
    styleSizeName,
    events,
    encodes,
    isBuild,
    option,
    dataChart,
    checkbox,
    checkList,
    containerStyle,
    textStyle,
    fomrCheckBoxClasses,
    handleChange,
  };
}
