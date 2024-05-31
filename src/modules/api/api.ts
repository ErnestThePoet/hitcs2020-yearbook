import type { AxiosError, AxiosResponse } from "axios";
import { message } from "antd";
import apiObject from "./api.json";
import axios from "axios";
import { ResponseType } from "./interfaces";

const customAxios = axios.create({
  withCredentials: true,
});

const getApiUrl = (api: keyof typeof apiObject) => {
  return "/api" + apiObject[api][1];
};

// Axios wrappers

type RequestFn = (
  api: keyof typeof apiObject,
  params: any
) => Promise<AxiosResponse<any>>;

type RequestMethod = "GET" | "PUT" | "POST" | "DELETE";

const REQUESTS: Record<RequestMethod, RequestFn> = {
  GET: (api, params) =>
    customAxios.get(getApiUrl(api), {
      params,
    }),
  PUT: (api, params) => customAxios.put(getApiUrl(api), params),
  POST: (api, params) => customAxios.post(getApiUrl(api), params),
  DELETE: (api, params) =>
    customAxios.delete(getApiUrl(api), {
      params,
    }),
};

export function REQ<REQ_T = any, RES_T = any>(
  api: keyof typeof apiObject,
  data: REQ_T | null = null
): Promise<AxiosResponse<RES_T>> {
  return REQUESTS[apiObject[api][0] as RequestMethod](api, data);
}

export const StatusCode = {
  SUCCESS: 200,
  ERROR: 500,
} as const;

export type StatusCodeType = (typeof StatusCode)[keyof typeof StatusCode];

function getBoolean(
  value: undefined | boolean | ((data: any) => boolean),
  data?: any
): boolean {
  if (!value) {
    return false;
  }

  if (value === true) {
    return true;
  }

  return value(data);
}

function getDataOrNull(data: any) {
  return data ?? null;
}

export async function handleRequest<T = any>(
  request: Promise<AxiosResponse<ResponseType<T>>>,
  options?: {
    useOnAxiosError?: boolean;
    suppressMessageShow?: {
      error?: boolean | ((data: T) => boolean);
      axiosError?: boolean;
      warning?: boolean | ((data: T) => boolean);
    };
    onSuccess?: ((data: T) => void) | null;
    onError?: ((dataOrErr: T | AxiosError, msg: string) => void) | null;
    onAxiosError?: ((err: AxiosError) => void) | null;
    onWarning?: ((data: T, msg: string) => void) | null;
    onFinish?: (() => void) | null;
  }
) {
  try {
    const result = await request;
    switch (result.data.status) {
      case StatusCode.ERROR:
        if (
          !getBoolean(
            options?.suppressMessageShow?.error,
            getDataOrNull(result.data.data)
          )
        ) {
          message.error(result.data.message);
        }
        options?.onError?.(
          getDataOrNull(result.data.data),
          result.data.message!
        );
        break;
      case StatusCode.SUCCESS:
        options?.onSuccess?.(getDataOrNull(result.data.data));
    }
  } catch (e) {
    if (!options?.suppressMessageShow?.axiosError) {
      message.error((e as AxiosError).message);
    }

    if (options?.useOnAxiosError) {
      options?.onAxiosError?.(e as AxiosError);
    } else {
      options?.onError?.(e as AxiosError, (e as AxiosError).message);
    }
  } finally {
    options?.onFinish?.();
  }
}
