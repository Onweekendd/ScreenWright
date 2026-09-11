enum URLKeys {
  Source = "source",
  Display = "display",
  Map = "map",
  Assets = "assets",
  InterfaceDebugger = "interfaceDebugger",
  team = "team"
}

interface URLGroup {
  [URLKeys.Source]: string;
  [URLKeys.Display]: string;
  [URLKeys.Map]: string;
  [URLKeys.Assets]: string;
  [URLKeys.InterfaceDebugger]: string;
}

interface GroupURLConfig {
  base: URLGroup;
  get: URLGroup;
  create: URLGroup;
  update: URLGroup;
  delete: URLGroup;
}

const getGroupURL: GroupURLConfig = {
  base: {
    [URLKeys.Source]: "/data",
    [URLKeys.Display]: "/largeScreen",
    [URLKeys.Map]: "/scene",
    [URLKeys.Assets]: "/minioGroup",
    [URLKeys.InterfaceDebugger]: "/interface-debugger"
  },
  get: {
    [URLKeys.Source]: "/group/list",
    [URLKeys.Display]: "/group/list",
    [URLKeys.Map]: "/group/list",
    [URLKeys.Assets]: "/list",
    [URLKeys.InterfaceDebugger]: "/group/list"
  },
  create: {
    [URLKeys.Source]: "/group/add",
    [URLKeys.Display]: "/group/save",
    [URLKeys.Map]: "/group/save",
    [URLKeys.Assets]: "/add",
    [URLKeys.InterfaceDebugger]: "/group/save"
  },
  update: {
    [URLKeys.Source]: "/group/edit",
    [URLKeys.Display]: "/group/update",
    [URLKeys.Map]: "/group/update",
    [URLKeys.Assets]: "/edit",
    [URLKeys.InterfaceDebugger]: "/group/update"
  },
  delete: {
    [URLKeys.Source]: "/group/delete",
    [URLKeys.Display]: "/group/delete",
    [URLKeys.Map]: "/group/delete",
    [URLKeys.Assets]: "/delete",
    [URLKeys.InterfaceDebugger]: "/group/delete"
  }
};

export { getGroupURL, URLKeys };
export type { GroupURLConfig, URLGroup };
