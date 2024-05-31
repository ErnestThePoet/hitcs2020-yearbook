import { useAppDispatch, useAppSelector } from "../store/hooks";
import { useEffect, useMemo } from "react";
import { isFunction } from "lodash";
import { AppDispatch } from "@/modules/store/store";
import { REQ, handleRequest } from "@/modules/api/api";
import { LOCAL_STORAGE_SESSION_KEY } from "../constants";
import { setSessionData } from "../store/reducers/session/session";
import { useNavigate } from "react-router-dom";
import { LoginResponse } from "../api/interfaces";

export type OnLoginCallBack = (params: {
  navigate: ReturnType<typeof useNavigate>;
  dispatch: AppDispatch;
}) => void;

export const AutoLogin = (
  navigate: ReturnType<typeof useNavigate>,
  dispatch: AppDispatch,
  onLogin?: OnLoginCallBack
) => {
  handleRequest(REQ<null, LoginResponse>("AUTH_AUTO_LOGIN"), {
    suppressMessageShow: {
      error: true,
    },
    onSuccess: (data) => {
      dispatch(
        setSessionData({
          id: data.id,
          name: data.name,
          studentId: data.studentId,
        })
      );

      onLogin?.({ navigate, dispatch });
    },
    onError: () =>
      navigate("/login", {
        replace: true,
      }),
  });
};

export const TryAutoLogin = (
  navigate: ReturnType<typeof useNavigate>,
  dispatch: AppDispatch,
  onLogin?: OnLoginCallBack
) => {
  if (localStorage.getItem(LOCAL_STORAGE_SESSION_KEY)) {
    AutoLogin(navigate, dispatch, onLogin);
  } else {
    navigate("/login", {
      replace: true,
    });
  }
};

const isLoggedIn = (id: number | null) => {
  return id !== null;
};

interface UseLoginOptions {
  checkLoginOnly?: boolean;
  onAlreadyLoggedIn?: OnLoginCallBack;
  onAutoLoggedIn?: OnLoginCallBack;
}

export function useLogin(onLogin?: OnLoginCallBack): boolean;
export function useLogin(options?: UseLoginOptions): boolean;

export function useLogin(param?: OnLoginCallBack | UseLoginOptions): boolean {
  const navigate = useNavigate();
  const id = useAppSelector((state) => state.session.id);
  const dispatch = useAppDispatch();

  const loggedIn = useMemo(() => isLoggedIn(id), [id]);

  const isCallback = isFunction(param);

  const onAlreadyLoggedIn =
    param === undefined ? null : isCallback ? param : param.onAlreadyLoggedIn;

  const onAutoLoggedIn =
    param === undefined ? null : isCallback ? param : param.onAutoLoggedIn;

  const checkLoginOnly =
    param !== undefined && !isCallback && Boolean(param.checkLoginOnly);

  useEffect(() => {
    if (id !== null) {
      onAlreadyLoggedIn?.({ navigate, dispatch });
    } else if (!checkLoginOnly) {
      TryAutoLogin(navigate, dispatch, (e) => {
        onAutoLoggedIn?.(e);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return loggedIn;
}
