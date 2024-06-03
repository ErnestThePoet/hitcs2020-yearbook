import { ClassListItem } from "@/assets/interfaces";

export function getClassDesc(classItem: ClassListItem): string {
  return (
    classItem.major.name +
    (classItem.classNo ? classItem.classNo + "班" : "") +
    (classItem.direction ? `/${classItem.direction}` : "")
  );
}

export function getClassSearchList(classItem: ClassListItem): string[] {
  const classNoSuffix = classItem.classNo ? classItem.classNo + "班" : "";

  const searchList = [
    classItem.class + "班",
    classItem.major.name + classNoSuffix,
    ...classItem.major.aliases.map((x) => x + classNoSuffix),
  ];

  if (classItem.direction) {
    searchList.push(classItem.direction);
  }

  return searchList;
}
