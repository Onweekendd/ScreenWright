import { computed, ref } from "vue";

import { ElMessage } from "element-plus";

import { updateLargeScreen } from "@/api/library";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";
import { useLargeScreenInfo } from "@/views/build/useLargeScreenInfo";
import { useEncodeCommunication } from "@/views/view/useEncodeCommunication";

/**
 * 控制编码组件业务逻辑
 */
export const useControlEncodes = () => {
  const { encodedControlValues } = useEncodeCommunication();
  const { selectTargetData } = useEditStore();
  const { navInfo } = useLargeScreenInfo();
  /**
   * 当前组件的控制编码值
   * 从 encodedControlValues 中读取当前选中组件的编码，支持双向绑定
   */
  const codeValue = computed<string>({
    get: () => {
      if (!selectTargetData.value?.length) return "";

      const currentComponentId = `${selectTargetData.value[0].id}`;
      const targetEncode = encodedControlValues.value.find((item) => item.id === currentComponentId);
      return targetEncode?.code || "";
    },
    set: (value: string) => {
      if (!selectTargetData.value?.length) return;

      const currentComponentId = `${selectTargetData.value[0].id}`;

      /**
       * id-code-value
       */

      const targetEncodeIndex = encodedControlValues.value.findIndex((item) => item.id === currentComponentId);

      if (targetEncodeIndex !== -1) {
        // 更新existing编码 - 使用浅拷贝
        const newEncodedValues = [...encodedControlValues.value];
        newEncodedValues[targetEncodeIndex] = {
          id: currentComponentId,
          code: value,
          value: selectTargetData.value[0]?.data?.[0]?.value ?? ""
        };
        encodedControlValues.value = newEncodedValues;
      } else {
        // 添加新编码 - 先删除原有相同id的数据，再添加新数据
        const filteredValues = encodedControlValues.value.filter((item) => item.id !== currentComponentId);
        encodedControlValues.value = [
          ...filteredValues,
          {
            id: currentComponentId,
            code: value,
            value: selectTargetData.value[0]?.data?.[0]?.value ?? ""
          }
        ];
      }
    }
  });

  /**
   * 处理编码变更
   * @param value 新的编码值
   */
  const handleCodeChange = () => {
    const update = () => {
      const updateParams = {
        encodedControl: JSON.stringify(navInfo.value.encodedControl),
        id: Number(navInfo.value.id)
      };
      updateLargeScreen(updateParams);
    };
    update();
  };

  // 内部状态
  const isFocused = ref(false);

  /**
   * 验证控制编码格式
   * @param code 编码字符串
   */
  const validateControlCode = (code: string): boolean => {
    if (!code.trim()) return true; // 允许为空

    // 验证规则：只允许字母、数字、下划线、中划线
    const regex = /^[a-zA-Z0-9_-]+$/;
    if (!regex.test(code)) {
      ElMessage.warning("控制编码只能包含字母、数字、下划线和中划线");
      return false;
    }

    // 长度验证
    if (code.length > 50) {
      ElMessage.warning("控制编码长度不能超过50个字符");
      return false;
    }

    return true;
  };

  /**
   * 格式化控制编码
   * @param code 原始编码
   */
  const formatControlCode = (code: string): string => {
    // 去除首尾空格，转换为小写
    return code.trim().toLowerCase();
  };

  /**
   * 处理输入框失焦
   */
  const handleBlur = () => {
    isFocused.value = false;

    // 失焦时进行最终验证和格式化
    if (codeValue.value) {
      const formattedValue = formatControlCode(codeValue.value);
      if (validateControlCode(formattedValue)) {
        codeValue.value = formattedValue;
      }
    }
  };

  /**
   * 处理输入框聚焦
   */
  const handleFocus = () => {
    isFocused.value = true;
  };

  return {
    // 状态
    codeValue,
    isFocused,

    // 方法
    handleCodeChange,
    handleBlur,
    handleFocus,
    validateControlCode,
    formatControlCode
  };
};
