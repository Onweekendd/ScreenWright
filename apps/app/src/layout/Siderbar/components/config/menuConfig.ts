import { URLKeys } from "./urlConfig";

export interface MenuItem {
  id: number | string;
  label: string;
  name: string;
  icon: string;
  children: MenuItem[];
  groupId?: number;
  pid?: number;
  count?: number;
  outsider: boolean;
  add: boolean;
  uuid?: string;
  ids?: number[];
}

export interface MenuConfig {
  [URLKeys.Display]: MenuItem[];
  [URLKeys.Source]: MenuItem[];
  [URLKeys.Map]: MenuItem[];
  [URLKeys.Assets]: MenuItem[];
  [URLKeys.InterfaceDebugger]: MenuItem[];
}

const menuConfig: MenuConfig = {
  // 数据管理
  [URLKeys.Source]: [
    {
      id: -2,
      label: "全部数据",
      name: "all",
      icon: "folder-close",
      children: [],
      outsider: true,
      add: false,
      uuid: "-2"
    },
    {
      id: -1,
      label: "数据分组",
      name: "grouped",
      icon: "folder-close",
      children: [],
      outsider: true,
      add: true,
      uuid: "-1"
    },
    {
      id: 0,
      label: "未分组",
      name: "ungrouped",
      icon: "folder-close",
      children: [],
      outsider: true,
      add: false,
      uuid: "0"
    }
  ],
  // 大屏应用 - 0是未分组 -1是除去未分组的 -2是所有的
  [URLKeys.Display]: [
    {
      id: -2,
      label: "全部应用",
      name: "all",
      icon: "folder-close",
      children: [],
      outsider: true,
      add: false,
      uuid: "-2"
    },
    {
      id: -1,
      label: "应用分组",
      name: "grouped",
      icon: "folder-close",
      children: [],
      outsider: true,
      add: true,
      uuid: "-1"
    },
    {
      id: 0,
      label: "未分组",
      name: "ungrouped",
      icon: "folder-close",
      children: [],
      outsider: true,
      add: false,
      uuid: "0"
    }
  ],
  // 三维场景 - 0是未分组 -1是除去未分组的 -2是所有的
  [URLKeys.Map]: [
    {
      id: -2,
      label: "全部场景",
      name: "all",
      icon: "folder-close",
      children: [],
      outsider: true,
      add: false,
      uuid: "-2"
    },
    {
      id: -1,
      label: "场景分组",
      name: "grouped",
      icon: "folder-close",
      children: [],
      outsider: true,
      add: true,
      uuid: "-1"
    },
    {
      id: 0,
      label: "未分组",
      name: "ungrouped",
      icon: "folder-close",
      children: [],
      outsider: true,
      add: false,
      uuid: "0"
    }
  ],
  // 资产
  [URLKeys.Assets]: [
    {
      id: 1,
      label: "页面资产",
      name: "pageGroups",
      icon: "folder-close",
      children: [
        {
          id: "0",
          pid: 1, // 对应页面资产的id
          label: "未分组",
          outsider: true,
          name: "",
          icon: "",
          children: [],
          add: false,
          uuid: "-2"
        }
      ],
      outsider: true,
      add: true,
      groupId: -2,
      uuid: "-22"
    }
    // 系统页面资产 / 场景资产 / 系统场景资产 / 其他资源(HDR)：依赖 Screenwright 内部素材云与自研三维引擎，开源版移除
  ],
  // 接口调试器 - 0是未分组 -1是除去未分组的 -2是所有的
  [URLKeys.InterfaceDebugger]: [
    {
      id: -2,
      label: "全部调试器",
      name: "all",
      icon: "folder-close",
      children: [],
      outsider: true,
      add: false,
      uuid: "-2"
    },
    {
      id: -1,
      label: "调试器分组",
      name: "grouped",
      icon: "folder-close",
      children: [],
      outsider: true,
      add: true,
      uuid: "-1"
    },
    {
      id: 0,
      label: "未分组",
      name: "ungrouped",
      icon: "folder-close",
      children: [],
      outsider: true,
      add: false,
      uuid: "0"
    }
  ]
};

export { menuConfig };
