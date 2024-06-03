import { Modal, ModalProps } from "antd";
import React, { memo } from "react";
import "./FlowerModal.scss";
import classNames from "classnames";

const FlowerModal: React.FC<ModalProps> = memo(
  ({ className, rootClassName, children, ...restProps }) => {
    return (
      <Modal
        className={classNames("flower-modal", className)}
        rootClassName={classNames("flower-modal-root", rootClassName)}
        footer={null}
        {...restProps}
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
