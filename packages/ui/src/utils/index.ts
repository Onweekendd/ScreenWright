import { isNil, isString } from "lodash-es";
const { VITE_PUBLIC_PATH: PUBLIC_PATH, VITE_MINIO_BASE_URL: MINIO_BASE_URL } = import.meta.env;
export const BaseName = {
  System: "/bi-system",
  User: "/user",
  Order: "/order",
  Online: "/online",
  Suffix: "Agg",
  AppCode: "BI",
  BaseName: PUBLIC_PATH || ""
} as const;

// minio资源域名公共拼接方法
export const setMinioUrl = (url: string) => {
  const pattern = /(data:image)|(http[s]?:\/\/)/;
  if (!isString(url)) {
    return "";
  }
  if (!url || isNil(url)) return ""; // 若为空(null/undefined)直接返回空不做判断操作
  if (url && (url.slice(0, 2) == "./" || url.slice(0, 5) == "/img/")) return url;
  return pattern.test(url) ? url : MINIO_BASE_URL + url;
};

export const uuid = (len = 36) => {
  const s = [];
  const hexDigits = "0123456789abcdefghijklmnopqrstuvwxyzGHIJKLMNOPQRSTUVWXYZ";
  for (let i = 0; i < len; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x36), 1);
  }
  if (len > 8) {
    s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((parseInt(s[19], 16) & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";
  }
  const uuid = s.join("");
  return uuid;
};

export const fontFamily = [
  { label: "sans-serif", value: "sans-serif" },
  { label: "Arial-字体", value: "Arial" },
  { label: "思源黑体-Normal", value: "siayuan-normal" },
  { label: "思源黑体-Regular", value: "siayuan-regular" },
  { label: "思源黑体-Bold", value: "siayuan-bold" },
  { label: "DIN-粗体", value: "DIN-Bold" },
  { label: "DIN-黑体", value: "DIN-Black" },
  { label: "DIN-黑斜体", value: "DIN-BlackItalic" },
  { label: "DIN-粗斜体", value: "DIN-BoldItalic" },
  { label: "DINCond-粗体", value: "DINCond-Bold" },
  { label: "DINCond-细体", value: "DINCond-Light" },
  { label: "DINCond-中等体", value: "DIN-Bold-Medium" },
  { label: "DIN-细体", value: "DIN-Light" },
  { label: "DIN-细斜体", value: "DIN-LightItalic" },
  { label: "DIN-中等斜体", value: "DIN-MediumItalic" },
  { label: "DIN-常规体", value: "DIN-Regular" },
  { label: "DIN-常规斜体", value: "DIN-RegularItalic" },
  { label: "D-DIN-压缩体", value: "D-DINCondensed" },
  { label: "D-DIN-压缩粗体", value: "D-DINCondensed-Bold" },
  { label: "OPPO Sans字体", value: "OppOOPPOSans" },
  { label: "庞门正道标题体", value: "PangMenZhengDaoBiaoTiTi-1" },
  { label: "庞门正道粗书体", value: "PangMenZhengDaoCuShuTi-2" },
  { label: "阿里巴巴普惠体", value: "Alibaba-PuHuiTi-Regular" },
  { label: "造字工房悦黑", value: "造字工房悦黑" },
  { label: "优设标题黑", value: "优设标题黑" },
  { label: "液晶字体", value: "DigifaceWide_Regular" },
  { label: "钉钉进步体", value: "DingTalk_JinBuTi_Regular" },
  { label: "方正兰亭中黑简体1", value: "方正兰亭中黑_简体" },
  { label: "方正兰亭中黑简体2", value: "FZLTZHJW" },
  { label: "方正兰亭黑简体", value: "方正兰亭黑简体" },
  { label: "方正兰亭纤黑简体", value: "方正兰亭纤黑简体" },
  { label: "创客贴金刚体", value: "ChuangKeTieJinGangTi" },
  { label: "斗鱼字体", value: "DOUYU_Font" },
  { label: "斗鱼追光体", value: "DY追光体" },
  { label: "GrtskTera-细体", value: "GrtskTera-Light" },
  { label: "GrtskTera-中等体", value: "GrtskTera-Medium" },
  { label: "GrtskTera-半粗体", value: "GrtskTera-Semibold" },
  { label: "GrtskTera-Thin", value: "GrtskTera-Thin" },
  { label: "阿里妈妈数黑体", value: "阿里妈妈黑体" },
  { label: "阿里妈妈灵动体", value: "阿里妈妈灵动体" },
  { label: "阿里妈妈方圆体", value: "AlimamaFangYuanTiVF-Thin" },
  { label: "阿里巴巴细体", value: "AlibabaPuHuiTi-2-55-Regular" },
  { label: "League Gothic", value: "LeagueGothic-Regular" },
  { label: "MiSans-Regular", value: "MiSans-Regular" },
  { label: "MiSans-Bold", value: "MiSans-Bold" },
  { label: "MiSans-Heavy", value: "MiSans-Heavy" },
  { label: "MiSans-Light", value: "MiSans-Light" },
  { label: "MiSans-Medium", value: "MiSans-Medium" },
  { label: "TimesNewRoman", value: "TimesNewRoman" },
  { label: "施耐德正文字体", value: "arialmt" },
  { label: "施耐德标题字体", value: "ARIALROUNDEDMT" }
];
