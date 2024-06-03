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
  Select,
  message,
} from "antd";
import Icon, {
  MenuOutlined,
  LockOutlined,
  PoweroffOutlined,
  EditOutlined,
  QuestionCircleOutlined,
  UserOutlined,
  InfoOutlined,
  HeartOutlined,
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
import { getStringSorter } from "@/modules/utils/sortors";
import AboutModal from "./AboutModal/AboutModal";
import classList from "@/assets/class-list.json";
import { ClassListItem } from "@/assets/interfaces";
import { getClassDesc, getClassSearchList } from "@/modules/utils/class-util";
import { classIdItemMap } from "@/assets/class-list";
import Pinyin from "pinyin-match";
import Music from "@/assets/icons/music";
import Mute from "@/assets/icons/mute";
import SendWordsModal from "./SendWordsModal/SendWordsModal";
import { useWindowSize } from "@/modules/hooks/use-window-size";
import detailedInfoCache from "@/modules/cache/detailed-info-cache";

const { BMapGL } = window as any;

const POINT_BEIJING = new BMapGL.Point(116.41338729034514, 39.910923647957596);
// Set to <=0 to disable
const WITH_LABEL_ZOOM = 5.7;

interface InfoEditFormFieldType {
  className: string;
  city: string;
  contact: string;
  mainwork: string;
  sentence: string;
}

const Home: React.FC = () => {
  const loggedIn = useLogin();

  const windowSize = useWindowSize();

  const navigate = useNavigate();

  const dispatch = useAppDispatch();

  const userId = useAppSelector((state) => state.session.id);
  const userName = useAppSelector((state) => state.session.name);

  const allInfo = useRef<InfoBriefItem[]>([]);
  const [selfInfo, setSelfInfo] = useState<InfoDetailItem | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const infoEditingRef = useRef(false);
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
    sendWords: {
      open: boolean;
    };
    about: {
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
    sendWords: {
      open: false,
    },
    about: {
      open: false,
    },
  });

  const [searchKeyword, setSearchKeyword] = useState("");
  const [displayedInfo, setDisplayedInfo] = useState<InfoBriefItem[]>([]);

  const [bgmPlaying, setBgmPlaying] = useState(false);

  const pendingSearch = useRef<{
    pending: boolean;
    keyword: string;
  }>({
    pending: false,
    keyword: "",
  });

  const mapRef = useRef<any>(null);
  const dragMarkerRef = useRef<any>(null);
  const mapZoomStartZoom = useRef(0);

  const bgmAudio = useRef<HTMLAudioElement | null>(null);

  const toggleBgmPlay = useCallback(() => {
    if (!bgmAudio.current || !(bgmAudio.current.readyState > 2)) {
      return;
    }

    if (bgmAudio.current.paused) {
      bgmAudio.current.play();
      setBgmPlaying(true);
    } else {
      bgmAudio.current.pause();
      setBgmPlaying(false);
    }
  }, []);

  const doSearch = useCallback((keyword: string) => {
    pendingSearch.current.keyword = keyword.trim().toLowerCase();

    if (pendingSearch.current.pending) {
      return;
    }

    pendingSearch.current.pending = true;

    setTimeout(() => {
      const searchKeyword = pendingSearch.current.keyword;

      let results: InfoBriefItem[] = [];

      if (searchKeyword === "") {
        results = _.cloneDeep(allInfo.current);
      } else {
        results = allInfo.current.filter((x) => {
          const classItem = classIdItemMap.get(x.className);

          let classMatch = false;

          if (classItem && searchKeyword !== "班") {
            classMatch = getClassSearchList(classItem).some((y) =>
              y.toLowerCase().includes(searchKeyword)
            );
          }

          return (
            x.name.toLowerCase().includes(searchKeyword) ||
            x.studentId.toLowerCase().includes(searchKeyword) ||
            x.city.toLowerCase().includes(searchKeyword) ||
            classMatch ||
            Pinyin.match(x.name, searchKeyword)
          );
        });
      }

      setDisplayedInfo(results.sort(getStringSorter("name")));

      pendingSearch.current.pending = false;
    }, 100);
  }, []);

  const drawAllInfo = useCallback((withLabel: boolean) => {
    if (!mapRef.current) {
      return;
    }

    // TODO 实现聚簇
    for (const info of allInfo.current) {
      const clickListener = () =>
        setModalState((value) =>
          _.merge({}, value, {
            detailedInfo: {
              open: true,
              id: info.id,
            },
          })
        );

      const marker = new BMapGL.Marker(coordToPoint(info.coord));

      if (withLabel) {
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

        label.addEventListener("click", clickListener);

        marker.setLabel(label);
      }

      marker.addEventListener("click", clickListener);
      mapRef.current.addOverlay(marker);
    }
  }, []);

  const syncAllInfo = useCallback(() => {
    handleRequest(REQ<null, InfoGetAllResponse>("INFO_GET_ALL"), {
      onSuccess: (data) => {
        allInfo.current = data;
        doSearch(searchKeyword);

        if (mapRef.current && !infoEditingRef.current) {
          mapRef.current.clearOverlays();
          drawAllInfo(mapRef.current.getZoom() > WITH_LABEL_ZOOM);
        }
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
        onSuccess: (data) => {
          setSelfInfo(data);
          if (data) {
            detailedInfoCache.set(userId, data);
          }
        },
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

    const dragMarkerLabel = new BMapGL.Label("请设置位置", {
      offset: new BMapGL.Size(15, -22),
    });
    dragMarkerLabel.setStyle({
      backgroundColor: "#fef6d5",
      color: "#ea6500",
      borderRadius: "10px",
      borderColor: "#ccc",
      padding: "0 5px",
      fontSize: "12px",
      lineHeight: "20px",
      cursor: "pointer",
    });

    dragMarker.setLabel(dragMarkerLabel);

    mapRef.current.addOverlay(dragMarker);

    dragMarkerRef.current = dragMarker;

    infoEditingRef.current = true;
  }, []);

  const finalizeInfoSubmitEdit = useCallback(() => {
    if (!mapRef.current) {
      return;
    }

    mapRef.current.clearOverlays();

    dragMarkerRef.current = null;

    infoEditingRef.current = false;
  }, []);

  const goToLocation = useCallback((point: any) => {
    mapRef.current?.flyTo(point, 12);
  }, []);

  const viewDetailedInfo = useCallback((id: number) => {
    setModalState((value) =>
      _.merge({}, value, {
        detailedInfo: {
          id,
          open: true,
        },
      })
    );
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

  const sendWordsModalOnCancel = useCallback(
    () =>
      setModalState((value) =>
        _.merge({}, value, { sendWords: { open: false } })
      ),
    []
  );

  const aboutModalOnCancel = useCallback(
    () =>
      setModalState((value) => _.merge({}, value, { about: { open: false } })),
    []
  );

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

    map.addEventListener("zoomstart", () => {
      mapZoomStartZoom.current = map.getZoom();
    });

    map.addEventListener("zoomend", () => {
      if (infoEditingRef.current) {
        return;
      }

      if (
        mapZoomStartZoom.current <= WITH_LABEL_ZOOM &&
        map.getZoom() > WITH_LABEL_ZOOM
      ) {
        map.clearOverlays();
        drawAllInfo(true);
      } else if (
        mapZoomStartZoom.current > WITH_LABEL_ZOOM &&
        map.getZoom() <= WITH_LABEL_ZOOM
      ) {
        map.clearOverlays();
        drawAllInfo(false);
      }
    });

    syncSelfInfo();
    syncAllInfo();

    const refetchIntervalId = setInterval(() => {
      detailedInfoCache.clearExcept([userId!]);
      syncAllInfo();
    }, 60 * 1000);

    return () => clearInterval(refetchIntervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn]);

  if (!loggedIn) {
    return <></>;
  }

  return (
    <main className={styles.main}>
      <audio autoPlay loop ref={bgmAudio}>
        <source src="/bgm.mp3" />
      </audio>

      <div id="div-map-wrapper" className={styles.divMapWrapper} />

      <Flex
        className={styles.flexFloatingButtonsWrapper}
        vertical
        gap={10}
        align="center"
      >
        <Button
          icon={<MenuOutlined />}
          shape="circle"
          size="large"
          onClick={() => setDrawerOpen((open) => !open)}
        />

        <Button
          icon={
            bgmPlaying ? (
              <Icon
                // Use style to prevent hashing animation name in scss
                style={{
                  animation: "loadingCircle 5s infinite linear",
                }}
                component={Music}
              />
            ) : (
              <Icon component={Mute} />
            )
          }
          shape="circle"
          size="large"
          onClick={toggleBgmPlay}
        />

        <Button
          icon={<HeartOutlined />}
          shape="circle"
          size="large"
          onClick={() =>
            setModalState((value) =>
              _.merge({}, value, { sendWords: { open: true } })
            )
          }
        />

        <Button
          icon={<InfoOutlined />}
          shape="circle"
          size="large"
          onClick={() =>
            setModalState((value) =>
              _.merge({}, value, { about: { open: true } })
            )
          }
        />
      </Flex>

      <Drawer
        title="操作中心"
        onClose={() => setDrawerOpen(false)}
        placement={windowSize.w > windowSize.h ? "right" : "bottom"}
        open={drawerOpen}
        mask={false}
        width="min(390px, 80vw)"
        height="min(400px, 55vh)"
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
            <Button
              className={styles.btnName}
              type="link"
              icon={<UserOutlined />}
            >
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
                  <Flex gap={15}>
                    <Button
                      type="link"
                      onClick={() => {
                        goToLocation(coordToPoint(selfInfo.coord));
                        viewDetailedInfo(userId);
                      }}
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
                      <Select
                        placeholder="选择你的班级"
                        onChange={(e) =>
                          setInfoEditState((value) =>
                            _.merge({}, value, {
                              formInitialValues: {
                                className: e,
                              },
                            })
                          )
                        }
                        optionLabelProp="value"
                        options={(classList as ClassListItem[]).map((x) => ({
                          value: x.class,
                          label: (
                            <Flex className={styles.flexClassItem} vertical>
                              <div>{x.class}</div>
                              <div className="class-desc">
                                {getClassDesc(x)}
                              </div>
                            </Flex>
                          ),
                        }))}
                      />
                    </Form.Item>

                    <Form.Item
                      className="form-item-city"
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

                    <Form.Item
                      className="form-item-please-select-coord"
                      wrapperCol={{
                        xs: {
                          offset: 0,
                        },
                        sm: {
                          offset: 7,
                        },
                      }}
                    >
                      <Flex align="center" wrap>
                        并请拖动地图上的标记点，设置具体去向位置
                        <Popconfirm
                          title="为何不支持地图检索设置位置"
                          description="百度地图API的免费检索配额较低，因为经费原因暂不支持检索。请拖动地图上的标记点，手动设置位置坐标🥳"
                          icon={<QuestionCircleOutlined />}
                          okText="理解"
                          showCancel={false}
                        >
                          <Button
                            className="btn-why-cannot-search"
                            type="link"
                            tabIndex={-1}
                          >
                            (为何不支持检索?)
                          </Button>
                        </Popconfirm>
                      </Flex>
                    </Form.Item>

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
                        rows={8}
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
                            finalizeInfoSubmitEdit();

                            if (mapRef.current) {
                              drawAllInfo(
                                mapRef.current.getZoom() > WITH_LABEL_ZOOM
                              );
                            }

                            setInfoEditState((value) => ({
                              ...value,
                              editing: false,
                            }));
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
                  placeholder="智能搜索同学录..."
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
                  onClick={() => goToLocation(coordToPoint(item.coord))}
                >
                  <Flex vertical align="flex-start">
                    <div className="name">{item.name}</div>
                    <div className="class-id-city">
                      {item.className}班 {item.studentId} {item.city}
                    </div>
                    <Button
                      className="info"
                      type="link"
                      onClick={(e) => {
                        e.stopPropagation();
                        viewDetailedInfo(item.id);
                      }}
                    >
                      查看同学录信息
                    </Button>
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

      <SendWordsModal
        open={modalState.sendWords.open}
        onCancel={sendWordsModalOnCancel}
      />

      <AboutModal open={modalState.about.open} onCancel={aboutModalOnCancel} />
    </main>
  );
};

export default Home;
