import { Maybe } from "./types";

function stringCompare(a: string, b: string): number {
  if (a < b) {
    return -1;
  } else if (a === b) {
    return 0;
  } else {
    return 1;
  }
}

function getNested<T>(obj: any, keys: string[]): Maybe<T> {
  let result: any = obj;

  for (const key of keys) {
    result = result[key];
  }

  return result as Maybe<T>;
}

export function getStringSorter<T>(key: keyof T | string[]) {
  if (Array.isArray(key)) {
    return (a: T, b: T) =>
      stringCompare(getNested(a, key) ?? "", getNested(b, key) ?? "");
  }

  return (a: T, b: T) =>
    stringCompare(
      (a[key] as Maybe<string>) ?? "",
      (b[key] as Maybe<string>) ?? "",
    );
}

export function getNumberSorter<T>(key: keyof T | string[]) {
  if (Array.isArray(key)) {
    return (a: T, b: T) =>
      (getNested<number>(a, key) ?? 0) - (getNested<number>(b, key) ?? 0);
  }

  return (a: T, b: T) =>
    ((a[key] as Maybe<number>) ?? 0) - ((b[key] as Maybe<number>) ?? 0);
}
