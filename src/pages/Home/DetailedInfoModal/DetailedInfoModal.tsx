import { REQ, handleRequest } from "@/modules/api/api";
import {
  InfoDetailItem,
  InfoGetOneDto,
  InfoGetOneResponse,
} from "@/modules/api/interfaces";
import { Flex, Skeleton, Tooltip } from "antd";
import React, { memo, useEffect, useRef, useState } from "react";
import styles from "./DetailedInfoModal.module.scss";
import { getClassDesc } from "@/modules/utils/class-util";
import { classIdItemMap } from "@/assets/class-list";
import FlowerModal from "../FlowerModal/FlowerModal";

interface DetailedInfoModalProps {
  open: boolean;
  id: number;
  onCancel: () => void;
}

const DetailedInfoModal: React.FC<DetailedInfoModalProps> = memo(
  ({ open, id, onCancel }) => {
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
      <FlowerModal open={open} onCancel={onCancel}>
        {detailedInfo ? (
          <Flex className={styles.flexInfoWrapper} vertical gap={8}>
            {loading ? (
              <Skeleton active />
            ) : (
              <>
                <div className="name">{detailedInfo.name}</div>

                <div className="class-id">
                  <Tooltip
                    color="orange"
                    title={
                      classIdItemMap.has(detailedInfo.className)
                        ? getClassDesc(
                            classIdItemMap.get(detailedInfo.className)!
                          )
                        : "无班级信息"
                    }
                  >
                    <span className="class-name">
                      {detailedInfo.className}班
                    </span>
                  </Tooltip>
                  {` ${detailedInfo.studentId}`}
                </div>
                <div className="location">
                  <img className="img-location" src="/loc.svg" alt="loc" />
                  {detailedInfo.city}
                  {detailedInfo.mainwork && `，${detailedInfo.mainwork}`}
                </div>
                {detailedInfo.contact && (
                  <Flex vertical gap={5}>
                    <div>联系方式：</div>
                    <div className="contact">{detailedInfo.contact}</div>
                  </Flex>
                )}
                {detailedInfo.sentence && (
                  <Flex vertical gap={5}>
                    <div>毕业赠言：</div>
                    <div className="sentence">{detailedInfo.sentence}</div>
                  </Flex>
                )}
              </>
            )}
          </Flex>
        ) : (
          <div>暂无信息</div>
        )}
      </FlowerModal>
    );
  }
);

export default DetailedInfoModal;
