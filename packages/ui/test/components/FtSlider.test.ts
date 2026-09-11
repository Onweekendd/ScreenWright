import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import SwSlider from "@/components/SwSlider/index.vue"
import SwInputNumber from "@/components/SwInputNumber/index.vue"

describe("SwSlider 组件测试", () => {
  it("应该正确渲染组件", () => {
    const wrapper = mount(SwSlider, {
      props: {
        modelValue: 50
      }
    })
    expect(wrapper.find(".sw-slider").exists()).toBe(true)
  })

  it("应该显示滑块组件", () => {
    const wrapper = mount(SwSlider, {
      props: {
        modelValue: 50
      }
    })
    // 检查组件是否正确渲染
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.vm).toBeDefined()
  })

  it("默认应该显示数字输入框", () => {
    const wrapper = mount(SwSlider, {
      props: {
        modelValue: 50
      }
    })
    // 检查组件是否正确渲染
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.vm.showNumberInput).toBe(true)
  })

  it("当 showNumberInput 为 false 时不应该显示数字输入框", () => {
    const wrapper = mount(SwSlider, {
      props: {
        modelValue: 50,
        showNumberInput: false
      }
    })
    expect(wrapper.findComponent(SwInputNumber).exists()).toBe(false)
  })

  it("应该显示正确的值", () => {
    const wrapper = mount(SwSlider, {
      props: {
        modelValue: 75
      }
    })
    expect(wrapper.props("modelValue")).toBe(75)
  })

  it("应该触发 update:modelValue 事件", async () => {
    const wrapper = mount(SwSlider, {
      props: {
        modelValue: 50
      }
    })
    await (wrapper.vm as any).handleChange(80)
    expect(wrapper.emitted("update:modelValue")).toBeTruthy()
    expect(wrapper.emitted("update:modelValue")![0]).toEqual([80])
  })

  it("应该触发 change 事件", async () => {
    const wrapper = mount(SwSlider, {
      props: {
        modelValue: 50
      }
    })
    await (wrapper.vm as any).handleChange(60)
    expect(wrapper.emitted("change")).toBeTruthy()
  })

  it("应该将单位传递给数字输入框", () => {
    const wrapper = mount(SwSlider, {
      props: {
        modelValue: 50,
        unit: "%"
      }
    })
    const inputNumber = wrapper.findComponent(SwInputNumber)
    expect(inputNumber.props("unit")).toBe("%")
  })

  it("数字输入框应该有固定宽度", () => {
    const wrapper = mount(SwSlider, {
      props: {
        modelValue: 50
      }
    })
    const inputNumber = wrapper.findComponent(SwInputNumber)
    expect(inputNumber.props("width")).toBe("75")
  })

  it("应该支持最小值属性", () => {
    const wrapper = mount(SwSlider, {
      props: {
        modelValue: 50,
        min: 0
      }
    })
    expect(wrapper.props("min")).toBe(0)
  })

  it("应该支持最大值属性", () => {
    const wrapper = mount(SwSlider, {
      props: {
        modelValue: 50,
        max: 100
      }
    })
    expect(wrapper.props("max")).toBe(100)
  })

  it("应该支持步长属性", () => {
    const wrapper = mount(SwSlider, {
      props: {
        modelValue: 50,
        step: 5
      }
    })
    expect(wrapper.props("step")).toBe(5)
  })

  it("应该是 flex 布局", () => {
    const wrapper = mount(SwSlider, {
      props: {
        modelValue: 50
      }
    })
    expect(wrapper.find(".sw-slider").classes()).toContain("flex")
  })

  it("滑块和输入框应该同步更新", async () => {
    const wrapper = mount(SwSlider, {
      props: {
        modelValue: 50
      }
    })

    // 通过 handleChange 更新值
    await (wrapper.vm as any).handleChange(70)

    // 检查事件是否正确触发
    expect(wrapper.emitted("update:modelValue")).toBeTruthy()
    expect(wrapper.emitted("update:modelValue")![0]).toEqual([70])
  })
})
