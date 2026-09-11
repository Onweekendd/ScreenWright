import type { CSSProperties } from "vue";
import { computed, type Ref, ref, watch } from "vue";

import { type ConfigField, configOptions } from "../options";

/**
 * 选项数据结构定义
 */
export interface ConfigSelectOption {
  /** 显示标签 */
  label: string;
  /** 选项值 */
  value: string | any;
  /** 名称 */
  name?: string;
  /** 唯一标识 */
  id?: string;
  /** 资源类型 */
  assetsType?: any;
  /** 是否禁用 */
  disabled?: boolean;
  /** 子选项 */
  children?: ConfigSelectOption[];
  /** 其他扩展属性 */
  [key: string]: any;
}

/**
 * 选中数据结构定义
 */
export interface CheckedData {
  /** 选中的键值列表 */
  checkedKeys: string[];
  /** 选中的节点对象列表 */
  checkedNodes: ConfigSelectOption[];
}

/**
 * 树节点选中参数定义
 */
export interface TreeCheckParams {
  /** 选中数据 */
  checked: CheckedData;
  /** 当前操作的节点数据 */
  data: ConfigSelectOption;
}

/**
 * 配置选择器属性定义
 */
export interface ConfigSelectProps {
  /** 当前选中值 */
  modelValue?: string | string[] | number[] | number;
  /** 配置字段名，用于获取预设选项 */
  field?: ConfigField;
  /** 自定义选项数组 */
  option?: ConfigSelectOption[];
  /** 组件尺寸 */
  size?: "default" | "small" | "large";
  /** 是否多选 */
  multiple?: boolean;
  /** 是否可清空 */
  clearable?: boolean;
  /** 排除的选项值，逗号分隔 */
  excludes?: string;
  /** 是否显示树形结构 */
  hasTree?: boolean;
  /** 树形选择时是否严格模式 */
  checkStrictly?: boolean;
  /** 是否显示复选框 */
  isCheckbox?: boolean;
  /** 树节点的键值字段名 */
  nodeKey?: string;
  /** 标签格式化函数 */
  labelFormat?: (item: ConfigSelectOption) => string;
  /** 是否可过滤 */
  filterable?: boolean;
  /** 是否为组件选择器 */
  isComp?: boolean;
  /** 是否保留选中分组 */
  isReserveCheckedGroup?: boolean;
  /** 样式 */
  style?: CSSProperties;
}

/**
 * 配置选择器 hooks
 * @param props 组件属性
 * @param modelValue 双向绑定的值
 * @param emit 事件发射器
 * @returns 配置选择器相关状态和方法
 */
export function useConfigSelect(
  props: ConfigSelectProps,
  modelValue: Ref<string | string[] | number[] | number | undefined>,
  emit: {
    (e: "change", value: string | string[] | number[], checkedNodesList?: ConfigSelectOption[]): void;
    (e: "update:modelValue", value: string | string[] | number[]): void;
  }
) {
  /** 原始选项数据 */
  const options = ref<ConfigSelectOption[]>([]);

  /** 扁平化后的选项数据（用于树形结构） */
  const flattenedOptions = ref<ConfigSelectOption[]>([]);

  /** 树形选择标志，用于避免循环触发 */
  const isTreeSelectionFlag = ref(true);

  /** 过滤文本 */
  const filterText = ref("");

  /**
   * 排除选项列表
   * 将字符串形式的排除列表转换为数组
   */
  const excludesList = computed(() => {
    return props.excludes ? props.excludes.split(",").map((item) => item.trim()) : [];
  });

  /**
   * 将值转换为适当的类型
   * 根据原始 modelValue 的类型来决定返回值的类型
   * @param value 要转换的值
   * @returns 转换后的值
   */
  const convertToAppropriateType = (value: string | string[]): string | string[] | number[] => {
    // 检查原始 modelValue 是否为 number[] 类型
    const isNumberArrayType =
      Array.isArray(modelValue.value) && modelValue.value.length > 0 && typeof modelValue.value[0] === "number";

    // 检查原始 modelValue 是否为单个 number 类型
    const isSingleNumberType = typeof modelValue.value === "number";

    if (isNumberArrayType) {
      // 原始类型是 number[]，返回 number[]
      if (Array.isArray(value)) {
        return value.map((v) => Number(v));
      } else {
        return [Number(value)];
      }
    } else if (isSingleNumberType) {
      // 原始类型是单个 number，返回 number[]（保持一致性）
      if (Array.isArray(value)) {
        return value.map((v) => Number(v));
      } else {
        return [Number(value)];
      }
    }

    // 原始类型是 string 或 string[]，保持原样
    return value;
  };

  /**
   * 处理后的选项数据
   * 根据是否为树形结构返回不同的数据格式
   */
  const processedOptions = computed(() => {
    if (props.hasTree) {
      return flattenedOptions.value;
    }

    return options.value.map((item) => {
      const formattedItem = { ...item };
      if (props.labelFormat) {
        formattedItem.label = props.labelFormat(item);
      }
      return {
        ...formattedItem,
        label: formattedItem.label || formattedItem.name || ""
      };
    });
  });

  /**
   * 初始化选项数据
   * 根据 field 字段或 option 属性设置选项数据
   */
  const initializeOptions = (): void => {
    try {
      if (props.field) {
        options.value = configOptions(props.field) || [];
      } else if (props.option) {
        options.value = props.option;
      } else {
        options.value = [];
      }

      if (props.hasTree && options.value.length > 0) {
        buildFlattenedOptions(options.value);
      }
    } catch (error) {
      console.error("Failed to initialize options:", error);
      options.value = [];
    }
  };

  /**
   * 构建扁平化选项数据
   * 将树形结构的选项数据转换为扁平结构，便于下拉选择
   * @param optionItems 树形选项数据
   */
  const buildFlattenedOptions = (optionItems: ConfigSelectOption[]): void => {
    flattenedOptions.value = [];
    traverseAndFlattenOptions(optionItems);
  };

  /**
   * 递归遍历并扁平化选项
   * @param optionItems 待处理的选项数组
   */
  const traverseAndFlattenOptions = (optionItems: ConfigSelectOption[]): void => {
    optionItems.forEach((item) => {
      flattenedOptions.value.push({
        label: item.name || item.label || "",
        value: props.nodeKey === "value" ? item.value : item.id,
        id: item.id
      });

      if (item.children && item.children.length > 0) {
        traverseAndFlattenOptions(item.children);
      }
    });
  };

  /**
   * 处理选项值变更
   * @param value 新的选中值
   * @param checkedNodesList 选中的节点列表（可选）
   */
  const handleValueChange = (value: string | string[], checkedNodesList?: ConfigSelectOption[]): void => {
    // 如果是数组值但没有传入节点列表，则从选项中查找对应节点
    if (Array.isArray(value) && !checkedNodesList && props.option) {
      checkedNodesList = props.option.filter((node) => value.includes(node.label || node.name || ""));
    }

    // 转换为适当的类型
    const convertedValue = convertToAppropriateType(value);
    emit("change", convertedValue, checkedNodesList);
  };

  /**
   * 处理树形结构节点选中变更
   * @param params 树节点选中参数
   */
  const handleTreeCheckChange = (params: TreeCheckParams): void => {
    const { checked, data } = params;
    isTreeSelectionFlag.value = false;

    // 确保多选时值为数组
    if (props.multiple && !modelValue.value) {
      modelValue.value = [];
    }

    // 处理选中多个节点的情况（例如选中文件夹）
    if (shouldFilterGroupSelection(checked, data)) {
      filterGroupSelection(checked, data);
    }

    const processedKeys = processCheckedKeys(checked.checkedKeys);
    const processedNodes = processCheckedNodes(checked.checkedNodes, processedKeys.length);

    // 转换为适当的类型
    const convertedKeys = convertToAppropriateType(processedKeys);
    modelValue.value = convertedKeys;
    emit("change", convertedKeys, processedNodes);
  };

  /**
   * 判断是否需要过滤分组选择
   * @param checked 选中数据
   * @param _data 当前节点数据
   * @returns 是否需要过滤
   */
  const shouldFilterGroupSelection = (checked: CheckedData, _data: ConfigSelectOption): boolean => {
    return (
      !props.isReserveCheckedGroup &&
      Array.isArray(modelValue.value) &&
      checked.checkedKeys.length - (modelValue.value?.length || 0) > 1
    );
  };

  /**
   * 过滤分组选择逻辑
   * 当选中文件夹时，移除父级分组项
   * @param checked 选中数据
   * @param data 当前节点数据
   */
  const filterGroupSelection = (checked: CheckedData, data: ConfigSelectOption): void => {
    if (!Array.isArray(modelValue.value)) return;

    // 获取新增的选项
    const currentValues = modelValue.value.map(String);
    const newIds = checked.checkedKeys.filter((item) => !currentValues.includes(item));

    // 找到当前选中的组的ID
    const nodeKey = props.nodeKey || "id";
    const newGroupId = newIds.find((item) => {
      return data.children ? item === data[nodeKey] : item !== data[nodeKey];
    });

    // 移除分组项
    if (newGroupId) {
      const groupIndex = checked.checkedKeys.findIndex((item) => item === newGroupId);
      if (groupIndex >= 0) {
        checked.checkedKeys.splice(groupIndex, 1);
        checked.checkedNodes.splice(groupIndex, 1);
      }
    }
  };

  /**
   * 处理选中的键值列表
   * 移除特殊标记项（如包含 "-meet" 的项）
   * @param checkedKeys 原始选中键值列表
   * @returns 处理后的键值列表
   */
  const processCheckedKeys = (checkedKeys: string[]): string[] => {
    const processedList = [...checkedKeys];
    const meetIndex = processedList.findIndex((key) => typeof key === "string" && key.includes("-meet"));

    if (meetIndex >= 0) {
      processedList.splice(meetIndex, 1);
    }

    return processedList;
  };

  /**
   * 处理选中的节点列表
   * 确保节点列表与键值列表长度一致
   * @param checkedNodes 原始选中节点列表
   * @param targetLength 目标长度
   * @returns 处理后的节点列表
   */
  const processCheckedNodes = (checkedNodes: ConfigSelectOption[], targetLength: number): ConfigSelectOption[] => {
    const processedList = [...checkedNodes];

    // 如果长度不匹配，调整节点列表
    if (processedList.length > targetLength) {
      processedList.splice(targetLength);
    }

    return processedList;
  };

  /**
   * 设置树形组件的选中状态
   * @param treeRef 树形组件引用
   * @param value 要设置的选中值
   */
  const updateTreeSelection = (treeRef: any, value: string | string[] | number[]): void => {
    if (!value || !treeRef?.value) return;

    const keys = Array.isArray(value) ? value.map(String) : [String(value)];

    if (isTreeSelectionFlag.value) {
      const treeComponent = treeRef.value.$refs?.treeRef;
      if (treeComponent?.setCheckedKeys) {
        // FIXME: 性能消耗大
        treeComponent.setCheckedKeys(keys, !props.isReserveCheckedGroup);
      }
    } else {
      isTreeSelectionFlag.value = true;
    }
  };

  /**
   * 监听选项变化
   */
  watch(
    () => props.option,
    (newOptions) => {
      if (newOptions) {
        options.value = newOptions;
        if (props.hasTree) {
          buildFlattenedOptions(newOptions);
        }
      }
    },
    { deep: true }
  );

  return {
    // 响应式状态
    options,
    flattenedOptions,
    isTreeSelectionFlag,
    filterText,

    // 计算属性
    excludesList,
    processedOptions,

    // 方法
    initializeOptions,
    buildFlattenedOptions,
    handleValueChange,
    handleTreeCheckChange,
    updateTreeSelection
  };
}
