/**
 * 检测对象滑动
 * @param dom 需要检测滑动的dom
 * @param cb 回调函数
 * @param isTouched 是否触屏
 * @returns 返回包含开始、结束触摸事件处理函数和触摸状态的对象
 */
export function onDomTouch(dom: HTMLElement, cb: (direction: string) => void, isTouched?: boolean) {
  let startx = 0,
    starty = 0;
  const isTouch = "ontouchend" in document;

  //获得角度
  function getAngle(angx: number, angy: number): number {
    return (Math.atan2(angy, angx) * 180) / Math.PI;
  }

  //根据起点终点返回方向 1向上滑动 2向下滑动 3向左滑动 4向右滑动 0点击事件
  function getDirection(startx: number, starty: number, endx: number, endy: number): string {
    const angx = endx - startx;
    const angy = endy - starty;

    //如果滑动距离太短
    if (Math.abs(angx) < 2 && Math.abs(angy) < 2) {
      return "click";
    }

    const angle = getAngle(angx, angy);
    if (angle >= -135 && angle <= -45) {
      return "up";
    } else if (angle > 45 && angle < 135) {
      return "down";
    } else if ((angle >= 135 && angle <= 180) || (angle >= -180 && angle < -135)) {
      return "left";
    } else if (angle >= -45 && angle <= 45) {
      return "right";
    }
    return "click";
  }

  const startFun = (e: TouchEvent | MouseEvent) => {
    if (isTouch || isTouched) {
      const touchEvent = e as TouchEvent;
      startx = touchEvent.touches[0].pageX;
      starty = touchEvent.touches[0].pageY;
    } else {
      const mouseEvent = e as MouseEvent;
      startx = mouseEvent.pageX;
      starty = mouseEvent.pageY;
    }
  };

  const endFun = (e: TouchEvent | MouseEvent) => {
    let endx = 0,
      endy = 0;
    if (isTouch || isTouched) {
      const touchEvent = e as TouchEvent;
      endx = touchEvent.changedTouches[0].pageX;
      endy = touchEvent.changedTouches[0].pageY;
    } else {
      const mouseEvent = e as MouseEvent;
      endx = mouseEvent.pageX;
      endy = mouseEvent.pageY;
    }
    const direction = getDirection(startx, starty, endx, endy);
    console.log("滑动", direction);
    cb && cb(direction);
    e.stopPropagation(); // 阻止事件冒泡
  };

  if (isTouch || isTouched) {
    //手指接触屏幕
    dom.addEventListener("touchstart", startFun, false);
    //手指离开屏幕
    dom.addEventListener("touchend", endFun, false);
  } else {
    dom.addEventListener("pointerdown", startFun, false);
    dom.addEventListener("pointerup", endFun, false);
  }

  return {
    startFun,
    endFun,
    isTouch
  };
}

/**
 * 计算下一个卡片索引
 * @param currentIndex 当前卡片索引
 * @param totalLength 卡片总数
 * @param direction 切换方向，"prev"上一个或"next"下一个
 * @returns 计算后的新索引
 */
export const calculateNextCardIndex = (
  currentIndex: number,
  totalLength: number,
  direction?: "prev" | "next"
): number => {
  if (direction === "prev") {
    return currentIndex - 1 < 0 ? totalLength - 1 : currentIndex - 1;
  } else {
    return currentIndex + 1 > totalLength - 1 ? 0 : currentIndex + 1;
  }
};

/**
 * 从事件目标获取卡片索引
 * @param event 触发事件
 * @param itemList 卡片元素列表
 * @returns 目标卡片索引
 */
export const getCardIndexFromEvent = (event: Event, itemList: NodeListOf<Element>): number => {
  const target = event.currentTarget as HTMLElement;
  const className = target.classList[1];

  for (let i = 0; i < itemList.length; i++) {
    if (className === itemList[i].classList[1]) {
      return i;
    }
  }

  return 0;
};

/**
 * 更新卡片类名
 * 根据活动卡片索引重新分配所有卡片的动画类名
 * @param itemList 卡片元素列表
 * @param activeIndex 当前活动卡片索引
 */
export const updateCardClasses = (itemList: NodeListOf<Element>, activeIndex: number): void => {
  const totalLength = itemList.length;

  for (let i = 0; i < totalLength; i++) {
    const item = itemList[i];
    const currentClassIndex = parseInt(item.classList[1].slice(7));

    // 移除当前动画类名
    item.classList.remove(`is-ani-${currentClassIndex}`);

    // 添加新的动画类名
    if (i === activeIndex) {
      item.classList.add("is-ani-0");
    } else if (i > activeIndex) {
      item.classList.add(`is-ani-${i - activeIndex}`);
    } else {
      item.classList.add(`is-ani-${totalLength - activeIndex + i}`);
    }
  }
};

/**
 * 设置卡片动画样式
 * @param item 卡片项配置数据
 * @param setMinioUrl 设置Minio URL的函数
 * @returns 样式对象
 */
export const setAniStyle = (item: any, setMinioUrl: (url: string) => string) => {
  const style: Record<string, string> = {
    backgroundColor: item.backgroundColor || "transparent",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    backgroundSize: "100%",
    overflow: item.enableScroll ? "scroll" : "hidden"
  };

  if (item.showBackgroundImage && item.backgroundImage) {
    style.backgroundImage = `url(${setMinioUrl(item.backgroundImage)})`;
  }

  return style;
};

/**
 * 获取动画类型
 * 检测浏览器支持的动画事件类型
 * @param el HTML元素
 * @returns 动画结束事件名称
 */
export const getAnimationType = (el: HTMLElement): string => {
  const animations = {
    animation: "animationend",
    OAnimation: "oAnimationEnd",
    MozAnimation: "animationend",
    WebkitAnimation: "webkitAnimationEnd"
  };

  for (const key in animations) {
    if (el.style[key as any] !== undefined) {
      return animations[key as keyof typeof animations];
    }
  }

  return "animationend";
};
