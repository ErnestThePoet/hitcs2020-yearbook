const { BMapGL } = window as any;

export function coordToPoint(coord: [number, number]) {
  return new BMapGL.Point(coord[0], coord[1]);
}

export function pointToCoord(point: any): [number, number] {
  return [point.lng, point.lat];
}
