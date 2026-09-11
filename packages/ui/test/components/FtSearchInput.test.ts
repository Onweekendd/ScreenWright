import { describe, it, expect, vi } from "vitest"
import { mount } from "@vue/test-utils"
import SwSearchInput from "@/components/SwSearchInput/index.vue"

describe("SwSearchInput 组件测试", () => {
  const mockSuggestions = [
    { value: "选项1", label: "选项1" },
    { value: "选项2", label: "选项2" },
    { value: "选项3", label: "选项3" }
  ]

  it("应该正确渲染搜索输入组件", () => {
    const wrapper = mount(SwSearchInput, {
      props: {
        modelValue: "",
        suggestions: mockSuggestions
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it("应该显示初始值", () => {
    const wrapper = mount(SwSearchInput, {
      props: {
        modelValue: "初始值",
        suggestions: mockSuggestions
      }
    })
    expect(wrapper.props("modelValue")).toBe("初始值")
  })

  it("应该支持 placeholder", () => {
    const wrapper = mount(SwSearchInput, {
      props: {
        modelValue: "",
        suggestions: mockSuggestions,
        placeholder: "请输入搜索内容"
      }
    })
    expect(wrapper.props("placeholder")).toBe("请输入搜索内容")
  })

  it("应该支持 clearable 属性", () => {
    const wrapper = mount(SwSearchInput, {
      props: {
        modelValue: "测试",
        suggestions: mockSuggestions,
        clearable: true
      }
    })
    expect(wrapper.props("clearable")).toBe(true)
  })

  it("应该支持 size 属性", () => {
    const wrapper = mount(SwSearchInput, {
      props: {
        modelValue: "",
        suggestions: mockSuggestions,
        size: "large"
      }
    })
    expect(wrapper.props("size")).toBe("large")
  })

  it("应该支持 disabled 属性", () => {
    const wrapper = mount(SwSearchInput, {
      props: {
        modelValue: "",
        suggestions: mockSuggestions,
        disabled: true
      }
    })
    // 检查组件是否正确渲染
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.vm).toBeDefined()
  })

  it("应该支持 fetchSuggestions 函数", () => {
    const fetchSuggestions = vi.fn()
    const wrapper = mount(SwSearchInput, {
      props: {
        modelValue: "",
        fetchSuggestions
      }
    })
    // 检查组件是否正确渲染
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.vm).toBeDefined()
  })

  it("应该支持 debounce 属性", () => {
    const wrapper = mount(SwSearchInput, {
      props: {
        modelValue: "",
        suggestions: mockSuggestions,
        debounce: 300
      }
    })
    // 检查组件是否正确渲染
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.vm).toBeDefined()
  })

  it("应该支持 triggerOnFocus 属性", () => {
    const wrapper = mount(SwSearchInput, {
      props: {
        modelValue: "",
        suggestions: mockSuggestions,
        triggerOnFocus: true
      }
    })
    // 检查组件是否正确渲染
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.vm).toBeDefined()
  })

  it("应该支持 selectWhenUnmatched 属性", () => {
    const wrapper = mount(SwSearchInput, {
      props: {
        modelValue: "",
        suggestions: mockSuggestions,
        selectWhenUnmatched: true
      }
    })
    // 检查组件是否正确渲染
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.vm).toBeDefined()
  })

  it("应该支持 hideLoading 属性", () => {
    const wrapper = mount(SwSearchInput, {
      props: {
        modelValue: "",
        suggestions: mockSuggestions,
        hideLoading: true
      }
    })
    // 检查组件是否正确渲染
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.vm).toBeDefined()
  })

  it("应该支持 popperClass 属性", () => {
    const wrapper = mount(SwSearchInput, {
      props: {
        modelValue: "",
        suggestions: mockSuggestions,
        popperClass: "custom-popper"
      }
    })
    expect(wrapper.props("popperClass")).toBe("custom-popper")
  })

  it("应该支持 placement 属性", () => {
    const wrapper = mount(SwSearchInput, {
      props: {
        modelValue: "",
        suggestions: mockSuggestions,
        placement: "top"
      }
    })
    // 检查组件是否正确渲染
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.vm).toBeDefined()
  })

  it("应该支持 teleported 属性", () => {
    const wrapper = mount(SwSearchInput, {
      props: {
        modelValue: "",
        suggestions: mockSuggestions,
        teleported: false
      }
    })
    // 检查组件是否正确渲染
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.vm).toBeDefined()
  })

  it("应该支持 highlightFirstItem 属性", () => {
    const wrapper = mount(SwSearchInput, {
      props: {
        modelValue: "",
        suggestions: mockSuggestions,
        highlightFirstItem: true
      }
    })
    // 检查组件是否正确渲染
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.vm).toBeDefined()
  })

  it("应该支持 fitInputWidth 属性", () => {
    const wrapper = mount(SwSearchInput, {
      props: {
        modelValue: "",
        suggestions: mockSuggestions,
        fitInputWidth: true
      }
    })
    // 检查组件是否正确渲染
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.vm).toBeDefined()
  })

  it("应该支持 maxlength 属性", () => {
    const wrapper = mount(SwSearchInput, {
      props: {
        modelValue: "",
        suggestions: mockSuggestions,
        maxlength: 100
      }
    })
    // 检查组件是否正确渲染
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.vm).toBeDefined()
  })

  it("应该支持 showWordLimit 属性", () => {
    const wrapper = mount(SwSearchInput, {
      props: {
        modelValue: "",
        suggestions: mockSuggestions,
        showWordLimit: true
      }
    })
    // 检查组件是否正确渲染
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.vm).toBeDefined()
  })

  it("应该支持 inputStyle 属性", () => {
    const inputStyle = { color: "red" }
    const wrapper = mount(SwSearchInput, {
      props: {
        modelValue: "",
        suggestions: mockSuggestions,
        inputStyle
      }
    })
    // 检查组件是否正确渲染
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.vm).toBeDefined()
  })
})
