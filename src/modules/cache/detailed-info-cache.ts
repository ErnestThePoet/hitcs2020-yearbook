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

  clearExcept(ids: number[]) {
    const newCache: typeof this.cache = new Map();

    for (const id of ids) {
      if (this.cache.has(id)) {
        newCache.set(id, this.cache.get(id)!);
      }
    }

    this.cache = newCache;
  }
}

export default new DetailedInfoCache();
