import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import SwEmpty from "@/components/SwEmpty/index.vue"

describe("SwEmpty 组件测试", () => {
  it("应该正确渲染组件", () => {
    const wrapper = mount(SwEmpty)
    expect(wrapper.find(".ft_empty").exists()).toBe(true)
  })

  it("应该显示默认描述文本", () => {
    const wrapper = mount(SwEmpty)
    expect(wrapper.find(".ft_empty_desc").text()).toBe("暂无数据")
  })

  it("应该显示自定义描述文本", () => {
    const customDesc = "自定义空状态描述"
    const wrapper = mount(SwEmpty, {
      props: {
        desc: customDesc
      }
    })
    expect(wrapper.find(".ft_empty_desc").text()).toBe(customDesc)
  })

  it("应该显示自定义图片", () => {
    const customImage = "https://example.com/custom-image.png"
    const wrapper = mount(SwEmpty, {
      props: {
        image: customImage
      }
    })
    const img = wrapper.find("img")
    expect(img.attributes("src")).toBe(customImage)
  })

  it("应该设置自定义高度", () => {
    const customHeight = "200px"
    const wrapper = mount(SwEmpty, {
      props: {
        height: customHeight
      }
    })
    const imgContainer = wrapper.find(".ft_empty_img")
    expect(imgContainer.attributes("style")).toContain(`height: ${customHeight}`)
  })

  it("应该设置自定义字体大小", () => {
    const customFontSize = "16px"
    const wrapper = mount(SwEmpty, {
      props: {
        fontSize: customFontSize
      }
    })
    const desc = wrapper.find(".ft_empty_desc")
    expect(desc.attributes("style")).toContain(`font-size: ${customFontSize}`)
  })

  it("应该应用自定义图片样式", () => {
    const customImgStyle = { width: "50%", height: "50%" }
    const wrapper = mount(SwEmpty, {
      props: {
        imgStyle: customImgStyle
      }
    })
    const img = wrapper.find("img")
    expect(img.attributes("style")).toContain("width: 50%")
    expect(img.attributes("style")).toContain("height: 50%")
  })

  it("应该渲染默认插槽内容", () => {
    const wrapper = mount(SwEmpty, {
      slots: {
        default: "<button>重新加载</button>"
      }
    })
    expect(wrapper.find("button").exists()).toBe(true)
    expect(wrapper.find("button").text()).toBe("重新加载")
  })

  it("应该同时支持多个自定义属性", () => {
    const wrapper = mount(SwEmpty, {
      props: {
        height: "150px",
        desc: "没有找到数据",
        fontSize: "14px",
        image: "custom-image.png"
      }
    })
    expect(wrapper.find(".ft_empty_desc").text()).toBe("没有找到数据")
    expect(wrapper.find(".ft_empty_desc").attributes("style")).toContain("font-size: 14px")
    expect(wrapper.find(".ft_empty_img").attributes("style")).toContain("height: 150px")
    expect(wrapper.find("img").attributes("src")).toBe("custom-image.png")
  })
})
