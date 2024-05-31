import React, { useEffect } from "react";
import styles from "./Home.module.scss";

const Home: React.FC = () => {
  useEffect(() => {
    const { BMap, BMAP_NORMAL_MAP, BMAP_HYBRID_MAP } = window as any;

    const map = new BMap.Map("div-map-wrapper"); // 创建Map实例

    map.centerAndZoom(new BMap.Point(116.404, 39.915), 11); // 初始化地图,设置中心点坐标和地图级别
    //添加地图类型控件
    map.addControl(
      new BMap.MapTypeControl({
        mapTypes: [BMAP_NORMAL_MAP, BMAP_HYBRID_MAP],
      })
    );
    map.setCurrentCity("北京"); // 设置地图显示的城市 此项是必须设置的
    map.enableScrollWheelZoom(true); //开启鼠标滚轮缩放
  }, []);

  return (
    <main className={styles.main}>
      <div id="div-map-wrapper" className={styles.divMapWrapper}></div>
    </main>
  );
};

export default Home;
