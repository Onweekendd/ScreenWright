import { afterEach, describe, expect, it, vi } from "vitest";

import { defineComponent, h, nextTick, provide, shallowRef } from "vue";
import { mount } from "@vue/test-utils";

import type { Rect } from "@screenwright/core";

import { VISIBLE_WORLD_RECT_KEY } from "@/views/build/components/buildInfiniteCanvas/canvasViewportContext";
import { withCullingSuspended } from "@/views/build/components/buildRender/hooks/cullingSuspend";
import { useCanvasCulling } from "@/views/build/components/buildRender/hooks/useCanvasCulling";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";
import type { ComponentType } from "@/views/build/components/buildRender/type";

const comp = (id: number, left: number, top: number, extra: Record<string, unknown> = {}) =>
  ({
    id,
    zIndex: "a0",
    left,
    top,
    component: { prop: "swtext", width: 100, height: 100 },
    ...extra
  }) as unknown as ComponentType;

const VISIBLE: Rect = { x: 0, y: 0, width: 1000, height: 600 };

/** 在一个提供了可视窗口的父组件下跑 useCanvasCulling */
const setup = (list: ComponentType[], options: { visible?: Rect | null; enabled?: () => boolean } = {}) => {
  const visibleRect = shallowRef<Rect | null>(options.visible === undefined ? VISIBLE : options.visible);
  let result!: ReturnType<typeof useCanvasCulling>;
  const Child = defineComponent({
    setup() {
      result = useCanvasCulling(
        () => list,
        options.enabled ?? (() => true),
        () => ({ width: 1920, height: 1080 })
      );
      return () => h("div");
    }
  });
  const Parent = defineComponent({
    setup() {
      provide(VISIBLE_WORLD_RECT_KEY, visibleRect);
      return () => h(Child);
    }
  });
  const wrapper = mount(Parent);
  return { wrapper, visibleRect, culled: () => [...result.culledIds.value].sort() };
};

describe("useCanvasCulling", () => {
  afterEach(() => {
    useEditStore().targetChart.value.selectId = [];
  });

  it("窗口内的组件不隐藏，完全移出窗口的隐藏", () => {
    const { culled } = setup([comp(1, 100, 100), comp(2, 5000, 100), comp(3, 100, 9000)]);

    expect(culled()).toEqual(["2", "3"]);
  });

  it("可视窗口移动后重新计算：滑回来的组件取消隐藏", async () => {
    const { culled, visibleRect } = setup([comp(1, 5000, 100)]);
    expect(culled()).toEqual(["1"]);

    visibleRect.value = { x: 4800, y: 0, width: 1000, height: 600 };
    await nextTick();

    expect(culled()).toEqual([]);
  });

  it("刚滑出窗口一点点的组件还留着（有边距），滑远了才隐藏", () => {
    const nearEdge = comp(1, 1040, 100);
    const far = comp(2, 1500, 100);

    const { culled } = setup([nearEdge, far]);

    expect(culled()).toEqual(["2"]);
  });

  it("选中的组件不隐藏，即使它在窗口外", () => {
    useEditStore().targetChart.value.selectId = ["2"];
    const { culled } = setup([comp(1, 5000, 0), comp(2, 5000, 100)]);

    expect(culled()).toEqual(["1"]);
  });

  it("容器里有成员被选中时，整个容器不隐藏", () => {
    const member = comp(21, 0, 0);
    const group = comp(2, 5000, 100, { children: [member] });
    useEditStore().targetChart.value.selectId = ["21"];

    const { culled } = setup([group, comp(3, 5000, 400)]);

    expect(culled()).toEqual(["3"]);
  });

  it("带旋转的组件按更大的范围判断，不会因为包围盒没算旋转而被误隐藏", () => {
    // 100×100 的组件，右边缘在窗口左边 160 处（边距只有 100），不转就是完全在外；转起来后包围盒外扩一圈，会伸进边距
    const rotated = comp(1, -260, 100, { option: { rotateZ: 45 } });
    const plain = comp(2, -260, 100);

    const { culled } = setup([rotated, plain]);

    expect(culled()).toEqual(["2"]);
  });

  it("百分比单位的组件按画板尺寸换算", () => {
    // 50% × 1920 = 960，在 1000 宽的窗口内
    const percent = comp(1, 50, 0, { unitPavenType: "percent", component: { prop: "swtext", width: 10, height: 10 } });

    expect(setup([percent]).culled()).toEqual([]);
  });

  it("没有可视窗口（不在无限画布里 / 还没量出尺寸）时一个都不隐藏", () => {
    expect(setup([comp(1, 99999, 99999)], { visible: null }).culled()).toEqual([]);
  });

  it("enabled 为 false（只读预览）时不隐藏", () => {
    expect(setup([comp(1, 99999, 99999)], { enabled: () => false }).culled()).toEqual([]);
  });

  it("没有画布提供窗口（直接用在别处）时不隐藏，也不报错", () => {
    let result!: ReturnType<typeof useCanvasCulling>;
    mount(
      defineComponent({
        setup() {
          result = useCanvasCulling(
            () => [comp(1, 99999, 99999)],
            () => true,
            () => ({ width: 1920, height: 1080 })
          );
          return () => h("div");
        }
      })
    );

    expect(result.culledIds.value.size).toBe(0);
  });
});

describe("withCullingSuspended", () => {
  it("task 执行期间暂停裁剪，结束后恢复", async () => {
    const { culled } = setup([comp(1, 5000, 100)]);
    expect(culled()).toEqual(["1"]);

    let duringTask: string[] = [];
    await withCullingSuspended(async () => {
      duringTask = culled();
    });

    expect(duringTask).toEqual([]);
    await nextTick();
    expect(culled()).toEqual(["1"]);
  });

  it("task 抛错也要恢复裁剪", async () => {
    const { culled } = setup([comp(1, 5000, 100)]);

    await expect(
      withCullingSuspended(async () => {
        throw new Error("截图失败");
      })
    ).rejects.toThrow("截图失败");

    await nextTick();
    expect(culled()).toEqual(["1"]);
  });

  it("返回 task 的结果", async () => {
    await expect(withCullingSuspended(async () => 42)).resolves.toBe(42);
  });

  it("有组件被隐藏过时，会多等几帧让它们重新渲染出来再执行 task", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("requestAnimationFrame", (cb: () => void) => setTimeout(cb, 16));
    try {
      const { culled } = setup([comp(1, 5000, 100)]);
      expect(culled()).toEqual(["1"]);

      let ran = false;
      const pending = withCullingSuspended(async () => {
        ran = true;
      });
      await vi.advanceTimersByTimeAsync(10);
      expect(ran).toBe(false);
      await vi.advanceTimersByTimeAsync(400);
      await pending;

      expect(ran).toBe(true);
    } finally {
      vi.unstubAllGlobals();
      vi.useRealTimers();
    }
  });
});
