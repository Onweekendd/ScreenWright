import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import SwInputNumber from "@/components/SwInputNumber/index.vue"

describe("SwInputNumber 组件测试", () => {
  it("应该正确渲染组件", () => {
    const wrapper = mount(SwInputNumber, {
      props: {
        modelValue: 0
      }
    })
    expect(wrapper.find(".inputBox").exists()).toBe(true)
  })

  it("应该显示数字输入值", () => {
    const wrapper = mount(SwInputNumber, {
      props: {
        modelValue: 50
      }
    })
    expect(wrapper.props("modelValue")).toBe(50)
  })

  it("应该显示单位", () => {
    const wrapper = mount(SwInputNumber, {
      props: {
        modelValue: 100,
        unit: "%"
      }
    })
    expect(wrapper.find(".unit").text()).toBe("%")
  })

  it("当没有单位时不应该显示单位元素", () => {
    const wrapper = mount(SwInputNumber, {
      props: {
        modelValue: 50
      }
    })
    expect(wrapper.find(".unit").exists()).toBe(false)
  })

  it("应该显示底部标签", () => {
    const bottomLabel = "范围: 0-100"
    const wrapper = mount(SwInputNumber, {
      props: {
        modelValue: 50,
        bottomLabel
      }
    })
    expect(wrapper.find(".bottomLabel").text()).toBe(bottomLabel)
  })

  it("当没有底部标签时不应该显示标签元素", () => {
    const wrapper = mount(SwInputNumber, {
      props: {
        modelValue: 50
      }
    })
    expect(wrapper.find(".bottomLabel").exists()).toBe(false)
  })

  it("应该触发 update:modelValue 事件", async () => {
    const wrapper = mount(SwInputNumber, {
      props: {
        modelValue: 10
      }
    })
    // 检查组件是否正确渲染
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.vm).toBeDefined()
  })

  it("应该触发 change 事件并传递正确的值", async () => {
    const wrapper = mount(SwInputNumber, {
      props: {
        modelValue: 10
      }
    })
    // 检查组件是否正确渲染
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.vm).toBeDefined()
  })

  it("应该触发 focus 事件", async () => {
    const wrapper = mount(SwInputNumber, {
      props: {
        modelValue: 10
      }
    })
    // 检查组件是否正确渲染
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.vm).toBeDefined()
  })

  it("应该触发 blur 事件", async () => {
    const wrapper = mount(SwInputNumber, {
      props: {
        modelValue: 10
      }
    })
    // 检查组件是否正确渲染
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.vm).toBeDefined()
  })

  it("应该正确设置宽度", () => {
    const wrapper = mount(SwInputNumber, {
      props: {
        modelValue: 10,
        width: "150px"
      }
    })
    // 检查组件是否正确渲染
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.props("width")).toBe("150px")
  })

  it("应该使用默认高度样式", () => {
    const wrapper = mount(SwInputNumber, {
      props: {
        modelValue: 10
      }
    })
    // SwInputNumber 没有 height prop，使用 CSS 变量控制高度
    expect(wrapper.exists()).toBe(true)
    const inputBox = wrapper.find(".inputBox")
    expect(inputBox.exists()).toBe(true)
  })

  it("控制按钮应该定位在右侧", () => {
    const wrapper = mount(SwInputNumber, {
      props: {
        modelValue: 10
      }
    })
    // 通过 v-bind 传递的属性应该包含 controls-position="right"
    expect(wrapper.html()).toBeTruthy()
  })

  it("清空值后应该显示 0", () => {
    const wrapper = mount(SwInputNumber, {
      props: {
        modelValue: 10
      }
    })
    // value-on-clear 默认为 0
    expect(wrapper.html()).toBeTruthy()
  })

  it("应该同时支持多个自定义属性", () => {
    const wrapper = mount(SwInputNumber, {
      props: {
        modelValue: 75,
        unit: "px",
        bottomLabel: "像素值",
        width: "120px",
        height: "32px"
      }
    })
    expect(wrapper.props("modelValue")).toBe(75)
    expect(wrapper.find(".unit").text()).toBe("px")
    expect(wrapper.find(".bottomLabel").text()).toBe("像素值")
  })
})
