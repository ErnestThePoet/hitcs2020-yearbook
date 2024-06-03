import { InfoDetailItem } from "../api/interfaces";

class DetailedInfoCache {
  constructor() {
    this.cache = new Map();
  }

  private cache: Map<number, InfoDetailItem>;

  set(id: number, item: InfoDetailItem) {
    this.cache.set(id, item);
  }

  has(id: number): boolean {
    return this.cache.has(id);
  }

  get(id: number): InfoDetailItem | null {
    return this.cache.get(id) ?? null;
  }

  delete(id: number) {
    this.cache.delete(id);
  }
}

export default new DetailedInfoCache();
