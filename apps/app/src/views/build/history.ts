// 定义历史记录对象的基本属性接口
interface historyProps {
  id: number;
}

// 定义 History 类
class History<T extends historyProps> {
  // 历史状态数组，存储泛型 T 类型的元素
  private state: T[] = [];
  // 当前状态的下标
  private index = 0;
  // 最大保存状态个数，防止爆栈
  private maxState = 11;

  // 设置状态的方法，接收一个泛型 T 类型的参数，改为 async 函数
  public async setState(state: T): Promise<void> {
    await debounceAsync(() => {
      // if (this.checkRepeat(state)) {
      //   // 判断是否是重复对象进来
      //   return
      // }

      // 限制长度
      if (this.state.length >= this.maxState) {
        this.state.shift();
      }
      // 如果 this.state.length 与 this.index 不一致说明，当前指针发生了变化，所以将指针后面的都去掉
      if (this.index < this.state.length - 1) {
        this.state.splice(this.index + 1, this.state.length - 1);
      }
      this.state.push(JSON.parse(JSON.stringify(state))); // 深拷贝状态对象，防止引用类型数据被修改
      this.index = this.state.length - 1; // 方便下标的计算，都从 0 开始计算
    }, 200);
  }

  // 获取状态数组的方法，返回泛型 T 类型的数组
  public getState(): T[] {
    return this.state;
  }

  // 判断是否可以撤销操作
  public canReplace(): boolean {
    return this.index > 0;
  }

  // 撤销操作的方法，返回泛型 T 类型的对象或 undefined
  public replaceState(): T | undefined {
    if (this.canReplace()) {
      this.index--;
      // 处理边界情况，确保 index 不会小于 0
      const state = JSON.parse(JSON.stringify(this.state[this.index]));
      return state;
    }
  }

  // 判断是否可以反撤销操作
  public canUnReplace(): boolean {
    return this.state.length - 1 > this.index;
  }

  // 反撤销操作的方法，返回泛型 T 类型的对象或 undefined
  public unReplaceState(): T | undefined {
    if (this.canUnReplace()) {
      // 反撤销
      this.index++;
      const state = JSON.parse(JSON.stringify(this.state[this.index]));
      return state;
    }
  }
  popState() {
    this.state.pop();
    this.index = this.state.length - 1;
  }
  getLastState() {
    return this.state[this.state.length - 1];
  }
  destroy() {
    console.log("destroy");
    this.state = [];
    this.index = 0;
  }

  // 检验是否重复元素的方法，接收一个泛型 T 类型的参数，返回布尔值
  // private checkRepeat(snapshot: T): boolean {
  //   const next = snapshot
  //   let prev: T | {} = {}
  //   if (this.index >= 0) {
  //     prev = this.state[this.index]
  //   }
  //   return isEqual(next, prev)
  // }
}

export { History };

// 去抖函数的定时器变量
let timeout: ReturnType<typeof setTimeout> | null = null;

/**
 * 去抖函数封装体，返回一个 Promise
 * @param {Function} fn 执行函数
 * @param {number} wait 触发时间
 */
function debounceAsync(fn: () => void, wait: number): Promise<void> {
  return new Promise((resolve) => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      fn();
      resolve();
    }, wait);
  });
}
