export type WorldContinentId =
  | "asia"
  | "europe"
  | "africa"
  | "north-america"
  | "south-america"
  | "oceania"
  | "antarctica";

export interface WorldContinentGroup {
  id: WorldContinentId;
  label: string;
  englishLabel: string;
  /**
   * Codes that exist in the root world GeoJSON.
   * These are safe to use for continent union/highlight on `/cdn/geo-world/world.json`.
   */
  codes: string[];
  /**
   * Codes that do not exist in the root world GeoJSON, but have dedicated country GeoJSON
   * or are useful as supplemental aliases for later region lookup.
   */
  supplementalCodes?: string[];
  /**
   * Notes for transcontinental or special-case assignments.
   */
  notes?: string[];
}

const unique = (codes: string[]) => Array.from(new Set(codes.filter(Boolean)));

/**
 * 世界地图大洲分组。
 *
 * 说明：
 * - 跨洲国家默认只归到一个大洲，避免做 union/outline 时出现二义性。
 * - `RUS`、`TUR`、`KAZ`、`ARM`、`AZE`、`GEO`、`CYP`、`-99` 默认归到亚洲。
 * - `SGP` 作为补充码位保留，因为仓库里有 `Singapore.json`，但根 `world.json` 里没有顶层新加坡要素。
 */
export const worldContinentGroups: WorldContinentGroup[] = [
  {
    id: "asia",
    label: "亚洲",
    englishLabel: "Asia",
    codes: unique([
      "-99",
      "100000",
      "AFG",
      "ARE",
      "ARM",
      "AZE",
      "BGD",
      "BRN",
      "BTN",
      "CYP",
      "GEO",
      "IDN",
      "IND",
      "IRN",
      "IRQ",
      "ISR",
      "JOR",
      "JPN",
      "KAZ",
      "KGZ",
      "KHM",
      "KOR",
      "KWT",
      "LAO",
      "LBN",
      "LKA",
      "MMR",
      "MNG",
      "MYS",
      "NPL",
      "OMN",
      "PAK",
      "PHL",
      "PRK",
      "PSE",
      "QAT",
      "RUS",
      "SAU",
      "SYR",
      "THA",
      "TJK",
      "TKM",
      "TLS",
      "TUR",
      "UZB",
      "VNM",
      "YEM"
    ]),
    supplementalCodes: unique(["SGP"]),
    notes: [
      "RUS/TUR/KAZ/ARM/AZE/GEO/CYP/-99 default to Asia to avoid cross-continent union ambiguity.",
      "SGP is supplemental-only because it is absent from the root world GeoJSON."
    ]
  },
  {
    id: "europe",
    label: "欧洲",
    englishLabel: "Europe",
    codes: unique([
      "ALB",
      "AUT",
      "BEL",
      "BGR",
      "BIH",
      "BLR",
      "CHE",
      "CZE",
      "DEU",
      "DNK",
      "ESP",
      "EST",
      "FIN",
      "FRA",
      "GBR",
      "GRC",
      "HRV",
      "HUN",
      "IRL",
      "ISL",
      "ITA",
      "LTU",
      "LUX",
      "LVA",
      "MDA",
      "MKD",
      "MNE",
      "NLD",
      "NOR",
      "OSA",
      "POL",
      "PRT",
      "ROU",
      "SRB",
      "SVK",
      "SVN",
      "SWE",
      "UKR"
    ])
  },
  {
    id: "africa",
    label: "非洲",
    englishLabel: "Africa",
    codes: unique([
      "ABV",
      "AGO",
      "BDI",
      "BEN",
      "BFA",
      "BWA",
      "CAF",
      "CIV",
      "CMR",
      "COD",
      "COG",
      "DJI",
      "DZA",
      "EGY",
      "ERI",
      "ESH",
      "ETH",
      "GAB",
      "GHA",
      "GIN",
      "GMB",
      "GNB",
      "GNQ",
      "KEN",
      "LBR",
      "LBY",
      "LSO",
      "MAR",
      "MDG",
      "MLI",
      "MOZ",
      "MRT",
      "MWI",
      "NAM",
      "NER",
      "NGA",
      "RWA",
      "SDN",
      "SDS",
      "SEN",
      "SLE",
      "SOM",
      "SWZ",
      "TCD",
      "TGO",
      "TUN",
      "TZA",
      "UGA",
      "ZAF",
      "ZMB",
      "ZWE"
    ])
  },
  {
    id: "north-america",
    label: "北美洲",
    englishLabel: "North America",
    codes: unique([
      "BHS",
      "BLZ",
      "CAN",
      "CRI",
      "CUB",
      "DOM",
      "GTM",
      "GRL",
      "HND",
      "HTI",
      "JAM",
      "MEX",
      "NIC",
      "PAN",
      "PRI",
      "SLV",
      "TTO",
      "USA"
    ])
  },
  {
    id: "south-america",
    label: "南美洲",
    englishLabel: "South America",
    codes: unique([
      "ARG",
      "BOL",
      "BRA",
      "CHL",
      "COL",
      "ECU",
      "FLK",
      "GUY",
      "PER",
      "PRY",
      "SUR",
      "URY",
      "VEN"
    ])
  },
  {
    id: "oceania",
    label: "大洋洲",
    englishLabel: "Oceania",
    codes: unique(["AUS", "FJI", "NCL", "NZL", "PNG", "SLB", "VUT"])
  },
  {
    id: "antarctica",
    label: "南极洲",
    englishLabel: "Antarctica",
    codes: unique(["ATF"])
  }
];

export const worldContinentGroupMap = new Map(worldContinentGroups.map((group) => [group.id, group]));

const buildWorldContinentCodeMap = (includeSupplemental = false) => {
  const codeMap = new Map<string, WorldContinentId>();

  worldContinentGroups.forEach((group) => {
    const codes = includeSupplemental ? [...group.codes, ...(group.supplementalCodes || [])] : group.codes;
    codes.forEach((code) => {
      codeMap.set(String(code), group.id);
    });
  });

  return codeMap;
};

export const worldContinentCodeToGroupId = buildWorldContinentCodeMap(false);
export const worldContinentCodeToGroupIdWithSupplemental = buildWorldContinentCodeMap(true);

export const getWorldContinentGroupById = (id?: string | null) => {
  if (!id) {
    return null;
  }

  return worldContinentGroupMap.get(id as WorldContinentId) || null;
};

export const getWorldContinentCodes = (
  id?: string | null,
  options: {
    includeSupplemental?: boolean;
  } = {}
) => {
  const group = getWorldContinentGroupById(id);
  if (!group) {
    return [];
  }

  if (options.includeSupplemental) {
    return unique([...group.codes, ...(group.supplementalCodes || [])]);
  }

  return [...group.codes];
};

export const getWorldContinentGroupByCode = (
  code?: string | null,
  options: {
    includeSupplemental?: boolean;
  } = {}
) => {
  if (!code) {
    return null;
  }

  const codeMap = options.includeSupplemental
    ? worldContinentCodeToGroupIdWithSupplemental
    : worldContinentCodeToGroupId;
  const groupId = codeMap.get(String(code));

  return groupId ? getWorldContinentGroupById(groupId) : null;
};

export const worldContinentOptions = worldContinentGroups.map((group) => ({
  label: group.label,
  value: group.id
}));
