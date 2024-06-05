import { Collapse, Flex } from "antd";
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
      <FlowerModal
        className={styles.modal}
        title="师长寄语"
        centered
        open={open}
        onCancel={onCancel}
      >
        <Flex className={styles.flexSendWordsWrapper} vertical>
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
          <div className="hint">
            同学们也可以联系自己的老师，为大家留下寄语哦
          </div>
        </Flex>
      </FlowerModal>
    );
  }
);

export default SendWordsModal;
