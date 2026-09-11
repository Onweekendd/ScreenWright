interface GeoJsonFeature {
  type: string;
  properties: Record<string, any>;
  geometry: {
    type: string;
    coordinates: any;
  };
  id?: string | number;
}

interface GeoJsonFeatureCollection {
  type: string;
  features: GeoJsonFeature[];
  [key: string]: any;
}

const geoJsonCache = new Map<string, GeoJsonFeatureCollection>();

const buildPublicAssetUrl = (url: string) => {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const publicPath = (process.env.PUBLIC_PATH || "/").replace(/\/?$/, "/");
  return `${publicPath}${url.replace(/^\/+/, "")}`;
};

const normalizeFeatureName = (properties: Record<string, any>) => {
  return (
    properties.name ||
    properties.NAME ||
    properties.admin ||
    properties.ADMIN ||
    properties.name_en ||
    properties.NAME_EN ||
    ""
  );
};

const normalizeFeatureCode = (properties: Record<string, any>) => {
  const adcode = properties.adcode || properties.ADCODE;
  if (adcode) {
    return String(adcode);
  }

  const adm1Code = properties.adm1_code || properties.adm1_cod_1;
  if (adm1Code && !String(adm1Code).includes("+99?")) {
    return String(adm1Code);
  }

  const iso3166 = properties.iso_3166_2;
  if (iso3166 && !String(iso3166).endsWith("-")) {
    return String(iso3166);
  }

  const isoA3 = properties.iso_a3 || properties.sov_a3 || properties.adm0_a3 || properties.gu_a3;
  if (isoA3) {
    return String(isoA3);
  }

  const isoA2 = properties.iso_a2;
  if (isoA2) {
    return String(isoA2);
  }

  return "";
};

const normalizeFeature = (feature: GeoJsonFeature): GeoJsonFeature | null => {
  const properties = feature.properties || {};
  const name = normalizeFeatureName(properties);
  const adcode = normalizeFeatureCode(properties);

  // Drop aggregate/minor-island features that do not work well as interactive regions.
  if (!name || !adcode) {
    return null;
  }

  return {
    ...feature,
    properties: {
      ...properties,
      name,
      adcode
    }
  };
};

const normalizeGeoJson = (geoJson: GeoJsonFeatureCollection): GeoJsonFeatureCollection => {
  const features = (geoJson.features || [])
    .map((feature) => normalizeFeature(feature))
    .filter((feature): feature is GeoJsonFeature => Boolean(feature));

  return {
    ...geoJson,
    type: geoJson.type || "FeatureCollection",
    features
  };
};

export const loadStaticGeoJson = async (url: string): Promise<GeoJsonFeatureCollection> => {
  const fullUrl = buildPublicAssetUrl(url);

  if (geoJsonCache.has(fullUrl)) {
    return geoJsonCache.get(fullUrl)!;
  }

  const response = await fetch(fullUrl);
  if (!response.ok) {
    throw new Error(`Failed to load GeoJSON: ${fullUrl}`);
  }

  const json = (await response.json()) as GeoJsonFeatureCollection;
  const normalized = normalizeGeoJson(json);
  geoJsonCache.set(fullUrl, normalized);
  return normalized;
};
