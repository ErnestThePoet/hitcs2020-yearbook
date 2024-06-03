import { Collapse } from "antd";
import React, { memo } from "react";
import styles from "./SendWordsModal.module.scss";
import { sendWords } from "@/assets/send-word";
import FlowerModal from "../FlowerModal/FlowerModal";

interface SendWordsModalProps {
  open: boolean;
  onCancel: () => void;
}

const SendWordsModal: React.FC<SendWordsModalProps> = memo(
  ({ open, onCancel }) => {
    return (
      <FlowerModal open={open} onCancel={onCancel}>
        <div className={styles.divSendWordsWrapper}>
          {sendWords.length ? (
            <Collapse
              className={styles.collapse}
              items={sendWords.map((x, i) => ({
                key: i,
                label: <div className="name">{x.name}</div>,
                children: <div className="send-word">{x.word}</div>,
              }))}
            />
          ) : (
            <div>暂无寄语</div>
          )}
        </div>
      </FlowerModal>
    );
  }
);

export default SendWordsModal;
