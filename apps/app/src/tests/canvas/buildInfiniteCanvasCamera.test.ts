import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { nextTick } from "vue";
import { mount } from "@vue/test-utils";

import BuildInfiniteCanvas from "@/views/build/components/buildInfiniteCanvas/index.vue";

const STORAGE_KEY = "funbi:build-camera:23587_1";

const mountCanvas = (persistKey?: string) =>
  mount(BuildInfiniteCanvas, {
    props: { persistKey, editWidth: 1920, editHeight: 1080 },
    attachTo: document.body
  });

const worldTransform = (wrapper: ReturnType<typeof mountCanvas>) =>
  (wrapper.find(".world").element as HTMLElement).style.transform;

/** 普通滚轮 = 平移；用 Ctrl 触发缩放 */
const wheel = async (wrapper: ReturnType<typeof mountCanvas>, init: WheelEventInit) => {
  await wrapper.find(".edit-screens").element.dispatchEvent(new WheelEvent("wheel", { cancelable: true, ...init }));
  await nextTick();
};

describe("无限画布：相机位置记忆", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("有存档时进入画布直接用存档的位置和缩放", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ x: -320, y: 88, zoom: 0.5 }));

    const wrapper = mountCanvas("23587_1");
    await nextTick();

    expect(worldTransform(wrapper)).toBe("translate(-320px, 88px) scale(0.5)");
    wrapper.unmount();
  });

  it("没有存档时不乱动，保持默认相机", async () => {
    const wrapper = mountCanvas("23587_1");
    await nextTick();

    expect(worldTransform(wrapper)).toBe("translate(0px, 0px) scale(1)");
    wrapper.unmount();
  });

  it("用户平移之后，停手一小会儿就把位置存下来", async () => {
    const wrapper = mountCanvas("23587_1");
    await nextTick();

    await wheel(wrapper, { deltaX: -40, deltaY: -25 });
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

    vi.advanceTimersByTime(400);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({ x: 40, y: 25, zoom: 1 });
    wrapper.unmount();
  });

  it("连续操作只在停手后存一次，存的是最后的位置", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const wrapper = mountCanvas("23587_1");
    await nextTick();

    await wheel(wrapper, { deltaX: -10, deltaY: 0 });
    vi.advanceTimersByTime(100);
    await wheel(wrapper, { deltaX: -10, deltaY: 0 });
    vi.advanceTimersByTime(100);
    await wheel(wrapper, { deltaX: -10, deltaY: 0 });
    expect(setItem).not.toHaveBeenCalled();

    vi.advanceTimersByTime(400);
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).x).toBe(30);
    setItem.mockRestore();
    wrapper.unmount();
  });

  it("缩放之后同样会存", async () => {
    const wrapper = mountCanvas("23587_1");
    await nextTick();

    await wheel(wrapper, { ctrlKey: true, deltaY: -200, clientX: 0, clientY: 0 });
    vi.advanceTimersByTime(400);

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).zoom).toBeGreaterThan(1);
    wrapper.unmount();
  });

  it("卸载画布时把还没存的位置立刻存下", async () => {
    const wrapper = mountCanvas("23587_1");
    await nextTick();
    await wheel(wrapper, { deltaX: -15, deltaY: -5 });

    wrapper.unmount();

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({ x: 15, y: 5, zoom: 1 });
  });

  it("没有 persistKey（面板 / 终端交互编辑器）时什么都不存", async () => {
    const wrapper = mountCanvas(undefined);
    await nextTick();

    await wheel(wrapper, { deltaX: -40, deltaY: -25 });
    vi.advanceTimersByTime(400);
    wrapper.unmount();

    expect(localStorage.length).toBe(0);
  });

  it("没有用户操作过时不存：自动适配的结果跟窗口大小有关，不该固化下来", async () => {
    const wrapper = mountCanvas("23587_1");
    await nextTick();

    vi.advanceTimersByTime(1000);
    wrapper.unmount();

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("点「复原」：回到自动适配，并忘掉存档", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ x: -320, y: 88, zoom: 0.5 }));
    const wrapper = mountCanvas("23587_1");
    await nextTick();

    await wrapper
      .findAll(".zoom-bar button")
      .find((button) => button.text() === "复原")!
      .trigger("click");
    vi.advanceTimersByTime(400);
    wrapper.unmount();

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("存档损坏（不是 JSON / 字段不对）时忽略，不抛错", async () => {
    localStorage.setItem(STORAGE_KEY, "{broken");

    const wrapper = mountCanvas("23587_1");
    await nextTick();

    expect(worldTransform(wrapper)).toBe("translate(0px, 0px) scale(1)");
    wrapper.unmount();
  });

  it("localStorage 不可用（隐私模式 / 被禁用）时画布照常工作", async () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });

    const wrapper = mountCanvas("23587_1");
    await nextTick();
    await wheel(wrapper, { deltaX: -40, deltaY: -25 });

    expect(() => vi.advanceTimersByTime(400)).not.toThrow();
    expect(worldTransform(wrapper)).toBe("translate(40px, 25px) scale(1)");
    wrapper.unmount();
    getItem.mockRestore();
    setItem.mockRestore();
  });

  it("画布先挂载、大屏 id 后加载出来时，也能恢复存档", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ x: -320, y: 88, zoom: 0.5 }));
    const wrapper = mountCanvas(undefined);
    await nextTick();
    expect(worldTransform(wrapper)).toBe("translate(0px, 0px) scale(1)");

    await wrapper.setProps({ persistKey: "23587_1" });

    expect(worldTransform(wrapper)).toBe("translate(-320px, 88px) scale(0.5)");
    wrapper.unmount();
  });

  it("切到另一个大屏：先存好上一个的位置，再换成新大屏的存档", async () => {
    localStorage.setItem("funbi:build-camera:2_1", JSON.stringify({ x: 7, y: 8, zoom: 2 }));
    const wrapper = mountCanvas("23587_1");
    await nextTick();
    await wheel(wrapper, { deltaX: -40, deltaY: -25 });

    await wrapper.setProps({ persistKey: "2_1" });

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({ x: 40, y: 25, zoom: 1 });
    expect(worldTransform(wrapper)).toBe("translate(7px, 8px) scale(2)");
    wrapper.unmount();
  });
});
