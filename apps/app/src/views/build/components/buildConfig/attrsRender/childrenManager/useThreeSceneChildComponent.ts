import { ref, watch } from "vue";

import { useChildrenDrawer } from "@/views/build/components/buildConfig/attrsRender/childrenManager/useChildrenDrawer";

// 用于三维场景子组件
export const useThreeSceneChildComponent = () => {
  const { currentChildrenItem, update } = useChildrenDrawer();
  const { type } = currentChildrenItem.value;
  const martixOption = ref<any>({ rotation: [0, 0, 0], scale: [1, 1, 1] });
  const iconOption = ref<any>({});
  const initData = (option: any) => {
    const { rotation, scale } = option;
    martixOption.value = { rotation, scale };
    iconOption.value = option;
  };
  watch(
    () => currentChildrenItem.value,
    (val) => {
      initData(val.option.options);
    },
    {
      immediate: true
    }
  );
  return { currentChildrenItem, martixOption, iconOption, update, type };
};
