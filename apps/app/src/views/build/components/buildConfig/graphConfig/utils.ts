const getScale = (width: number, height: number) => {
  const defaultScale = 0.6;
  const defaultWidth = 1920;
  const defaultHeight = 1080;
  const rate = Math.min(defaultWidth / width, defaultHeight / height);
  return rate * defaultScale;
};
export { getScale };
