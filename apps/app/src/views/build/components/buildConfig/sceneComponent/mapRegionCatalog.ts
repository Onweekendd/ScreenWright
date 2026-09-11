import { provinceToCity } from "./provinceToCity";

export type MapRegionProvider = "china-adcode" | "geojson-file";

export interface MapRegionSelection {
  id: string;
  name: string;
  adcode: string;
  provider: MapRegionProvider;
  geoJsonUrl?: string;
  allowDrillDown: boolean;
}

export interface MapRegionTreeNode extends MapRegionSelection {
  label: string;
  value: string;
  children?: MapRegionTreeNode[];
}

interface LegacyRegionNode {
  label: string;
  value: string;
  children?: LegacyRegionNode[];
}

interface CountryRegionSeed {
  id: string;
  label: string;
  adcode: string;
  geoJsonUrl: string;
}

const chinaRootSource = provinceToCity[0] as LegacyRegionNode | undefined;

const countryRegionSeeds: CountryRegionSeed[] = [
  {
    id: "world",
    label: "世界地图",
    adcode: "WORLD",
    geoJsonUrl: "/cdn/geo-world/world.json"
  },
  {
    id: "country:USA",
    label: "美国",
    adcode: "USA",
    geoJsonUrl: "/cdn/geo-world/USA.json"
  },
  {
    id: "country:CAN",
    label: "加拿大",
    adcode: "CAN",
    geoJsonUrl: "/cdn/geo-world/Canada.json"
  },
  {
    id: "country:JPN",
    label: "日本",
    adcode: "JPN",
    geoJsonUrl: "/cdn/geo-world/Japan.json"
  },
  {
    id: "country:AUS",
    label: "澳大利亚",
    adcode: "AUS",
    geoJsonUrl: "/cdn/geo-world/Australia.json"
  },
  {
    id: "country:DEU",
    label: "德国",
    adcode: "DEU",
    geoJsonUrl: "/cdn/geo-world/German.json"
  },
  {
    id: "country:FRA",
    label: "法国",
    adcode: "FRA",
    geoJsonUrl: "/cdn/geo-world/France.json"
  },
  {
    id: "country:IND",
    label: "印度",
    adcode: "IND",
    geoJsonUrl: "/cdn/geo-world/India.json"
  },
  {
    id: "country:RUS",
    label: "俄罗斯",
    adcode: "RUS",
    geoJsonUrl: "/cdn/geo-world/Russia.json"
  },
  {
    id: "country:BRA",
    label: "巴西",
    adcode: "BRA",
    geoJsonUrl: "/cdn/geo-world/Brazil.json"
  },
  {
    id: "country:KOR",
    label: "韩国",
    adcode: "KOR",
    geoJsonUrl: "/cdn/geo-world/SouthKorea.json"
  },
  {
    id: "country:SGP",
    label: "新加坡",
    adcode: "SGP",
    geoJsonUrl: "/cdn/geo-world/Singapore.json"
  },
  {
    id: "country:NZL",
    label: "新西兰",
    adcode: "NZL",
    geoJsonUrl: "/cdn/geo-world/NewZealand.json"
  },
  {
    id: "country:NOR",
    label: "挪威",
    adcode: "NOR",
    geoJsonUrl: "/cdn/geo-world/Norway.json"
  },
  {
    id: "country:FIN",
    label: "芬兰",
    adcode: "FIN",
    geoJsonUrl: "/cdn/geo-world/Finland.json"
  },
  {
    id: "country:SWE",
    label: "瑞典",
    adcode: "SWE",
    geoJsonUrl: "/cdn/geo-world/Sweden.json"
  },
  {
    id: "country:CHE",
    label: "瑞士",
    adcode: "CHE",
    geoJsonUrl: "/cdn/geo-world/Swiss.json"
  },
  {
    id: "country:ESP",
    label: "西班牙",
    adcode: "ESP",
    geoJsonUrl: "/cdn/geo-world/Spain.json"
  },
  {
    id: "country:PRT",
    label: "葡萄牙",
    adcode: "PRT",
    geoJsonUrl: "/cdn/geo-world/Portugal.json"
  },
  {
    id: "country:NLD",
    label: "荷兰",
    adcode: "NLD",
    geoJsonUrl: "/cdn/geo-world/Netheland.json"
  },
  {
    id: "country:ISL",
    label: "冰岛",
    adcode: "ISL",
    geoJsonUrl: "/cdn/geo-world/Iceland.json"
  },
  {
    id: "country:ZAF",
    label: "南非",
    adcode: "ZAF",
    geoJsonUrl: "/cdn/geo-world/SouthAfrica.json"
  },
  {
    id: "country:ENG",
    label: "英格兰",
    adcode: "GBR",
    geoJsonUrl: "/cdn/geo-world/England.json"
  }
];

const createChinaTree = (nodes: LegacyRegionNode[] = []): MapRegionTreeNode[] => {
  return nodes.map((node) => ({
    id: String(node.value),
    value: String(node.value),
    label: node.label,
    name: node.label,
    adcode: String(node.value),
    provider: "china-adcode",
    allowDrillDown: true,
    children: node.children ? createChinaTree(node.children) : undefined
  }));
};

const chinaRootNode: MapRegionTreeNode = {
  id: "china",
  value: "china",
  label: chinaRootSource?.label || "中华人民共和国",
  name: chinaRootSource?.label || "中华人民共和国",
  adcode: "100000",
  provider: "china-adcode",
  allowDrillDown: true,
  children: createChinaTree(chinaRootSource?.children || [])
};

const countryNodes: MapRegionTreeNode[] = countryRegionSeeds.map((seed) => ({
  id: seed.id,
  value: seed.id,
  label: seed.label,
  name: seed.label,
  adcode: seed.adcode,
  provider: "geojson-file",
  geoJsonUrl: seed.geoJsonUrl,
  allowDrillDown: seed.id === "world"
}));

export const mapRegionCatalog: MapRegionTreeNode[] = [countryNodes[0], chinaRootNode, ...countryNodes.slice(1)];

const toSelection = (node: MapRegionTreeNode): MapRegionSelection => ({
  id: node.id,
  name: node.name,
  adcode: node.adcode,
  provider: node.provider,
  geoJsonUrl: node.geoJsonUrl,
  allowDrillDown: node.allowDrillDown
});

const findNodeBy = (
  nodes: MapRegionTreeNode[],
  predicate: (node: MapRegionTreeNode) => boolean
): MapRegionTreeNode | null => {
  for (const node of nodes) {
    if (predicate(node)) {
      return node;
    }
    if (node.children?.length) {
      const found = findNodeBy(node.children, predicate);
      if (found) {
        return found;
      }
    }
  }

  return null;
};

const findPathByValue = (
  value: string,
  nodes: MapRegionTreeNode[],
  path: MapRegionTreeNode[] = []
): MapRegionTreeNode[] | null => {
  for (const node of nodes) {
    const nextPath = [...path, node];
    if (node.value === value) {
      return nextPath;
    }
    if (node.children?.length) {
      const found = findPathByValue(value, node.children, nextPath);
      if (found) {
        return found;
      }
    }
  }

  return null;
};

export const getDefaultMapRegionSelection = (): MapRegionSelection => toSelection(chinaRootNode);

export const getMapRegionPath = (value: string): MapRegionSelection[] => {
  const path = findPathByValue(value, mapRegionCatalog);
  if (!path) {
    return [getDefaultMapRegionSelection()];
  }

  return path.map(toSelection);
};

export const findMapRegionByAdcode = (adcode?: string): MapRegionTreeNode | null => {
  if (!adcode) {
    return null;
  }

  return findNodeBy(mapRegionCatalog, (node) => node.adcode === String(adcode));
};

export const findMapRegionById = (id?: string): MapRegionTreeNode | null => {
  if (!id) {
    return null;
  }

  return findNodeBy(mapRegionCatalog, (node) => node.id === id);
};

export const resolveChinaRegionSelectionByAdcode = (adcode?: string): MapRegionSelection | null => {
  const node = findNodeBy(
    mapRegionCatalog,
    (item) => item.provider === "china-adcode" && item.adcode === String(adcode)
  );

  return node ? toSelection(node) : null;
};

export const resolveMapRegionSelectionByAdcode = (adcode?: string): MapRegionSelection | null => {
  const node = findMapRegionByAdcode(adcode);
  return node ? toSelection(node) : null;
};

export const normalizeMapRegionSelection = (
  raw?: Partial<MapRegionSelection> & Record<string, any>
): MapRegionSelection => {
  if (!raw) {
    return getDefaultMapRegionSelection();
  }

  const byId = raw.id ? findMapRegionById(String(raw.id)) : null;
  if (byId) {
    return toSelection(byId);
  }

  const byAdcode = raw.adcode ? findMapRegionByAdcode(String(raw.adcode)) : null;
  if (byAdcode) {
    return toSelection(byAdcode);
  }

  if (raw.provider === "geojson-file") {
    return {
      id: String(raw.id || raw.adcode || raw.geoJsonUrl || "custom-geojson"),
      name: String(raw.name || raw.label || "自定义区域"),
      adcode: String(raw.adcode || raw.id || "CUSTOM"),
      provider: "geojson-file",
      geoJsonUrl: raw.geoJsonUrl,
      allowDrillDown: false
    };
  }

  return {
    id: String(raw.id || raw.adcode || "china"),
    name: String(raw.name || raw.label || "中华人民共和国"),
    adcode: String(raw.adcode || "100000"),
    provider: "china-adcode",
    allowDrillDown: raw.allowDrillDown !== false
  };
};

export const getCurrentMapRegionSelection = (data?: any[]): MapRegionSelection => {
  if (!data?.length) {
    return getDefaultMapRegionSelection();
  }

  return normalizeMapRegionSelection(data[data.length - 1]);
};

export const getMapRegionModelValue = (data?: any[]): { label: string; value: string } => {
  const region = getCurrentMapRegionSelection(data);
  return {
    label: region.name,
    value: region.id
  };
};

export const isChinaMapRegion = (region?: Partial<MapRegionSelection> | null) => {
  return normalizeMapRegionSelection(region as MapRegionSelection).provider === "china-adcode";
};
