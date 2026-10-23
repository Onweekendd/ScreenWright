import { describe, expect, it } from "vitest";

import { sortByZIndex } from "@screenwright/core";

import { moveComponentInList } from "@/views/build/components/buildRender/hooks/layerOrder";
import type { ComponentType } from "@/views/build/components/buildRender/type";

const comp = (id: number, zIndex: string) => ({ id, zIndex }) as unknown as ComponentType;

/** 上层在前，和图层树 / moveComponentInList 的入参同一个次序 */
const desc = (...list: ComponentType[]) => sortByZIndex(list, "desc");
const idsTopToBottom = (list: ComponentType[]) => desc(...list).map((c) => c.id);

describe("moveComponentInList（图层上移/下移/置顶/置底）", () => {
  const make = () => [comp(1, "a3"), comp(2, "a2"), comp(3, "a1"), comp(4, "a0")];

  it("置顶：只改被挪的那一个，其余组件的 zIndex 原样不动", () => {
    const list = make();
    const before = new Map(list.map((c) => [c.id, c.zIndex]));
    const target = list[3];

    const changed = moveComponentInList(target, desc(...list), { direction: -1, moveToBoundary: true });

    expect(changed).toEqual([target]);
    expect(idsTopToBottom(list)).toEqual([4, 1, 2, 3]);
    list.filter((c) => c !== target).forEach((c) => expect(c.zIndex).toBe(before.get(c.id)));
  });

  it("置底：被挪的组件排到最底下", () => {
    const list = make();

    const changed = moveComponentInList(list[0], desc(...list), { direction: 1, moveToBoundary: true });

    expect(changed).toHaveLength(1);
    expect(idsTopToBottom(list)).toEqual([2, 3, 4, 1]);
  });

  it("上移一层：和上一层互换位置，且只改一个组件", () => {
    const list = make();

    const changed = moveComponentInList(list[2], desc(...list), { direction: -1 });

    expect(changed).toHaveLength(1);
    expect(idsTopToBottom(list)).toEqual([1, 3, 2, 4]);
  });

  it("下移一层", () => {
    const list = make();

    moveComponentInList(list[1], desc(...list), { direction: 1 });

    expect(idsTopToBottom(list)).toEqual([1, 3, 2, 4]);
  });

  it("已经在顶 / 在底时不动，返回 null", () => {
    const list = make();

    expect(moveComponentInList(list[0], desc(...list), { direction: -1 })).toBeNull();
    expect(moveComponentInList(list[0], desc(...list), { direction: -1, moveToBoundary: true })).toBeNull();
    expect(moveComponentInList(list[3], desc(...list), { direction: 1 })).toBeNull();
    expect(list.map((c) => c.zIndex)).toEqual(["a3", "a2", "a1", "a0"]);
  });

  it("找不到目标时返回 null", () => {
    const list = make();

    expect(moveComponentInList(comp(99, "a9"), desc(...list), { direction: -1 })).toBeNull();
  });

  it("兄弟之间 zIndex 有重复（旧数据里同层多个组件）也能挪成严格有序", () => {
    const list = [comp(1, "a1"), comp(2, "a1"), comp(3, "a1")];

    moveComponentInList(list[0], desc(...list), { direction: -1, moveToBoundary: true });

    const keys = desc(...list).map((c) => c.zIndex);
    expect(new Set(keys).size).toBe(3);
    expect([...keys].sort().reverse()).toEqual(keys);
  });

  it("反复挪动很多次，键之间依然严格有序、互不相同", () => {
    const list = make();
    for (let i = 0; i < 60; i += 1) {
      // 把最底下的挪到第二层、再挪回最底下
      moveComponentInList(list[3], desc(...list), { direction: -1 });
      moveComponentInList(list[3], desc(...list), { direction: 1 });
    }
    const keys = desc(...list).map((c) => c.zIndex);
    expect(new Set(keys).size).toBe(4);
    expect([...keys].sort().reverse()).toEqual(keys);
  });
});
