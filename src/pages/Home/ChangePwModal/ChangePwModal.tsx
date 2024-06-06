import { Flex, Form, Input, Modal, Tag, message } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import React, { memo, useState } from "react";
import { REQ, handleRequest } from "@/modules/api/api";
import { hashSha256Utf8Hex } from "@/modules/utils/crypto";
import {
  USER_PASSWORD_HINT,
  USER_PASSWORD_PATTERN,
} from "@/modules/rules/user-rules";
import { ChangePwDto, ResponseType } from "@/modules/api/interfaces";
import classNames from "classnames";
import styles from "./ChangePwModal.module.scss";

interface ChangePwModalProps {
  open: boolean;

  onSuccess: () => void;
  onCancel: () => void;
}

interface ChangePwModalFormFieldType {
  oldPassword: string;
  newPassword1: string;
  newPassword2: string;
}

export const ChangePwModal: React.FC<ChangePwModalProps> = memo(
  ({ open, onSuccess, onCancel }) => {
    const [form] = Form.useForm();

    const [loading, setLoading] = useState(false);

    return (
      <Modal
        title="修改密码"
        centered
        open={open}
        onOk={async () => {
          let values: ChangePwModalFormFieldType;
          try {
            values = await form.validateFields();
          } catch {
            return;
          }

          setLoading(true);
          handleRequest(
            REQ<ChangePwDto, ResponseType>("AUTH_CHANGE_PW", {
              oldPwHashed1: hashSha256Utf8Hex(values.oldPassword),
              newPwHashed1: hashSha256Utf8Hex(values.newPassword1),
            }),
            {
              onSuccess: () => {
                message.success("修改密码成功，请重新登录");
                onSuccess();
              },
              onFinish: () => setLoading(false),
            }
          );
        }}
        onCancel={onCancel}
        okText="修改密码"
        confirmLoading={loading}
      >
        <Flex vertical gap={5}>
          <Form
            initialValues={{
              oldPassword: "",
              newPassword1: "",
              newPassword2: "",
            }}
            form={form}
            labelCol={{ span: 4 }}
          >
            <Form.Item<ChangePwModalFormFieldType>
              name="oldPassword"
              label="旧密码"
              rules={[
                {
                  required: true,
                  message: USER_PASSWORD_HINT,
                },
                {
                  pattern: USER_PASSWORD_PATTERN,
                  message: USER_PASSWORD_HINT,
                },
              ]}
            >
              <Input.Password placeholder="请输入旧密码" />
            </Form.Item>
            <Form.Item<ChangePwModalFormFieldType>
              name="newPassword1"
              label="新密码"
              rules={[
                {
                  required: true,
                  message: USER_PASSWORD_HINT,
                },
                {
                  pattern: USER_PASSWORD_PATTERN,
                  message: USER_PASSWORD_HINT,
                },
              ]}
            >
              <Input.Password
                placeholder="请输入新密码"
                onChange={() => {
                  // Clear/set password confirm field error
                  form.validateFields(["newPassword2"]);
                }}
              />
            </Form.Item>
            <Form.Item<ChangePwModalFormFieldType>
              name="newPassword2"
              label="确认密码"
              rules={[
                {
                  required: true,
                  message: USER_PASSWORD_HINT,
                },
                {
                  pattern: USER_PASSWORD_PATTERN,
                  message: USER_PASSWORD_HINT,
                },
                ({ getFieldValue }) => ({
                  validator(_, value: string) {
                    if (value === getFieldValue("oldPassword")) {
                      return Promise.reject("新密码不能与旧密码相同");
                    }

                    if (value === getFieldValue("newPassword1")) {
                      return Promise.resolve();
                    }

                    return Promise.reject("两次密码输入不一致");
                  },
                }),
              ]}
            >
              <Input.Password placeholder="请再次输入新密码" />
            </Form.Item>
          </Form>

          <Tag
            className={classNames("text-block", styles.tagTip)}
            icon={<InfoCircleOutlined />}
            color="geekblue"
          >
            修改密码后，你将在所有登录过的地方被退出登录。
          </Tag>
        </Flex>
      </Modal>
    );
  }
);
