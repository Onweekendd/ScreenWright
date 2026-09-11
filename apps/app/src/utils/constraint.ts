import type { ComponentType, LargeScreenDetailInfo } from "@screenwright/types";
import { horizontalConstEnum, verticalConstEnum } from "@screenwright/types";

/** 设计稿 → 当前视口的横向/纵向缩放比 */
export interface ScaleConstraint {
  vertical: number;
  horizontal: number;
}

/** 锚点布局所参照的视口（一般为浏览器窗口或画布 DOM 尺寸），由调用方传入，工具层不依赖 Vue */
export interface ConstraintViewport {
  width: number;
  height: number;
}

export interface HandleConstraintOptions {
  viewport: ConstraintViewport;
}

interface LayoutContext {
  viewport: ConstraintViewport;
  editConfig: LargeScreenDetailInfo;
}

function getDesignSize(editConfig: LargeScreenDetailInfo): { width: number; height: number } {
  const w = Number(editConfig.width);
  const h = Number(editConfig.height);
  return {
    width: Number.isFinite(w) && w !== 0 ? w : 1,
    height: Number.isFinite(h) && h !== 0 ? h : 1
  };
}

function hasConstraintProps(target: ComponentType): target is ComponentType & {
  horizontalConst: horizontalConstEnum;
  verticalConst: verticalConstEnum;
} {
  return target.horizontalConst != null && target.verticalConst != null;
}

const horizontalMap: Record<horizontalConstEnum, (target: ComponentType, ctx: LayoutContext) => void> = {
  [horizontalConstEnum.Left]: (target) => {
    target.left = target.left;
  },
  [horizontalConstEnum.Center]: (target, ctx) => {
    const { width: vw } = ctx.viewport;
    const { width: designW } = getDesignSize(ctx.editConfig);
    const center = designW / 2;
    let left = 0;
    if (target.left + target.component.width <= center) {
      const difference = center - target.component.width - target.left;
      left = vw / 2 - difference - target.component.width;
    } else {
      left = target.left - center + vw / 2;
    }
    target.left = left;
  },
  [horizontalConstEnum.Right]: (target, ctx) => {
    const { width: vw } = ctx.viewport;
    const { width: designW } = getDesignSize(ctx.editConfig);
    const differenceRight = designW - target.component.width - target.left;
    target.left = vw - (differenceRight + target.component.width);
  }
};

const verticalMap: Record<verticalConstEnum, (target: ComponentType, ctx: LayoutContext) => void> = {
  [verticalConstEnum.Top]: (target) => {
    target.top = target.top;
  },
  [verticalConstEnum.Center]: (target, ctx) => {
    const { height: vh } = ctx.viewport;
    const { height: designH } = getDesignSize(ctx.editConfig);
    const center = designH / 2;
    let top = 0;
    if (target.top + target.component.height <= center) {
      const difference = center - target.component.height - target.top;
      top = vh / 2 - difference - target.component.height;
    } else {
      top = target.top - center + vh / 2;
    }
    target.top = top;
  },
  [verticalConstEnum.Bottom]: (target, ctx) => {
    const { height: vh } = ctx.viewport;
    const { height: designH } = getDesignSize(ctx.editConfig);
    const differenceBottom = designH - target.component.height - target.top;
    target.top = vh - (differenceBottom + target.component.height);
  }
};

function applyHorizontal(target: ComponentType, h: horizontalConstEnum, ctx: LayoutContext) {
  horizontalMap[h](target, ctx);
}

function applyVertical(target: ComponentType, v: verticalConstEnum, ctx: LayoutContext) {
  verticalMap[v](target, ctx);
}

function handleGroupComponent(target: ComponentType, ctx: LayoutContext) {
  const children = (target.children ?? []) as ComponentType[];

  if (!hasConstraintProps(target)) {
    applyHorizontal(target, horizontalConstEnum.Left, ctx);
    applyVertical(target, verticalConstEnum.Top, ctx);
    for (const child of children) {
      applyHorizontal(child, horizontalConstEnum.Left, ctx);
      applyVertical(child, verticalConstEnum.Top, ctx);
    }
    return;
  }

  applyHorizontal(target, target.horizontalConst, ctx);
  applyVertical(target, target.verticalConst, ctx);

  for (const child of children) {
    applyHorizontal(child, target.horizontalConst, ctx);
    applyVertical(child, target.verticalConst, ctx);
  }
}

function handleDefaultComponent(target: ComponentType, ctx: LayoutContext) {
  if (!hasConstraintProps(target)) {
    applyHorizontal(target, horizontalConstEnum.Left, ctx);
    applyVertical(target, verticalConstEnum.Top, ctx);
    return;
  }
  applyHorizontal(target, target.horizontalConst, ctx);
  applyVertical(target, target.verticalConst, ctx);
}

/**
 * 按锚点与缩放比，将设计稿坐标映射到当前视口。
 */
export const handleConstraint = (
  options: HandleConstraintOptions,
  cpL: ComponentType[],
  editConfig: LargeScreenDetailInfo
): ComponentType[] => {
  const { viewport } = options;
  const ctx: LayoutContext = { viewport, editConfig };
  const cpls = JSON.parse(JSON.stringify(cpL)) as ComponentType[];

  for (const target of cpls) {
    const isGroup = Boolean(target.children?.length);
    if (isGroup) {
      handleGroupComponent(target, ctx);
    } else {
      handleDefaultComponent(target, ctx);
    }
  }

  return cpls;
};
