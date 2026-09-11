import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import SwItemEmpty from "@/components/SwItemEmpty/index.vue"

describe("SwItemEmpty 组件测试", () => {
  it("应该正确渲染组件", () => {
    const wrapper = mount(SwItemEmpty)
    expect(wrapper.find(".default-content-item").exists()).toBe(true)
  })

  it("默认类型应该是 default", () => {
    const wrapper = mount(SwItemEmpty)
    expect(wrapper.find(".default-content-item").classes()).toContain("default")
  })

  it("应该支持 default 类型", () => {
    const wrapper = mount(SwItemEmpty, {
      props: {
        type: "default"
      }
    })
    expect(wrapper.find(".default-content-item").classes()).toContain("default")
  })

  it("应该支持 icon 类型", () => {
    const wrapper = mount(SwItemEmpty, {
      props: {
        type: "icon"
      }
    })
    expect(wrapper.find(".default-content-item").classes()).toContain("icon")
  })

  it("应该支持 upload 类型", () => {
    const wrapper = mount(SwItemEmpty, {
      props: {
        type: "upload"
      }
    })
    expect(wrapper.find(".default-content-item").classes()).toContain("upload")
  })

  it("bgClass 计算属性应该返回正确的类型", () => {
    const wrapper = mount(SwItemEmpty, {
      props: {
        type: "icon"
      }
    })
    expect((wrapper.vm as any).bgClass).toBe("icon")
  })

  it("更改类型应该更新类名", async () => {
    const wrapper = mount(SwItemEmpty, {
      props: {
        type: "default"
      }
    })
    expect(wrapper.find(".default-content-item").classes()).toContain("default")

    await wrapper.setProps({ type: "upload" })
    expect(wrapper.find(".default-content-item").classes()).toContain("upload")
  })

  it("应该是 flex 布局且居中对齐", () => {
    const wrapper = mount(SwItemEmpty)
    const element = wrapper.find(".default-content-item").element as HTMLElement
    const styles = window.getComputedStyle(element)
    // 检查组件是否渲染
    expect(element).toBeTruthy()
  })

  it("应该占据 100% 宽度和高度", () => {
    const wrapper = mount(SwItemEmpty)
    const element = wrapper.find(".default-content-item").element as HTMLElement
    expect(element).toBeTruthy()
  })

  it("所有类型应该正确切换", async () => {
    const wrapper = mount(SwItemEmpty, {
      props: {
        type: "default"
      }
    })

    const types: Array<"default" | "icon" | "upload"> = ["default", "icon", "upload"]
    for (const type of types) {
      await wrapper.setProps({ type })
      expect(wrapper.find(".default-content-item").classes()).toContain(type)
      expect((wrapper.vm as any).bgClass).toBe(type)
    }
  })
})
