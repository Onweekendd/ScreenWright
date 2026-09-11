// 地图场景环境配置
import { uuid } from "@/utils/utils";

const { MINIO_DEFAULT_PREFIX } = process.env;
const { WEB_APP_MINIO_DEFAULT_PREFIX } = (window as any).webconfig;
const staticSourceUrl = `${WEB_APP_MINIO_DEFAULT_PREFIX || MINIO_DEFAULT_PREFIX}assets/scene`;
export const environment: Record<string, any> = {
  lightIconVisible: true, // 灯光图标显隐
  // 天空盒
  skyBox: {
    skyType: "sphere", // 形状
    type: "skyBox", // 类型
    imageType: "default", // type为image时，选择图片类型
    envMapType: "default",
    texture: `${staticSourceUrl}/skyBox/lightsky.jpg`, // 背景
    image: "", // 图片
    video: "", // 视频
    position: [0, 0, 0], // 位置
    rotateY: 0, // 旋转角
    radius: 6000, // 半径
    distance: 10000, // 距离(之后被radius替代)
    cloudSpeed: 0.02,
    cloudScale: 2.1,
    cloudInt: 0.5,
    skycolor1: "#336699",
    skycolor2: "#66b2ff",
    // 暂时不使用渐变色
    // color:
    //   'linear-gradient(0.0deg,rgba(100,249,232,1) 0.0,rgba(100,249,232,0.67) 100.0%)', // 颜色
    // opacity: 100 // 透明度
    color: "rgba(210,210,210,1)", // 颜色
    envSourceUrl: `${staticSourceUrl}/envmap`, // 天空盒环境贴图默认路径
    isFollowSkyBox: true, // 环境贴图是否跟随天空盒背景
    environment: "",
    environmentIntensity: 1,
    backgroundRotationY: 0,
    environmentRotationY: 0
  },
  // 灯光
  lights: [
    {
      index: "4dd07431-99e4-4dd8-9393-073c52705685", // uuid
      tabsName: "灯光1", // tab名称
      show: true, // 启用
      type: "directionalLight", // 类型
      intensity: 3, // 强度
      color: "rgba(255,255,255,1)", // 颜色
      skyColor: "rgba(255,255,255,1)", // 天空颜色
      groundColor: "rgba(255,255,255,1)", // 地面颜色
      distance: 500, // 距离
      rotateY: -160, // 旋转角
      rotateX: -40, // 俯仰角
      angle: 60, // 聚光灯最大范围
      position: [1000, 1000, 1000], // 灯光起点位置
      shadowArea: 300,
      target: [0, 0, 0], // 灯光焦点位置
      isFollowCamera: false, // 是否跟随相机(点光源)
      isCastShadow: true, // 灯光投影
      bias: -0.001, // 偏移
      mapSize: "4096,4096", // 质量
      radius: 100, // 半径
      focus: 1, // 聚焦
      isHelper: true, // 默认添加辅助线
      specular: "rgba(255,255,255,1)", // 高光颜色
      penumbra: 0.62, // 边缘模糊（聚光灯）
      shadowIntensity: 1 //阴影强度
    },
    {
      index: "43635eb4-3d1e-4023-8ab3-8a32f6dacdd1", // uuid
      tabsName: "灯光2", // tab名称
      show: true, // 启用
      type: "ambientLight", // 类型
      intensity: 0.3, // 强度
      color: "rgba(214,229,255,1)", // 颜色
      skyColor: "rgba(255,255,255,1)", // 天空颜色
      groundColor: "rgba(255,255,255,1)", // 地面颜色
      distance: 500, // 距离
      rotateY: -160, // 旋转角
      rotateX: -40, // 俯仰角
      angle: 60, // 聚光灯最大范围
      position: [1000, 1000, 1000], // 灯光起点位置
      shadowArea: 300,
      target: [0, 0, 0], // 灯光焦点位置
      isFollowCamera: false, // 是否跟随相机(点光源)
      isCastShadow: false, // 灯光投影
      bias: -0.001, // 偏移
      mapSize: "4096,4096", // 质量
      radius: 100, // 半径
      focus: 1, // 聚焦
      isHelper: true, // 默认添加辅助线
      specular: "rgba(255,255,255,1)", // 高光颜色
      penumbra: 0.62, // 边缘模糊（聚光灯）
      shadowIntensity: 1 //阴影强度
    }
    // {
    //   index: 'c895b298-bbb7-40a1-b7d0-5df166535e3f',
    //   tabsName: '灯光3',
    //   show: true, // 启用
    //   type: 'ambientLight',
    //   intensity: 0.8,
    //   color: 'rgba(255,255,255,1)',
    //   skyColor: 'rgba(255,255,255,1)', // 天空颜色
    //   groundColor: 'rgba(255,255,255,1)', // 地面颜色
    //   distance: 1000,
    //   rotateY: -180, // 旋转角
    //   rotateX: -50, // 俯仰角
    //   angle: 60, // 聚光灯最大范围
    //   position: [1000, 1000, 1000], // 灯光起点位置
    //   target: [0, 0, 0], // 灯光焦点位置
    //   isFollowCamera: false, // 是否跟随相机(点光源)
    //   isCastShadow: true, // 灯光投影
    //   bias: -0.0001, // 偏移
    //   mapSize: '4096,4096', // 质量
    //   focus: 1, // 聚焦
    //   radius: 100, // 半径
    //   isHelper: true // 默认添加辅助线
    // }
  ],
  // 雾化
  fog: {
    isOpen: false,
    color: "rgba(210,210,210,1)",
    near: 500,
    far: 1500,
    disabledHeight: true, // 是否禁用高度雾
    fogTop: 3000, // 结束高度
    fogBottom: 0, // 起始高度
    isDefault: true // 是否跟随天空盒颜色
  },
  // 云
  skyCloud: {
    isOpen: false,
    type: "sky",
    skyType: "dynamic", // 动态云
    cloudType: 0, // 0: 高层云 1: 双层云 2：积云 3：积雨云
    cloudy: 0.6, // 云层密度 范围[0, 1]
    speed: 0.001, // 速度 风速 范围[0, 1]
    angle: 89, // 风向角度 范围[0, 360]
    enableSunLight: true, // 是否启用太阳光
    enableCloud: true, // 是否启用云效果
    time: 17, // 时间（单位时） 范围[0, 24]
    exposure: 0.9, // 曝光等级
    height: 1500, // 云层高度
    thickness: 0.23 // 云厚度 范围[0, 10]
  },
  // 渲染器
  renderer: {
    envType: "neutral", // 全局环境贴图类型 hdr, neutral, none
    envHdr: "", // hdr类型
    shadowEnabled: true, // 是否开启阴影
    toneMapping: 1,
    exposure: 1, // 色调映射的曝光级别
    outputEncoding: 3001 // 色彩空间
  },
  // 后处理（泛光，抗锯齿，gamma校正等）(未完善)
  postProcessing: {
    enabled: true, // 是否开启后处理

    ssrEnabled: false, // 是否开启环境反射
    ssrOpacity: 0.8, // 透明度
    ssrDistance: 0, // 最大距离
    ssrThickness: 0, // 环境反射厚度

    gtaoEnabled: false, //  全局投影
    gtaoRadius: 0.5, // 全局投影半径
    gtaoIntensity: 0.8, // 全局投影强度
    // ssaoQuality: 0.5, // 全局投影质量
    // ssaoMinDistance: 0.001, // 全局投影最小距离
    // ssaoMaxDistance: 10, // 全局投影最大距离

    // grainEnabled: false, // 胶片颗粒
    // grainIntensity: 0.2, // 胶片颗粒强度

    dofEnabled: false, // 开启景深模糊
    dofFocus: 50.0, // 景深焦距
    dofAperture: 0.025, // 景深孔径
    dofMaxblur: 0.01, // 景深最大模糊程度

    // edgeBlurEnalbed: false, // 边角模糊是否开启
    // edgeBlurRadius: 0.2, // 模糊范围
    // edgeBlurIntensity: 1, // 模糊强度

    // sharpenEnabled: false, // 锐化
    // sharpenIntensity: 0.1, // 锐化程度

    // chromaticAberrationEnabled: false, // 色差
    // chromaticAberrationIntensity: 0.2, // 强度

    unrealBloomEnabled: false, // 是否开启泛光
    bloomStrength: 0.6, // 泛光强度
    bloomRadius: 0.7, // 泛光半径
    bloomThreshold: 0.7, // 泛光线性衰减

    globalUnrealBloomEnabled: false, // 全局泛光
    globalBloomStrength: 0.3, // 全局泛光强度
    globalBloomRadius: 0.7, // 全局泛光半径
    globalBloomThreshold: 0.7, // 全局泛光线性衰减

    colorCorrectEnabled: false, // 颜色校正
    colorExposure: 0.03, // 曝光
    colorBrightness: -0.6, // 亮度
    colorContrast: -0.9, // 对比度
    colorSaturation: 0.3, // 饱和度
    coloTemperature: 0, // 色温
    colorTint: 0, // 色偏
    colorHue: 0, // 色相

    lutEnabled: false, // lut滤镜是否开启
    lutIntensity: 0.2, // lut强度
    lutType: "Lenox 340", // lut滤镜类型
    lutUrl: `${staticSourceUrl}/lut`, // lut默认路径

    antiAliasingType: "MSAA", // 抗锯齿类型
    smaaEnabled: false, // smaa抗锯齿
    fxaaEnabled: false, // fxaa抗锯齿
    msaaEnabled: true, // msaa抗锯齿
    samples: 4, // msaa抗锯齿重采样次数

    flowEnabled: false, // 是否开启扫光
    flowIntensity: 1, // 扫光强度
    flowColor: "rgba(255,255,255,1)", // 扫光颜色
    flowPosition: [0, 0, 0], // 扫光初始位置
    flowSpeed: 0.5, // 扫光速度
    flowMaxRadius: 5000, // 扫光最大半径

    godRayEnable: false, // 是否开启耶稣光
    godRayBlurriness: 1, // 模糊程度
    godRayDensity: 0.96, //光源强度
    godRayDecay: 0.98, // 衰减
    godRayWeight: 0.3, // 光比重
    godRayExposure: 0.54, // 曝光程度
    godRayClampMax: 1, // 最大颜色比例
    godRaySamples: 32, // 采样数量
    godRayColor: "rgba(255,221,170,1)", // 颜色
    godRayOpacity: 1, // 透明度
    godRayRadius: 40, //光源半径
    godRayResolutionScale: 0.5, // 分辨率缩放
    godRayPosition: [1500, 150, 1500], //光源位置

    // 未使用
    outlineEnabled: false, // 是否开启外轮廓高亮
    gammaEnabled: false // 是否开启颜色校正
  },
  // 空间特效
  spaceEffect: [
    {
      show: false, // 启用
      type: "", // 类型
      tabsName: "特效1",
      index: uuid()
    }
    // {
    //   index: 'ecf4909d-f663-4949-8f1e-a85ac4f6f281', // uuid
    //   tabsName: '特效1', // tab名称
    //   show: false, // 启用
    //   type: '', // 类型
    //   offsetX: 0, // 偏移X
    //   offsetY: 0, // 偏移Y
    //   offsetZ: 0, // 偏移Z
    //   radius: 100, // 半径
    //   minHeight: 0, // 最小高度
    //   maxHeight: 500, // 最大高度
    //   size: 10, // 尺寸
    //   density: 50, // 密度
    //   direction: 0, // 方向
    //   color: 'rgba(255, 255, 255, 1)', // 颜色
    //   brightness: 1, // 亮度
    //   lineWidth: 0.5, // 线宽
    //   scale: 1, // 个体缩放
    //   speed: 2, // 速度
    //   interval: 2, // 间隔
    //   minViewDistance: 0, // 最小可视距离
    //   maxViewDistance: 2000 // 最大可视距离
    // },
    // {
    //   index: '2cdec78a-2d90-4972-8b6a-d3d34f883764', // uuid
    //   tabsName: '特效2', // tab名称
    //   show: false, // 启用
    //   type: 'glowworm' // 类型
    // }
  ],
  // 相机以及相机控制器配置 (未完善)
  camera: {
    autoRotate: false, // 自动旋转
    viewLimitEnable: true, // 视角限制
    fov: 45, // 视场角
    distanceMin: 1, // 最小裁剪面
    distanceMax: 3000, // 最大裁剪面
    viewDistanceMin: 1, // 最小可视距离
    viewDistanceMax: 50000, // 最大可视距离
    inclinationAngleMin: -90, // 最小俯仰角
    inclinationAngleMax: 90, // 最大俯仰角
    rotationAngleLimited: false, // 旋转角限制
    rotationAngleMin: -180, // 最小旋转角
    rotationAngleMax: 180, // 最大旋转角
    positionCenter: [0, 0, 0], // 最大最小位置中心点
    positionMin: [-1000, -1000, -1000], // 最小位置
    positionMax: [1000, 1000, 1000], // 最大位置
    position: [[5, 65, 110]], // 视点
    target: [[0, 0, 0]], // 目标点
    flyTime: [1.5], // 视角移动时间
    flyInterval: 0, // 视角移动间隔

    // 暂时没有这几个配置
    // limitedShow: false, // 视点限制
    // limitedRadius: 1000, // 视点限制半径
    // cameraRotateY: 0, // 摄像机水平角
    // cameraRotateX: -26, // 摄像机俯仰角
    // cameraDistance: 110, // 摄像机距离

    // 用不上的
    dollySpeed: 0.05,
    truckSpeed: 1,
    polarRotateSpeed: 1, // 极性旋转速度
    azimuthRotateSpeed: 1, // 水平角旋转速度
    dampingFactor: 0.5, // 阻尼因子
    draggingDampingFactor: 0.25 // 拖拽阻尼因子
  },
  publishQuality: {
    // 发布质量
    resolution: "orignal",
    effect: "none", // 'orignal 'medium' 'low' 'none'
    shadow: "medium",
    texture: "medium",
    mergeType: "merge", // merge/instance
    num: 10
  },
  // 模型是否合并
  performance: {
    type: "none", // 'merge' 'instance' 'none'
    num: 5
  },
  animation: {
    keyframes: []
  }
};

export const models = [];

// 默认底图配置
export const baseConfig = [
  {
    type: "TileLayer",
    name: "底图",
    enable: true,
    layerType: "wmts",
    rightSideOptions: {
      layerName: "mars:hfgh",
      layerFormat: "png",
      subdomains: ["a", "b", "c", "d"],
      isBaseLayer: false,
      crs: "EPSG:3857",
      attribution:
        '&copy; <a href="http://osm.org">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/">CARTO</a>',
      maskOptions: {
        sepia: 0,
        brightness: 100,
        invert: 0,
        saturate: 100,
        enable: false,
        "hue-rotate": 0,
        contrast: 100
      },
      url: "http://t0.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=0e018e8c8af00c9073d72c6e4def7729",
      token: ""
    }
  },
  {
    layerType: "wmts",
    rightSideOptions: {
      layerFormat: "png",
      subdomains: ["a", "b", "c", "d"],
      isBaseLayer: false,
      crs: "EPSG:3857",
      attribution:
        '&copy; <a href="http://osm.org">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/">CARTO</a>',
      layerName: "mars:hfgh",
      maskOptions: {
        sepia: 0,
        brightness: 100,
        invert: 0,
        saturate: 100,
        enable: false,
        "hue-rotate": 0,
        contrast: 100
      },
      url: "http://t0.tianditu.gov.cn/cva_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=w&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=0e018e8c8af00c9073d72c6e4def7729",
      token: ""
    },
    enable: false,
    name: "底图标注",
    type: "TileLayer"
  }
];
export const cityData = [
  {
    environment: {
      lightsShow: false,
      ambient: {
        HDR: ""
      },
      skyBox: {
        enable: true,
        skyboxData: {
          img: [
            "version-test/cityScene/1407968381/right_81e70256-20b9-4d44-bdc0-623db58d1ffe.jpg",
            "version-test/cityScene/1407968381/left_5d7a5679-f3db-407d-b612-79632ef244d2.jpg",
            "version-test/cityScene/1407968381/bottom_baf183f5-bdad-47e1-ae65-4b2c86523b7a.jpg",
            "version-test/cityScene/1407968381/top_884e9986-6914-41de-a18f-4324202fa486.jpg",
            "version-test/cityScene/1407968381/front_a9e4eac7-ac15-4827-9572-20e319e6ca82.jpg",
            "version-test/cityScene/1407968381/back_278870ee-dc2c-494c-837c-b4c595556a6e.jpg"
          ],
          name: "skyImgFolder.zip"
        },
        backgroundUrl: "version-test/36729564-0662-47e1-8666-6550b7f9c0a3.jpg",
        backgroundType: "天空盒",
        backgroundColor: "rgb(36, 49, 94)"
      },
      lights: [
        {
          bias: 0.0001,
          show: true,
          type: "directionalLight",
          angle: 60,
          color: "rgb(255, 255, 255)",
          focus: 1,
          index: "43635eb4-3d1e-4023-8ab3-8a32f6dacdd1",
          radius: 100,
          target: [0, 0, 0],
          mapSize: "2048,2048",
          rotateX: -69.2,
          rotateY: 101.5,
          distance: 5000,
          isHelper: false,
          position: [1000, 1000, 1000],
          skyColor: "rgba(255,255,255,1)",
          tabsName: "平行光",
          intensity: 2,
          shadowArea: 25000,
          groundColor: "rgba(255,255,255,1)",
          isCastShadow: false,
          isFllowCamera: false
        },
        {
          bias: 0.0001,
          show: true,
          type: "ambientLight",
          angle: 60,
          color: "rgba(255,255,255,1)",
          focus: 1,
          index: "c895b298-bbb7-40a1-b7d0-5df166535e3f",
          radius: 100,
          target: [0, 0, 0],
          mapSize: "2048,2048",
          rotateX: -50,
          rotateY: -180,
          distance: 1000,
          isHelper: false,
          position: [1000, 1000, 1000],
          skyColor: "rgba(255,255,255,1)",
          tabsName: "环境光",
          intensity: 2.5,
          groundColor: "rgba(255,255,255,1)",
          isCastShadow: true,
          isFllowCamera: false
        }
        // {
        //   bias: 0.0001,
        //   show: true,
        //   type: 'directionalLight',
        //   angle: 60,
        //   color: 'rgb(31, 135, 232)',
        //   focus: 1,
        //   index: '9205d0310ab442549011a694e2140573',
        //   radius: 100,
        //   target: [0, 0, 0],
        //   mapSize: '2048,2048',
        //   rotateX: 90,
        //   rotateY: 45.2,
        //   distance: 30000,
        //   isHelper: false,
        //   position: [1000, 1000, 1000],
        //   skyColor: 'rgba(255,255,255,1)',
        //   tabsName: '灯光1',
        //   intensity: 1,
        //   groundColor: 'rgba(255,255,255,1)',
        //   isCastShadow: true,
        //   isFllowCamera: false
        // }
      ],
      fog: {
        isOpen: false,
        color: `rgba(210,210,210,1)`,
        near: 1,
        far: 10000
      },
      skyCloud: {
        isOpen: true,
        enabled: true,
        type: "sky",
        skyType: "dynamic", // 动态云
        cloudType: 2, // 0: 高层云 1: 双层云 2：积云 3：积雨云
        cloudy: 0.5, // 云层密度 范围[0, 1]
        speed: 0.05, // 速度 风速 范围[0, 1]
        angle: 0, // 风向角度 范围[0, 360]
        enableSunLight: false, // 是否启用太阳光
        enableCloud: true, // 是否启用云效果
        time: 10, // 时间（单位时） 范围[0, 24] 日出6， 日落18
        exposure: 2, // 曝光等级
        height: 1100, // 云层高度
        thickness: 0.9 // 云厚度 范围[0, 10]
      },
      skyType: "skyCloud",
      renderer: {
        toneMapping: "Linear",
        colorSpace: "SRGBTransfer",
        shadowEnabled: true,
        exposure: 1
      },
      postProcessing: {
        enabled: false,
        ssrEnabled: false,
        ssrDistance: 0,
        ssrThickness: 0,
        ssaoEnabled: false,
        ssaoRadius: 5,
        ssaoMinDistance: 0.001,
        ssaoMaxDistance: 10,
        dofEnabled: false,
        dofFocus: 50,
        dofAperture: 0.025,
        dofMaxblur: 0.01,
        unrealBloomEnabled: false,
        bloomStrength: 0.6,
        bloomRadius: 0.7,
        bloomThreshold: 0.7,
        // lutEnabled: false,
        // lutIntensity: 1,
        // lutType: 'Lenox 340',
        // lutUrl: 'version-test/assets/scene/lut',
        colorCorrectionEnbled: false,
        colorExposure: 0,
        colorBrightness: 0,
        colorContrast: 0,
        colorSaturation: 0,
        coloTemperature: 0,
        colorTint: 0,
        colorHue: 0,
        smaaEnabled: true,
        outlineEnabled: true,
        gammaEnabled: false
      },
      spaceEffect: [],
      camera: {
        autoRotate: false,
        fov: 45,
        distanceMin: 1,
        distanceMax: 3000,
        viewDistanceMin: 1,
        viewDistanceMax: 50000,
        inclinationAngleMin: -90,
        inclinationAngleMax: 90,
        rotationAngleLimited: false,
        rotationAngleMin: -180,
        rotationAngleMax: 180,
        flyInterval: 0,
        dollySpeed: 0.05,
        truckSpeed: 1,
        polarRotateSpeed: 1,
        azimuthRotateSpeed: 1,
        dampingFactor: 0.5,
        draggingDampingFactor: 0.25
      }
    },
    maptalksMap: {
      extent: {
        ymin: 0,
        xmin: 0,
        ymax: 90,
        xmax: 180
      },
      options: {
        scaleControl: false,
        shadow: {
          type: "esm",
          enable: true,
          quality: "high",
          opacity: 1,
          color: "rgb(0,0,0)",
          blurOffset: 1
        },
        overviewControl: false,
        centerCross: true,
        attribution: false,
        zoomControl: false,
        spatialReference: {},
        lights: {
          directional: {
            color: [1, 1, 1],
            direction: [0.13, 0.2, -0.37]
          },
          ambient: {
            luminance: 0,
            orientation: 0,
            exposure: 1,
            resource: {
              prefilterCubeSize: 512,
              url: ""
            },
            hsv: [0, 0, 0]
          }
        },
        specialEffects: {
          ssr: {
            enable: false
          },
          ssao: {
            bias: 0.5,
            enable: true,
            radius: 0.5,
            intensity: 1
          },
          bloom: {
            enable: true,
            factor: 0.5,
            radius: 0.5,
            threshold: 0.5
          },
          enable: true,
          outline: {
            enable: false
          },
          sharpen: {
            enable: false,
            factor: 0
          },
          antialias: {
            taa: true,
            enable: true
          }
        },
        viewpoint: {
          isAutoRotate: false,
          zoom: [4.7, 22],
          isRotate: true,
          maxPitch: 88.5,
          minExtent: [78.73, 10.11],
          maxExtend: [130.86, 60.04],
          roamGap: 5,
          flyTime: 1,
          roams: [
            {
              // 偏转角
              bearing: 3.22,
              // 坐标
              center: [104.41534288, 37.07580914],
              // 缩放层级
              zoom: 4.73,
              // 俯仰角
              pitch: 9.45,
              // 间隔时间
              gap: 0,
              // 持续时间
              duration: 1.5
            }
          ]
        }
      }
    },
    layers: [
      {
        name: "底图",
        dataType: "base",
        areaCode: null,
        enable: true,
        layers: baseConfig
      }
    ]
  }
];

// 三维默认创建参数
export const defaultSceneConfig = {
  name: "",
  groupId: -2,
  password: "",
  globalArgs: '{"connectedModelList":[]}',
  defaultScene: JSON.stringify({
    name: "default",
    environment: { ...environment },
    models
  }),
  sceneList: "[]",
  applicationCode: "BI"
};
// 工厂场景默认创建参数
export const defaultIndustrySceneConfig = {
  name: "",
  groupId: -2,
  password: "",
  globalArgs: '{"connectedModelList":[]}',
  defaultScene: JSON.stringify({
    name: "default",
    environment: { ...environment },
    models
  }),
  sceneList: "[]",
  applicationCode: "BI",
  belong: 1
};
// 城市模板默认创建参数
export const defaultCityConfig = {
  config: "",
  name: "",
  autoSavePic: true,
  viewSaving: true,
  groupId: -2,
  password: "",
  waterMark:
    '{"show":true,"fontStyle":"normal","fontWeight":"normal","width":400,"height":200,"rotate":-30,"contentType":"text","content":"Screenwright","globalAlpha":0.2,"textType":"fill","lineHeight":30,"fontSize":"30px","fontFamily":"sans-serif","fontColor":"#646464","textAlign":"center"}',
  applicationCode: "City"
};
