import { vi } from "vitest"
import { config } from "@vue/test-utils"

// 配置全局属性
config.global.stubs = {
  Teleport: true,
  // Mock ScreenwrightColorPicker 和 FrontColorPicker 组件以避免死循环
  ScreenwrightColorPicker: {
    name: "ScreenwrightColorPicker",
    template: '<div class="sw-color-picker-mock">ScreenwrightColorPicker</div>',
    props: ["modelValue", "options", "returnType"],
    emits: ["update:modelValue"]
  },
  FrontColorPicker: {
    name: "FrontColorPicker",
    template: '<div class="front-color-picker-mock">FrontColorPicker</div>',
    props: ["modelValue", "options", "border"],
    emits: ["update:modelValue", "confirm"]
  }
}

// Mock Element Plus 组件
vi.mock("element-plus", () => ({
  ElDialog: {
    name: "ElDialog",
    template: "<div><slot /></div>"
  },
  ElConfigProvider: {
    name: "ElConfigProvider",
    template: "<div><slot /></div>"
  },
  ElInput: {
    name: "ElInput",
    template: '<input v-bind="$attrs" />'
  },
  ElInputNumber: {
    name: "ElInputNumber",
    template: '<input type="number" v-bind="$attrs" />'
  },
  ElRadio: {
    name: "ElRadio",
    template: '<input type="radio" v-bind="$attrs" />'
  },
  ElRadioGroup: {
    name: "ElRadioGroup",
    template: "<div><slot /></div>"
  },
  ElSlider: {
    name: "ElSlider",
    template: '<input type="range" v-bind="$attrs" />'
  },
  ElColorPicker: {
    name: "ElColorPicker",
    template: '<input type="color" v-bind="$attrs" />'
  },
  ElSelect: {
    name: "ElSelect",
    template: "<select><slot /></select>"
  },
  ElOption: {
    name: "ElOption",
    template: '<option v-bind="$attrs"><slot /></option>'
  },
  ElCollapse: {
    name: "ElCollapse",
    template: "<div><slot /></div>"
  },
  ElCollapseItem: {
    name: "ElCollapseItem",
    template: "<div><slot /></div>"
  },
  ElEmpty: {
    name: "ElEmpty",
    template: "<div>Empty</div>"
  },
  ElPagination: {
    name: "ElPagination",
    template: "<div>Pagination</div>"
  },
  ElAutocomplete: {
    name: "ElAutocomplete",
    template: '<input v-bind="$attrs" />'
  },
  ElIcon: {
    name: "ElIcon",
    template: "<i><slot /></i>"
  }
}))
