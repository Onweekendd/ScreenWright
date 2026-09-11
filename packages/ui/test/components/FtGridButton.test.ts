import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import SwGridButton from "@/components/SwGridButton/index.vue"

describe("SwGridButton 组件测试", () => {
  const mockModelValue = {
    top: "10px",
    left: "20px",
    right: "30px",
    bottom: "40px"
  }

  it("应该正确渲染网格按钮组件", () => {
    const wrapper = mount(SwGridButton, {
      props: {
        modelValue: mockModelValue
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it("应该显示正确的初始值", () => {
    const wrapper = mount(SwGridButton, {
      props: {
        modelValue: mockModelValue
      }
    })
    expect(wrapper.props("modelValue")).toEqual(mockModelValue)
  })

  it("应该支持部分值", () => {
    const partialValue = {
      top: "10px",
      left: "20px"
    }
    const wrapper = mount(SwGridButton, {
      props: {
        modelValue: partialValue
      }
    })
    expect(wrapper.props("modelValue")).toEqual(partialValue)
  })

  it("应该支持空值", () => {
    const wrapper = mount(SwGridButton, {
      props: {
        modelValue: {}
      }
    })
    expect(wrapper.props("modelValue")).toEqual({})
  })

  it("应该支持数字类型的值", () => {
    const numericValue = {
      top: 10,
      left: 20,
      right: 30,
      bottom: 40
    }
    const wrapper = mount(SwGridButton, {
      props: {
        modelValue: numericValue
      }
    })
    expect(wrapper.props("modelValue")).toEqual(numericValue)
  })

  it("应该支持混合类型的值", () => {
    const mixedValue = {
      top: "10px",
      left: 20,
      right: "30px",
      bottom: 40
    }
    const wrapper = mount(SwGridButton, {
      props: {
        modelValue: mixedValue
      }
    })
    expect(wrapper.props("modelValue")).toEqual(mixedValue)
  })

  it("应该支持零值", () => {
    const zeroValue = {
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    }
    const wrapper = mount(SwGridButton, {
      props: {
        modelValue: zeroValue
      }
    })
    expect(wrapper.props("modelValue")).toEqual(zeroValue)
  })

  it("应该支持字符串零值", () => {
    const stringZeroValue = {
      top: "0",
      left: "0",
      right: "0",
      bottom: "0"
    }
    const wrapper = mount(SwGridButton, {
      props: {
        modelValue: stringZeroValue
      }
    })
    expect(wrapper.props("modelValue")).toEqual(stringZeroValue)
  })

  it("应该支持百分比值", () => {
    const percentageValue = {
      top: "10%",
      left: "20%",
      right: "30%",
      bottom: "40%"
    }
    const wrapper = mount(SwGridButton, {
      props: {
        modelValue: percentageValue
      }
    })
    expect(wrapper.props("modelValue")).toEqual(percentageValue)
  })

  it("应该支持 em 单位", () => {
    const emValue = {
      top: "1em",
      left: "2em",
      right: "3em",
      bottom: "4em"
    }
    const wrapper = mount(SwGridButton, {
      props: {
        modelValue: emValue
      }
    })
    expect(wrapper.props("modelValue")).toEqual(emValue)
  })

  it("应该支持 rem 单位", () => {
    const remValue = {
      top: "1rem",
      left: "2rem",
      right: "3rem",
      bottom: "4rem"
    }
    const wrapper = mount(SwGridButton, {
      props: {
        modelValue: remValue
      }
    })
    expect(wrapper.props("modelValue")).toEqual(remValue)
  })

  it("应该支持 auto 值", () => {
    const autoValue = {
      top: "auto",
      left: "auto",
      right: "auto",
      bottom: "auto"
    }
    const wrapper = mount(SwGridButton, {
      props: {
        modelValue: autoValue
      }
    })
    expect(wrapper.props("modelValue")).toEqual(autoValue)
  })

  it("应该支持 inherit 值", () => {
    const inheritValue = {
      top: "inherit",
      left: "inherit",
      right: "inherit",
      bottom: "inherit"
    }
    const wrapper = mount(SwGridButton, {
      props: {
        modelValue: inheritValue
      }
    })
    expect(wrapper.props("modelValue")).toEqual(inheritValue)
  })
})
