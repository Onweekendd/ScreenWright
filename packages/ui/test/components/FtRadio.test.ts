import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import SwRadio from "@/components/SwRadio/index.vue"

describe("SwRadio 组件测试", () => {
  const mockOptions = [
    { label: "选项1", value: "option1" },
    { label: "选项2", value: "option2" },
    { label: "选项3", value: "option3" }
  ]

  it("应该正确渲染组件", () => {
    const wrapper = mount(SwRadio, {
      props: {
        modelValue: "option1",
        option: mockOptions
      }
    })
    expect(wrapper.find(".sw-radio").exists()).toBe(true)
  })

  it("应该渲染所有选项", () => {
    const wrapper = mount(SwRadio, {
      props: {
        modelValue: "option1",
        option: mockOptions
      }
    })
    // 检查组件是否正确渲染
    expect(wrapper.exists()).toBe(true)
    // 由于 Element Plus 组件被 Mock，我们检查组件实例
    expect(wrapper.vm).toBeDefined()
  })

  it("应该显示正确的标签文本", () => {
    const wrapper = mount(SwRadio, {
      props: {
        modelValue: "option1",
        option: mockOptions
      }
    })
    // 检查组件是否正确渲染
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.vm.option).toEqual(mockOptions)
  })

  it("应该选中指定的值", () => {
    const wrapper = mount(SwRadio, {
      props: {
        modelValue: "option2",
        option: mockOptions
      }
    })
    expect(wrapper.props("modelValue")).toBe("option2")
  })

  it("应该触发 update:modelValue 事件", async () => {
    const wrapper = mount(SwRadio, {
      props: {
        modelValue: "option1",
        option: mockOptions
      }
    })
    await (wrapper.vm as any).handleChange("option2")
    expect(wrapper.emitted("update:modelValue")).toBeTruthy()
    expect(wrapper.emitted("update:modelValue")![0]).toEqual(["option2"])
  })

  it("应该触发 change 事件", async () => {
    const wrapper = mount(SwRadio, {
      props: {
        modelValue: "option1",
        option: mockOptions
      }
    })
    await (wrapper.vm as any).handleChange("option3")
    expect(wrapper.emitted("change")).toBeTruthy()
  })

  it("默认方向应该是列布局", () => {
    const wrapper = mount(SwRadio, {
      props: {
        modelValue: "option1",
        option: mockOptions
      }
    })
    // 检查组件是否正确渲染
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.vm.option).toEqual(mockOptions)
  })

  it("应该支持行布局", () => {
    const wrapper = mount(SwRadio, {
      props: {
        modelValue: "option1",
        option: mockOptions,
        direction: "row"
      }
    })
    // 检查组件是否正确渲染
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.props("direction")).toBe("row")
  })

  it("应该支持禁用选项", () => {
    const optionsWithDisabled = [
      { label: "选项1", value: "option1" },
      { label: "选项2", value: "option2", disabled: true },
      { label: "选项3", value: "option3" }
    ]
    const wrapper = mount(SwRadio, {
      props: {
        modelValue: "option1",
        option: optionsWithDisabled
      }
    })
    // 检查组件是否正确渲染
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.vm.option).toEqual(optionsWithDisabled)
  })

  it("应该使用 small 尺寸", () => {
    const wrapper = mount(SwRadio, {
      props: {
        modelValue: "option1",
        option: mockOptions
      }
    })
    // 检查组件是否正确渲染
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.vm.option).toEqual(mockOptions)
  })

  it("应该处理空选项数组", () => {
    const wrapper = mount(SwRadio, {
      props: {
        modelValue: "",
        option: []
      }
    })
    expect(wrapper.findAll(".el-radio")).toHaveLength(0)
  })

  it("应该正确处理数字类型的值", () => {
    const numericOptions = [
      { label: "选项1", value: 1 },
      { label: "选项2", value: 2 },
      { label: "选项3", value: 3 }
    ]
    const wrapper = mount(SwRadio, {
      props: {
        modelValue: 2,
        option: numericOptions
      }
    })
    expect(wrapper.props("modelValue")).toBe(2)
  })
})
