import { onMounted, ref } from "vue";

import { useChildrenDrawer } from "../../useChildrenDrawer";

export const useSeriesAction = () => {
  const { currentChildrenItem, update } = useChildrenDrawer();
  const activeTab = ref("颜色1");
  const handleAdd = () => {
    const index = currentChildrenItem.value.option.visualMapTabsName.findIndex(
      (item: string) => item === activeTab.value
    );
    const currentColor = currentChildrenItem.value.option.visualMapColor[index];
    currentChildrenItem.value.option.visualMapTabsName.push(
      `颜色${currentChildrenItem.value.option.visualMapTabsName.length + 1}`
    );
    currentChildrenItem.value.option.visualMapColor.push(currentColor);
    activeTab.value = `颜色${currentChildrenItem.value.option.visualMapTabsName.length}`;
    update();
  };
  const handleDelete = () => {
    if (currentChildrenItem.value.option.visualMapTabsName.length <= 1) {
      return;
    }
    const index = currentChildrenItem.value.option.visualMapTabsName.findIndex(
      (item: string) => item === activeTab.value
    );
    if (index !== -1) {
      currentChildrenItem.value.option.visualMapTabsName.splice(index, 1);
      currentChildrenItem.value.option.visualMapColor.splice(index, 1);
      for (let i = 0; i < currentChildrenItem.value.option.visualMapTabsName.length; i++) {
        currentChildrenItem.value.option.visualMapTabsName[i] = `颜色${i + 1}`;
      }
      if (currentChildrenItem.value.option.visualMapTabsName.length === 1) {
        activeTab.value = currentChildrenItem.value.option.visualMapTabsName[0];
      }
      if (currentChildrenItem.value.option.visualMapTabsName.length === index) {
        activeTab.value = currentChildrenItem.value.option.visualMapTabsName[index - 1];
      }
      update();
    }
  };
  onMounted(() => {
    if (currentChildrenItem.value && currentChildrenItem.value.option.visualMapTabsName.length > 0) {
      activeTab.value = currentChildrenItem.value.option.visualMapTabsName[0];
    }
  });
  return {
    activeTab,
    handleAdd,
    handleDelete
  };
};
