import { describe, expect, it } from "vitest";

import { generateKeyBetween, generateNKeysBetween } from "../fractionalIndex";
import {
  assignOrderedZIndexes,
  compareZIndex,
  getBottomIndex,
  getIndexAbove,
  getIndexBelow,
  getIndexBetween,
  getTopIndex,
  INDEX_ZERO,
  isValidZIndex,
  legacyNumberToZIndex,
  maxZIndex,
  migrateLegacyZIndex,
  minZIndex,
  normalizeZIndex,
  sortByZIndex
} from "../zIndex";

const item = (zIndex: string, id = zIndex) => ({ id, zIndex });

describe("fractionalIndex（与上游算法对齐的已知值）", () => {
  it("两端都无界时给第一个键", () => {
    expect(generateKeyBetween(null, null)).toBe("a0");
  });

  it("向上/向下延伸", () => {
    expect(generateKeyBetween("a0", null)).toBe("a1");
    expect(generateKeyBetween(null, "a0")).toBe("Zz");
    expect(generateKeyBetween("az", null)).toBe("b00");
  });

  it("夹在两个键之间", () => {
    expect(generateKeyBetween("a0", "a1")).toBe("a0V");
    expect(generateKeyBetween("a0V", "a1")).toBe("a0l");
    expect(generateKeyBetween("Zz", "a0")).toBe("ZzV");
    expect(generateKeyBetween("Zz", "a1")).toBe("a0");
  });

  it("a >= b 或键非法时抛错", () => {
    expect(() => generateKeyBetween("a1", "a0")).toThrow();
    expect(() => generateKeyBetween("a1", "a1")).toThrow();
    expect(() => generateKeyBetween("a10", null)).toThrow();
    expect(() => generateKeyBetween("", null)).toThrow();
  });

  it("generateNKeysBetween 严格递增且都落在区间内", () => {
    const keys = generateNKeysBetween("a0", "a1", 20);
    expect(keys).toHaveLength(20);
    expect([...keys].sort()).toEqual(keys);
    expect(new Set(keys).size).toBe(20);
    expect(keys[0] > "a0").toBe(true);
    expect(keys[19] < "a1").toBe(true);
  });

  it("反复插在同一个位置，键始终保持有序", () => {
    let lower = "a0";
    const upper = "a1";
    const seen = [lower];
    for (let i = 0; i < 200; i += 1) {
      lower = generateKeyBetween(lower, upper);
      seen.push(lower);
    }
    expect([...seen].sort()).toEqual(seen);
  });
});

describe("zIndex 键", () => {
  it("INDEX_ZERO 是合法键", () => {
    expect(isValidZIndex(INDEX_ZERO)).toBe(true);
    expect(isValidZIndex("")).toBe(false);
    expect(isValidZIndex("a10")).toBe(false);
    expect(isValidZIndex(3)).toBe(false);
  });

  it("用字符串比较：位数更长的整数键整体更大（b00 > az）", () => {
    expect(compareZIndex("a1", "a2")).toBeLessThan(0);
    expect(compareZIndex("b00", "az")).toBeGreaterThan(0);
    expect(compareZIndex("a1", "a1")).toBe(0);
  });

  it("sortByZIndex：asc 下层在前，desc 上层在前，不改原数组", () => {
    const input = [item("a2"), item("a0"), item("a1")];
    expect(sortByZIndex(input).map((i) => i.zIndex)).toEqual(["a0", "a1", "a2"]);
    expect(sortByZIndex(input, "desc").map((i) => i.zIndex)).toEqual(["a2", "a1", "a0"]);
    expect(input.map((i) => i.zIndex)).toEqual(["a2", "a0", "a1"]);
  });

  it("sortByZIndex：同键保持原次序", () => {
    const input = [item("a1", "x"), item("a1", "y"), item("a0", "z")];
    expect(sortByZIndex(input).map((i) => i.id)).toEqual(["z", "x", "y"]);
  });

  it("maxZIndex / minZIndex：空数组返回 null", () => {
    expect(maxZIndex([])).toBeNull();
    expect(minZIndex([])).toBeNull();
    expect(maxZIndex([item("a1"), item("a3"), item("a2")])).toBe("a3");
    expect(minZIndex([item("a1"), item("a3"), item("a2")])).toBe("a1");
  });

  it("容器里有非法键（agent 手写的 a20）时，极值忽略它，getTopIndex / getBottomIndex 不抛错", () => {
    // a20：整数部分 a2，小数部分 0 以 0 结尾，是非法键。以前 getTopIndex 会在它上面生成键而抛
    // "invalid order key: a20"，一次批量创建 18 个组件全部失败
    const list = [item("a1"), item("a20"), item("a3")];

    expect(maxZIndex(list)).toBe("a3");
    expect(minZIndex(list)).toBe("a1");
    expect(() => getTopIndex(list)).not.toThrow();
    expect(getTopIndex(list) > "a3").toBe(true);
    expect(getBottomIndex(list) < "a1").toBe(true);
  });

  it("容器里全是非法键时当作空容器：给第一个键", () => {
    const list = [item("a20"), item("")];

    expect(maxZIndex(list)).toBeNull();
    expect(getTopIndex(list)).toBe(INDEX_ZERO);
  });

  it("getTopIndex / getBottomIndex：空容器给第一个键，否则越过现有的", () => {
    expect(getTopIndex([])).toBe(INDEX_ZERO);
    expect(getBottomIndex([])).toBe(INDEX_ZERO);
    const list = [item("a1"), item("a2")];
    expect(getTopIndex(list) > "a2").toBe(true);
    expect(getBottomIndex(list) < "a1").toBe(true);
  });

  it("getIndexAbove / Below / Between", () => {
    expect(getIndexAbove("a0") > "a0").toBe(true);
    expect(getIndexBelow("a0") < "a0").toBe(true);
    const mid = getIndexBetween("a0", "a1");
    expect(mid > "a0" && mid < "a1").toBe(true);
  });
});

describe("assignOrderedZIndexes", () => {
  it("次序已经对的不动，返回空数组", () => {
    const list = [item("a0"), item("a1"), item("a2")];
    expect(assignOrderedZIndexes(list)).toEqual([]);
    expect(list.map((i) => i.zIndex)).toEqual(["a0", "a1", "a2"]);
  });

  it("把最上面的挪到最下面：只改它一个", () => {
    const [a, b, c] = [item("a0", "a"), item("a1", "b"), item("a2", "c")];
    const changed = assignOrderedZIndexes([c, a, b]);
    expect(changed).toEqual([c]);
    expect(a.zIndex).toBe("a0");
    expect(b.zIndex).toBe("a1");
    expect(c.zIndex < "a0").toBe(true);
  });

  it("把最下面的挪到中间：只改它一个，且夹在邻居之间", () => {
    const [a, b, c] = [item("a0", "a"), item("a1", "b"), item("a2", "c")];
    const changed = assignOrderedZIndexes([b, a, c]);
    // a、b 谁动都行，但只能动一个
    expect(changed).toHaveLength(1);
    const ordered = [b, a, c].map((i) => i.zIndex);
    expect([...ordered].sort()).toEqual(ordered);
    expect(new Set(ordered).size).toBe(3);
  });

  it("重复键、非法键都会被改成有序的新键", () => {
    const list = [item("a1", "x"), item("a1", "y"), item("bad", "z"), item("a5", "w")];
    assignOrderedZIndexes(list);
    const keys = list.map((i) => i.zIndex);
    expect(keys.every(isValidZIndex)).toBe(true);
    expect([...keys].sort()).toEqual(keys);
    expect(new Set(keys).size).toBe(4);
  });

  it("全是新成员（键都不合法）时从头铺一遍", () => {
    const list = [item("", "x"), item("", "y"), item("", "z")];
    expect(assignOrderedZIndexes(list)).toHaveLength(3);
    const keys = list.map((i) => i.zIndex);
    expect([...keys].sort()).toEqual(keys);
  });
});

describe("旧数字 zIndex 的迁移", () => {
  it("保序：数字的大小关系 = 键的大小关系", () => {
    const numbers = [-200, -63, -62, -2, -1, 0, 1, 2, 9, 10, 61, 62, 63, 100, 3905, 3906, 99999, 12345678];
    const keys = numbers.map(legacyNumberToZIndex);
    expect(keys.every(isValidZIndex)).toBe(true);
    expect([...keys].sort()).toEqual(keys);
    expect(new Set(keys).size).toBe(numbers.length);
  });

  it("边界值与上游整数键一致", () => {
    expect(legacyNumberToZIndex(0)).toBe("a0");
    expect(legacyNumberToZIndex(1)).toBe("a1");
    expect(legacyNumberToZIndex(61)).toBe("az");
    expect(legacyNumberToZIndex(62)).toBe("b00");
    expect(legacyNumberToZIndex(-1)).toBe("Zz");
    expect(legacyNumberToZIndex(-62)).toBe("Z0");
    expect(legacyNumberToZIndex(-63)).toBe("Yzz");
  });

  it("相同数字得到相同键；小数向下取整；非有限数当 0", () => {
    expect(legacyNumberToZIndex(7)).toBe(legacyNumberToZIndex(7));
    expect(legacyNumberToZIndex(7.9)).toBe(legacyNumberToZIndex(7));
    expect(legacyNumberToZIndex(Number.NaN)).toBe("a0");
    expect(legacyNumberToZIndex(Number.POSITIVE_INFINITY)).toBe("a0");
  });

  it("迁移后的键之间还能继续插入", () => {
    const lower = legacyNumberToZIndex(3);
    const upper = legacyNumberToZIndex(4);
    const mid = getIndexBetween(lower, upper);
    expect(mid > lower && mid < upper).toBe(true);
  });

  it("normalizeZIndex：键原样返回，数字转换，其余回到第一个键", () => {
    expect(normalizeZIndex("a5")).toBe("a5");
    expect(normalizeZIndex(5)).toBe("a5");
    expect(normalizeZIndex(undefined)).toBe(INDEX_ZERO);
    expect(normalizeZIndex(null)).toBe(INDEX_ZERO);
    expect(normalizeZIndex("!bad")).toBe(INDEX_ZERO);
  });

  it("migrateLegacyZIndex：递归换掉组件树里的数字，幂等", () => {
    const tree = [
      {
        id: 1,
        zIndex: 3,
        component: { prop: "group" },
        children: [{ id: 2, zIndex: 1, component: { prop: "text" } }]
      },
      {
        id: 3,
        zIndex: 0,
        component: { prop: "dynamicPanel" },
        panelData: [{ config: [{ id: 4, zIndex: 2, component: { prop: "text" } }] }]
      }
    ];
    expect(migrateLegacyZIndex(tree)).toBe(true);
    expect(tree[0].zIndex).toBe("a3");
    expect(tree[0].children?.[0].zIndex).toBe("a1");
    expect(tree[1].zIndex).toBe("a0");
    expect(tree[1].panelData?.[0].config[0].zIndex).toBe("a2");
    expect(migrateLegacyZIndex(tree)).toBe(false);
  });

  it("migrateLegacyZIndex：没有 component 的对象（状态动画属性）不动；option/data 不进", () => {
    const tree = [
      {
        id: 1,
        zIndex: 1,
        component: { prop: "text" },
        option: { nested: { zIndex: 9, component: { prop: "x" } } },
        animation: { zIndex: 5 }
      }
    ];
    migrateLegacyZIndex(tree);
    expect(tree[0].zIndex).toBe("a1");
    expect(tree[0].option.nested.zIndex).toBe(9);
    expect(tree[0].animation.zIndex).toBe(5);
  });

  it("migrateLegacyZIndex：缺 zIndex 的组件不补", () => {
    const tree = [{ id: 1, component: { prop: "text" } }] as Array<Record<string, unknown>>;
    expect(migrateLegacyZIndex(tree)).toBe(false);
    expect("zIndex" in tree[0]).toBe(false);
  });
});
