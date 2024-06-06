import { InfoDetailItem } from "../api/interfaces";

class DetailedInfoCache {
  constructor() {
    this.cache = new Map();
  }

  private cache: Map<string, InfoDetailItem>;

  set(studentId: string, item: InfoDetailItem) {
    this.cache.set(studentId, item);
  }

  has(studentId: string): boolean {
    return this.cache.has(studentId);
  }

  get(studentId: string): InfoDetailItem | null {
    return this.cache.get(studentId) ?? null;
  }

  delete(studentId: string) {
    this.cache.delete(studentId);
  }
}

export default new DetailedInfoCache();
