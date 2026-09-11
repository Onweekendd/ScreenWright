// 定义验证函数的类型，它可以是返回布尔值的普通函数，也可以是返回Promise<boolean>的异步函数
type ValidationFunction = ((...args: any[]) => boolean) | ((...args: any[]) => Promise<boolean>);

class pipeValidator {
  // 用于存储验证函数的数组，初始化为空数组
  private validators: ValidationFunction[] = [];

  // add方法用于添加验证函数到validators数组中，并返回当前pipeValidator实例以支持链式调用，支持参数绑定
  add(validatorFn: ValidationFunction): pipeValidator {
    const boundFn = async (...args: any[]) => await validatorFn(...args);
    this.validators.push(boundFn);
    return this;
  }

  // validate方法用于执行所有添加的验证函数，并根据结果返回最终的验证状态，处理异步及同步验证逻辑
  async validate(): Promise<boolean> {
    const resultList: Array<boolean> = [];
    for (const validator of this.validators) {
      // 始终使用 await 获取验证函数的结果，确保为 boolean 类型
      const result = await validator();
      resultList.push(result);
    }
    return resultList.every((res) => res === true);
  }
}

export { pipeValidator };
