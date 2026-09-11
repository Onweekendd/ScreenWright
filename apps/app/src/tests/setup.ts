import { config } from "@vue/test-utils";

// 全局禁用 Transition 和 TransitionGroup 组件在测试中的动画
config.global.stubs = {
  Transition: {
    template: "<div><slot /></div>"
  },
  TransitionGroup: {
    template: "<div><slot /></div>"
  }
};
