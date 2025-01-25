import { Flex, Modal } from "antd";
import React, { memo } from "react";
import styles from "./AboutModal.module.scss";

interface AboutModalProps {
  open: boolean;
  onCancel: () => void;
}

const AboutModal: React.FC<AboutModalProps> = memo(({ open, onCancel }) => {
  return (
    <Modal
      className={styles.modal}
      rootClassName={styles.modalRoot}
      centered
      open={open}
      footer={null}
      onCancel={onCancel}
    >
      <Flex className={styles.flexContentWrapper} vertical>
        <div className="title">哈工大计算学部2024届同学录</div>
        <Flex gap={5} justify="center" wrap>
          前端开发/120L021615 崔子健
          <a
            href="https://github.com/ErnestThePoet/hitcs2020-yearbook"
            target="_blank"
          >
            仓库
          </a>
          <a href="mailto: ecuiships@126.com">Email</a>
        </Flex>
        <Flex gap={5} justify="center" wrap>
          后端开发/120L021515 张靖宇
          <a
            href="https://github.com/yink12138/HITCS2020-backend"
            target="_blank"
          >
            仓库
          </a>
          <a href="mailto: 1097179128@qq.com">Email</a>
        </Flex>
        <div className="time">June🦅2024</div>
        <div className="motto">“愿少年，乘风破浪，他日毋忘化雨功”</div>
        <div className="copyright">
          登录页背景图/小红书
          <a
            href="https://www.xiaohongshu.com/user/profile/5ea968fd00000000010013bd"
            target="_blank"
          >
            @小宇哥咯Chen_JY0823
          </a>
          ；本页背景图/小红书
          <a
            href="https://www.xiaohongshu.com/user/profile/60715310000000000101eaac"
            target="_blank"
          >
            @江同学
          </a>
          ；背景音乐/S.H.E《你曾是少年》
        </div>
      </Flex>
    </Modal>
  );
});

export default AboutModal;
