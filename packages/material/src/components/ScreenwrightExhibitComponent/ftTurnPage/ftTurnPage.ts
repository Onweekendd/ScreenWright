import { PageFlip, type SizeType } from "page-flip";

import type { IProps } from "./type";

const MAXWIDTH = 3840;
const MAXHEIGHT = 2140;
class FtTurnPage {
  private pageFlip: PageFlip | null = null;
  private IFlipSetting: IProps;
  container: HTMLElement;
  constructor(container: HTMLElement, IFlipSetting: IProps) {
    this.IFlipSetting = IFlipSetting;
    this.container = container;
    this.initTurnPage(container, IFlipSetting);
    this.addEventHandlers();
  }
  public addEventHandlers() {
    if (!this.pageFlip) {
      return;
    }
    this.pageFlip.on("flip", (e: unknown) => {
      // this.IFlipSetting?.onFlip && this.IFlipSetting.onFlip(e);
      if (this.IFlipSetting?.onFlip) {
        this.IFlipSetting.onFlip(e);
      }
    });
    this.pageFlip.on(
      "changeOrientation",
      (e: unknown) => this.IFlipSetting?.onChangeOrientation && this.IFlipSetting.onChangeOrientation(e)
    );
    this.pageFlip.on(
      "changeState",
      (e: unknown) => this.IFlipSetting?.onChangeState && this.IFlipSetting.onChangeState(e)
    );
    this.pageFlip.on("init", (e: unknown) => this.IFlipSetting?.onInit && this.IFlipSetting.onInit(e));
    this.pageFlip.on("update", (e: unknown) => this.IFlipSetting?.onUpdate && this.IFlipSetting.onUpdate(e));
  }
  public destroy() {
    if (!this.pageFlip) {
      return;
    }
    const flip = this.pageFlip;
    if (flip) {
      flip.off("flip");
      flip.off("changeOrientation");
      flip.off("changeState");
      flip.off("init");
      flip.off("update");
    }
    this.pageFlip.destroy();
  }

  public initTurnPage(container: HTMLElement, IFlipSetting: IProps) {
    const width = IFlipSetting.width;
    const height = IFlipSetting.height;
    this.pageFlip = new PageFlip(container, {
      width, // base page width
      height, // base page height
      size: (IFlipSetting.size as SizeType) || ("stretch" as SizeType),
      minWidth: IFlipSetting.minWidth ?? width,
      maxWidth: IFlipSetting.maxWidth ?? MAXWIDTH,
      minHeight: IFlipSetting.minHeight ?? height,
      maxHeight: IFlipSetting.maxHeight ?? MAXHEIGHT,
      maxShadowOpacity: IFlipSetting.maxShadowOpacity ?? 0.5,
      mobileScrollSupport: IFlipSetting.mobileScrollSupport ?? false,
      drawShadow: IFlipSetting.drawShadow ?? true,
      flippingTime: IFlipSetting.flippingTime ?? 1000,
      usePortrait: IFlipSetting.usePortrait ?? true,
      startZIndex: IFlipSetting.startZIndex ?? 0,
      autoSize: IFlipSetting.autoSize ?? true,
      showCover: IFlipSetting.showCover ?? false,
      startPage: IFlipSetting.startPage ?? 1,
      disableFlipByClick: IFlipSetting.disableFlipByClick ?? false,
      clickEventForward: IFlipSetting.clickEventForward ?? true,
      useMouseEvents: IFlipSetting.useMouseEvents ?? true
    });
  }
  public loadFromImages(imageList: string[]) {
    if (!this.pageFlip) {
      return;
    }
    this.pageFlip.loadFromImages(imageList);
  }
  public updateFromImages(imageList: string[]) {
    if (!this.pageFlip) {
      return;
    }
    this.pageFlip.updateFromImages(imageList);
  }
  public turnToPage(page: number): void {
    if (!this.pageFlip) {
      return;
    }
    this.pageFlip.turnToPage(page);
  }
  public flipNext() {
    if (!this.pageFlip) {
      return;
    }

    this.pageFlip.flipNext();
  }

  public flipPrev() {
    if (!this.pageFlip) {
      return;
    }

    this.pageFlip.flipPrev();
  }
  public getState() {
    if (!this.pageFlip) {
      return;
    }
    return this.pageFlip.getState();
  }
  public getPageCollection() {
    if (!this.pageFlip) {
      return;
    }
    return this.pageFlip.getPageCollection();
  }
  public setCurrentSpreadIndex(index: number) {
    const pageCollection = this.getPageCollection();
    if (pageCollection) {
      pageCollection.setCurrentSpreadIndex(index);
    }
  }
}
export { FtTurnPage };
