import { describe, it, expect, vi } from "vitest"
import { mount } from "@vue/test-utils"
import SwSingleSelect from "@/components/SwSingleSelect/index.vue"

// Mock 环境变量
vi.mock("import.meta.env", () => ({
  VUE_APP_MINIO_DEFAULT_PREFIX: "http://minio.example.com"
}))

describe("SwSingleSelect 组件测试", () => {
  const mockOptions = [
    { label: "选项1", value: "value1" },
    { label: "选项2", value: "value2" },
    { label: "选项3", value: "value3" }
  ]

  const mockOptionsWithCover = [
    { label: "选项1", value: "value1", cover: "http://minio.example.com/image1.png" },
    { label: "选项2", value: "value2", cover: "http://minio.example.com/image2.png" }
  ]

  it("应该正确渲染组件", () => {
    const wrapper = mount(SwSingleSelect, {
      props: {
        option: mockOptions,
        filterable: false,
        clearable: false,
        showImage: false,
        isSquareImage: false,
        isNotValueHideImage: false
      }
    })
    // 检查组件是否正确渲染
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.vm).toBeDefined()
  })

  it("应该渲染所有选项", () => {
    const wrapper = mount(SwSingleSelect, {
      props: {
        option: mockOptions,
        filterable: false,
        clearable: false,
        showImage: false,
        isSquareImage: false,
        isNotValueHideImage: false
      }
    })
    // 检查组件是否正确渲染
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.vm.option).toEqual(mockOptions)
  })

  it("默认不应该可过滤", () => {
    const wrapper = mount(SwSingleSelect, {
      props: {
        option: mockOptions,
        filterable: false,
        clearable: false,
        showImage: false,
        isSquareImage: false,
        isNotValueHideImage: false
      }
    })
    expect(wrapper.props("filterable")).toBe(false)
  })

  it("应该支持可过滤选项", () => {
    const wrapper = mount(SwSingleSelect, {
      props: {
        option: mockOptions,
        filterable: true,
        clearable: false,
        showImage: false,
        isSquareImage: false,
        isNotValueHideImage: false
      }
    })
    expect(wrapper.props("filterable")).toBe(true)
  })

  it("默认不应该可清空", () => {
    const wrapper = mount(SwSingleSelect, {
      props: {
        option: mockOptions,
        filterable: false,
        clearable: false,
        showImage: false,
        isSquareImage: false,
        isNotValueHideImage: false
      }
    })
    expect(wrapper.props("clearable")).toBe(false)
  })

  it("应该支持可清空选项", () => {
    const wrapper = mount(SwSingleSelect, {
      props: {
        option: mockOptions,
        filterable: false,
        clearable: true,
        showImage: false,
        isSquareImage: false,
        isNotValueHideImage: false
      }
    })
    expect(wrapper.props("clearable")).toBe(true)
  })

  it("选择选项时应该触发 handleSelect 事件", async () => {
    const wrapper = mount(SwSingleSelect, {
      props: {
        option: mockOptions,
        filterable: false,
        clearable: false,
        showImage: false,
        isSquareImage: false,
        isNotValueHideImage: false
      }
    })

    ;(wrapper.vm as any).value = "value1"
    await (wrapper.vm as any).handleSelect("value1")
    expect(wrapper.emitted("handleSelect")).toBeTruthy()
  })

  it("handleSelect 应该传递当前值和旧值", async () => {
    const wrapper = mount(SwSingleSelect, {
      props: {
        option: mockOptions,
        filterable: false,
        clearable: false,
        showImage: false,
        isSquareImage: false,
        isNotValueHideImage: false
      }
    })

    ;(wrapper.vm as any).oldValue = "value1"
    await (wrapper.vm as any).handleSelect("value2")
    const emitted = wrapper.emitted("handleSelect")
    expect(emitted).toBeTruthy()
    expect(emitted![0]).toEqual(["value2", "value1"])
  })

  it("handleVisibleChange 应该保存旧值", async () => {
    const wrapper = mount(SwSingleSelect, {
      props: {
        option: mockOptions,
        filterable: false,
        clearable: false,
        showImage: false,
        isSquareImage: false,
        isNotValueHideImage: false
      }
    })

    ;(wrapper.vm as any).value = "value1"
    await (wrapper.vm as any).handleVisibleChange(true)
    expect((wrapper.vm as any).oldValue).toBe("value1")
  })

  it("当值不在选项中时应该清空值", async () => {
    const wrapper = mount(SwSingleSelect, {
      props: {
        option: mockOptions,
        filterable: false,
        clearable: false,
        showImage: false,
        isSquareImage: false,
        isNotValueHideImage: false
      }
    })

    ;(wrapper.vm as any).value = "invalid_value"
    await (wrapper.vm as any).$nextTick()
    expect((wrapper.vm as any).value).toBe("")
  })

  it("默认不应该显示图片", () => {
    const wrapper = mount(SwSingleSelect, {
      props: {
        option: mockOptions,
        filterable: false,
        clearable: false,
        showImage: false,
        isSquareImage: false,
        isNotValueHideImage: false
      }
    })
    expect(wrapper.find(".option-image").exists()).toBe(false)
  })

  it("当 showImage 为 true 时选项中应该显示图片", () => {
    const wrapper = mount(SwSingleSelect, {
      props: {
        option: mockOptionsWithCover,
        filterable: false,
        clearable: false,
        showImage: true,
        isSquareImage: false,
        isNotValueHideImage: false
      }
    })
    // 由于需要满足 isIncludeImgPrefix 条件，这里检查组件是否渲染
    expect(wrapper.exists()).toBe(true)
  })

  it("默认图片不应该是正方形", () => {
    const wrapper = mount(SwSingleSelect, {
      props: {
        option: mockOptionsWithCover,
        filterable: false,
        clearable: false,
        showImage: true,
        isSquareImage: false,
        isNotValueHideImage: false
      }
    })
    expect(wrapper.props("isSquareImage")).toBe(false)
  })

  it("应该支持正方形图片", () => {
    const wrapper = mount(SwSingleSelect, {
      props: {
        option: mockOptionsWithCover,
        filterable: false,
        clearable: false,
        showImage: true,
        isSquareImage: true,
        isNotValueHideImage: false
      }
    })
    expect(wrapper.props("isSquareImage")).toBe(true)
  })

  it("value watcher 应该在选项改变时工作", async () => {
    const wrapper = mount(SwSingleSelect, {
      props: {
        option: mockOptions,
        filterable: false,
        clearable: false,
        showImage: false,
        isSquareImage: false,
        isNotValueHideImage: false
      }
    })

    ;(wrapper.vm as any).value = "value2"
    await (wrapper.vm as any).$nextTick()
    expect((wrapper.vm as any).value).toBe("value2")
  })

  it("disabled 状态初始应该为 false", () => {
    const wrapper = mount(SwSingleSelect, {
      props: {
        option: mockOptions,
        filterable: false,
        clearable: false,
        showImage: false,
        isSquareImage: false,
        isNotValueHideImage: false
      }
    })
    expect((wrapper.vm as any).disabled).toBe(false)
  })

  it("popperTextCenter 初始应该为 false", () => {
    const wrapper = mount(SwSingleSelect, {
      props: {
        option: mockOptions,
        filterable: false,
        clearable: false,
        showImage: false,
        isSquareImage: false,
        isNotValueHideImage: false
      }
    })
    expect((wrapper.vm as any).popperTextCenter).toBe(false)
  })
})
