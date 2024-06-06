const { BMapGL } = window as any;

export function coordToPoint(coord: [number, number]) {
  return new BMapGL.Point(coord[0], coord[1]);
}

export function pointToCoord(point: any): [number, number] {
  return [point.lng, point.lat];
}

export function randomAround(point: any, lngRange = 0.2, latRange = 0.2) {
  return new BMapGL.Point(
    point.lng + (lngRange * Math.random() * 2 - lngRange),
    point.lat + (latRange * Math.random() * 2 - latRange)
  );
}
