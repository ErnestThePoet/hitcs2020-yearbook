import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "./Home.module.scss";
import { useLogin } from "@/modules/hooks/use-login";
import {
  InfoBriefItem,
  InfoDetailItem,
  InfoGetAllResponse,
  InfoGetOneDto,
  InfoGetOneResponse,
} from "@/modules/api/interfaces";
import { REQ, handleRequest } from "@/modules/api/api";
import { useAppSelector } from "@/modules/store/hooks";
import DetailedInfoModal from "./DetailedInfoModal/DetailedInfoModal";

const { BMapGL } = window as any;

const Home: React.FC = () => {
  const loggedIn = useLogin();

  const userId = useAppSelector((state) => state.session.id);

  const [allInfo, setAllInfo] = useState<InfoBriefItem[]>([]);
  const [selfInfo, setSelfInfo] = useState<InfoDetailItem | null>(null);
  const detailedInfoMap = useRef<Map<number, InfoDetailItem>>(new Map());

  const [detailedInfoModalState, setDetailedInfoModalState] = useState<{
    open: boolean;
    id: number;
  }>({
    open: false,
    id: 0,
  });

  const mapRef = useRef<any>(null);

  const syncAllInfo = useCallback(() => {
    handleRequest(REQ<null, InfoGetAllResponse>("INFO_GET_ALL"), {
      onSuccess: (data) => setAllInfo(data),
    });
  }, []);

  const syncSelfInfo = useCallback(() => {
    if (userId === null) {
      return;
    }

    handleRequest(
      REQ<InfoGetOneDto, InfoGetOneResponse>("INFO_GET_ONE", {
        id: userId,
      }),
      {
        onSuccess: (data) => setSelfInfo(data),
      }
    );
  }, [userId]);

  useEffect(() => {
    if (!loggedIn) {
      return;
    }

    const map = new BMapGL.Map("div-map-wrapper");

    mapRef.current = map;

    map.centerAndZoom("北京市", 6);
    map.enableScrollWheelZoom(true);

    map.addControl(new BMapGL.ZoomControl());

    map.updateFocusOptions({
      open: true,
      gray: false, // 是否使用灰度图模式
      involve: 0, // 0 底图面线+图层 1 底图poi 2 覆盖物
      focus: -1, // -1 全部地图使用other着色，此配置不需要商业授权；0 局部，此配置不需要商业授权
      other: [65, 117, 250],
    });

    syncSelfInfo();
    syncAllInfo();
  }, [loggedIn, syncSelfInfo, syncAllInfo]);

  // TODO 实现聚簇
  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    for (const info of allInfo) {
      const marker = new BMapGL.Marker(
        new BMapGL.Point(info.coord[0], info.coord[1])
      );

      const label = new BMapGL.Label(info.name, {
        offset: new BMapGL.Size(15, -22),
      });
      label.setStyle({
        backgroundColor: "#fef6d5",
        color: "#ea6500",
        borderRadius: "10px",
        borderColor: "#ccc",
        padding: "0 5px",
        fontSize: "12px",
        lineHeight: "20px",
        cursor: "pointer",
      });

      marker.setLabel(label);

      const clickListener = () =>
        setDetailedInfoModalState({
          id: info.id,
          open: true,
        });

      marker.addEventListener("click", clickListener);
      label.addEventListener("click", clickListener);

      mapRef.current.addOverlay(marker);
    }
  }, [allInfo]);

  if (!loggedIn) {
    return <></>;
  }

  return (
    <main className={styles.main}>
      <div id="div-map-wrapper" className={styles.divMapWrapper} />

      <DetailedInfoModal
        open={detailedInfoModalState.open}
        id={detailedInfoModalState.id}
        onClose={() =>
          setDetailedInfoModalState((value) => ({ ...value, open: false }))
        }
      />
    </main>
  );
};

export default Home;
