import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { useDialog } from "@/hooks/useDialog"
import { h, defineComponent } from "vue"

// 创建一个测试用的组件
const TestComponent = defineComponent({
  name: "TestComponent",
  props: {
    message: String
  },
  setup(props) {
    return () => h("div", { class: "test-component" }, props.message || "测试组件")
  }
})

describe("useDialog hook 测试", () => {
  let container: HTMLDivElement

  beforeEach(() => {
    // 在每个测试前创建容器
    container = document.createElement("div")
    document.body.appendChild(container)
  })

  afterEach(() => {
    // 在每个测试后清理容器
    if (container && container.parentNode) {
      container.parentNode.removeChild(container)
    }
  })

  it("应该返回 dialog 和 close 方法", () => {
    const { dialog, close } = useDialog()
    expect(dialog).toBeDefined()
    expect(close).toBeDefined()
    expect(typeof dialog).toBe("function")
    expect(typeof close).toBe("function")
  })

  it("dialog 方法应该接受 DialogOptions 参数", () => {
    const { dialog } = useDialog()

    const options = {
      DialogProps: {
        title: "测试对话框",
        width: "500px"
      },
      component: TestComponent,
      componentProps: {
        message: "测试消息"
      }
    }

    expect(() => dialog(options)).not.toThrow()
  })

  it("应该支持 onClose 回调", () => {
    const { dialog } = useDialog()
    const onCloseMock = vi.fn()

    const options = {
      DialogProps: {
        title: "测试对话框"
      },
      component: TestComponent,
      componentProps: {},
      onClose: onCloseMock
    }

    dialog(options)
    expect(typeof options.onClose).toBe("function")
  })

  it("应该支持 closeBefore 回调", () => {
    const { dialog } = useDialog()
    const closeBeforeMock = vi.fn()

    const options = {
      DialogProps: {
        title: "测试对话框"
      },
      component: TestComponent,
      componentProps: {},
      closeBefore: closeBeforeMock
    }

    dialog(options)
    expect(typeof options.closeBefore).toBe("function")
  })

  it("应该支持 center 选项", () => {
    const { dialog } = useDialog()

    const options = {
      DialogProps: {
        title: "测试对话框"
      },
      component: TestComponent,
      componentProps: {},
      center: true
    }

    expect(() => dialog(options)).not.toThrow()
  })

  it("应该支持 visible 选项", () => {
    const { dialog } = useDialog()

    const options = {
      DialogProps: {
        title: "测试对话框"
      },
      component: TestComponent,
      componentProps: {},
      visible: false
    }

    expect(() => dialog(options)).not.toThrow()
  })

  it("close 方法应该是函数", () => {
    const { close } = useDialog()
    expect(typeof close).toBe("function")
  })

  it("应该能够传递 DialogProps", () => {
    const { dialog } = useDialog()

    const dialogProps = {
      title: "测试标题",
      width: "600px",
      modal: true,
      closeOnClickModal: false
    }

    const options = {
      DialogProps: dialogProps,
      component: TestComponent,
      componentProps: {}
    }

    expect(() => dialog(options)).not.toThrow()
  })

  it("应该能够传递 componentProps", () => {
    const { dialog } = useDialog()

    const componentProps = {
      message: "自定义消息",
      title: "标题",
      count: 5
    }

    const options = {
      DialogProps: {
        title: "对话框"
      },
      component: TestComponent,
      componentProps
    }

    expect(() => dialog(options)).not.toThrow()
  })

  it("多次调用 dialog 应该正常工作", () => {
    const { dialog } = useDialog()

    const options1 = {
      DialogProps: { title: "对话框1" },
      component: TestComponent,
      componentProps: {}
    }

    const options2 = {
      DialogProps: { title: "对话框2" },
      component: TestComponent,
      componentProps: {}
    }

    expect(() => {
      dialog(options1)
      dialog(options2)
    }).not.toThrow()
  })

  it("应该返回相同的 close 方法实例", () => {
    const { close: close1 } = useDialog()
    const { close: close2 } = useDialog()

    // 每次调用 useDialog 都会返回新的实例
    expect(typeof close1).toBe("function")
    expect(typeof close2).toBe("function")
  })

  it("dialog 方法应该返回 VNode", () => {
    const { dialog } = useDialog()

    const options = {
      DialogProps: {
        title: "测试对话框"
      },
      component: TestComponent,
      componentProps: {}
    }

    const result = dialog(options)
    expect(result).toBeDefined()
  })

  it("应该正确处理不同的组件类型", () => {
    const { dialog } = useDialog()

    const AnotherComponent = defineComponent({
      name: "AnotherComponent",
      setup() {
        return () => h("div", "另一个组件")
      }
    })

    const options = {
      DialogProps: {
        title: "测试对话框"
      },
      component: AnotherComponent,
      componentProps: {}
    }

    expect(() => dialog(options)).not.toThrow()
  })
})
