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
import { Button, Card, Drawer, Dropdown, Flex, Form, Input } from "antd";
import {
  MenuOutlined,
  LockOutlined,
  PoweroffOutlined,
  EditOutlined,
} from "@ant-design/icons";
import _ from "lodash";
import { ChangePwModal } from "./ChangePwModal/ChangePwModal";
import { useNavigate } from "react-router-dom";
import {
  initialSessionState,
  setSessionData,
} from "@/modules/store/reducers/session/session";
import { coordToPoint } from "@/modules/utils/map";

const { BMapGL } = window as any;

const POINT_BEIJING = new BMapGL.Point(116.41338729034514, 39.910923647957596);

interface InfoEditFormFieldType {
  className: string;
  city: string;
  contact: string;
  mainwork: string;
  sentence: string;
}

const Home: React.FC = () => {
  const loggedIn = useLogin();

  const navigate = useNavigate();

  const dispatch = useAppDispatch();

  const userId = useAppSelector((state) => state.session.id);
  const userName = useAppSelector((state) => state.session.name);

  const [allInfo, setAllInfo] = useState<InfoBriefItem[]>([]);
  const [selfInfo, setSelfInfo] = useState<InfoDetailItem | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [infoEditState, setInfoEditState] = useState<{
    editing: boolean;
    mode: "SUBMIT" | "EDIT";
    point: any;
    formInitialValues: InfoEditFormFieldType;
  }>({
    editing: false,
    mode: "SUBMIT",
    point: POINT_BEIJING,
    formInitialValues: {
      className: "",
      city: "",
      contact: "",
      mainwork: "",
      sentence: "",
    },
  });

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

  const moveViewTo = useCallback((point: any, onFinish?: () => void) => {
    if (!mapRef.current) {
      return;
    }

    const currentCenter = mapRef.current.getCenter();

    const animation = new BMapGL.ViewAnimation(
      [
        {
          // MUST make a copy of mapRef.current.getCenter()
          center: new BMapGL.Point(currentCenter.lng, currentCenter.lat),
          zoom: mapRef.current.getZoom(),
          tilt: 0,
          heading: 0,
          percentage: 0,
        },
        {
          center: point,
          zoom: 10,
          tilt: 0,
          heading: 0,
          percentage: 1,
        },
      ],
      {
        duration: 500,
        delay: 0,
        interation: 1,
      }
    );

    if (onFinish) {
      animation.addEventListener("animationend", onFinish);
    }

    mapRef.current.startViewAnimation(animation);
  }, []);

  useEffect(() => {
    if (!loggedIn) {
      return;
    }

    const map = new BMapGL.Map("div-map-wrapper");

    mapRef.current = map;

    map.centerAndZoom(POINT_BEIJING, 6);
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
      const marker = new BMapGL.Marker(coordToPoint(info.coord));

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

      <Drawer
        title="操作中心"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        mask={false}
        width="min(380px, 80vw)"
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
              {userName}
            </Button>
          </Dropdown>
        }
      >
        <Card className={styles.cardInfoOpWrapper}>
          <Flex vertical gap={5} align="center">
            {selfInfo ? (
              <>
                <span>🌞你已经填写过同学录信息了哦</span>
                <Flex gap={10}>
                  <Button
                    type="link"
                    onClick={() =>
                      moveViewTo(coordToPoint(selfInfo.coord), () =>
                        setModalState((value) =>
                          _.merge({}, value, {
                            detailedInfo: {
                              id: userId,
                              open: true,
                            },
                          })
                        )
                      )
                    }
                  >
                    查看
                  </Button>
                  <Button
                    type="link"
                    onClick={() =>
                      setInfoEditState({
                        editing: true,
                        mode: "EDIT",
                        point: coordToPoint(selfInfo.coord),
                        formInitialValues: {
                          className: selfInfo.className,
                          city: selfInfo.city,
                          contact: selfInfo.contact ?? "",
                          mainwork: selfInfo.mainwork ?? "",
                          sentence: selfInfo.sentence ?? "",
                        },
                      })
                    }
                  >
                    编辑
                  </Button>
                  <Button type="link" danger>
                    删除
                  </Button>
                </Flex>
              </>
            ) : (
              <>
                <span>✨你还没有填写同学录信息哦</span>
                {infoEditState.editing ? (
                  <Form
                    className={styles.formLogin}
                    onFinish={(e) => {
                      console.log(e);
                    }}
                    initialValues={infoEditState.formInitialValues}
                  >
                    <Form.Item
                      label="大学班级"
                      name="className"
                      rules={[
                        {
                          required: true,
                          message: "请填写大学班级",
                        },
                        {
                          whitespace: true,
                          message: "请填写大学班级",
                        },
                      ]}
                    >
                      <Input
                        placeholder="“信息安全2班”"
                        onChange={(e) =>
                          setInfoEditState((value) =>
                            _.merge({}, value, {
                              formInitialValues: {
                                className: e.target.value,
                              },
                            })
                          )
                        }
                      />
                    </Form.Item>

                    <Form.Item
                      label="去向城市"
                      name="city"
                      rules={[
                        {
                          required: true,
                          message: "请填写去向城市",
                        },
                        {
                          whitespace: true,
                          message: "请填写去向城市",
                        },
                      ]}
                    >
                      <Input
                        placeholder="“哈尔滨”"
                        onChange={(e) => {
                          setInfoEditState((value) =>
                            _.merge({}, value, {
                              formInitialValues: {
                                city: e.target.value,
                              },
                            })
                          );
                        }}
                      />
                    </Form.Item>

                    <Form.Item>
                      <Flex
                        className={styles.flexInfoEditButtonWrapper}
                        gap={15}
                        justify="center"
                      >
                        <Button
                          onClick={() =>
                            setInfoEditState((value) => ({
                              ...value,
                              editing: false,
                            }))
                          }
                        >
                          取消
                        </Button>
                        <Button type="primary" htmlType="submit">
                          提交
                        </Button>
                      </Flex>
                    </Form.Item>
                  </Form>
                ) : (
                  <Flex gap={10}>
                    <Button
                      type="link"
                      icon={<EditOutlined />}
                      onClick={() =>
                        setInfoEditState((value) => ({
                          ...value,
                          editing: true,
                          mode: "SUBMIT",
                        }))
                      }
                    >
                      去填写
                    </Button>
                  </Flex>
                )}
              </>
            )}
          </Flex>
        </Card>
      </Drawer>
    </main>
  );
};

export default Home;
