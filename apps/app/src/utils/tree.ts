const DEFAULT_CONFIG = {
  id: "id",
  children: "children",
  pid: "pid"
};

interface ConfigProps {
  id: string;
  children: string;
  pid: string;
}

class Tree<T extends Array<U>, U> {
  config: ConfigProps;
  constructor(config: ConfigProps) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  getConfig(): ConfigProps {
    return this.config;
  }
  forEach(tree: T, func: (node: U) => void) {
    const config = this.getConfig();
    const list = [...tree];
    const { children } = config;
    for (let i = 0; i < list.length; i++) {
      func(list[i]);
      (list[i] as any)[children] && list.splice(i + 1, 0, ...(list[i] as any)[children]);
    }
  }
}

export { Tree };
