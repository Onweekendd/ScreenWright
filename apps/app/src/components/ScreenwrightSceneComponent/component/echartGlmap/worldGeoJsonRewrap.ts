type GeoPoint = [number, number];

type GeoJsonGeometry =
  | {
      type: "Polygon";
      coordinates: GeoPoint[][];
    }
  | {
      type: "MultiPolygon";
      coordinates: GeoPoint[][][];
    };

interface WorldWrapFeature {
  type: string;
  id?: string | number;
  properties?: Record<string, any>;
  geometry?: { type: string; coordinates: any } | null;
  [key: string]: any;
}

interface WorldWrapFeatureCollection {
  type: string;
  features: WorldWrapFeature[];
  [key: string]: any;
}

interface WorldMapSourceLike {
  regionId?: string;
  geoJsonUrl?: string;
}

const EPSILON = 1e-7;
// Use a Pacific-style composition so the Americas stay on the right-hand side
// instead of splitting around China's exact central meridian.
export const DEFAULT_WORLD_WRAP_CENTER_LNG = 150;

const isFinitePoint = (point: any): point is GeoPoint => {
  return (
    Array.isArray(point) &&
    point.length >= 2 &&
    Number.isFinite(Number(point[0])) &&
    Number.isFinite(Number(point[1]))
  );
};

const isSamePoint = (a: GeoPoint, b: GeoPoint) => {
  return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON;
};

const dedupeOpenRing = (ring: GeoPoint[]) => {
  const nextRing: GeoPoint[] = [];
  ring.forEach((point) => {
    if (!nextRing.length || !isSamePoint(nextRing[nextRing.length - 1], point)) {
      nextRing.push([point[0], point[1]]);
    }
  });
  return nextRing;
};

const toOpenRing = (ring: any[]): GeoPoint[] => {
  const nextRing = ring
    .filter((point) => isFinitePoint(point))
    .map((point) => [Number(point[0]), Number(point[1])] as GeoPoint);

  if (nextRing.length > 1 && isSamePoint(nextRing[0], nextRing[nextRing.length - 1])) {
    nextRing.pop();
  }

  return dedupeOpenRing(nextRing);
};

const toClosedRing = (ring: GeoPoint[]) => {
  const nextRing = dedupeOpenRing(ring);
  if (nextRing.length < 3) {
    return [];
  }

  if (!isSamePoint(nextRing[0], nextRing[nextRing.length - 1])) {
    nextRing.push([nextRing[0][0], nextRing[0][1]]);
  }

  return nextRing;
};

const clipIntersectionAtX = (start: GeoPoint, end: GeoPoint, boundaryX: number): GeoPoint => {
  const dx = end[0] - start[0];
  if (Math.abs(dx) < EPSILON) {
    return [boundaryX, (start[1] + end[1]) / 2];
  }

  const t = (boundaryX - start[0]) / dx;
  return [boundaryX, start[1] + (end[1] - start[1]) * t];
};

const clipRingByVerticalBoundary = (ring: GeoPoint[], boundaryX: number, keepGreater: boolean): GeoPoint[] => {
  if (!ring.length) {
    return [];
  }

  const inside = (point: GeoPoint) => {
    return keepGreater ? point[0] >= boundaryX - EPSILON : point[0] <= boundaryX + EPSILON;
  };

  const output: GeoPoint[] = [];
  let previousPoint = ring[ring.length - 1];
  let previousInside = inside(previousPoint);

  ring.forEach((currentPoint) => {
    const currentInside = inside(currentPoint);

    if (currentInside !== previousInside) {
      output.push(clipIntersectionAtX(previousPoint, currentPoint, boundaryX));
    }

    if (currentInside) {
      output.push([currentPoint[0], currentPoint[1]]);
    }

    previousPoint = currentPoint;
    previousInside = currentInside;
  });

  return dedupeOpenRing(output);
};

export const wrapWorldLongitude = (lng: number, centerLng = DEFAULT_WORLD_WRAP_CENTER_LNG) => {
  const seamMinLng = centerLng - 180;
  let nextLng = lng;

  while (nextLng < seamMinLng) {
    nextLng += 360;
  }

  while (nextLng > seamMinLng + 360) {
    nextLng -= 360;
  }

  return nextLng;
};

const normalizeRing = (ring: any[], centerLng: number) => {
  const openRing = toOpenRing(ring);
  return toClosedRing(
    openRing.map(([lng, lat]) => [wrapWorldLongitude(lng, centerLng), lat] as GeoPoint)
  );
};

const unwrapRing = (ring: any[], centerLng: number) => {
  const openRing = toOpenRing(ring);
  if (!openRing.length) {
    return [];
  }

  const nextRing: GeoPoint[] = [];
  let previousLng = 0;

  openRing.forEach(([lng, lat], index) => {
    let nextLng = wrapWorldLongitude(lng, centerLng);
    if (index > 0) {
      while (nextLng - previousLng > 180) {
        nextLng -= 360;
      }

      while (nextLng - previousLng < -180) {
        nextLng += 360;
      }
    }

    nextRing.push([nextLng, lat]);
    previousLng = nextLng;
  });

  return nextRing;
};

const clipWrappedSimpleRing = (ring: any[], centerLng: number) => {
  const seamMinLng = centerLng - 180;
  const seamMaxLng = seamMinLng + 360;
  const unwrappedRing = unwrapRing(ring, centerLng);

  if (unwrappedRing.length < 3) {
    return [];
  }

  const results: GeoPoint[][] = [];
  const seen = new Set<string>();

  [-360, 0, 360].forEach((offset) => {
    const shiftedRing = unwrappedRing.map(([lng, lat]) => [lng + offset, lat] as GeoPoint);
    let clippedRing = clipRingByVerticalBoundary(shiftedRing, seamMinLng, true);
    clippedRing = clipRingByVerticalBoundary(clippedRing, seamMaxLng, false);
    const closedRing = toClosedRing(clippedRing);

    if (closedRing.length < 4) {
      return;
    }

    const ringKey = closedRing.map(([lng, lat]) => `${lng.toFixed(6)},${lat.toFixed(6)}`).join("|");
    if (seen.has(ringKey)) {
      return;
    }

    seen.add(ringKey);
    results.push(closedRing);
  });

  if (results.length) {
    return results;
  }

  const fallbackRing = normalizeRing(ring, centerLng);
  return fallbackRing.length ? [fallbackRing] : [];
};

const rewrapPolygonGeometry = (coordinates: GeoPoint[][], centerLng: number): GeoJsonGeometry | null => {
  if (!Array.isArray(coordinates) || !coordinates.length) {
    return null;
  }

  // First pass keeps polygon holes intact. Most world-country polygons here are single-ring.
  if (coordinates.length > 1) {
    const nextRings = coordinates.map((ring) => normalizeRing(ring, centerLng)).filter((ring) => ring.length >= 4);
    return nextRings.length
      ? {
          type: "Polygon",
          coordinates: nextRings
        }
      : null;
  }

  const nextPolygons = clipWrappedSimpleRing(coordinates[0], centerLng);
  if (!nextPolygons.length) {
    return null;
  }

  if (nextPolygons.length === 1) {
    return {
      type: "Polygon",
      coordinates: [nextPolygons[0]]
    };
  }

  return {
    type: "MultiPolygon",
    coordinates: nextPolygons.map((ring) => [ring])
  };
};

const rewrapMultiPolygonGeometry = (coordinates: GeoPoint[][][], centerLng: number): GeoJsonGeometry | null => {
  if (!Array.isArray(coordinates) || !coordinates.length) {
    return null;
  }

  const nextPolygons: GeoPoint[][][] = [];

  coordinates.forEach((polygon) => {
    if (!Array.isArray(polygon) || !polygon.length) {
      return;
    }

    if (polygon.length > 1) {
      const nextRings = polygon.map((ring) => normalizeRing(ring, centerLng)).filter((ring) => ring.length >= 4);
      if (nextRings.length) {
        nextPolygons.push(nextRings);
      }
      return;
    }

    const nextPieces = clipWrappedSimpleRing(polygon[0], centerLng);
    nextPieces.forEach((ring) => {
      nextPolygons.push([ring]);
    });
  });

  return nextPolygons.length
    ? {
        type: "MultiPolygon",
        coordinates: nextPolygons
      }
    : null;
};

const rewrapFeatureGeometry = (geometry: GeoJsonGeometry | null | undefined, centerLng: number): GeoJsonGeometry | null => {
  if (!geometry) {
    return null;
  }

  if (geometry.type === "Polygon") {
    return rewrapPolygonGeometry(geometry.coordinates, centerLng);
  }

  if (geometry.type === "MultiPolygon") {
    return rewrapMultiPolygonGeometry(geometry.coordinates, centerLng);
  }

  return geometry;
};

export const isWorldGeoJsonSource = (mapSource?: WorldMapSourceLike) => {
  const regionId = String(mapSource?.regionId || "").toLowerCase();
  const geoJsonUrl = String(mapSource?.geoJsonUrl || "");

  return regionId === "world" || /(^|\/)world\.json(?:[?#].*)?$/i.test(geoJsonUrl);
};

export const rewrapWorldFeatureCollection = <T extends WorldWrapFeatureCollection>(
  geoJson: T,
  centerLng = DEFAULT_WORLD_WRAP_CENTER_LNG
): T => {
  if (!geoJson?.features?.length) {
    return geoJson;
  }

  const nextFeatures = geoJson.features
    .map((feature) => {
      const nextGeometry = rewrapFeatureGeometry(feature.geometry as GeoJsonGeometry | null, centerLng);
      if (!nextGeometry) {
        return null;
      }

      return {
        ...feature,
        geometry: nextGeometry
      };
    })
    .filter(Boolean) as WorldWrapFeature[];

  return {
    ...geoJson,
    features: nextFeatures
  } as T;
};
