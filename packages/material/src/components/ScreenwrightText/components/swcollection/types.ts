export interface CollectionItem {
  src: string;
  title?: string;
  [key: string]: any;
}

export interface CollectionOption {
  cardLen: number;
  scroll: boolean;
  scrollBar: boolean;
  speed: number;
  speedPosition: "ToLeft" | "ToRight" | "ToTop" | "ToBottom";
  loopPlay: boolean;
  autoPlay: boolean;
  muted: boolean;
  controls: boolean;
  padding: [number, number, number, number];
  backgroundType: "color" | "image";
  background: string;
  backgroundImage: string;
  cardBackgroundType: "color" | "image";
  cardBackgroundColor: string;
  cardBackgroundImage: string;
  cardObjectFit: string;
  cardPadding: [number, number, number, number];
  cardMarginRight: number;
  titleWidth: number;
  titleHeight: number;
  color: string;
  fontSize: number;
  fontWeight: number;
  fontFamily: string;
  fontStyle: string;
  spacing: number;
  textTranslateX: number;
  textTranslateY: number;
  cardBgObjectFit: string;
}

export type MediaType = "图片" | "视频" | "";
