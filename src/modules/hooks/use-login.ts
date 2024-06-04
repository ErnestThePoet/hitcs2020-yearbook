import { useAppDispatch, useAppSelector } from "../store/hooks";
import { useEffect, useMemo } from "react";
import { isFunction } from "lodash";
import { AppDispatch } from "@/modules/store/store";
import { REQ, handleRequest } from "@/modules/api/api";
import { setSessionData } from "../store/reducers/session/session";
import { useNavigate } from "react-router-dom";
import { LoginResponse } from "../api/interfaces";

export type OnLoginCallBack = (params: {
  navigate: ReturnType<typeof useNavigate>;
  dispatch: AppDispatch;
}) => void;

export const TryAutoLogin = (
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
          visitor: false,
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

const isLoggedIn = (id: number | null) => {
  return id !== null;
};

interface UseLoginOptions {
  checkLoginOnly?: boolean;
  onAlreadyLoggedIn?: OnLoginCallBack;
  onAutoLoggedIn?: OnLoginCallBack;
}

interface UseLoginResponse {
  loggedIn: boolean;
  visitor: boolean;
}

export function useLogin(onLogin?: OnLoginCallBack): UseLoginResponse;
export function useLogin(options?: UseLoginOptions): UseLoginResponse;

export function useLogin(
  param?: OnLoginCallBack | UseLoginOptions
): UseLoginResponse {
  const navigate = useNavigate();
  const userId = useAppSelector((state) => state.session.id);
  const visitor = useAppSelector((state) => state.session.visitor);
  const dispatch = useAppDispatch();

  const loggedIn = useMemo(() => isLoggedIn(userId), [userId]);

  const isCallback = isFunction(param);

  const onAlreadyLoggedIn =
    param === undefined ? null : isCallback ? param : param.onAlreadyLoggedIn;

  const onAutoLoggedIn =
    param === undefined ? null : isCallback ? param : param.onAutoLoggedIn;

  const checkLoginOnly =
    param !== undefined && !isCallback && Boolean(param.checkLoginOnly);

  useEffect(() => {
    if (visitor) {
      return;
    }

    if (userId !== null) {
      onAlreadyLoggedIn?.({ navigate, dispatch });
    } else if (!checkLoginOnly) {
      TryAutoLogin(navigate, dispatch, (e) => {
        onAutoLoggedIn?.(e);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { loggedIn, visitor };
}
