import { ClassListItem } from "./interfaces";
import classList from "./class-list.json";

export const classIdItemMap: Map<string, ClassListItem> = new Map(
  (classList as ClassListItem[]).map((x) => [x.class, x])
);
