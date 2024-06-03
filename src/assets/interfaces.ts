export interface ClassListItem {
  class: string;
  major: {
    name: string;
    aliases: string[];
  };
  classNo: string | null;
  direction: string | null;
}

export interface SendWordItem {
  name: string;
  word: string;
}
