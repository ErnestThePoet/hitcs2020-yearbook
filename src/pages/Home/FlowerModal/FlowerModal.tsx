import { Modal } from "antd";
import React, { memo } from "react";
import "./FlowerModal.scss";
import classNames from "classnames";

interface FlowerModalProps {
  className?: string;
  rootClassName?: string;
  open: boolean;
  onCancel: () => void;
  children?: React.ReactNode;
}

const FlowerModal: React.FC<FlowerModalProps> = memo(
  ({ className, rootClassName, open, onCancel, children }) => {
    return (
      <Modal
        className={classNames("flower-modal", className)}
        rootClassName={classNames("flower-modal-root", rootClassName)}
        centered
        open={open}
        footer={null}
        onCancel={onCancel}
      >
        <div className="flower-modal-flower-wrapper">
          <img
            className="flower-modal-flower-tl"
            src="/flowertl.png"
            alt="flower"
          />
          <img
            className="flower-modal-flower-bl"
            src="/flowerbl.png"
            alt="flower"
          />
          <img
            className="flower-modal-flower-br"
            src="/flowerbr.png"
            alt="flower"
          />
        </div>
        <div className="flower-modal-content-wrapper">{children}</div>
      </Modal>
    );
  }
);

export default FlowerModal;
