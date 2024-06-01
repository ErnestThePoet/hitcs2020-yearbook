const { BMapGL } = window as any;

export function coordToPoint(coord: [number, number]) {
  return new BMapGL.Point(coord[0], coord[1]);
}
