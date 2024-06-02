import React, { useEffect, useState } from "react";
import { Button, Checkbox, Flex, Form, Input } from "antd";
import styles from "./Login.module.scss";
import { REQ, handleRequest } from "@/modules/api/api";
import { setSessionData } from "@/modules/store/reducers/session/session";
import { useAppDispatch } from "@/modules/store/hooks";
import { hashSha256Utf8B64 } from "@/modules/utils/crypto";
import { useLogin } from "@/modules/hooks/use-login";
import { LoginResponse, ManualLoginDto } from "@/modules/api/interfaces";
import classNames from "classnames";
import { useNavigate } from "react-router-dom";
import {
  USER_ACCOUNT_HINT,
  USER_ACCOUNT_PATTERN,
  USER_PASSWORD_HINT,
  USER_PASSWORD_PATTERN,
} from "@/modules/rules/user-rules";

interface LoginFormFieldType {
  userName: string;
  password: string;
  remember: boolean;
}

const Login: React.FC = () => {
  const navigate = useNavigate();

  useLogin(({ navigate }) => navigate("/", { replace: true }));

  const dispatch = useAppDispatch();

  const [windowSize, setWindowSize] = useState<{
    w: number;
    h: number;
  }>({
    w: 1,
    h: 1,
  });

  const [{ loginError, loginErrorMessage }, setLoginErrorData] = useState<{
    loginError: boolean;
    loginErrorMessage: string;
  }>({
    loginError: false,
    loginErrorMessage: "",
  });

  useEffect(() => {
    setWindowSize({
      w: window.innerWidth,
      h: window.innerHeight,
    });

    window.onresize = () =>
      setWindowSize({
        w: window.innerWidth,
        h: window.innerHeight,
      });

    return () => {
      window.onresize = null;
    };
  }, []);

  return (
    <main className={styles.main}>
      <title>登录 - 哈工大计算学部2020级同学录</title>
      <div
        className={classNames(
          styles.divLoginWrapper,
          windowSize.w > windowSize.h
            ? styles.divLoginWrapperBkgH
            : styles.divLoginWrapperBkgV
        )}
      >
        <Flex className={styles.flexTitleRowWrapper} align="center">
          <div className={styles.divTitle}>哈工大计算学部2020级同学录</div>
        </Flex>
        <Form
          className={styles.formLogin}
          initialValues={{ remember: true }}
          onFinish={(e) => {
            handleRequest(
              REQ<ManualLoginDto, LoginResponse>("AUTH_MANUAL_LOGIN", {
                account: e.userName,
                pwHashed1: hashSha256Utf8B64(e.password),
                autoLogin: e.remember,
              }),
              {
                useOnAxiosError: true,
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

                  setLoginErrorData({
                    loginError: false,
                    loginErrorMessage: "",
                  });

                  navigate("/", { replace: true });
                },
                onError: (_, msg) =>
                  setLoginErrorData({
                    loginError: true,
                    loginErrorMessage: msg,
                  }),
              }
            );
          }}
          labelCol={{ span: 4 }}
        >
          <Form.Item<LoginFormFieldType>
            label="账号"
            name="userName"
            rules={[
              { required: true, message: "请输入登录账号" },
              {
                pattern: USER_ACCOUNT_PATTERN,
                message: USER_ACCOUNT_HINT,
              },
            ]}
          >
            <Input placeholder="请输入登录账号" />
          </Form.Item>

          <Form.Item<LoginFormFieldType>
            label="密码"
            name="password"
            rules={[
              { required: true, message: "请输入登录密码" },
              {
                pattern: USER_PASSWORD_PATTERN,
                message: USER_PASSWORD_HINT,
              },
            ]}
          >
            <Input.Password placeholder="请输入登录密码" />
          </Form.Item>

          <Form.Item<LoginFormFieldType>
            className="form-item-remember"
            name="remember"
            valuePropName="checked"
            wrapperCol={{
              xs: {
                offset: 0,
              },
              sm: {
                offset: 4,
              },
            }}
          >
            <Checkbox>7日内自动登录</Checkbox>
          </Form.Item>

          <Form.Item
            wrapperCol={{
              xs: {
                offset: 0,
              },
              sm: {
                offset: 4,
              },
            }}
            validateStatus={loginError ? "error" : "success"}
            help={loginErrorMessage}
          >
            <Button className="btn-login" type="primary" htmlType="submit">
              登录
            </Button>
          </Form.Item>
        </Form>
      </div>
    </main>
  );
};

export default Login;
