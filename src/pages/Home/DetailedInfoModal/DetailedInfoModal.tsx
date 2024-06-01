import { REQ, handleRequest } from "@/modules/api/api";
import {
  InfoDetailItem,
  InfoGetOneDto,
  InfoGetOneResponse,
} from "@/modules/api/interfaces";
import { Flex, Modal, Skeleton } from "antd";
import React, { memo, useEffect, useRef, useState } from "react";
import styles from "./DetailedInfoModal.module.scss";

interface DetailedInfoModalProps {
  open: boolean;
  id: number;
  onClose: () => void;
}

const DetailedInfoModal: React.FC<DetailedInfoModalProps> = memo(
  ({ open, id, onClose }) => {
    const [detailedInfo, setDetailedInfo] = useState<InfoDetailItem | null>(
      null
    );
    const detailedInfoMap = useRef<Map<number, InfoDetailItem | null>>(
      new Map()
    );

    const [loading, setLoading] = useState(false);

    useEffect(() => {
      if (!open) {
        return;
      }

      if (detailedInfoMap.current.has(id)) {
        setDetailedInfo(detailedInfoMap.current.get(id)!);
        return;
      }

      setLoading(true);

      handleRequest(
        REQ<InfoGetOneDto, InfoGetOneResponse>("INFO_GET_ONE", {
          id,
        }),
        {
          onSuccess: (data) => {
            setDetailedInfo(data);
            detailedInfoMap.current.set(id, data);
          },
          onFinish: () => setLoading(false),
        }
      );
    }, [open, id]);

    return (
      <Modal
        className={styles.modal}
        centered
        open={open}
        footer={null}
        onCancel={onClose}
      >
        <>
          <img className="flower-tl" src="/flowertl.png" alt="flower" />
          <img className="flower-bl" src="/flowerbl.png" alt="flower" />
          <img className="flower-br" src="/flowerbr.png" alt="flower" />
        </>
        {detailedInfo ? (
          <Flex className={styles.flexInfoWrapper} vertical gap={5}>
            {loading ? (
              <Skeleton active />
            ) : (
              <>
                <div className="name">{detailedInfo.name}</div>
                <div className="class-id">
                  {detailedInfo.className}班 {detailedInfo.studentId}
                </div>
                <div className="location">
                  <img className="img-location" src="/loc.svg" alt="loc" />
                  {detailedInfo.city}
                  {detailedInfo.mainwork && `,  ${detailedInfo.mainwork}`}
                </div>
                {detailedInfo.contact && (
                  <div className="contact">
                    联系方式：{detailedInfo.contact}
                  </div>
                )}
                {detailedInfo.sentence && (
                  <div>
                    <div>毕业赠言：</div>
                    <div className="sentence">{detailedInfo.sentence}</div>
                  </div>
                )}
              </>
            )}
          </Flex>
        ) : (
          <div>暂无信息</div>
        )}
      </Modal>
    );
  }
);

export default DetailedInfoModal;
