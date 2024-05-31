import { format } from "date-fns";

export function formatTimeyMdHms(time: number) {
  return format(new Date(time ?? 0), "yyyy/MM/dd HH:mm:ss");
}

export function formatTimeyMdHmsNoInternalSeparation(time: number) {
  return format(new Date(time ?? 0), "yyyyMMdd-HHmmss");
}
