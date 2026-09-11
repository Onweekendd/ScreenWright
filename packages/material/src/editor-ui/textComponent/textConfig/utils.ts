import type { ComponentPublicInstance } from "vue";

import { cloneDeep, isObject } from "lodash-es";

import { useUpdateInstance } from "../../useUpdateInstance";

const uuid = () => crypto.randomUUID().replace(/-/g, "");

/**
 * 给对象某个属性赋值
 * @param {object} obj 对象
 * @param {string} str 扁平化属性 如a.b.c[1].e
 * @param {any} value 赋值
 * @returns
 */
export function setFlatObj(obj: Record<string, any>, str: string, value: any) {
  if (!obj) {
    obj = {};
  }
  const attrs = str.replace(/[[\]]+/g, ".").split(".");
  let temp = obj;
  for (let i = 0; i < attrs.length; i++) {
    const n = attrs[i];
    if (n) {
      if (i === attrs.length - 1) {
        temp[n] = value;
      } else {
        if (!temp[n]) {
          temp[n] = {};
        }
        temp = temp[n];
      }
    }
  }
  return obj;
}

/**
 * 获取对象某个属性的值
 * @param {objec} obj 对象
 * @param {string} str 扁平化属性 如a.b.c[1].e
 * @returns
 */
export function getFlatObj(obj: Record<string, any>, str: string) {
  if (!obj) {
    obj = {};
  }
  let temp = obj;
  const attrs = str.replace(/[[\]]+/g, ".").split(".");
  for (let i = 0; i < attrs.length; i++) {
    const n = attrs[i];
    if (n) {
      if (i === attrs.length - 1) {
        return temp[n];
      } else {
        if (temp[n] === undefined) {
          return;
        }
        temp = temp[n];
      }
    }
  }
}

export const generateSeries = (
  val: "add" | "delete",
  list: string[],
  parent: ComponentPublicInstance,
  sName = "系列",
  tabKey = "seriesTabsName",
  selectTabKey = "seriesTabs",
  nameKey = "name",
  hasId?: boolean
) => {
  const { selectTargetData } = useUpdateInstance();
  const currentOption = selectTargetData.value[0].option;
  const tabs = currentOption[tabKey];
  const isObj = isObject(tabs[0]);
  const min = 1;
  const defaultTab = {};
  const defaultObj: Record<string, any> = {};

  const len = tabs.length;
  let index = 0;
  const currentTab = getFlatObj(parent, selectTabKey);

  if (isObj) {
    index = tabs.findIndex((it: any) => it[nameKey] == currentTab);
  } else {
    index = tabs.findIndex((it: any) => it == currentTab);
  }

  if (val === "add") {
    const newTabName = `${sName}${len + 1}`;
    if (isObj) {
      const last = cloneDeep(tabs[index] || defaultTab);
      last[nameKey] = newTabName;
      if (hasId) last.id = uuid();
      tabs.push(last);
    } else {
      tabs.push(newTabName);
    }

    const targetIndex = len === 0 ? 0 : index;
    list.forEach((item) => {
      try {
        const newItem =
          len === 0
            ? cloneDeep((defaultObj as Record<string, any>)[item] ?? {})
            : cloneDeep(currentOption[item][targetIndex]);

        if (!Array.isArray(currentOption[item])) {
          currentOption[item] = [newItem];
        } else {
          currentOption[item].push(newItem);
        }
      } catch (error) {
        console.log("clone error", item);
      }
    });

    setFlatObj(parent, selectTabKey, newTabName);
  } else if (val === "delete" && len > min) {
    list.forEach((item) => {
      try {
        if (Array.isArray(currentOption[item])) {
          currentOption[item]?.splice(index, 1);
        }
      } catch (error) {
        console.log("delete error", item);
      }
    });

    tabs.splice(index, 1);
    tabs.forEach((it: any, idx: number) => {
      if (isObj) {
        it[nameKey] = `${sName}${idx + 1}`;
      } else {
        tabs[idx] = `${sName}${idx + 1}`;
      }
    });

    if (index === len - 1) {
      const newValue = isObj ? tabs[tabs.length - 1][nameKey] : tabs[tabs.length - 1];
      setFlatObj(parent, selectTabKey, newValue);
    }
  }
};
