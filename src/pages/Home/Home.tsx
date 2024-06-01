import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "./Home.module.scss";
import { useLogin } from "@/modules/hooks/use-login";
import {
  InfoBriefItem,
  InfoDetailItem,
  InfoGetAllResponse,
  InfoGetOneDto,
  InfoGetOneResponse,
  ResponseType,
} from "@/modules/api/interfaces";
import { REQ, handleRequest } from "@/modules/api/api";
import { useAppDispatch, useAppSelector } from "@/modules/store/hooks";
import DetailedInfoModal from "./DetailedInfoModal/DetailedInfoModal";
import { Button, Drawer, Dropdown } from "antd";
import {
  MenuOutlined,
  LockOutlined,
  PoweroffOutlined,
} from "@ant-design/icons";
import _ from "lodash";
import { ChangePwModal } from "./ChangePwModal/ChangePwModal";
import { useNavigate } from "react-router-dom";
import {
  initialSessionState,
  setSessionData,
} from "@/modules/store/reducers/session/session";

const { BMapGL } = window as any;

const Home: React.FC = () => {
  const loggedIn = useLogin();

  const navigate = useNavigate();

  const dispatch = useAppDispatch();

  const userId = useAppSelector((state) => state.session.id);

  const [allInfo, setAllInfo] = useState<InfoBriefItem[]>([]);
  const [selfInfo, setSelfInfo] = useState<InfoDetailItem | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [modalState, setModalState] = useState<{
    detailedInfo: {
      open: boolean;
      id: number;
    };
    changePw: {
      open: boolean;
    };
  }>({
    detailedInfo: {
      open: false,
      id: 0,
    },
    changePw: {
      open: false,
    },
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
        setModalState((value) =>
          _.merge({}, value, {
            detailedInfo: {
              open: true,
              id: info.id,
            },
          })
        );

      marker.addEventListener("click", clickListener);
      label.addEventListener("click", clickListener);

      mapRef.current.addOverlay(marker);
    }
  }, [allInfo]);

  const detailedInfoModalOnCancel = useCallback(
    () =>
      setModalState((value) =>
        _.merge({}, value, { detailedInfo: { open: false } })
      ),
    []
  );

  const changePwModalOnCancel = useCallback(
    () =>
      setModalState((value) =>
        _.merge({}, value, { changePw: { open: false } })
      ),
    []
  );

  const logout = useCallback(() => {
    dispatch(setSessionData(initialSessionState));
    navigate("/login");
  }, [dispatch, navigate]);

  if (!loggedIn) {
    return <></>;
  }

  return (
    <main className={styles.main}>
      <div id="div-map-wrapper" className={styles.divMapWrapper} />

      {!drawerOpen && (
        <div className={styles.divMenuButtonWrapper}>
          <Button
            className="menu-button"
            icon={<MenuOutlined />}
            shape="circle"
            size="large"
            onClick={() => setDrawerOpen(true)}
          />
        </div>
      )}

      <DetailedInfoModal
        open={modalState.detailedInfo.open}
        id={modalState.detailedInfo.id}
        onCancel={detailedInfoModalOnCancel}
      />

      <ChangePwModal
        open={modalState.changePw.open}
        onCancel={changePwModalOnCancel}
        onSuccess={logout}
      />

      {selfInfo && (
        <Drawer
          title="操作中心"
          onClose={() => setDrawerOpen(false)}
          open={drawerOpen}
          mask={false}
          width="min(380px, 70vw)"
          extra={
            <Dropdown
              menu={{
                items: [
                  {
                    key: "0",
                    label: "修改密码",
                    icon: <LockOutlined />,
                    onClick: () =>
                      setModalState((value) =>
                        _.merge({}, value, {
                          changePw: { open: true },
                        })
                      ),
                  },
                  {
                    key: "1",
                    label: "退出登录",
                    icon: <PoweroffOutlined />,
                    onClick: () => {
                      handleRequest(REQ<null, ResponseType>("AUTH_LOGOUT"), {
                        onFinish: logout,
                        suppressMessageShow: {
                          error: true,
                          axiosError: true,
                          warning: true,
                        },
                      });
                    },
                  },
                ],
              }}
              placement="bottomRight"
              arrow={{ pointAtCenter: true }}
            >
              <Button className={styles.btnName} type="link">
                {selfInfo.name}
              </Button>
            </Dropdown>
          }
        >
          <p>Some contents...</p>
          <p>Some contents...</p>
          <p>Some contents...</p>
        </Drawer>
      )}
    </main>
  );
};

export default Home;
