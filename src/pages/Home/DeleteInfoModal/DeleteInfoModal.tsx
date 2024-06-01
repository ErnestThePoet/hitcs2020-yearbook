import { Modal, Tag, message } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import React, { memo, useState } from "react";
import { REQ, handleRequest } from "@/modules/api/api";
import { ResponseType } from "@/modules/api/interfaces";

interface DeleteInfoModalProps {
  open: boolean;

  onSuccess: () => void;
  onCancel: () => void;
}

export const DeleteInfoModal: React.FC<DeleteInfoModalProps> = memo(
  ({ open, onSuccess, onCancel }) => {
    const [loading, setLoading] = useState(false);

    return (
      <Modal
        title="删除同学录信息"
        centered
        open={open}
        onOk={() => {
          setLoading(true);

          handleRequest(REQ<null, ResponseType>("INFO_DELETE"), {
            onSuccess: () => {
              message.info("已删除你的同学录信息");
              onSuccess();
            },
            onFinish: () => setLoading(false),
          });
        }}
        onCancel={onCancel}
        okText="删除"
        okButtonProps={{
          danger: true,
        }}
        confirmLoading={loading}
      >
        <Tag
          className="text-block"
          icon={<ExclamationCircleOutlined />}
          color="red"
        >
          你将删除已填写的同学录信息。继续吗？
        </Tag>
      </Modal>
    );
  }
);
