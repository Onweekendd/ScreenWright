export const threeMapExtraData = [
  {
    name: "路径",
    title: "路径",
    isEdit: false,
    showOperation: false,
    type: "mapPath",
    listenArgs: [],
    show: true,
    dataMethod: "get",
    dataType: 0,
    dataSource: {},
    requestHeader: {},
    requestBody: {},
    crossOrigin: false,
    needCookie: false,
    autoRefresh: false,
    dataQuery: "",
    sql: "SELECT * FROM",
    data: [
      {
        name: "京津沪链路",
        points: [
          [116.405285, 39.904989],
          [117.200983, 39.084158],
          [118.796877, 32.060255],
          [121.469269, 31.238176]
        ]
      },
      {
        name: "西南路径",
        points: [
          [104.066541, 30.572269],
          [106.551557, 29.56301],
          [108.940175, 34.341568],
          [113.264385, 23.129112]
        ]
      }
    ],
    dataRemark: [
      { key: "name", map: "name", decription: "名称" },
      { key: "points", map: "points", decription: "路径点集" }
    ],
    component: {
      name: "threeMap-mapPath",
      prop: "threeMapMapPath"
    },
    option: {
      blendingMode: "AdditiveBlending",
      lineWidth: 4,
      offsetZ: 2,
      trailLength: 0.28,
      animationDuration: 3.5,
      delay: 0,
      loop: true,
      lineShow: true,
      lineColor: "rgba(15,42,66,1)",
      lineOpacity: 100,
      effectColor: {
        type: "linear-gradient",
        angle: "0",
        colors: [
          {
            color: "rgba(34,211,238,1)",
            per: 0
          },
          {
            color: "rgba(255,255,255,1)",
            per: 100
          }
        ]
      },
      effectOpacity: 100
    }
  },
  {
    name: "围墙",
    title: "围墙",
    isEdit: false,
    showOperation: false,
    type: "fence",
    listenArgs: [],
    show: true,
    dataMethod: "get",
    dataType: 0,
    dataSource: {},
    requestHeader: {},
    requestBody: {},
    crossOrigin: false,
    needCookie: false,
    autoRefresh: false,
    dataQuery: "",
    sql: "SELECT * FROM",
    data: [
      {
        name: "北京",
        adcode: "110000"
      },
      {
        name: "上海",
        adcode: "310000"
      }
    ],
    dataRemark: [
      { key: "name", map: "name", decription: "区域名称" },
      { key: "adcode", map: "adcode", decription: "行政区划代码" },
      { key: "points", map: "points", decription: "自定义围墙点集" }
    ],
    component: {
      name: "threeMap-fence",
      prop: "threeMapFence"
    },
    option: {
      blendingMode: "AdditiveBlending",
      height: 60,
      offsetZ: 0,
      fillType: "gradient",
      fillColor: {
        type: "linear-gradient",
        angle: "90",
        colors: [
          {
            color: "rgba(16,56,83,0.08)",
            per: 0
          },
          {
            color: "rgba(38,196,255,0.95)",
            per: 100
          }
        ]
      },
      fillOpacity: 100,
      textureUrl: "",
      tintColor: "#ffffff",
      tintOpacity: 100,
      lineShow: true,
      lineColor: "rgba(255,255,255,1)",
      lineOpacity: 100,
      lineWidth: 0.08,
      animationDuration: 2.2,
      animationInterval: 0.8
    }
  },
  {
    name: "区域轮廓",
    title: "区域轮廓",
    isEdit: false,
    showOperation: false,
    type: "regionOutline",
    listenArgs: [],
    show: true,
    dataMethod: "get",
    dataType: 0,
    dataSource: {},
    requestHeader: {},
    requestBody: {},
    crossOrigin: false,
    needCookie: false,
    autoRefresh: false,
    dataQuery: "",
    sql: "SELECT * FROM",
    data: [],
    dataRemark: [
      { key: "targetType", map: "targetType", decription: "目标类型(region/continent)" },
      { key: "adcode", map: "adcode", decription: "区域编码" },
      { key: "groupId", map: "groupId", decription: "大洲分组 ID" },
      { key: "name", map: "name", decription: "名称" }
    ],
    component: {
      name: "threeMap-regionOutline",
      prop: "threeMapRegionOutline"
    },
    option: {
      targetType: "region",
      color: "#3FEFFF",
      opacity: 100,
      lineWidth: 3,
      flow: false,
      flowSpeed: 1,
      zOffset: 0.15,
      blendingMode: "AdditiveBlending"
    }
  }
];
