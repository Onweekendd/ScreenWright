/**
 * @description 时间转换为距离
 * @param {{time: number, step: number, stepDistance: number}} params
 * @returns {number}
 */
export function time2Distance({ time, step, stepDistance }) {
  let width = 0;
  if (time > 0) {
    const num = time / step;
    width = num * stepDistance;
  }
  return width;
}

/**
 * @description 距离转换为时间
 * @param {{distance: number, step: number, stepDistance: number}} params
 * @returns {number}
 */
export function distance2Time({ distance, step, stepDistance }) {
  return (distance / stepDistance) * step;
}

/**
 * 高亮组件
 * @param {number} componentId 组件id
 * @param {number} highLightTime 高亮时间
 */
export function highlightComponent(componentId, highLightTime = 2000) {
  const el = document.getElementById(`animation-${componentId}`);
  if (el) {
    el.style.color = "#8b58e7";
    setTimeout(() => {
      el.style.color = "#b4b7c1";
    }, highLightTime);
  }
}
