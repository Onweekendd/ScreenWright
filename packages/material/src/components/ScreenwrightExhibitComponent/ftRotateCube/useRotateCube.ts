import { useBaseData } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";
import type { CSSProperties } from "vue";
import { computed, ref } from "vue";

export const useRotateCube = (options: ComponentType) => {
  const { width, height, isBuild, option } = useBaseData(options);
  const rotateX = ref<number>(0); // 初始X轴旋转角度
  const rotateY = ref<number>(0); // 初始Y轴旋转角度
  const rotateZ = ref<number>(0); // 初始Z轴旋转角度
  const cubeWidth = ref(0);
  const cubeHeight = ref(0);
  const isDragging = ref(false);
  const lastMouseX = ref(0);
  const lastMouseY = ref(0);
  const velocityX = ref(0);
  const velocityY = ref(0);
  const lastTime = ref(0);
  const animationId = ref<number | null>(null);

  const cubeStyle = computed<CSSProperties>(() => ({
    transform: `translateZ(-${option.value.perspectiveDistance}rem) rotateX(${rotateX.value}deg) rotateY(${rotateY.value}deg) rotateZ(${rotateZ.value}deg)`,
  }));
  // box-shadow: ` 0 0 10px rgba(255, 255, 255, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.3);`
  const cubeFaceBorderLight = computed<CSSProperties>(() => {
    if (option.value.borderLight.enabled) {
      return {
        border: `1px solid ${option.value.borderLight.color}`,
        boxShadow: `0 0 1px ${option.value.borderLight.color}, 
                    inset 0 0 1px ${option.value.borderLight.color}`,
      };
    } else {
      return {};
    }
  });

  const perspectiveStyle = computed<CSSProperties>(() => ({
    perspective: `${option.value.perspectiveDistance}rem`,
  }));

  const faceImages = computed(() => {
    return option.value.faceImages;
  });

  const faceStyle = (faceIndex: number) => {
    const faceOption = {
      width: `${cubeWidth.value}px`,
      height: `${cubeHeight.value}px`,
      transform: ``,
    };
    // 正面
    if (faceIndex === 1) {
      faceOption.transform = `rotateX(0deg) translateZ(${cubeHeight.value / 2}px)`;
    }

    // 背面
    if (faceIndex === 2) {
      faceOption.transform = `rotateY(180deg) translateZ(${cubeHeight.value / 2}px)`;
    }

    // 右面
    if (faceIndex === 3) {
      faceOption.transform = `rotateY(90deg) translateZ(${cubeWidth.value - cubeHeight.value / 2}px)`;
    }

    // 左面
    if (faceIndex === 4) {
      faceOption.transform = `rotateY(270deg) translateZ(${cubeHeight.value / 2}px)`;
    }

    // 上面
    if (faceIndex === 5) {
      faceOption.transform = `rotateX(90deg) translateZ(${cubeHeight.value / 2}px)`;
    }

    // 下面
    if (faceIndex === 6) {
      faceOption.transform = `rotateX(270deg) translateZ(${cubeHeight.value / 2}px)`;
    }
    return faceOption;
  };

  const startDrag = (event: MouseEvent | TouchEvent) => {
    if (isBuild.value) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();

    if (animationId.value) {
      cancelAnimationFrame(animationId.value);
      animationId.value = null;
    }

    isDragging.value = true;
    velocityX.value = 0;
    velocityY.value = 0;

    if (event.type === "mousedown") {
      const mouseEvent = event as MouseEvent;
      lastMouseX.value = mouseEvent.clientX;
      lastMouseY.value = mouseEvent.clientY;
      document.addEventListener("mousemove", onDrag);
      document.addEventListener("mouseup", stopDrag);
    } else if (event.type === "touchstart") {
      const touchEvent = event as TouchEvent;
      lastMouseX.value = touchEvent.touches[0].clientX;
      lastMouseY.value = touchEvent.touches[0].clientY;
      document.addEventListener("touchmove", onDrag);
      document.addEventListener("touchend", stopDrag);
    }

    lastTime.value = performance.now();
  };

  const onDrag = (event: MouseEvent | TouchEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isDragging.value) {
      return;
    }

    const currentTime = performance.now();
    // 计算时间差（秒）
    const deltaTime = (currentTime - lastTime.value) / 1000;
    lastTime.value = currentTime;

    // 防止除以零或过小的时间差导致异常大的速度
    if (deltaTime <= 0.001) {
      return;
    }

    let currentX = 0,
      currentY = 0;

    if (event.type === "mousemove") {
      currentX = (event as MouseEvent).clientX;
      currentY = (event as MouseEvent).clientY;
    } else if (event.type === "touchmove") {
      currentX = (event as TouchEvent).touches[0].clientX;
      currentY = (event as TouchEvent).touches[0].clientY;
    }

    // 计算鼠标移动的差值
    const deltaX = currentX - lastMouseX.value;
    const deltaY = currentY - lastMouseY.value;

    // 计算当前瞬时速度（修正方向，与实际旋转方向一致）
    velocityX.value = (-deltaY * option.value.sensitivity) / deltaTime; // 负号确保方向正确
    // 根据X轴旋转角度调整Y轴旋转方向
    const normalizedRotateX = ((rotateX.value % 360) + 360) % 360; // 标准化为0-360度
    const yDirectionMultiplier =
      normalizedRotateX > 85 && normalizedRotateX < 260 ? -1 : 1;
    velocityY.value =
      (deltaX * option.value.sensitivity * yDirectionMultiplier) / deltaTime;

    // 限制最大速度，防止过快旋转
    const maxVelocity = 100;
    velocityX.value = Math.max(
      -maxVelocity,
      Math.min(maxVelocity, velocityX.value),
    );
    velocityY.value = Math.max(
      -maxVelocity,
      Math.min(maxVelocity, velocityY.value),
    );

    // 更新旋转角度 (移动Y轴时绕X轴旋转，反之亦然)
    rotateX.value -= deltaY * option.value.sensitivity;
    // 根据X轴旋转角度调整Y轴旋转方向
    rotateY.value += deltaX * option.value.sensitivity * yDirectionMultiplier;

    // 更新最后的鼠标位置
    lastMouseX.value = currentX;
    lastMouseY.value = currentY;
  };

  const stopDrag = (event: MouseEvent | TouchEvent) => {
    isDragging.value = false;

    let currentX = 0,
      currentY = 0;

    if (event.type === "mousemove") {
      currentX = (event as MouseEvent).clientX;
      currentY = (event as MouseEvent).clientY;
    } else if (event.type === "touchmove") {
      currentX = (event as TouchEvent).touches[0].clientX;
      currentY = (event as TouchEvent).touches[0].clientY;
    }

    lastMouseX.value = currentX;
    lastMouseY.value = currentY;

    // 移除全局事件监听
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup", stopDrag);
    document.removeEventListener("touchmove", onDrag);
    document.removeEventListener("touchend", stopDrag);

    // 如果速度足够大，则启动惯性动画
    if (Math.abs(velocityX.value) > 10 || Math.abs(velocityY.value) > 10) {
      startInertiaAnimation();
    }
  };

  const startInertiaAnimation = () => {
    const animate = () => {
      // 应用阻尼减速
      if (option.value.inertia.enabled) {
        velocityX.value *= option.value.inertia.damping;
        velocityY.value *= option.value.inertia.damping;
      }

      // 根据X轴当前角度判断Y轴旋转方向
      const normalizedRotateX = ((rotateX.value % 360) + 360) % 360;
      const yDirectionMultiplier =
        normalizedRotateX > 85 && normalizedRotateX < 260 ? -1 : 1;

      console.log(normalizedRotateX, yDirectionMultiplier);

      // 更新立方体位置
      rotateX.value += velocityX.value * 0.016; // 假设16ms帧率
      // 当X轴旋转跨过临界点时，需要调整Y轴速度方向

      if (yDirectionMultiplier === 1) {
        rotateY.value += velocityY.value * 0.016 * yDirectionMultiplier;
      } else {
        rotateY.value -= velocityY.value * 0.016 * yDirectionMultiplier;
      }

      // 当速度足够小时停止动画
      if (Math.abs(velocityX.value) < 0.5 && Math.abs(velocityY.value) < 0.5) {
        if (animationId.value) {
          cancelAnimationFrame(animationId.value);
          animationId.value = null;
        }
        return;
      }

      animationId.value = requestAnimationFrame(animate);
    };

    animationId.value = requestAnimationFrame(animate);
  };

  const initRotate = () => {
    rotateX.value = option.value.initialRotation.x;
    rotateY.value = option.value.initialRotation.y;
    rotateZ.value = option.value.initialRotation.z;
  };

  return {
    option,
    width,
    height,
    cubeWidth,
    cubeHeight,
    cubeStyle,
    faceImages,
    animationId,
    perspectiveStyle,
    cubeFaceBorderLight,
    initRotate,
    faceStyle,
    startDrag,
    onDrag,
    stopDrag,
  };
};
