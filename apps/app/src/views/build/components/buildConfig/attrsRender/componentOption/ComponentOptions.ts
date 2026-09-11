import { defineAsyncComponent, markRaw } from "vue";

// 定义通用选项类型
type OptionType = {
  [key: string]: string;
};

// 定义单个选项的类型
export type SingleOption = {
  label: string;
  value: string;
  component?: any;
  hidden?: boolean;
};

// 基类
class ComponentOptions<T extends string> {
  optionType: OptionType;
  defaultOptions: Record<string, SingleOption[]>;
  enumType: T[];
  importPath: string;

  constructor(
    optionType: OptionType,
    defaultOptions: Record<string, SingleOption[]>,
    enumType: T[],
    importPath: string
  ) {
    this.optionType = optionType;
    this.defaultOptions = defaultOptions;
    this.enumType = enumType;
    this.importPath = importPath;
  }

  getAsyncComponentByProps(component: string, preFix: string): ReturnType<typeof defineAsyncComponent> {
    const componentName = component + preFix;
    const preFixPath = this.importPath.split("/")[0];
    const appendFixPath = this.importPath.split("/")[1];
    return defineAsyncComponent(() => import(`../../${preFixPath}/${appendFixPath}${preFix}/${componentName}.vue`));
  }

  getOptionComponent(options: SingleOption[], type: string): SingleOption[] {
    return options.map((item) => {
      return {
        ...item,
        label: item.label,
        value: item.value,
        component: markRaw(this.getAsyncComponentByProps(type, item.value))
      };
    });
  }

  getComponentOptions(): Record<string, SingleOption[]> {
    const result: Record<string, SingleOption[]> = {};
    for (let i = 0; i < this.enumType.length; i++) {
      const key = this.enumType[i];
      const options = this.defaultOptions[key] || this.defaultOptions.default;
      result[key] = this.getOptionComponent(options, key);
    }

    return result;
  }
}

export { ComponentOptions };
