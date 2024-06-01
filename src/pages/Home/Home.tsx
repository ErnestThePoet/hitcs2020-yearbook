import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "./Home.module.scss";
import { useLogin } from "@/modules/hooks/use-login";
import {
  InfoBriefItem,
  InfoDetailItem,
  InfoGetAllResponse,
  InfoGetOneDto,
  InfoGetOneResponse,
  InfoSubmitEditDto,
  ResponseType,
} from "@/modules/api/interfaces";
import { REQ, handleRequest } from "@/modules/api/api";
import { useAppDispatch, useAppSelector } from "@/modules/store/hooks";
import DetailedInfoModal from "./DetailedInfoModal/DetailedInfoModal";
import {
  Button,
  Card,
  Drawer,
  Dropdown,
  Flex,
  Form,
  Input,
  List,
  Popconfirm,
  message,
} from "antd";
import {
  MenuOutlined,
  LockOutlined,
  PoweroffOutlined,
  EditOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import _ from "lodash";
import { ChangePwModal } from "./ChangePwModal/ChangePwModal";
import { useNavigate } from "react-router-dom";
import {
  initialSessionState,
  setSessionData,
} from "@/modules/store/reducers/session/session";
import { coordToPoint, pointToCoord } from "@/modules/utils/map";
import { DeleteInfoModal } from "./DeleteInfoModal/DeleteInfoModal";

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

  const allInfo = useRef<InfoBriefItem[]>([]);
  const [selfInfo, setSelfInfo] = useState<InfoDetailItem | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [infoEditState, setInfoEditState] = useState<{
    editing: boolean;
    loading: boolean;
    mode: "SUBMIT" | "EDIT";
    formInitialValues: InfoEditFormFieldType;
  }>({
    editing: false,
    loading: false,
    mode: "SUBMIT",
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
    deleteInfo: {
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
    deleteInfo: {
      open: false,
    },
  });

  const [searchKeyword, setSearchKeyword] = useState("");
  const [displayedInfo, setDisplayedInfo] = useState<InfoBriefItem[]>([]);

  const pendingSearch = useRef<{
    pending: boolean;
    keyword: string;
  }>({
    pending: false,
    keyword: "",
  });

  const mapRef = useRef<any>(null);
  const dragMarkerRef = useRef<any>(null);

  const doSearch = useCallback((keyword: string) => {
    pendingSearch.current.keyword = keyword.trim();

    if (pendingSearch.current.pending) {
      return;
    }

    pendingSearch.current.pending = true;

    setTimeout(() => {
      if (pendingSearch.current.keyword === "") {
        setDisplayedInfo(allInfo.current);
      } else {
        setDisplayedInfo(
          allInfo.current.filter(
            (x) =>
              x.name.includes(pendingSearch.current.keyword) ||
              x.studentId.includes(pendingSearch.current.keyword) ||
              x.className.includes(pendingSearch.current.keyword) ||
              x.city.includes(pendingSearch.current.keyword)
          )
        );
      }

      pendingSearch.current.pending = false;
    }, 100);
  }, []);

  const drawAllInfo = useCallback(() => {
    if (!mapRef.current) {
      return;
    }

    // TODO 实现聚簇
    for (const info of allInfo.current) {
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
  }, []);

  const syncAllInfo = useCallback(() => {
    handleRequest(REQ<null, InfoGetAllResponse>("INFO_GET_ALL"), {
      onSuccess: (data) => {
        allInfo.current = data;
        mapRef.current?.clearOverlays();
        drawAllInfo();
        doSearch(searchKeyword);
      },
    });
  }, [doSearch, drawAllInfo, searchKeyword]);

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

  const initializeInfoSubmitEdit = useCallback((initialPoint?: any) => {
    if (!mapRef.current) {
      return;
    }

    mapRef.current.clearOverlays();

    const dragMarker = new BMapGL.Marker(initialPoint ?? POINT_BEIJING, {
      enableDragging: true,
    });

    mapRef.current.addOverlay(dragMarker);

    dragMarkerRef.current = dragMarker;
  }, []);

  const finalizeInfoSubmitEdit = useCallback(() => {
    if (!mapRef.current) {
      return;
    }

    mapRef.current.clearOverlays();

    dragMarkerRef.current = null;
  }, []);

  const viewDetailedInfoOf = useCallback((point: any, id: number) => {
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
          zoom: 9,
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

    animation.addEventListener("animationend", () =>
      setModalState((value) =>
        _.merge({}, value, {
          detailedInfo: {
            id,
            open: true,
          },
        })
      )
    );

    mapRef.current.startViewAnimation(animation);
  }, []);

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

  const deleteInfoModalOnCancel = useCallback(
    () =>
      setModalState((value) =>
        _.merge({}, value, { deleteInfo: { open: false } })
      ),
    []
  );

  const deleteInfoModalOnSuccess = useCallback(() => {
    syncSelfInfo();
    syncAllInfo();
    setModalState((value) =>
      _.merge({}, value, { deleteInfo: { open: false } })
    );
  }, [syncAllInfo, syncSelfInfo]);

  const logout = useCallback(() => {
    dispatch(setSessionData(initialSessionState));
    navigate("/login");
  }, [dispatch, navigate]);

  useEffect(() => {
    // Second condition prevents reinitializing map during development HMR
    if (!loggedIn || mapRef.current) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn]);

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

      <Drawer
        title="操作中心"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        mask={false}
        width="min(390px, 80vw)"
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
        <Flex vertical gap={24}>
          <Card className={styles.cardInfoOpWrapper}>
            <Flex vertical gap={5} align="center">
              {selfInfo && userId !== null && !infoEditState.editing && (
                <>
                  <span>🌞你已经填写过同学录信息了哦</span>
                  <Flex gap={10}>
                    <Button
                      type="link"
                      onClick={() =>
                        viewDetailedInfoOf(coordToPoint(selfInfo.coord), userId)
                      }
                    >
                      查看
                    </Button>
                    <Button
                      type="link"
                      onClick={() => {
                        const selfPoint = coordToPoint(selfInfo.coord);

                        setInfoEditState((value) => ({
                          ...value,
                          editing: true,
                          mode: "EDIT",
                          point: selfPoint,
                          formInitialValues: {
                            className: selfInfo.className,
                            city: selfInfo.city,
                            contact: selfInfo.contact ?? "",
                            mainwork: selfInfo.mainwork ?? "",
                            sentence: selfInfo.sentence ?? "",
                          },
                        }));

                        initializeInfoSubmitEdit(selfPoint);
                      }}
                    >
                      编辑
                    </Button>
                    <Button
                      type="link"
                      danger
                      onClick={() =>
                        setModalState((value) =>
                          _.merge({}, value, {
                            deleteInfo: {
                              open: true,
                            },
                          })
                        )
                      }
                    >
                      删除
                    </Button>
                  </Flex>
                </>
              )}
              {!selfInfo && !infoEditState.editing && (
                <>
                  <span>✨你还没有填写同学录信息哦</span>
                  <Flex gap={10}>
                    <Button
                      type="link"
                      icon={<EditOutlined />}
                      onClick={() => {
                        setInfoEditState((value) => ({
                          ...value,
                          editing: true,
                          mode: "SUBMIT",
                        }));

                        initializeInfoSubmitEdit();
                      }}
                    >
                      去填写
                    </Button>
                  </Flex>
                </>
              )}

              {infoEditState.editing && (
                <>
                  {infoEditState.mode === "SUBMIT" ? (
                    <b>填写同学录信息</b>
                  ) : (
                    <b>编辑同学录信息</b>
                  )}

                  <Form
                    className={styles.formInfo}
                    labelCol={{ span: 7 }}
                    onFinish={(e: InfoEditFormFieldType) => {
                      setInfoEditState((value) => ({
                        ...value,
                        loading: true,
                      }));

                      const dto: InfoSubmitEditDto = {
                        className: e.className.trim(),
                        city: e.city.trim(),
                        coord: pointToCoord(
                          dragMarkerRef.current.getPosition()
                        ),
                        contact:
                          e.contact.trim() === "" ? null : e.contact.trim(),
                        mainwork:
                          e.mainwork.trim() === "" ? null : e.mainwork.trim(),
                        sentence:
                          e.sentence.trim() === "" ? null : e.sentence.trim(),
                      };

                      if (!dto.className.endsWith("班")) {
                        dto.className += "班";
                      }

                      handleRequest(
                        REQ<InfoSubmitEditDto, ResponseType>(
                          infoEditState.mode === "SUBMIT"
                            ? "INFO_SUBMIT"
                            : "INFO_UPDATE",
                          dto
                        ),
                        {
                          onSuccess: () => {
                            message.success(
                              infoEditState.mode === "SUBMIT"
                                ? "成功提交同学录信息"
                                : "成功修改同学录信息"
                            );

                            finalizeInfoSubmitEdit();

                            syncSelfInfo();
                            syncAllInfo();
                            setInfoEditState((value) => ({
                              ...value,
                              editing: false,
                            }));
                          },
                          onFinish: () =>
                            setInfoEditState((value) => ({
                              ...value,
                              loading: false,
                            })),
                        }
                      );
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
                      style={{
                        marginBottom: 0,
                      }}
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

                    <Flex
                      className="flex-please-select-coord"
                      align="center"
                      wrap
                    >
                      并请在地图上选择去向地点
                      {window.innerWidth * 0.8 < 390 && "(可关闭侧栏)"}
                      <Popconfirm
                        title="为何去向城市不支持地图检索"
                        description="百度地图API的免费检索配额较低，因为经费原因暂不支持检索，请手动选择地点坐标🥳"
                        icon={<QuestionCircleOutlined />}
                        okText="理解"
                        showCancel={false}
                      >
                        <Button type="link" tabIndex={-1}>
                          (为何不支持检索?)
                        </Button>
                      </Popconfirm>
                    </Flex>

                    <Form.Item label="具体去向" name="mainwork">
                      <Input
                        placeholder="(选填)“哈工大计算学部”"
                        onChange={(e) => {
                          setInfoEditState((value) =>
                            _.merge({}, value, {
                              formInitialValues: {
                                mainwork: e.target.value,
                              },
                            })
                          );
                        }}
                      />
                    </Form.Item>

                    <Form.Item label="联系方式" name="contact">
                      <Input
                        placeholder="(选填)“手机15000000000”"
                        onChange={(e) => {
                          setInfoEditState((value) =>
                            _.merge({}, value, {
                              formInitialValues: {
                                contact: e.target.value,
                              },
                            })
                          );
                        }}
                      />
                    </Form.Item>

                    <Form.Item label="毕业赠言" name="sentence">
                      <Input.TextArea
                        placeholder="(选填)"
                        rows={5}
                        onChange={(e) => {
                          setInfoEditState((value) =>
                            _.merge({}, value, {
                              formInitialValues: {
                                sentence: e.target.value,
                              },
                            })
                          );
                        }}
                      />
                    </Form.Item>

                    <Form.Item>
                      <Flex gap={15} justify="center">
                        <Button
                          className="btn-bottom"
                          onClick={() => {
                            setInfoEditState((value) => ({
                              ...value,
                              editing: false,
                            }));

                            finalizeInfoSubmitEdit();

                            drawAllInfo();
                          }}
                          loading={infoEditState.loading}
                        >
                          取消
                        </Button>
                        <Button
                          className="btn-bottom"
                          type="primary"
                          htmlType="submit"
                          loading={infoEditState.loading}
                        >
                          提交
                        </Button>
                      </Flex>
                    </Form.Item>
                  </Form>
                </>
              )}
            </Flex>
          </Card>

          {!infoEditState.editing && (
            <List
              className={styles.listSearchResult}
              header={
                <Input
                  placeholder="同学录检索"
                  allowClear
                  value={searchKeyword}
                  onChange={(e) => {
                    setSearchKeyword(e.target.value);
                    doSearch(e.target.value);
                  }}
                />
              }
              bordered
              dataSource={displayedInfo}
              pagination={{
                size: "small",
                defaultPageSize: 20,
                pageSizeOptions: [10, 20, 30, 50, 100, 200],
                showSizeChanger: true,
                showQuickJumper: true,
              }}
              renderItem={(item) => (
                <List.Item
                  onClick={() =>
                    viewDetailedInfoOf(coordToPoint(item.coord), item.id)
                  }
                >
                  <Flex vertical>
                    <div className="name">{item.name}</div>
                    <div className="class-id-city">
                      {item.className} {item.studentId} {item.city}
                    </div>
                  </Flex>
                </List.Item>
              )}
            />
          )}
        </Flex>
      </Drawer>

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

      <DeleteInfoModal
        open={modalState.deleteInfo.open}
        onCancel={deleteInfoModalOnCancel}
        onSuccess={deleteInfoModalOnSuccess}
      />
    </main>
  );
};

export default Home;
