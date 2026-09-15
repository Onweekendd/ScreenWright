export const defaultData = [
  {
    name: "飞线",
    title: "飞线",
    isEdit: false,
    showOperation: false,
    type: "mapLines",
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
        name: "上海-北京",
        coords: [
          [121.4692688, 31.2381763],
          [116.405285, 39.904989]
        ]
      },
      {
        name: "重庆-北京",
        coords: [
          [106.548425, 29.5549144],
          [116.405285, 39.904989]
        ]
      },
      {
        name: "辽宁-北京",
        coords: [
          [123.4116821, 41.7966156],
          [116.405285, 39.904989]
        ]
      },
      {
        name: "吉林-北京",
        coords: [
          [125.3154297, 43.8925629],
          [116.405285, 39.904989]
        ]
      },
      {
        name: "黑龙江-北京",
        coords: [
          [126.6433411, 45.7414932],
          [116.405285, 39.904989]
        ]
      },
      {
        name: "浙江-北京",
        coords: [
          [120.1592484, 30.265995],
          [116.405285, 39.904989]
        ]
      },
      {
        name: "福建-北京",
        coords: [
          [119.2978134, 26.0785904],
          [116.405285, 39.904989]
        ]
      },
      {
        name: "河南-北京",
        coords: [
          [113.6500473, 34.7570343],
          [116.405285, 39.904989]
        ]
      },
      {
        name: "湖北-北京",
        coords: [
          [114.2919388, 30.5675144],
          [116.405285, 39.904989]
        ]
      },
      {
        name: "湖南-北京",
        coords: [
          [112.9812698, 28.2008247],
          [116.405285, 39.904989]
        ]
      },
      {
        name: "广东-北京",
        coords: [
          [113.2614288, 23.1189117],
          [116.405285, 39.904989]
        ]
      },
      {
        name: "海南-北京",
        coords: [
          [110.3465118, 20.0317936],
          [116.405285, 39.904989]
        ]
      },
      {
        name: "四川-北京",
        coords: [
          [104.0817566, 30.6610565],
          [116.405285, 39.904989]
        ]
      },
      {
        name: "贵州-北京",
        coords: [
          [106.7113724, 26.5768738],
          [116.405285, 39.904989]
        ]
      },
      {
        name: "云南-北京",
        coords: [
          [102.704567, 25.0438442],
          [116.405285, 39.904989]
        ]
      },
      {
        name: "江西-北京",
        coords: [
          [115.8999176, 28.6759911],
          [116.405285, 39.904989]
        ]
      },
      {
        name: "陕西-北京",
        coords: [
          [108.949028, 34.2616844],
          [116.405285, 39.904989]
        ]
      },
      {
        name: "青海-北京",
        coords: [
          [101.7874527, 36.6094475],
          [116.405285, 39.904989]
        ]
      },
      {
        name: "甘肃-北京",
        coords: [
          [103.7500534, 36.0680389],
          [116.405285, 39.904989]
        ]
      },
      {
        name: "广西-北京",
        coords: [
          [108.3117676, 22.8065434],
          [116.405285, 39.904989]
        ]
      },
      {
        name: "新疆-北京",
        coords: [
          [87.6061172, 43.7909393],
          [116.405285, 39.904989]
        ]
      },
      {
        name: "西藏-北京",
        coords: [
          [91.1320496, 29.657589],
          [116.405285, 39.904989]
        ]
      },
      {
        name: "宁夏-北京",
        coords: [
          [106.2719421, 38.4680099],
          [116.405285, 39.904989]
        ]
      },
      {
        name: "台湾-北京",
        coords: [
          [120.9581316, 23.8516062],
          [116.405285, 39.904989]
        ]
      },
      {
        name: "香港-北京",
        coords: [
          [114.139452, 22.391577],
          [116.405285, 39.904989]
        ]
      },
      {
        name: "澳门-北京",
        coords: [
          [113.5678411, 22.167654],
          [116.405285, 39.904989]
        ]
      },
      {
        name: "安徽-北京",
        coords: [
          [117.2757034, 31.8632545],
          [116.405285, 39.904989]
        ]
      },
      {
        name: "江苏-北京",
        coords: [
          [118.7727814, 32.0476151],
          [116.405285, 39.904989]
        ]
      }
    ],
    dataRemark: [
      { key: "name", map: "name", decription: "名称" },
      { key: "coords", map: "coords", decription: "经纬度" }
    ],
    component: {
      name: "echart-mapLines",
      prop: "echartmapLines"
    },
    option: {
      effectShow: true,
      effectType: "constantSpeed",
      period: 4,
      constantSpeed: 80,
      delay: 0,
      effectSymbol: "pin",
      effectSymbolImage: "",
      effectSymbolWidth: 2,
      effectSymbolHeight: 20,
      effectColor: {
        type: "linear-gradient",
        angle: "0",
        colors: [
          {
            color: "rgba(253, 143, 209, 1)",
            per: 0
          },
          {
            color: "rgba(255, 255, 255, 1)",
            per: 100
          }
        ]
      },
      effectOpacity: 100,
      trailLength: 0.86,
      loop: true,
      lineColor: {
        type: "linear-gradient",
        angle: "0",
        colors: [
          {
            color: "rgba(88, 179, 204, 1)",
            per: 0
          },
          {
            color: "rgba(255, 255, 255, 1)",
            per: 100
          }
        ]
      },
      lineOpacity: 50,
      lineWidth: 0,
      lineCurveness: 0.1,
      lineLabelShow: false,
      lineLabelPosition: "end",
      lineLabelColor: "rgba(255,255,255,1)",
      lineLabelFontFamily: "Source Han Sans CN-Normal, Source Han Sans CN",
      lineLabelFontSize: 18,
      lineLabelFontWeight: "bolder",
      lineLabelFontStyle: "normal"
    }
  },
  {
    name: "\u8def\u5f84",
    title: "\u8def\u5f84",
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
        name: "\u4eac\u6d25\u6caa\u94fe\u8def",
        points: [
          [116.405285, 39.904989],
          [117.200983, 39.084158],
          [118.796877, 32.060255],
          [121.469269, 31.238176]
        ]
      },
      {
        name: "\u897f\u5357\u8def\u5f84",
        points: [
          [104.066541, 30.572269],
          [106.551557, 29.56301],
          [108.940175, 34.341568],
          [113.264385, 23.129112]
        ]
      }
    ],
    dataRemark: [
      { key: "name", map: "name", decription: "\u540d\u79f0" },
      { key: "points", map: "points", decription: "\u8def\u5f84\u70b9\u96c6" }
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
    name: "\u56f4\u5899",
    title: "\u56f4\u5899",
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
        name: "\u5317\u4eac",
        adcode: "110000"
      },
      {
        name: "\u4e0a\u6d77",
        adcode: "310000"
      }
    ],
    dataRemark: [
      { key: "name", map: "name", decription: "\u533a\u57df\u540d\u79f0" },
      { key: "adcode", map: "adcode", decription: "\u884c\u653f\u533a\u5212\u4ee3\u7801" },
      { key: "points", map: "points", decription: "\u81ea\u5b9a\u4e49\u56f4\u5899\u70b9\u96c6" }
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
    name: "散点",
    title: "散点",
    isEdit: false,
    showOperation: false,
    type: "mapEffectScatter",
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
      // { name: "北京", value: ["116.3979471", "39.9081726", 78] },

      { name: "上海", value: ["121.4692688", "31.2381763", 75] },

      { name: "重庆", value: ["106.548425", "29.5549144", 78] },

      { name: "辽宁", value: ["123.4116821", "41.7966156", 96] },

      { name: "吉林", value: ["125.3154297", "43.8925629", 46] },

      { name: "黑龙江", value: ["126.6433411", "45.7414932", 97] },

      { name: "浙江", value: ["120.1592484", "30.265995", 32] },

      { name: "福建", value: ["119.2978134", "26.0785904", 2] },

      { name: "河南", value: ["113.6500473", "34.7570343", 23] },

      { name: "湖北", value: ["114.2919388", "30.5675144", 76] },

      { name: "湖南", value: ["112.9812698", "28.2008247", 71] },

      { name: "广东", value: ["113.2614288", "23.1189117", 6] },

      { name: "海南", value: ["110.3465118", "20.0317936", 64] },

      { name: "四川", value: ["104.0817566", "30.6610565", 54] },

      { name: "贵州", value: ["106.7113724", "26.5768738", 1] },

      { name: "云南", value: ["102.704567", "25.0438442", 78] },

      { name: "江西", value: ["115.8999176", "28.6759911", 16] },

      { name: "陕西", value: ["108.949028", "34.2616844", 14] },

      { name: "青海", value: ["101.7874527", "36.6094475", 22] },

      { name: "甘肃", value: ["103.7500534", "36.0680389", 37] },

      { name: "广西", value: ["108.3117676", "22.8065434", 52] },

      { name: "新疆", value: ["87.6061172", "43.7909393", 11] },

      { name: "西藏", value: ["91.1320496", "29.657589", 6] },

      { name: "宁夏", value: ["106.2719421", "38.4680099", 64] },

      { name: "台湾", value: ["120.9581316", "23.8516062", 49] },

      { name: "香港", value: ["114.139452", "22.391577", 49] },

      { name: "澳门", value: ["113.5678411", "22.167654", 36] },

      { name: "安徽", value: ["117.2757034", "31.8632545", 78] },

      { name: "江苏", value: ["118.7727814", "32.0476151", 98] }
    ],
    dataRemark: [
      { key: "name", map: "name", decription: "类目" },
      { key: "value", map: "value", decription: "值" }
    ],
    component: {
      width: 850,
      height: 450,
      name: "echart-mapEffectScatter",
      prop: "echartmapEffectScatter"
    },
    option: {
      refresh: true,
      dataSeriesName: ["系列一", "系列二"],
      seriesName: ["系列一", "系列二"],
      seriesTabsName: [
        { name: "系列1", value: "系列一" },
        { name: "系列2", value: "系列二" }
      ],
      gridLeft: 50,
      gridTop: 0,
      gridRight: 50,
      gridBottom: 0,
      symbolSize: 6,
      borderWidth: 2,
      borderColor: "rgba(59, 147, 203, 0.23)",
      rippleEffectNumber: 3,
      rippleEffectPeriod: 5,
      rippleEffectScale: 1.5,
      rippleEffectBrushType: "stroke",
      insideColor: "rgba(255,255,255,1)",
      outsideColor: "rgba(255,255,255,1)",
      showEffectOn: "render",
      seriesLabelNameShow: false,
      seriesLabelNameFontFamily: "Source Han Sans CN-Normal, Source Han Sans CN",
      seriesLabelNameFontSize: 18,
      seriesLabelNameColor: "rgba(255, 255, 255, 1)",
      seriesLabelNameFontStyle: "normal",
      seriesLabelNameFontWeight: "normal",
      seriesLabelValueShow: false,
      seriesLabelValueFontFamily: "Source Han Sans CN-Normal, Source Han Sans CN",
      seriesLabelValueFontSize: 18,
      seriesLabelValueColor: "rgba(255, 255, 255, 1)",
      seriesLabelValueFontStyle: "normal",
      seriesLabelValueFontWeight: "normal"
    }
  },
  {
    name: "热力图",
    title: "热力图",
    isEdit: false,
    showOperation: false,
    type: "heatmap",
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
        adcode: "110000",
        value: 27
      },
      {
        adcode: "120000",
        value: 97
      },
      {
        adcode: "130000",
        value: 83
      },
      {
        adcode: "140000",
        value: 61
      },
      {
        adcode: "150000",
        value: 53
      },
      {
        adcode: "210000",
        value: 82
      },
      {
        adcode: "220000",
        value: 37
      },
      {
        adcode: "230000",
        value: 31
      },
      {
        adcode: "310000",
        value: 95
      },
      {
        adcode: "320000",
        value: 73
      },
      {
        adcode: "330000",
        value: 92
      },
      {
        adcode: "340000",
        value: 76
      },
      {
        adcode: "350000",
        value: 28
      },
      {
        adcode: "360000",
        value: 94
      },
      {
        adcode: "370000",
        value: 91
      },
      {
        adcode: "410000",
        value: 64
      },
      {
        adcode: "420000",
        value: 55
      },
      {
        adcode: "430000",
        value: 75
      },
      {
        adcode: "440000",
        value: 50
      },
      {
        adcode: "450000",
        value: 99
      },
      {
        adcode: "460000",
        value: 83
      },
      {
        adcode: "500000",
        value: 25
      },
      {
        adcode: "510000",
        value: 4
      },
      {
        adcode: "520000",
        value: 27
      },
      {
        adcode: "530000",
        value: 94
      },
      {
        adcode: "540000",
        value: 45
      },
      {
        adcode: "610000",
        value: 83
      },
      {
        adcode: "620000",
        value: 50
      },
      {
        adcode: "630000",
        value: 76
      },
      {
        adcode: "640000",
        value: 34
      },
      {
        adcode: "650000",
        value: 36
      },
      {
        adcode: "710000",
        value: 91
      },
      {
        adcode: "810000",
        value: 38
      },
      {
        adcode: "820000",
        value: 77
      }
    ],
    dataRemark: [
      { key: "adcode", map: "adcode", decription: "城市区域代码" },
      { key: "value", map: "value", decription: "值" }
    ],
    component: {
      width: 850,
      height: 450,
      name: "echart-heatmap",
      prop: "echartheatmap"
    },
    option: {
      visualMapTabsName: [
        "颜色1",
        "颜色2",
        "颜色3",
        "颜色4",
        "颜色5",
        "颜色6",
        "颜色7",
        "颜色8",
        "颜色9",
        "颜色10",
        "颜色11"
      ],
      visualMapColor: [
        "#313695",
        "#4575b4",
        "#74add1",
        "#abd9e9",
        "#e0f3f8",
        "#ffffbf",
        "#fee090",
        "#fdae61",
        "#f46d43",
        "#d73027",
        "#a50026"
      ],
      pointSize: 40,
      blurSize: 40,
      minOpacity: 0,
      maxOpacity: 1,
      visualMapShow: true,
      visualMapTop: 80,
      visualMapLeft: 94,
      textHigh: "",
      textLow: "",
      visualMapTextFontFamily: "Source Han Sans CN-Normal, Source Han Sans CN",
      visualMapTextFontSize: 18,
      visualMapTextColor: "rgba(255, 255, 255, 1)",
      visualMapTextFontStyle: "normal",
      visualMapTextFontWeight: "normal",
      visualMapTextGap: 10,
      visualMapOrient: "vertical",
      visualMapMin: 0,
      visualMapMax: 200,
      visualMapItemWidth: 20,
      visualMapItemHeight: 140
    }
  },
  {
    name: "行政区色块图",
    title: "行政区色块图",
    isEdit: false,
    showOperation: false,
    type: "colormap",
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
        name: "北京市",
        value: 84
      },
      {
        name: "北京市市辖区",
        value: 45
      },
      {
        name: "天津市",
        value: 62
      },
      {
        name: "天津市市辖区",
        value: 10
      },
      {
        name: "河北省",
        value: 59
      },
      {
        name: "石家庄市",
        value: 1
      },
      {
        name: "唐山市",
        value: 36
      },
      {
        name: "秦皇岛市",
        value: 3
      },
      {
        name: "邯郸市",
        value: 25
      },
      {
        name: "邢台市",
        value: 97
      },
      {
        name: "保定市",
        value: 49
      },
      {
        name: "张家口市",
        value: 50
      },
      {
        name: "承德市",
        value: 10
      },
      {
        name: "沧州市",
        value: 26
      },
      {
        name: "廊坊市",
        value: 14
      },
      {
        name: "衡水市",
        value: 71
      },
      {
        name: "山西省",
        value: 29
      },
      {
        name: "太原市",
        value: 81
      },
      {
        name: "大同市",
        value: 35
      },
      {
        name: "阳泉市",
        value: 82
      },
      {
        name: "长治市",
        value: 13
      },
      {
        name: "晋城市",
        value: 40
      },
      {
        name: "朔州市",
        value: 54
      },
      {
        name: "晋中市",
        value: 18
      },
      {
        name: "运城市",
        value: 90
      },
      {
        name: "忻州市",
        value: 90
      },
      {
        name: "临汾市",
        value: 74
      },
      {
        name: "吕梁市",
        value: 92
      },
      {
        name: "内蒙古自治区",
        value: 69
      },
      {
        name: "呼和浩特市",
        value: 53
      },
      {
        name: "包头市",
        value: 23
      },
      {
        name: "乌海市",
        value: 41
      },
      {
        name: "赤峰市",
        value: 60
      },
      {
        name: "通辽市",
        value: 98
      },
      {
        name: "鄂尔多斯市",
        value: 87
      },
      {
        name: "呼伦贝尔市",
        value: 96
      },
      {
        name: "巴彦淖尔市",
        value: 24
      },
      {
        name: "乌兰察布市",
        value: 27
      },
      {
        name: "兴安盟",
        value: 46
      },
      {
        name: "锡林郭勒盟",
        value: 57
      },
      {
        name: "阿拉善盟",
        value: 34
      },
      {
        name: "辽宁省",
        value: 51
      },
      {
        name: "沈阳市",
        value: 80
      },
      {
        name: "大连市",
        value: 32
      },
      {
        name: "鞍山市",
        value: 37
      },
      {
        name: "抚顺市",
        value: 47
      },
      {
        name: "本溪市",
        value: 98
      },
      {
        name: "丹东市",
        value: 39
      },
      {
        name: "锦州市",
        value: 55
      },
      {
        name: "营口市",
        value: 40
      },
      {
        name: "阜新市",
        value: 24
      },
      {
        name: "辽阳市",
        value: 77
      },
      {
        name: "盘锦市",
        value: 83
      },
      {
        name: "铁岭市",
        value: 82
      },
      {
        name: "朝阳市",
        value: 72
      },
      {
        name: "葫芦岛市",
        value: 13
      },
      {
        name: "吉林省",
        value: 47
      },
      {
        name: "长春市",
        value: 43
      },
      {
        name: "吉林市",
        value: 67
      },
      {
        name: "四平市",
        value: 59
      },
      {
        name: "辽源市",
        value: 98
      },
      {
        name: "通化市",
        value: 40
      },
      {
        name: "白山市",
        value: 88
      },
      {
        name: "松原市",
        value: 55
      },
      {
        name: "白城市",
        value: 79
      },
      {
        name: "延边朝鲜族自治州",
        value: 79
      },
      {
        name: "黑龙江省",
        value: 95
      },
      {
        name: "哈尔滨市",
        value: 84
      },
      {
        name: "齐齐哈尔市",
        value: 85
      },
      {
        name: "鸡西市",
        value: 80
      },
      {
        name: "鹤岗市",
        value: 35
      },
      {
        name: "双鸭山市",
        value: 8
      },
      {
        name: "大庆市",
        value: 38
      },
      {
        name: "伊春市",
        value: 76
      },
      {
        name: "佳木斯市",
        value: 52
      },
      {
        name: "七台河市",
        value: 54
      },
      {
        name: "牡丹江市",
        value: 20
      },
      {
        name: "黑河市",
        value: 90
      },
      {
        name: "绥化市",
        value: 8
      },
      {
        name: "大兴安岭地区",
        value: 58
      },
      {
        name: "上海市",
        value: 56
      },
      {
        name: "上海市市辖区",
        value: 38
      },
      {
        name: "江苏省",
        value: 57
      },
      {
        name: "南京市",
        value: 9
      },
      {
        name: "无锡市",
        value: 39
      },
      {
        name: "徐州市",
        value: 32
      },
      {
        name: "常州市",
        value: 55
      },
      {
        name: "苏州市",
        value: 71
      },
      {
        name: "南通市",
        value: 34
      },
      {
        name: "连云港市",
        value: 34
      },
      {
        name: "淮安市",
        value: 12
      },
      {
        name: "盐城市",
        value: 28
      },
      {
        name: "扬州市",
        value: 23
      },
      {
        name: "镇江市",
        value: 51
      },
      {
        name: "泰州市",
        value: 100
      },
      {
        name: "宿迁市",
        value: 99
      },
      {
        name: "浙江省",
        value: 83
      },
      {
        name: "杭州市",
        value: 97
      },
      {
        name: "宁波市",
        value: 57
      },
      {
        name: "温州市",
        value: 39
      },
      {
        name: "嘉兴市",
        value: 54
      },
      {
        name: "湖州市",
        value: 14
      },
      {
        name: "绍兴市",
        value: 24
      },
      {
        name: "金华市",
        value: 65
      },
      {
        name: "衢州市",
        value: 91
      },
      {
        name: "舟山市",
        value: 73
      },
      {
        name: "台州市",
        value: 9
      },
      {
        name: "丽水市",
        value: 71
      },
      {
        name: "安徽省",
        value: 44
      },
      {
        name: "合肥市",
        value: 23
      },
      {
        name: "芜湖市",
        value: 69
      },
      {
        name: "蚌埠市",
        value: 84
      },
      {
        name: "淮南市",
        value: 34
      },
      {
        name: "马鞍山市",
        value: 67
      },
      {
        name: "淮北市",
        value: 53
      },
      {
        name: "铜陵市",
        value: 98
      },
      {
        name: "安庆市",
        value: 65
      },
      {
        name: "黄山市",
        value: 77
      },
      {
        name: "滁州市",
        value: 11
      },
      {
        name: "阜阳市",
        value: 76
      },
      {
        name: "宿州市",
        value: 47
      },
      {
        name: "六安市",
        value: 77
      },
      {
        name: "亳州市",
        value: 89
      },
      {
        name: "池州市",
        value: 97
      },
      {
        name: "宣城市",
        value: 98
      },
      {
        name: "福建省",
        value: 71
      },
      {
        name: "福州市",
        value: 63
      },
      {
        name: "厦门市",
        value: 41
      },
      {
        name: "莆田市",
        value: 76
      },
      {
        name: "三明市",
        value: 8
      },
      {
        name: "泉州市",
        value: 69
      },
      {
        name: "漳州市",
        value: 5
      },
      {
        name: "南平市",
        value: 94
      },
      {
        name: "龙岩市",
        value: 46
      },
      {
        name: "宁德市",
        value: 31
      },
      {
        name: "江西省",
        value: 11
      },
      {
        name: "南昌市",
        value: 58
      },
      {
        name: "景德镇市",
        value: 6
      },
      {
        name: "萍乡市",
        value: 56
      },
      {
        name: "九江市",
        value: 9
      },
      {
        name: "新余市",
        value: 68
      },
      {
        name: "鹰潭市",
        value: 83
      },
      {
        name: "赣州市",
        value: 94
      },
      {
        name: "吉安市",
        value: 69
      },
      {
        name: "宜春市",
        value: 74
      },
      {
        name: "抚州市",
        value: 96
      },
      {
        name: "上饶市",
        value: 70
      },
      {
        name: "山东省",
        value: 72
      },
      {
        name: "济南市",
        value: 73
      },
      {
        name: "青岛市",
        value: 26
      },
      {
        name: "淄博市",
        value: 64
      },
      {
        name: "枣庄市",
        value: 35
      },
      {
        name: "东营市",
        value: 75
      },
      {
        name: "烟台市",
        value: 22
      },
      {
        name: "潍坊市",
        value: 52
      },
      {
        name: "济宁市",
        value: 55
      },
      {
        name: "泰安市",
        value: 1
      },
      {
        name: "威海市",
        value: 18
      },
      {
        name: "日照市",
        value: 57
      },
      {
        name: "临沂市",
        value: 70
      },
      {
        name: "德州市",
        value: 83
      },
      {
        name: "聊城市",
        value: 57
      },
      {
        name: "滨州市",
        value: 96
      },
      {
        name: "菏泽市",
        value: 30
      },
      {
        name: "河南省",
        value: 31
      },
      {
        name: "郑州市",
        value: 62
      },
      {
        name: "开封市",
        value: 42
      },
      {
        name: "洛阳市",
        value: 2
      },
      {
        name: "平顶山市",
        value: 63
      },
      {
        name: "安阳市",
        value: 24
      },
      {
        name: "鹤壁市",
        value: 13
      },
      {
        name: "新乡市",
        value: 57
      },
      {
        name: "焦作市",
        value: 79
      },
      {
        name: "濮阳市",
        value: 69
      },
      {
        name: "许昌市",
        value: 47
      },
      {
        name: "漯河市",
        value: 36
      },
      {
        name: "三门峡市",
        value: 95
      },
      {
        name: "南阳市",
        value: 37
      },
      {
        name: "商丘市",
        value: 9
      },
      {
        name: "信阳市",
        value: 38
      },
      {
        name: "周口市",
        value: 85
      },
      {
        name: "驻马店市",
        value: 3
      },
      {
        name: "湖北省",
        value: 70
      },
      {
        name: "武汉市",
        value: 75
      },
      {
        name: "黄石市",
        value: 84
      },
      {
        name: "十堰市",
        value: 83
      },
      {
        name: "宜昌市",
        value: 66
      },
      {
        name: "襄阳市",
        value: 37
      },
      {
        name: "鄂州市",
        value: 98
      },
      {
        name: "荆门市",
        value: 65
      },
      {
        name: "孝感市",
        value: 80
      },
      {
        name: "荆州市",
        value: 49
      },
      {
        name: "黄冈市",
        value: 91
      },
      {
        name: "咸宁市",
        value: 8
      },
      {
        name: "随州市",
        value: 46
      },
      {
        name: "恩施土家族苗族自治州",
        value: 1
      },
      {
        name: "湖南省",
        value: 45
      },
      {
        name: "长沙市",
        value: 80
      },
      {
        name: "株洲市",
        value: 30
      },
      {
        name: "湘潭市",
        value: 95
      },
      {
        name: "衡阳市",
        value: 54
      },
      {
        name: "邵阳市",
        value: 49
      },
      {
        name: "岳阳市",
        value: 8
      },
      {
        name: "常德市",
        value: 58
      },
      {
        name: "张家界市",
        value: 96
      },
      {
        name: "益阳市",
        value: 16
      },
      {
        name: "郴州市",
        value: 84
      },
      {
        name: "永州市",
        value: 39
      },
      {
        name: "怀化市",
        value: 44
      },
      {
        name: "娄底市",
        value: 80
      },
      {
        name: "湘西土家族苗族自治州",
        value: 37
      },
      {
        name: "广东省",
        value: 48
      },
      {
        name: "广州市",
        value: 73
      },
      {
        name: "韶关市",
        value: 5
      },
      {
        name: "深圳市",
        value: 22
      },
      {
        name: "珠海市",
        value: 14
      },
      {
        name: "汕头市",
        value: 49
      },
      {
        name: "佛山市",
        value: 52
      },
      {
        name: "江门市",
        value: 80
      },
      {
        name: "湛江市",
        value: 93
      },
      {
        name: "茂名市",
        value: 74
      },
      {
        name: "肇庆市",
        value: 82
      },
      {
        name: "惠州市",
        value: 88
      },
      {
        name: "梅州市",
        value: 91
      },
      {
        name: "汕尾市",
        value: 10
      },
      {
        name: "河源市",
        value: 91
      },
      {
        name: "阳江市",
        value: 94
      },
      {
        name: "清远市",
        value: 10
      },
      {
        name: "东莞市",
        value: 58
      },
      {
        name: "中山市",
        value: 29
      },
      {
        name: "潮州市",
        value: 18
      },
      {
        name: "揭阳市",
        value: 46
      },
      {
        name: "云浮市",
        value: 22
      },
      {
        name: "广西壮族自治区",
        value: 49
      },
      {
        name: "南宁市",
        value: 81
      },
      {
        name: "柳州市",
        value: 44
      },
      {
        name: "桂林市",
        value: 50
      },
      {
        name: "梧州市",
        value: 54
      },
      {
        name: "北海市",
        value: 30
      },
      {
        name: "防城港市",
        value: 73
      },
      {
        name: "钦州市",
        value: 86
      },
      {
        name: "贵港市",
        value: 69
      },
      {
        name: "玉林市",
        value: 2
      },
      {
        name: "百色市",
        value: 54
      },
      {
        name: "贺州市",
        value: 33
      },
      {
        name: "河池市",
        value: 59
      },
      {
        name: "来宾市",
        value: 91
      },
      {
        name: "崇左市",
        value: 81
      },
      {
        name: "海南省",
        value: 52
      },
      {
        name: "海口市",
        value: 26
      },
      {
        name: "三亚市",
        value: 83
      },
      {
        name: "三沙市",
        value: 79
      },
      {
        name: "儋州市",
        value: 69
      },
      {
        name: "重庆市",
        value: 93
      },
      {
        name: "重庆市市辖区",
        value: 13
      },
      {
        name: "重庆市郊县",
        value: 45
      },
      {
        name: "四川省",
        value: 62
      },
      {
        name: "成都市",
        value: 40
      },
      {
        name: "自贡市",
        value: 29
      },
      {
        name: "攀枝花市",
        value: 81
      },
      {
        name: "泸州市",
        value: 68
      },
      {
        name: "德阳市",
        value: 15
      },
      {
        name: "绵阳市",
        value: 51
      },
      {
        name: "广元市",
        value: 38
      },
      {
        name: "遂宁市",
        value: 69
      },
      {
        name: "内江市",
        value: 31
      },
      {
        name: "乐山市",
        value: 14
      },
      {
        name: "南充市",
        value: 35
      },
      {
        name: "眉山市",
        value: 88
      },
      {
        name: "宜宾市",
        value: 94
      },
      {
        name: "广安市",
        value: 29
      },
      {
        name: "达州市",
        value: 53
      },
      {
        name: "雅安市",
        value: 61
      },
      {
        name: "巴中市",
        value: 58
      },
      {
        name: "资阳市",
        value: 74
      },
      {
        name: "阿坝藏族羌族自治州",
        value: 22
      },
      {
        name: "甘孜藏族自治州",
        value: 18
      },
      {
        name: "凉山彝族自治州",
        value: 12
      },
      {
        name: "贵州省",
        value: 79
      },
      {
        name: "贵阳市",
        value: 93
      },
      {
        name: "六盘水市",
        value: 92
      },
      {
        name: "遵义市",
        value: 58
      },
      {
        name: "安顺市",
        value: 31
      },
      {
        name: "毕节市",
        value: 41
      },
      {
        name: "铜仁市",
        value: 20
      },
      {
        name: "黔西南布依族苗族自治州",
        value: 89
      },
      {
        name: "黔东南苗族侗族自治州",
        value: 6
      },
      {
        name: "黔南布依族苗族自治州",
        value: 49
      },
      {
        name: "云南省",
        value: 88
      },
      {
        name: "昆明市",
        value: 8
      },
      {
        name: "曲靖市",
        value: 91
      },
      {
        name: "玉溪市",
        value: 89
      },
      {
        name: "保山市",
        value: 47
      },
      {
        name: "昭通市",
        value: 96
      },
      {
        name: "丽江市",
        value: 33
      },
      {
        name: "普洱市",
        value: 100
      },
      {
        name: "临沧市",
        value: 76
      },
      {
        name: "楚雄彝族自治州",
        value: 75
      },
      {
        name: "红河哈尼族彝族自治州",
        value: 37
      },
      {
        name: "文山壮族苗族自治州",
        value: 90
      },
      {
        name: "西双版纳傣族自治州",
        value: 70
      },
      {
        name: "大理白族自治州",
        value: 8
      },
      {
        name: "德宏傣族景颇族自治州",
        value: 46
      },
      {
        name: "怒江傈僳族自治州",
        value: 13
      },
      {
        name: "迪庆藏族自治州",
        value: 38
      },
      {
        name: "西藏自治区",
        value: 2
      },
      {
        name: "拉萨市",
        value: 35
      },
      {
        name: "日喀则市",
        value: 15
      },
      {
        name: "昌都市",
        value: 17
      },
      {
        name: "林芝市",
        value: 34
      },
      {
        name: "山南市",
        value: 49
      },
      {
        name: "那曲市",
        value: 60
      },
      {
        name: "阿里地区",
        value: 98
      },
      {
        name: "陕西省",
        value: 32
      },
      {
        name: "西安市",
        value: 52
      },
      {
        name: "铜川市",
        value: 36
      },
      {
        name: "宝鸡市",
        value: 71
      },
      {
        name: "咸阳市",
        value: 10
      },
      {
        name: "渭南市",
        value: 27
      },
      {
        name: "延安市",
        value: 50
      },
      {
        name: "汉中市",
        value: 75
      },
      {
        name: "榆林市",
        value: 32
      },
      {
        name: "安康市",
        value: 62
      },
      {
        name: "商洛市",
        value: 73
      },
      {
        name: "甘肃省",
        value: 46
      },
      {
        name: "兰州市",
        value: 49
      },
      {
        name: "嘉峪关市",
        value: 34
      },
      {
        name: "金昌市",
        value: 50
      },
      {
        name: "白银市",
        value: 32
      },
      {
        name: "天水市",
        value: 58
      },
      {
        name: "武威市",
        value: 47
      },
      {
        name: "张掖市",
        value: 71
      },
      {
        name: "平凉市",
        value: 58
      },
      {
        name: "酒泉市",
        value: 5
      },
      {
        name: "庆阳市",
        value: 7
      },
      {
        name: "定西市",
        value: 29
      },
      {
        name: "陇南市",
        value: 6
      },
      {
        name: "临夏回族自治州",
        value: 63
      },
      {
        name: "甘南藏族自治州",
        value: 88
      },
      {
        name: "青海省",
        value: 67
      },
      {
        name: "西宁市",
        value: 96
      },
      {
        name: "海东市",
        value: 69
      },
      {
        name: "海北藏族自治州",
        value: 80
      },
      {
        name: "黄南藏族自治州",
        value: 16
      },
      {
        name: "海南藏族自治州",
        value: 49
      },
      {
        name: "果洛藏族自治州",
        value: 99
      },
      {
        name: "玉树藏族自治州",
        value: 100
      },
      {
        name: "海西蒙古族藏族自治州",
        value: 67
      },
      {
        name: "宁夏回族自治区",
        value: 80
      },
      {
        name: "银川市",
        value: 22
      },
      {
        name: "石嘴山市",
        value: 53
      },
      {
        name: "吴忠市",
        value: 74
      },
      {
        name: "固原市",
        value: 57
      },
      {
        name: "中卫市",
        value: 44
      },
      {
        name: "新疆维吾尔自治区",
        value: 45
      },
      {
        name: "乌鲁木齐市",
        value: 63
      },
      {
        name: "克拉玛依市",
        value: 49
      },
      {
        name: "吐鲁番市",
        value: 66
      },
      {
        name: "哈密市",
        value: 80
      },
      {
        name: "昌吉回族自治州",
        value: 63
      },
      {
        name: "博尔塔拉蒙古自治州",
        value: 54
      },
      {
        name: "巴音郭楞蒙古自治州",
        value: 61
      },
      {
        name: "阿克苏地区",
        value: 38
      },
      {
        name: "克孜勒苏柯尔克孜自治州",
        value: 95
      },
      {
        name: "喀什地区",
        value: 92
      },
      {
        name: "和田地区",
        value: 1
      },
      {
        name: "伊犁哈萨克自治州",
        value: 40
      },
      {
        name: "塔城地区",
        value: 46
      },
      {
        name: "阿勒泰地区",
        value: 23
      },
      {
        name: "台湾省",
        value: 1
      },
      {
        name: "香港特别行政区",
        value: 48
      },
      {
        name: "澳门特别行政区",
        value: 25
      }
    ],
    dataRemark: [
      { key: "name", map: "name", decription: "类目" },
      { key: "value", map: "value", decription: "值" }
    ],
    component: {
      width: 850,
      height: 450,
      name: "echart-colormap",
      prop: "echartcolormap"
    },
    option: {
      visualMapTabsName: ["颜色1", "颜色2"],
      visualMapColor: ["rgba(23,26,36,1)", "rgba(45,93,253,1)"],
      piecewiseList: [
        { name: "\u533A\u95F41", min: 0, max: 50, color: "#FF0000" },
        { name: "\u533A\u95F42", min: 50, max: 100, color: "#FFF000" },
        { name: "\u533A\u95F43", min: 100, max: 150, color: "#00A76F" }
      ],
      colorMode: "continuous",
      fillColor: {
        type: "linear-gradient",
        angle: 90,
        colors: [
          { color: "rgba(23,26,36,1)", per: 0 },
          { color: "rgba(45,93,253,1)", per: 100 }
        ]
      },
      fillOpacity: 100,
      noDataColor: "#A09E9E",
      noDataOpacity: 20,
      borderOpacity: 1,
      visualMapShow: true,
      visualMapTop: 80,
      visualMapLeft: 94,
      textHigh: "",
      textLow: "",
      visualMapTextFontFamily: "Source Han Sans CN-Normal, Source Han Sans CN",
      visualMapTextFontSize: 18,
      visualMapTextColor: "rgba(255, 255, 255, 1)",
      visualMapTextFontStyle: "normal",
      visualMapTextFontWeight: "normal",
      visualMapTextGap: 10,
      visualMapOrient: "vertical",
      visualMapMin: 0,
      visualMapMax: 100,
      visualMapItemWidth: 20,
      visualMapItemHeight: 140
    }
  }
];
export const defaultGlData = [
  {
    name: "聚合热力图",
    title: "聚合热力图",
    isEdit: false,
    showOperation: false,
    type: "heatmap",
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
      { name: "北京", lng: 116.405285, lat: 39.904989, value: 92 },
      { name: "上海", lng: 121.4692688, lat: 31.2381763, value: 88 },
      { name: "广州", lng: 113.264385, lat: 23.129112, value: 78 },
      { name: "深圳", lng: 114.057865, lat: 22.543096, value: 74 },
      { name: "杭州", lng: 120.15507, lat: 30.274084, value: 65 },
      { name: "南京", lng: 118.796877, lat: 32.060255, value: 58 },
      { name: "武汉", lng: 114.305393, lat: 30.593099, value: 70 },
      { name: "成都", lng: 104.065735, lat: 30.659462, value: 67 },
      { name: "重庆", lng: 106.551556, lat: 29.56301, value: 62 },
      { name: "西安", lng: 108.93977, lat: 34.341574, value: 55 }
    ],
    dataRemark: [
      { key: "name", map: "name", decription: "点位名称（可选）" },
      { key: "lng", map: "lng", decription: "经度" },
      { key: "lat", map: "lat", decription: "纬度" },
      { key: "value", map: "value", decription: "热力值" }
    ],
    component: {
      name: "threeMap-heatmap",
      prop: "threeMapHeatmap"
    },
    option: {
      visualMapTabsName: [
        "颜色1",
        "颜色2",
        "颜色3",
        "颜色4",
        "颜色5",
        "颜色6",
        "颜色7",
        "颜色8",
        "颜色9",
        "颜色10",
        "颜色11"
      ],
      visualMapColor: [
        "#313695",
        "#4575b4",
        "#74add1",
        "#abd9e9",
        "#e0f3f8",
        "#ffffbf",
        "#fee090",
        "#fdae61",
        "#f46d43",
        "#d73027",
        "#a50026"
      ],
      fillColor: {
        type: "linear-gradient",
        angle: 90,
        colors: [
          { color: "#313695", per: 0 },
          { color: "#4575b4", per: 10 },
          { color: "#74add1", per: 20 },
          { color: "#abd9e9", per: 30 },
          { color: "#e0f3f8", per: 40 },
          { color: "#ffffbf", per: 50 },
          { color: "#fee090", per: 60 },
          { color: "#fdae61", per: 70 },
          { color: "#f46d43", per: 80 },
          { color: "#d73027", per: 90 },
          { color: "#a50026", per: 100 }
        ]
      },
      pointSize: 80,
      blurFactor: 0.613,
      blurSize: 0.613,
      minOpacity: 0,
      maxOpacity: 1,
      resolution: 2048,
      visualMapShow: false,
      visualMapTop: 80,
      visualMapLeft: 94,
      textHigh: "",
      textLow: "",
      visualMapTextFontFamily: "Source Han Sans CN-Normal, Source Han Sans CN",
      visualMapTextFontSize: 18,
      visualMapTextColor: "rgba(255, 255, 255, 1)",
      visualMapTextFontStyle: "normal",
      visualMapTextFontWeight: "normal",
      visualMapTextGap: 10,
      visualMapOrient: "vertical",
      visualMapMin: 0,
      visualMapMax: 100,
      visualMapItemWidth: 20,
      visualMapItemHeight: 140
    }
  },
  {
    name: "\u533A\u57DF\u70ED\u529B\u56FE",
    title: "\u533A\u57DF\u70ED\u529B\u56FE",
    isEdit: false,
    showOperation: false,
    type: "colormap",
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
      { adcode: "110000", value: 84 },
      { adcode: "120000", value: 62 },
      { adcode: "310000", value: 91 },
      { adcode: "320000", value: 73 },
      { adcode: "330000", value: 88 },
      { adcode: "440000", value: 95 },
      { adcode: "500000", value: 55 },
      { adcode: "510000", value: 67 },
      { adcode: "610000", value: 49 },
      { adcode: "650000", value: 36 }
    ],
    dataRemark: [
      { key: "adcode", map: "adcode", decription: "\u884C\u653F\u533A\u5212\u4EE3\u7801" },
      { key: "value", map: "value", decription: "\u6570\u503C" }
    ],
    component: {
      name: "threeMap-colormap",
      prop: "threeMapColorMap"
    },
    option: {
      visualMapTabsName: ["\u989C\u82721", "\u989C\u82722"],
      visualMapColor: ["rgba(23,26,36,1)", "rgba(45,93,253,1)"],
      piecewiseList: [
        { name: "\u533A\u95F41", min: 0, max: 50, color: "#FF0000" },
        { name: "\u533A\u95F42", min: 50, max: 100, color: "#FFF000" },
        { name: "\u533A\u95F43", min: 100, max: 150, color: "#00A76F" }
      ],
      colorMode: "continuous",
      fillColor: {
        type: "linear-gradient",
        angle: 90,
        colors: [
          { color: "rgba(23,26,36,1)", per: 0 },
          { color: "rgba(45,93,253,1)", per: 100 }
        ]
      },
      fillOpacity: 100,
      noDataColor: "#A09E9E",
      noDataOpacity: 20,
      borderOpacity: 1,
      visualMapShow: true,
      visualMapTop: 80,
      visualMapLeft: 94,
      textHigh: "",
      textLow: "",
      visualMapTextFontFamily: "Source Han Sans CN-Normal, Source Han Sans CN",
      visualMapTextFontSize: 18,
      visualMapTextColor: "rgba(255, 255, 255, 1)",
      visualMapTextFontStyle: "normal",
      visualMapTextFontWeight: "normal",
      visualMapTextGap: 10,
      visualMapOrient: "vertical",
      visualMapMin: 0,
      visualMapMax: 100,
      visualMapItemWidth: 20,
      visualMapItemHeight: 140
    }
  },
  {
    name: "飞线",
    title: "飞线",
    isEdit: false,
    showOperation: false,
    type: "flowLine",
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
        name: "广州-上海",
        from: [113.264385, 23.129112],
        to: [121.469269, 31.238176]
      },
      {
        name: "广州-北京",
        from: [113.264385, 23.129112],
        to: [116.405285, 39.904989]
      },
      {
        name: "广州-哈尔滨",
        from: [113.264385, 23.129112],
        to: [126.534967, 45.803775]
      },
      {
        name: "广州-乌鲁木齐",
        from: [113.264385, 23.129112],
        to: [87.616848, 43.825592]
      },
      {
        name: "广州-拉萨",
        from: [113.264385, 23.129112],
        to: [91.117212, 29.647478]
      },
      {
        name: "广州-西宁",
        from: [113.264385, 23.129112],
        to: [101.778916, 36.623178]
      },
      {
        name: "广州-兰州",
        from: [113.264385, 23.129112],
        to: [103.834303, 36.061089]
      },
      {
        name: "广州-呼和浩特",
        from: [113.264385, 23.129112],
        to: [111.749181, 40.842585]
      },
      {
        name: "广州-银川",
        from: [113.264385, 23.129112],
        to: [106.230909, 38.487193]
      },
      {
        name: "广州-沈阳",
        from: [113.264385, 23.129112],
        to: [123.431475, 41.805698]
      },
      {
        name: "广州-海口",
        from: [113.264385, 23.129112],
        to: [110.33119, 20.031971]
      }
    ],
    dataRemark: [
      { key: "name", map: "name", decription: "名称" },
      { key: "from", map: "from", decription: "起点" },
      { key: "to", map: "to", decription: "终点" }
    ],
    component: {
      name: "threeMap-lines",
      prop: "threeMapLines"
    },
    option: {
      blendingMode: "AdditiveBlending",
      trailLength: 0.5,
      height: 120,
      effectColor: {
        type: "linear-gradient",
        angle: "0",
        colors: [
          {
            color: "rgba(245,148,0,0.91)",
            per: 0
          },
          {
            color: "rgba(238,239,193,0.12)",
            per: 100
          }
        ]
      },
      effectOpacity: 100,
      lineWidth: 4,
      lineShow: true,
      lineColor: "rgba(46,38,0,1)",
      lineOpacity: 100,
      lineCurveness: 0.1,
      lineLabelShow: false,
      lineLabelPosition: "end",
      lineLabelColor: "rgba(255,255,255,1)",
      lineLabelFontFamily: "Source Han Sans CN-Normal, Source Han Sans CN",
      lineLabelFontSize: 18,
      lineLabelFontWeight: "bolder",
      lineLabelFontStyle: "normal"
    }
  },
  {
    name: "面片",
    title: "面片",
    isEdit: false,
    showOperation: false,
    type: "plane",
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
    dataRemark: [],
    component: {
      name: "threeMap-plane",
      prop: "threeMapPlane"
    },
    option: {
      planeList: [
        {
          name: "面片1",
          id: "plane_1",
          visible: true,
          coordinateSystem: "3D",
          sizeWidth: 240,
          sizeHeight: 240,
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          fillMode: "picture",
          textureUrl: "version-test/assets/scene/echartGlMap/plane/plane12.png",
          tintColor: "#ffffff",
          tintOpacity: 100,
          doubleSide: true,
          depthTest: true,
          transparent: true,
          blending: "NormalBlending",
          depthWrite: false,
          opacity: 100,
          renderOrder: 1,
          animationType: "none",
          rotateSpeed: 0.5,
          rotateDirection: 1,
          spreadSpeed: 0.5,
          spreadInterval: 1,
          uvScaleX: 1,
          uvScaleY: 1,
          uvOffsetX: 0,
          uvOffsetY: 0,
          uvRotation: 0
        }
      ]
    }
  },
  {
    name: "标牌",
    title: "标牌",
    isEdit: false,
    showOperation: false,
    type: "mapGlIcon",
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
    isLock: false,
    sql: "SELECT * FROM",
    data: [
      {
        name: "1023",
        value: 1,
        latitude: 39.904989,
        longitude: 116.405285,
        status: "",
        address: ""
      },
      {
        name: "458",
        value: 1,
        latitude: 31.238176,
        longitude: 121.469269,
        status: "normal",
        address: ""
      },
      {
        name: "7391",
        value: 1,
        latitude: 23.129112,
        longitude: 113.264385,
        status: "normal",
        address: ""
      },
      {
        name: "862",
        value: 1,
        latitude: 22.543099,
        longitude: 114.057868,
        status: "normal",
        address: ""
      },
      {
        name: "3147",
        value: 1,
        latitude: 30.572269,
        longitude: 104.066541,
        status: "normal",
        address: ""
      },
      {
        name: "905",
        value: 1,
        latitude: 29.56301,
        longitude: 106.551557,
        status: "normal",
        address: ""
      },
      {
        name: "6724",
        value: 1,
        latitude: 30.593099,
        longitude: 114.305393,
        status: "normal",
        address: ""
      },
      {
        name: "188",
        value: 1,
        latitude: 34.341568,
        longitude: 108.940175,
        status: "normal",
        address: ""
      },
      {
        name: "4519",
        value: 1,
        latitude: 32.060255,
        longitude: 118.796877,
        status: "normal",
        address: ""
      },
      {
        name: "703",
        value: 1,
        latitude: 30.274084,
        longitude: 120.15507,
        status: "normal",
        address: ""
      },
      {
        name: "2648",
        value: 1,
        latitude: 34.746611,
        longitude: 113.625368,
        status: "normal",
        address: ""
      },
      {
        name: "819",
        value: 1,
        latitude: 28.22778,
        longitude: 112.938858,
        status: "normal",
        address: ""
      },
      {
        name: "5406",
        value: 1,
        latitude: 22.817002,
        longitude: 108.366543,
        status: "normal",
        address: ""
      },
      {
        name: "392",
        value: 1,
        latitude: 25.038889,
        longitude: 102.718344,
        status: "normal",
        address: ""
      },
      {
        name: "6771",
        value: 1,
        latitude: 26.647661,
        longitude: 106.630153,
        status: "normal",
        address: ""
      },
      {
        name: "924",
        value: 1,
        latitude: 29.647478,
        longitude: 91.117212,
        status: "normal",
        address: ""
      },
      {
        name: "5803",
        value: 1,
        latitude: 43.825592,
        longitude: 87.616848,
        status: "normal",
        address: ""
      },
      {
        name: "146",
        value: 1,
        latitude: 45.803775,
        longitude: 126.534967,
        status: "normal",
        address: ""
      }
    ],
    FilterData: [],
    dataRemark: [
      {
        key: "name",
        map: "name",
        decription: "名称"
      },
      {
        key: "value",
        map: "value",
        decription: "值"
      },
      {
        key: "latitude",
        map: "latitude",
        decription: "纬度"
      },
      {
        key: "longitude",
        map: "longitude",
        decription: "经度"
      },
      {
        key: "status",
        map: "status",
        decription: "状态"
      },
      {
        key: "address",
        map: "address",
        decription: "视频地址"
      }
    ],
    callbackArgs: [],
    cbArgs: [],
    events: [],
    dataFormatter: "(data, callbackArgs) => {\r\n    return data\r\n}",
    component: {
      name: "threeMap-mapGlIcon",
      prop: "threeMapMapGlIcon"
    },
    option: {
      name: "标牌",
      title: "标牌",
      type: "mapGlIcon",
      index: "标牌",
      options: {
        index: "标牌",
        url: "version-test/assets/scene/echartGlMap/mapIcon/defaultIcon.png",
        action: "none",
        scaleLock: true,
        isLock: false,
        visible: true,
        position: [0, 0, 0],
        scale: [0.5, 0.5, 0.5],
        rotation: [0, 0, 0],
        disableClickHandleCameraFly: true,
        isOriginalSize: false,
        iconSize: "fix",
        followCamera: "all",
        originPoint: "center",
        mapboxShow: false,
        statusIndex: 0,
        hoverShow: true,
        hoverMode: {
          highLightUrl: "version-test/assets/scene/echartGlMap/mapIcon/hoverIcon.png",
          fontSize: 5,
          fontFamily: "Source Han Sans CN-Normal, Source Han Sans CN",
          color: "rgba(7,218,246,1)",
          textBackground: "rgba(255, 255, 255, 0)",
          fontWeight: "normal",
          fontStyle: "normal",
          innerIconColor: "rgba(255, 255, 255, 1)",
          textFollow: false,
          iconScale: 1,
          textfillType: "picture",
          textBackgroundUrl: "version-test/assets/scene/echartGlMap/mapBar/board_bg.png",
          textFillType: "picture"
        },
        activeShow: false,
        activeMode: {
          highLightUrl: "",
          fontSize: 5,
          fontFamily: "Source Han Sans CN-Normal, Source Han Sans CN",
          color: "rgba(255, 255, 255, 1)",
          textBackground: "rgba(255, 255, 255, 0)",
          fontWeight: "normal",
          fontStyle: "normal",
          innerIconColor: "rgba(255, 255, 255, 1)",
          textFollow: false,
          iconScale: 1,
          textfillType: "color",
          textFillType: "color"
        },
        content: "",
        fontSize: 5,
        fontFamily: "Source Han Sans CN-Normal, Source Han Sans CN",
        color: "rgba(255, 255, 255, 1)",
        textBackground: "rgba(255, 255, 255, 0)",
        fontWeight: "normal",
        fontStyle: "normal",
        iconContentType: "text",
        iconImg: "",
        innerIconSize: 4,
        innerIconColor: "rgba(255, 255, 255, 1)",
        offsetX: 0,
        offsetY: 20,
        originX: 0,
        originY: 0,
        mapBoxShow: false,
        boxOffsetX: 0,
        boxOffsetY: 1.5,
        statusNameList: ["状态1"],
        statusList: [
          {
            name: "",
            url: "",
            iconScale: 1,
            fontSize: 5,
            fontFamily: "Source Han Sans CN-Normal, Source Han Sans CN",
            color: "rgba(255, 255, 255, 1)",
            textBackground: "rgba(255, 255, 255, 0)",
            fontWeight: "normal",
            fontStyle: "normal",
            innerIconColor: "rgba(255, 255, 255, 1)",
            hoverMode: {
              highLightUrl: "",
              fontSize: 5,
              fontFamily: "Source Han Sans CN-Normal, Source Han Sans CN",
              color: "rgba(255, 255, 255, 1)",
              textBackground: "rgba(255, 255, 255, 0)",
              fontWeight: "normal",
              fontStyle: "normal",
              innerIconColor: "rgba(255, 255, 255, 1)"
            },
            activeMode: {
              highLightUrl: "",
              fontSize: 5,
              fontFamily: "Source Han Sans CN-Normal, Source Han Sans CN",
              color: "rgba(255, 255, 255, 1)",
              textBackground: "rgba(255, 255, 255, 0)",
              fontWeight: "normal",
              fontStyle: "normal",
              innerIconColor: "rgba(255, 255, 255, 1)"
            }
          }
        ],
        textfillType: "color",
        textFillType: "color"
      }
    }
  },
  {
    name: "柱状图",
    title: "柱状图",
    isEdit: false,
    showOperation: false,
    type: "mapBar",
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
    isLock: false,
    sql: "SELECT * FROM",
    data: [
      { name: "北京", adcode: "110000", longitude: 116.405285, latitude: 39.904989, value: 85 },
      { name: "上海", adcode: "310000", longitude: 121.469269, latitude: 31.238176, value: 92 },
      { name: "广州", adcode: "440100", longitude: 113.264385, latitude: 23.129112, value: 102 },
      { name: "哈尔滨", adcode: "230100", longitude: 126.534967, latitude: 45.803775, value: 88 },
      { name: "杭州", adcode: "330100", longitude: 120.15507, latitude: 30.274084, value: 65 },
      { name: "成都", adcode: "510100", longitude: 104.066541, latitude: 30.572269, value: 70 },
      { name: "武汉", adcode: "420100", longitude: 114.305393, latitude: 30.593099, value: 58 },
      { name: "西安", adcode: "610100", longitude: 108.940175, latitude: 34.341568, value: 50 },
      { name: "南京", adcode: "320100", longitude: 118.796877, latitude: 32.060255, value: 62 }
    ],
    dataRemark: [
      { key: "name", map: "name", decription: "名称" },
      { key: "longitude", map: "longitude", decription: "经度" },
      { key: "latitude", map: "latitude", decription: "纬度" },
      { key: "value", map: "value", decription: "数值" }
    ],
    component: {
      name: "threeMap-mapBar",
      prop: "threeMapMapBar"
    },
    option: {
      transparent: true,
      blending: "NormalBlending",
      barType: "cylinder",
      barWidth: 2,
      minHeight: 4,
      maxHeight: 40,
      seriesGap: 0.8,
      opacity: 100,
      animation: true,
      animationDuration: 1000,
      label: {
        show: true,
        offset: [0, -28],
        carousel: {
          show: false,
          interval: 1000
        },
        sequence: {
          show: true,
          textStyle: {
            fontFamily: "Source Han Sans CN-Normal, Source Han Sans CN",
            fontSize: 20,
            color: "rgba(255,255,255,1)",
            fontWeight: "bolder",
            fontStyle: "normal"
          },
          background: {
            width: 36,
            height: 36,
            image: "version-test/assets/scene/echartGlMap/mapBar/icon.png"
          },
          offset: [-58, -8]
        },
        value: {
          show: true,
          textStyle: {
            fontFamily: "Source Han Sans CN-Normal, Source Han Sans CN",
            fontSize: 18,
            color: "#D3E5F2",
            fontWeight: "normal",
            fontStyle: "italic",
            letterSpacing: 0,
            lineHeight: 16
          },
          offset: [-20, 0],
          background: {
            type: "picture",
            image: "version-test/assets/scene/echartGlMap/mapBar/board_bg.png",
            color: "#ffffff"
          },
          suffix: {
            content: "万元",
            textStyle: {
              fontFamily: "SourceHanSansCN-Normal",
              fontSize: 14,
              color: "#D3E5F2",
              fontWeight: "normal",
              fontStyle: "normal",
              letterSpacing: 0,
              lineHeight: 12
            },
            offset: [4, 0]
          }
        }
      },
      seriesList: [
        {
          id: "series_1",
          name: "数值系列",
          field: "value",
          opacity: 100,
          color: {
            type: "linear-gradient",
            angle: "0",
            colors: [
              {
                color: "rgba(148,201,219,1)",
                per: 0
              },
              {
                color: "rgba(0,221,255,0.64)",
                per: 100
              }
            ]
          }
        }
      ]
    }
  },
  {
    name: "散点",
    title: "散点",
    isEdit: false,
    showOperation: false,
    type: "mapScatter",
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
    isLock: false,
    sql: "SELECT * FROM",
    data: [
      {
        lng: 114.057868,
        lat: 22.543099,
        city: "深圳市",
        adcode: 440300,
        value: 120,
        status: "normal"
      },
      {
        lng: 118.089425,
        lat: 24.479834,
        city: "厦门市",
        adcode: 350200,
        value: 60,
        status: "normal"
      },
      {
        lng: 84.873946,
        lat: 45.595886,
        city: "克拉玛依市", // 新疆北部
        adcode: 650200,
        value: 40,
        status: "normal"
      },
      {
        lng: 98.49432,
        lat: 39.73255,
        city: "酒泉市", // 甘肃西部
        adcode: 620900,
        value: 35,
        status: "normal"
      },
      {
        lng: 109.99029,
        lat: 39.817179,
        city: "鄂尔多斯市", // 内蒙古中部
        adcode: 150600,
        value: 55,
        status: "normal"
      },
      {
        lng: 102.714601,
        lat: 25.049153,
        city: "楚雄市", // 云南中部
        adcode: 532301,
        value: 45,
        status: "normal"
      },
      {
        lng: 110.29002,
        lat: 25.27361,
        city: "桂林市", // 广西东北
        adcode: 450300,
        value: 50,
        status: "normal"
      },
      {
        lng: 129.513228,
        lat: 42.906964,
        city: "延吉市", // 东北边缘
        adcode: 222401,
        value: 38,
        status: "normal"
      }
    ],
    dataRemark: [
      { key: "lng", map: "lng", decription: "经度" },
      { key: "lat", map: "lat", decription: "纬度" },
      { key: "city", map: "city", decription: "城市名称" },
      { key: "adcode", map: "adcode", decription: "行政区划代码" },
      { key: "value", map: "value", decription: "数值" }
    ],
    component: {
      name: "threeMap-mapScatter",
      prop: "threeMapMapScatter"
    },
    option: {
      model: "version-test/assets/scene/echartGlMap/mapScatter/model-default-opaque.glb",
      offset: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      opacity: 100
    }
  }
];
