import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import Pagination from "@/components/Pagination/index.vue"

describe("Pagination 组件测试", () => {
  it("应该正确渲染分页组件", () => {
    const wrapper = mount(Pagination, {
      props: {
        pageNum: 1,
        pageSize: 10,
        total: 100
      }
    })
    expect(wrapper.find(".fant-pagination").exists()).toBe(true)
  })

  it("应该正确显示总数", () => {
    const wrapper = mount(Pagination, {
      props: {
        pageNum: 1,
        pageSize: 10,
        total: 50
      }
    })
    expect(wrapper.props("total")).toBe(50)
  })

  it("当页码改变时应该触发 update:pageNum 事件", async () => {
    const wrapper = mount(Pagination, {
      props: {
        pageNum: 1,
        pageSize: 10,
        total: 100
      }
    })

    // 通过 computed 属性的 setter 触发事件
    ;(wrapper.vm as any).currentPage = 2
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted("update:pageNum")).toBeTruthy()
  })

  it("当每页大小改变时应该触发 update:pageSize 事件", async () => {
    const wrapper = mount(Pagination, {
      props: {
        pageNum: 1,
        pageSize: 10,
        total: 100
      }
    })

    // 通过 computed 属性的 setter 触发事件
    ;(wrapper.vm as any).pageSize = 20
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted("update:pageSize")).toBeTruthy()
  })

  it("应该触发 pagination 事件并传递正确的参数", async () => {
    const wrapper = mount(Pagination, {
      props: {
        pageNum: 1,
        pageSize: 10,
        total: 100
      }
    })

    await (wrapper.vm as any).currentChange(3)
    const paginationEvents = wrapper.emitted("pagination")
    expect(paginationEvents).toBeTruthy()
    expect(paginationEvents![0]).toEqual([{ page: 3, pageSize: 10 }])
  })

  it("计算属性 currentPage 应该正确工作", () => {
    const wrapper = mount(Pagination, {
      props: {
        pageNum: 5,
        pageSize: 10,
        total: 100
      }
    })
    expect((wrapper.vm as any).currentPage).toBe(5)
  })

  it("计算属性 pageSize 应该正确工作", () => {
    const wrapper = mount(Pagination, {
      props: {
        pageNum: 1,
        pageSize: 20,
        total: 100
      }
    })
    expect((wrapper.vm as any).pageSize).toBe(20)
  })

  it("更改 currentPage 计算属性应该触发 update:pageNum", async () => {
    const wrapper = mount(Pagination, {
      props: {
        pageNum: 1,
        pageSize: 10,
        total: 100
      }
    })
    ;(wrapper.vm as any).currentPage = 3
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted("update:pageNum")).toBeTruthy()
  })

  it("更改 pageSize 计算属性应该触发 update:pageSize", async () => {
    const wrapper = mount(Pagination, {
      props: {
        pageNum: 1,
        pageSize: 10,
        total: 100
      }
    })
    ;(wrapper.vm as any).pageSize = 25
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted("update:pageSize")).toBeTruthy()
  })
})
