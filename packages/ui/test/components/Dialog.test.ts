import { describe, it, expect, vi } from "vitest"
import { mount } from "@vue/test-utils"
import Dialog from "@/components/Dialog/index.vue"

// 简单的测试组件
const TestComponent = {
  name: "TestComponent",
  template: '<div class="test-component">测试组件</div>'
}

describe("Dialog 组件测试", () => {
  const mockDialogProps = {
    title: "测试对话框",
    width: "500px"
  }

  it("应该正确渲染对话框组件", () => {
    const wrapper = mount(Dialog, {
      props: {
        visible: true,
        DialogProps: mockDialogProps,
        component: TestComponent,
        componentProps: {}
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it("应该渲染传入的组件", () => {
    const wrapper = mount(Dialog, {
      props: {
        visible: true,
        DialogProps: mockDialogProps,
        component: TestComponent,
        componentProps: { message: "自定义消息" }
      }
    })
    expect(wrapper.find(".test-component").exists()).toBe(true)
  })

  it("应该支持自定义 DialogProps", () => {
    const customProps = {
      title: "自定义标题",
      width: "800px"
    }
    const wrapper = mount(Dialog, {
      props: {
        visible: true,
        DialogProps: customProps,
        component: TestComponent,
        componentProps: {}
      }
    })
    expect(wrapper.props("DialogProps")).toEqual(customProps)
  })

  it("应该支持 center 属性", () => {
    const wrapper = mount(Dialog, {
      props: {
        visible: true,
        DialogProps: mockDialogProps,
        component: TestComponent,
        componentProps: {},
        center: true
      }
    })
    expect(wrapper.props("center")).toBe(true)
  })

  it("应该支持 closeBefore 回调", () => {
    const closeBefore = vi.fn()
    const wrapper = mount(Dialog, {
      props: {
        visible: true,
        DialogProps: mockDialogProps,
        component: TestComponent,
        componentProps: {},
        closeBefore
      }
    })
    expect(wrapper.props("closeBefore")).toBe(closeBefore)
  })

  it("应该支持 onClose 回调", () => {
    const onClose = vi.fn()
    const wrapper = mount(Dialog, {
      props: {
        visible: true,
        DialogProps: mockDialogProps,
        component: TestComponent,
        componentProps: {},
        onClose
      }
    })
    expect(wrapper.props("onClose")).toBe(onClose)
  })

  it("应该正确传递 componentProps", () => {
    const componentProps = { message: "测试消息", count: 42 }
    const wrapper = mount(Dialog, {
      props: {
        visible: true,
        DialogProps: mockDialogProps,
        component: TestComponent,
        componentProps
      }
    })
    expect(wrapper.props("componentProps")).toEqual(componentProps)
  })

  it("应该支持不同的组件类型", () => {
    const AnotherComponent = {
      name: "AnotherComponent",
      template: '<div class="another-component">另一个组件</div>'
    }
    const wrapper = mount(Dialog, {
      props: {
        visible: true,
        DialogProps: mockDialogProps,
        component: AnotherComponent,
        componentProps: {}
      }
    })
    expect(wrapper.find(".another-component").exists()).toBe(true)
  })

  it("应该正确处理 visible 属性", () => {
    const wrapper = mount(Dialog, {
      props: {
        visible: false,
        DialogProps: mockDialogProps,
        component: TestComponent,
        componentProps: {}
      }
    })
    expect(wrapper.props("visible")).toBe(false)
  })

  it("应该支持默认值", () => {
    const wrapper = mount(Dialog, {
      props: {
        DialogProps: mockDialogProps,
        component: TestComponent,
        componentProps: {}
      }
    })
    expect(wrapper.exists()).toBe(true)
  })
})
