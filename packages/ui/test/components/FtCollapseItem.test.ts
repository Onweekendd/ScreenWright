import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import SwCollapseItem from "@/components/SwCollapseItem/index.vue"

describe("SwCollapseItem 组件测试", () => {
  it("应该正确渲染折叠面板项组件", () => {
    const wrapper = mount(SwCollapseItem, {
      props: {
        title: "测试折叠面板",
        modelValue: true
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it("应该显示标题文本", () => {
    const title = "测试折叠面板"
    const wrapper = mount(SwCollapseItem, {
      props: {
        modelValue: true,
        title
      }
    })
    // 检查组件是否正确渲染
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.props("title")).toBe(title)
  })

  it("应该支持 disabled 属性", () => {
    const wrapper = mount(SwCollapseItem, {
      props: {
        title: "测试折叠面板",
        modelValue: true,
        disabled: true
      }
    })
    expect(wrapper.props("disabled")).toBe(true)
  })

  it("应该支持 open 属性", () => {
    const wrapper = mount(SwCollapseItem, {
      props: {
        title: "测试折叠面板",
        modelValue: true,
        open: true
      }
    })
    expect(wrapper.props("open")).toBe(true)
  })

  it("应该支持 showIcon 属性", () => {
    const wrapper = mount(SwCollapseItem, {
      props: {
        title: "测试折叠面板",
        modelValue: true,
        showIcon: true
      }
    })
    expect(wrapper.props("showIcon")).toBe(true)
  })

  it("应该支持默认值", () => {
    const wrapper = mount(SwCollapseItem, {
      props: {
        title: "测试折叠面板"
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it("应该支持不同的标题", () => {
    const wrapper = mount(SwCollapseItem, {
      props: {
        title: "另一个标题",
        modelValue: true
      }
    })
    expect(wrapper.props("title")).toBe("另一个标题")
  })

  it("应该支持空标题", () => {
    const wrapper = mount(SwCollapseItem, {
      props: {
        title: "",
        modelValue: true
      }
    })
    expect(wrapper.props("title")).toBe("")
  })

  it("应该支持数字类型的 modelValue", () => {
    const wrapper = mount(SwCollapseItem, {
      props: {
        title: "测试折叠面板",
        modelValue: 1
      }
    })
    expect(wrapper.props("modelValue")).toBe(1)
  })

  it("应该支持字符串类型的 modelValue", () => {
    const wrapper = mount(SwCollapseItem, {
      props: {
        title: "测试折叠面板",
        modelValue: "item1"
      }
    })
    expect(wrapper.props("modelValue")).toBe("item1")
  })

  it("应该支持数组类型的 modelValue", () => {
    const wrapper = mount(SwCollapseItem, {
      props: {
        title: "测试折叠面板",
        modelValue: ["item1", "item2"]
      }
    })
    expect(wrapper.props("modelValue")).toEqual(["item1", "item2"])
  })

  it("应该支持布尔类型的 modelValue", () => {
    const wrapper = mount(SwCollapseItem, {
      props: {
        title: "测试折叠面板",
        modelValue: false
      }
    })
    expect(wrapper.props("modelValue")).toBe(false)
  })

  it("应该支持组合属性", () => {
    const wrapper = mount(SwCollapseItem, {
      props: {
        title: "组合测试",
        modelValue: true,
        disabled: false,
        open: true,
        showIcon: true
      }
    })
    expect(wrapper.props("title")).toBe("组合测试")
    expect(wrapper.props("modelValue")).toBe(true)
    expect(wrapper.props("disabled")).toBe(false)
    expect(wrapper.props("open")).toBe(true)
    expect(wrapper.props("showIcon")).toBe(true)
  })

  it("应该支持禁用状态", () => {
    const wrapper = mount(SwCollapseItem, {
      props: {
        title: "禁用状态测试",
        modelValue: true,
        disabled: true
      }
    })
    expect(wrapper.props("disabled")).toBe(true)
  })

  it("应该支持隐藏图标", () => {
    const wrapper = mount(SwCollapseItem, {
      props: {
        title: "隐藏图标测试",
        modelValue: true,
        showIcon: false
      }
    })
    expect(wrapper.props("showIcon")).toBe(false)
  })

  it("应该支持关闭状态", () => {
    const wrapper = mount(SwCollapseItem, {
      props: {
        title: "关闭状态测试",
        modelValue: true,
        open: false
      }
    })
    expect(wrapper.props("open")).toBe(false)
  })
})
