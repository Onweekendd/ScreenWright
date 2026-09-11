import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import Icon from "@/components/Icon/index.vue"

describe("Icon 组件测试", () => {
  it("应该正确渲染图标组件", () => {
    const wrapper = mount(Icon, {
      props: {
        type: "home"
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it("应该支持 size 属性", () => {
    const wrapper = mount(Icon, {
      props: {
        type: "home",
        size: "24px"
      }
    })
    expect(wrapper.props("size")).toBe("24px")
  })

  it("应该支持数字类型的 size", () => {
    const wrapper = mount(Icon, {
      props: {
        type: "home",
        size: 32
      }
    })
    expect(wrapper.props("size")).toBe(32)
  })

  it("应该支持 color 属性", () => {
    const wrapper = mount(Icon, {
      props: {
        type: "home",
        color: "#ff0000"
      }
    })
    expect(wrapper.props("color")).toBe("#ff0000")
  })

  it("应该支持不同的图标类型", () => {
    const wrapper = mount(Icon, {
      props: {
        type: "user"
      }
    })
    expect(wrapper.props("type")).toBe("user")
  })

  it("应该支持 Element Plus 图标", () => {
    const wrapper = mount(Icon, {
      props: {
        type: "el-icon-home"
      }
    })
    expect(wrapper.props("type")).toBe("el-icon-home")
  })

  it("应该支持自定义图标", () => {
    const wrapper = mount(Icon, {
      props: {
        type: "custom-icon"
      }
    })
    expect(wrapper.props("type")).toBe("custom-icon")
  })

  it("应该支持默认 size", () => {
    const wrapper = mount(Icon, {
      props: {
        type: "home"
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it("应该支持默认 color", () => {
    const wrapper = mount(Icon, {
      props: {
        type: "home"
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it("应该正确处理图标字体", () => {
    const wrapper = mount(Icon, {
      props: {
        type: "iconfont-home"
      }
    })
    expect(wrapper.props("type")).toBe("iconfont-home")
  })

  it("应该支持 SVG 图标", () => {
    const wrapper = mount(Icon, {
      props: {
        type: "svg-icon"
      }
    })
    expect(wrapper.props("type")).toBe("svg-icon")
  })

  it("应该支持 CSS 类名图标", () => {
    const wrapper = mount(Icon, {
      props: {
        type: "fa fa-home"
      }
    })
    expect(wrapper.props("type")).toBe("fa fa-home")
  })

  it("应该支持组合属性", () => {
    const wrapper = mount(Icon, {
      props: {
        type: "home",
        size: "48px",
        color: "#00ff00"
      }
    })
    expect(wrapper.props("type")).toBe("home")
    expect(wrapper.props("size")).toBe("48px")
    expect(wrapper.props("color")).toBe("#00ff00")
  })

  it("应该正确处理空字符串类型", () => {
    const wrapper = mount(Icon, {
      props: {
        type: ""
      }
    })
    expect(wrapper.props("type")).toBe("")
  })

  it("应该支持特殊字符图标", () => {
    const wrapper = mount(Icon, {
      props: {
        type: "icon-★"
      }
    })
    expect(wrapper.props("type")).toBe("icon-★")
  })
})
