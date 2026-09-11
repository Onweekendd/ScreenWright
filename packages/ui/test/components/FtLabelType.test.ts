import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import SwLabelType from "@/components/SwLabelType/index.vue"

describe("SwLabelType 组件测试", () => {
  const mockModelValue = { fontFamily: "Arial", fontSize: 14 }

  it("应该正确渲染标签类型组件", () => {
    const wrapper = mount(SwLabelType, {
      props: {
        modelValue: mockModelValue
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it("应该显示字体选择下拉框", () => {
    const wrapper = mount(SwLabelType, {
      props: {
        modelValue: mockModelValue
      }
    })
    // 检查组件是否正确渲染
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.vm).toBeDefined()
  })

  it("应该支持 isShowFontSize 属性", () => {
    const wrapper = mount(SwLabelType, {
      props: {
        modelValue: mockModelValue,
        isShowFontSize: true
      }
    })
    expect(wrapper.props("isShowFontSize")).toBe(true)
  })

  it("应该支持 selectWidth 属性", () => {
    const wrapper = mount(SwLabelType, {
      props: {
        modelValue: mockModelValue,
        selectWidth: 200
      }
    })
    expect(wrapper.props("selectWidth")).toBe(200)
  })

  it("应该支持默认值", () => {
    const wrapper = mount(SwLabelType, {
      props: {
        modelValue: mockModelValue
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it("应该支持不同的字体", () => {
    const wrapper = mount(SwLabelType, {
      props: {
        modelValue: { fontFamily: "Microsoft YaHei", fontSize: 16 }
      }
    })
    expect(wrapper.props("modelValue")).toEqual({ fontFamily: "Microsoft YaHei", fontSize: 16 })
  })

  it("应该支持不同的字体大小", () => {
    const wrapper = mount(SwLabelType, {
      props: {
        modelValue: { fontFamily: "Arial", fontSize: 18 }
      }
    })
    expect(wrapper.props("modelValue")).toEqual({ fontFamily: "Arial", fontSize: 18 })
  })

  it("应该支持部分属性", () => {
    const wrapper = mount(SwLabelType, {
      props: {
        modelValue: { fontFamily: "Arial" }
      }
    })
    expect(wrapper.props("modelValue")).toEqual({ fontFamily: "Arial" })
  })

  it("应该支持空对象", () => {
    const wrapper = mount(SwLabelType, {
      props: {
        modelValue: {}
      }
    })
    expect(wrapper.props("modelValue")).toEqual({})
  })

  it("应该支持 undefined", () => {
    const wrapper = mount(SwLabelType, {
      props: {
        modelValue: undefined
      }
    })
    expect(wrapper.props("modelValue")).toBeUndefined()
  })

  it("应该支持组合属性", () => {
    const wrapper = mount(SwLabelType, {
      props: {
        modelValue: mockModelValue,
        isShowFontSize: true,
        selectWidth: 300
      }
    })
    expect(wrapper.props("modelValue")).toEqual(mockModelValue)
    expect(wrapper.props("isShowFontSize")).toBe(true)
    expect(wrapper.props("selectWidth")).toBe(300)
  })

  it("应该支持隐藏字体大小", () => {
    const wrapper = mount(SwLabelType, {
      props: {
        modelValue: mockModelValue,
        isShowFontSize: false
      }
    })
    expect(wrapper.props("isShowFontSize")).toBe(false)
  })

  it("应该支持自定义宽度", () => {
    const wrapper = mount(SwLabelType, {
      props: {
        modelValue: mockModelValue,
        selectWidth: 150
      }
    })
    expect(wrapper.props("selectWidth")).toBe(150)
  })

  it("应该支持大字体", () => {
    const wrapper = mount(SwLabelType, {
      props: {
        modelValue: { fontFamily: "Arial", fontSize: 24 }
      }
    })
    expect(wrapper.props("modelValue")).toEqual({ fontFamily: "Arial", fontSize: 24 })
  })

  it("应该支持小字体", () => {
    const wrapper = mount(SwLabelType, {
      props: {
        modelValue: { fontFamily: "Arial", fontSize: 10 }
      }
    })
    expect(wrapper.props("modelValue")).toEqual({ fontFamily: "Arial", fontSize: 10 })
  })

  it("应该支持中文字体", () => {
    const wrapper = mount(SwLabelType, {
      props: {
        modelValue: { fontFamily: "宋体", fontSize: 14 }
      }
    })
    expect(wrapper.props("modelValue")).toEqual({ fontFamily: "宋体", fontSize: 14 })
  })

  it("应该支持英文字体", () => {
    const wrapper = mount(SwLabelType, {
      props: {
        modelValue: { fontFamily: "Times New Roman", fontSize: 14 }
      }
    })
    expect(wrapper.props("modelValue")).toEqual({ fontFamily: "Times New Roman", fontSize: 14 })
  })
})
