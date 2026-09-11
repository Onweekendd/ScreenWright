import { computed } from "vue";

import { getDataFilterPersistence, UpdateHistoryTypeEnum } from "./ports/persistencePort";
import { useChildrenDrawer } from "./useChildrenDrawer";
import { useEditStore } from "./useEditStore";
import { TargetFlag, useTargetData } from "./useTargetData";

interface Props {
  /** 历史遗留字段，当前实现未消费（保留仅为调用方类型兼容） */
  type?: string;
  history?: boolean;
  isDynamicPanel?: boolean;
}

const validUpdateHistoryTypes: Set<string> = new Set(Object.values(UpdateHistoryTypeEnum));
const isUpdateHistoryType = (value: unknown): value is UpdateHistoryTypeEnum =>
  typeof value === "string" && validUpdateHistoryTypes.has(value);

/**
 * @description 不需要传参
 * @param props
 * @returns
 */
export const useUpdateInstance = (
  _props: Props = {
    history: true,
    isDynamicPanel: false
  }
) => {
  const { selectTargetData, isPanel } = useEditStore();

  const isLock = computed(() => {
    if (!selectTargetData.value || selectTargetData.value.length === 0) {
      return false;
    }
    return selectTargetData.value.some((v) => v && v.isLock);
  });

  /**
   * @description 組件v-model綁定的值
   */
  const { selectTargetData: targetData, targetFlag } = useTargetData();
  const { update: updateChildrenDrawer } = useChildrenDrawer();

  /**
   * 250+ 处调用点里，绝大多数把 update 直接当 @change/@input 等事件处理器绑定（如
   * `@change="update"`），此时框架会把控件抛出的原始值（number/string/boolean...）作为第一个
   * 参数传入，而非真正的 UpdateHistoryTypeEnum。入参放宽为 unknown 并在内部校验：只有合法的
   * 枚举值才会被采用，其余（含未传参）一律按默认的 UPDATE 处理，避免历史遗留的 @change="update"
   * 写法把无关的事件值悄悄污染进保存选项，同时使 update 能被结构化赋值给任意 (value) => any 处理器。
   */
  const update = (updateHistoryType?: unknown): void => {
    // 無論是修改動作還是組件，都會調用這個方法
    const target = selectTargetData.value[0];
    if (isLock.value) {
      return;
    }
    if (targetFlag.value === TargetFlag.ChildItemOption) {
      updateChildrenDrawer();
    }

    getDataFilterPersistence().saveLayersByType(target, isPanel(), {
      updateHistoryType: isUpdateHistoryType(updateHistoryType) ? updateHistoryType : UpdateHistoryTypeEnum.UPDATE
    });
  };

  return {
    selectTargetData: targetData,
    isLock,
    isPanel,
    update
  };
};
