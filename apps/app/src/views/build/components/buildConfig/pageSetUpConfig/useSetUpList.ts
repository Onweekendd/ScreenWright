import type { Ref } from "vue";

import type { actionDirection } from "./type";

export interface Item {
  type: string;
  title?: string;
  isActive?: boolean;
  action: actionDirection;
}

export const useSetUpList = (itemList: Ref<Item[]>) => {
  const handleClick = (item: Item) => {
    itemList.value.forEach((v) => {
      v.isActive = false;
    });
    item.isActive = true;
  };
  return {
    handleClick
  };
};
