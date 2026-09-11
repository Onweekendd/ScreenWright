import { nextTick, ref } from "vue";
import { onClickOutside } from "@vueuse/core";

interface Props {
  target: string;
  callBack?: (e: PointerEvent) => void;
  ignore?: Array<string>;
}

export const usePopoverVisible = (props: Props) => {
  const popoverVisible = ref(false);
  let stop: any;
  const handlePopoverVisible = async () => {
    popoverVisible.value = !popoverVisible.value;
    await nextTick();
    const dom = document.querySelector(props.target) as HTMLElement;
    if (popoverVisible.value) {
      stop = onClickOutside(
        dom,
        (e) => {
          if (props.callBack) {
            props.callBack(e);
          } else {
            handlePopoverVisible();
          }
        },
        {
          ignore: props.ignore || []
        }
      );
    } else {
      stop();
    }
  };
  return {
    popoverVisible,
    handlePopoverVisible
  };
};
