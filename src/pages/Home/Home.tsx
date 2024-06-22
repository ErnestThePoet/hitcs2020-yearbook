import React, {
  CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import styles from "./Home.module.scss";
import { useLogin } from "@/modules/hooks/use-login";
import {
  InfoBriefItem,
  InfoCoordOnlyItem,
  InfoDetailItem,
  InfoGetAllCoordsResponse,
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
  Tag,
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
  EnvironmentOutlined,
} from "@ant-design/icons";
import _ from "lodash";
import { ChangePwModal } from "./ChangePwModal/ChangePwModal";
import { useNavigate } from "react-router-dom";
import {
  initialSessionState,
  setSessionData,
} from "@/modules/store/reducers/session/session";
import { coordToPoint, pointToCoord, randomAround } from "@/modules/utils/map";
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

const { BMapGL } = window as typeof window & { BMapGL: any };

const NO_FLOATUP_STYLE: CSSProperties = {
  zIndex: 0,
};

const FLOATUP_STYLE: CSSProperties = {
  zIndex: 1,
};

const POINT_BEIJING = new BMapGL.Point(116.41338729034514, 39.910923647957596);
const INITIAL_ZOOM = 6;
// Set to <=0 to disable
const DETAILED_ZOOM_THRESHOLD = 5.8;

const REFETCH_INTERVAL_MS = 60 * 1000;

interface InfoEditFormFieldType {
  className: string;
  city: string;
  contact: string;
  mainwork: string;
  sentence: string;
}

const Home: React.FC = () => {
  const { loggedIn, visitor } = useLogin();

  const windowSize = useWindowSize();

  const navigate = useNavigate();

  const dispatch = useAppDispatch();

  const userStudentId = useAppSelector((state) => state.session.studentId);
  const userName = useAppSelector((state) => state.session.name);

  const allInfo = useRef<InfoBriefItem[]>([]);
  const allInfoCoordOnly = useRef<InfoCoordOnlyItem[]>([]);
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
      studentId: string;
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
      studentId: "",
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

  const studentIdMarkerLabelMap = useRef<
    Map<string, { marker: any; label: any }>
  >(new Map());
  const floatingUpStudentId = useRef<string | null>(null);

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

  const doSearch = useCallback(() => {
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

  // Currently only label can float up; marker cannot
  const setFloatUpLabel = useCallback((studentId: string, floatUp: boolean) => {
    if (!studentIdMarkerLabelMap.current.has(studentId)) {
      return;
    }

    const markerLabel = studentIdMarkerLabelMap.current.get(studentId)!;

    if (!floatUp) {
      if (floatingUpStudentId.current !== studentId) {
        return;
      }

      floatingUpStudentId.current = null;

      markerLabel.marker.setStyle(NO_FLOATUP_STYLE);
      markerLabel.label.setStyle(NO_FLOATUP_STYLE);

      return;
    }

    if (
      floatingUpStudentId.current &&
      floatingUpStudentId.current !== studentId &&
      studentIdMarkerLabelMap.current.has(floatingUpStudentId.current)
    ) {
      const markerLabelToClear = studentIdMarkerLabelMap.current.get(
        floatingUpStudentId.current
      )!;

      markerLabelToClear.marker.setStyle(NO_FLOATUP_STYLE);
      markerLabelToClear.label.setStyle(NO_FLOATUP_STYLE);
    }

    floatingUpStudentId.current = studentId;

    markerLabel.marker.setStyle(FLOATUP_STYLE);
    markerLabel.label.setStyle(FLOATUP_STYLE);
  }, []);

  const drawAllInfo = useCallback(
    (detailed: boolean) => {
      if (!mapRef.current) {
        return;
      }

      studentIdMarkerLabelMap.current.clear();

      // TODO 实现聚簇
      for (const info of allInfo.current) {
        const clickListener = () => {
          setModalState((value) =>
            _.merge({}, value, {
              detailedInfo: {
                open: true,
                studentId: info.studentId,
              },
            })
          );

          setFloatUpLabel(info.studentId, true);
        };

        const marker = new BMapGL.Marker(coordToPoint(info.coord), {
          icon: new BMapGL.Icon(
            "/star.svg",
            detailed ? new BMapGL.Size(18, 18) : new BMapGL.Size(12, 12)
          ),
        });

        if (detailed) {
          const label = new BMapGL.Label(info.name, {
            offset: new BMapGL.Size(13, -11),
          });
          label.setStyle({
            backgroundColor: "#fef6d5",
            color: "#ea6500",
            borderRadius: "10px",
            borderColor: "#ffa12f",
            padding: "0 5px",
            fontSize: "12px",
            lineHeight: "20px",
            cursor: "pointer",
          });

          label.addEventListener("click", clickListener);

          marker.setLabel(label);

          studentIdMarkerLabelMap.current.set(info.studentId, {
            marker,
            label,
          });
        }

        marker.addEventListener("click", clickListener);
        mapRef.current.addOverlay(marker);
      }
    },
    [setFloatUpLabel]
  );

  const drawAllInfoCoordOnly = useCallback((big: boolean) => {
    if (!mapRef.current) {
      return;
    }

    for (const info of allInfoCoordOnly.current) {
      const marker = new BMapGL.Marker(coordToPoint(info.coord), {
        icon: new BMapGL.Icon(
          "/star.svg",
          big ? new BMapGL.Size(18, 18) : new BMapGL.Size(12, 12)
        ),
      });

      mapRef.current.addOverlay(marker);
    }
  }, []);

  const syncAllInfo = useCallback(() => {
    handleRequest(REQ<null, InfoGetAllResponse>("INFO_GET_ALL"), {
      onSuccess: (data) => {
        allInfo.current = data;
        doSearch();

        if (mapRef.current && !infoEditingRef.current) {
          mapRef.current.clearOverlays();
          drawAllInfo(mapRef.current.getZoom() > DETAILED_ZOOM_THRESHOLD);
        }
      },
    });
  }, [doSearch, drawAllInfo]);

  const syncAllInfoCoordOnly = useCallback(() => {
    handleRequest(REQ<null, InfoGetAllCoordsResponse>("INFO_GET_ALL_COORDS"), {
      onSuccess: (data) => {
        allInfoCoordOnly.current = data;

        if (mapRef.current) {
          mapRef.current.clearOverlays();
          drawAllInfoCoordOnly(
            mapRef.current.getZoom() > DETAILED_ZOOM_THRESHOLD
          );
        }
      },
    });
  }, [drawAllInfoCoordOnly]);

  const syncSelfInfo = useCallback(() => {
    if (userStudentId === null) {
      return;
    }

    handleRequest(
      REQ<InfoGetOneDto, InfoGetOneResponse>("INFO_GET_ONE", {
        studentId: userStudentId,
      }),
      {
        onSuccess: (data) => {
          setSelfInfo(data);
          if (data) {
            detailedInfoCache.set(userStudentId, data);
          }
        },
      }
    );
  }, [userStudentId]);

  const initializeInfoSubmitEdit = useCallback((initialPoint?: any) => {
    if (!mapRef.current) {
      return;
    }

    mapRef.current.clearOverlays();

    const dragMarker = new BMapGL.Marker(
      initialPoint ?? randomAround(POINT_BEIJING),
      {
        enableDragging: true,
      }
    );

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

  const goToLocation = useCallback(
    (point: any, zoom: number = 12, verticalScreenLatOffset = 0.075) => {
      // Set center a little bit to south so bottom drawer won't shadow the point
      mapRef.current?.flyTo(
        new BMapGL.Point(
          point.lng,
          point.lat - (windowSize.vertical ? verticalScreenLatOffset : 0)
        ),
        zoom
      );
    },
    [windowSize.vertical]
  );

  const viewDetailedInfo = useCallback(
    (studentId: string) => {
      setModalState((value) =>
        _.merge({}, value, {
          detailedInfo: {
            studentId,
            open: true,
          },
        })
      );

      setFloatUpLabel(studentId, true);
    },
    [setFloatUpLabel]
  );

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
    // Third condition prevents reinitializing map during development HMR
    if (!(loggedIn || visitor) || mapRef.current) {
      return;
    }

    const map = new BMapGL.Map("div-map-wrapper");

    mapRef.current = map;

    map.centerAndZoom(POINT_BEIJING, INITIAL_ZOOM);
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
        mapZoomStartZoom.current <= DETAILED_ZOOM_THRESHOLD &&
        map.getZoom() > DETAILED_ZOOM_THRESHOLD
      ) {
        map.clearOverlays();
        (loggedIn ? drawAllInfo : drawAllInfoCoordOnly)(true);
      } else if (
        mapZoomStartZoom.current > DETAILED_ZOOM_THRESHOLD &&
        map.getZoom() <= DETAILED_ZOOM_THRESHOLD
      ) {
        map.clearOverlays();
        (loggedIn ? drawAllInfo : drawAllInfoCoordOnly)(false);
      }
    });

    if (loggedIn) {
      syncSelfInfo();
      syncAllInfo();

      const refetchIntervalId = setInterval(() => {
        syncSelfInfo();
        syncAllInfo();
      }, REFETCH_INTERVAL_MS);

      return () => clearInterval(refetchIntervalId);
    } else {
      syncAllInfoCoordOnly();

      const refetchIntervalId = setInterval(() => {
        syncAllInfoCoordOnly();
      }, REFETCH_INTERVAL_MS);

      return () => clearInterval(refetchIntervalId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn, visitor]);

  if (!(loggedIn || visitor)) {
    return <></>;
  }

  return (
    <main className={styles.main}>
      <audio loop ref={bgmAudio}>
        <source src="/bgm.mp3" />
      </audio>

      <div id="div-map-wrapper" className={styles.divMapWrapper} />

      <Flex
        className={styles.flexFloatingButtonsWrapper}
        vertical
        gap={10}
        align="center"
      >
        {loggedIn && (
          <Button
            icon={<MenuOutlined />}
            shape="circle"
            size="large"
            onClick={() => setDrawerOpen((open) => !open)}
          />
        )}

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

      {loggedIn && (
        <>
          <Drawer
            title="操作中心"
            onClose={() => setDrawerOpen(false)}
            placement={windowSize.vertical ? "bottom" : "right"}
            open={drawerOpen}
            mask={false}
            width="min(390px, 80vw)"
            height="min(450px, 55vh)"
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
                  {selfInfo &&
                    userStudentId !== null &&
                    !infoEditState.editing && (
                      <>
                        <Tag color="green">🌞你已经填写过同学录信息了哦</Tag>
                        <Flex gap={15}>
                          <Button
                            type="link"
                            onClick={() => {
                              goToLocation(coordToPoint(selfInfo.coord));
                              viewDetailedInfo(userStudentId);
                            }}
                          >
                            查看
                          </Button>
                          <Button
                            type="link"
                            onClick={() => {
                              const selfPoint = coordToPoint(selfInfo.coord);

                              goToLocation(selfPoint, INITIAL_ZOOM, 5);

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
                      <Tag color="orange">✨你还没有填写同学录信息哦</Tag>
                      <Flex gap={10}>
                        <Button
                          type="link"
                          icon={<EditOutlined />}
                          onClick={() => {
                            goToLocation(POINT_BEIJING, INITIAL_ZOOM, 5);

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
                            contact: e.contact.trim() || null,
                            mainwork: e.mainwork.trim() || null,
                            sentence: e.sentence.trimEnd() || null,
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
                              message: "请选择大学班级",
                            },
                            {
                              whitespace: true,
                              message: "请选择大学班级",
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
                            options={(classList as ClassListItem[]).map(
                              (x) => ({
                                value: x.class,
                                label: (
                                  <Flex
                                    className={styles.flexClassItem}
                                    vertical
                                  >
                                    <div>{x.class}</div>
                                    <div className="class-desc">
                                      {getClassDesc(x)}
                                    </div>
                                  </Flex>
                                ),
                              })
                            )}
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
                            <span className="span-please-select-coord">
                              并请拖动地图上的标记点，设置具体去向位置
                            </span>
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
                                    mapRef.current.getZoom() >
                                      DETAILED_ZOOM_THRESHOLD
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
                    <Flex vertical align="center" gap={6}>
                      <Input
                        placeholder="智能搜索同学录..."
                        allowClear
                        value={searchKeyword}
                        onChange={(e) => {
                          setSearchKeyword(e.target.value);
                          pendingSearch.current.keyword = e.target.value
                            .trim()
                            .toLowerCase();
                          doSearch();
                        }}
                      />
                      {displayedInfo.length > 0 && (
                        <div className="div-item-count">
                          共{displayedInfo.length}条同学录信息
                        </div>
                      )}
                    </Flex>
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
                        <Flex gap={5}>
                          <Tag bordered={false} color="processing">
                            {item.className}班
                          </Tag>
                          <Tag bordered={false} color="cyan">
                            {item.studentId}
                          </Tag>
                          <Tag
                            className="tag-city"
                            bordered={false}
                            color="magenta"
                            icon={<EnvironmentOutlined />}
                          >
                            {item.city}
                          </Tag>
                        </Flex>
                        <Button
                          className="info"
                          type="link"
                          onClick={(e) => {
                            e.stopPropagation();
                            viewDetailedInfo(item.studentId);
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
            studentId={modalState.detailedInfo.studentId}
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
        </>
      )}

      <SendWordsModal
        open={modalState.sendWords.open}
        onCancel={sendWordsModalOnCancel}
      />

      <AboutModal open={modalState.about.open} onCancel={aboutModalOnCancel} />
    </main>
  );
};

export default Home;
