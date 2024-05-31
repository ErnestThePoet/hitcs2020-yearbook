import { StatusCodeType } from "./api";

export interface ResponseType<T = null> {
  status: StatusCodeType;
  message?: string;
  data?: T;
}

export interface ManualLoginDto {
  account: string;
  pwHashed1: string;
  autoLogin: boolean;
}

export interface LoginResponseData {
  id: number; // 用户在数据库中的ID
  name: string; // 姓名
  studentId: string; // 学号
}

export type LoginResponse = ResponseType<LoginResponseData>;

export interface ChangePwDto {
  oldPwHashed1: string;
  newPwHashed1: string;
}

export interface InfoGetOneDto {
  studentId: number;
}

export interface InfoDetailItem {
  id: number; // 用户在数据库中的ID
  name: string; // 姓名
  studentId: string; // 学号
  city: string; // 城市（必填）
  coord: [number, number]; // 城市坐标
  contact: string | null; // 联系方式（可空）
  mainwork: string | null; // 主业（可空）
  sentence: string | null; // 同学寄语（可空）
}

export interface InfoBriefItem {
  id: number; // 用户在数据库中的ID
  name: string; // 姓名
  studentId: string; // 学号
  city: string; // 城市（必填）
  coord: [number, number]; // 城市坐标
}

export type InfoGetOneResponse = ResponseType<InfoDetailItem | null>;

export type InfoGetAllResponse = ResponseType<InfoBriefItem[]>;

export interface InfoSubmitEditDto {
  city: string; // 城市（必填）
  coord: number[]; // 城市坐标
  contact: string | null; // 联系方式（可空）
  mainwork: string | null; // 主业（可空）
  sentence: string | null; // 同学寄语（可空）
}
