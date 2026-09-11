type borderImageSizeType = "contain" | "cover" | "fill" | "none" | "scale-down";
type objectFitType = "contain" | "cover" | "fill" | "none" | "scale-down";
type textAlignType = "left" | "center" | "right" | "justify";
export interface ImageItem {
  id?: string | number;
  value: string;
  content?: string;
  borderImage?: string;
  borderImageWidth?: number;
  borderImageHeight?: number;
  borderImageSize?: borderImageSizeType;
  objectFit?: objectFitType;
  imgTranslateX?: number;
  imgTranslateY?: number;
  fontColor?: string;
  fontSize?: number;
  textAlign?: textAlignType;
  letterSpacing?: number;
  fontWeight?: string;
  fontFamily?: string;
  fontStyle?: string;
  isTextShadow?: boolean;
  textShadow?: {
    color: string;
    x: number;
    y: number;
    blur: number;
  };
  textTranslateX?: number;
  textTranslateY?: number;
  textWidth?: number;
  textBackground?: string;
  textShowBackground?: boolean;
  textPaddingTop?: number;
  textPaddingBottom?: number;
  textPaddingLeft?: number;
  textPaddingRight?: number;
}
