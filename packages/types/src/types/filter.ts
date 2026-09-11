/**
 * 监听参数接口
 * @description 定义组件的数据过滤器监听配置
 */
export interface ListenArg {
  /** 过滤器名称 */
  filterName: string;

  /** 过滤器是否启用 */
  usageStatus: boolean;

  /** 回调字段列表 */
  callbackFields: string[];

  /** 过滤器类型（可选） */
  filterType?: boolean;
}

/**
 * 回调对象的接口定义
 */
export interface Callback {
  /**
   * 回调对象的唯一标识符
   */
  id: string;

  /**
   * 回调对象的名称
   */
  name: string;

  /**
   * 回调对象的类型
   */
  type: string;

  /**
   * 回调对象的方法类型
   */
  method: string;

  /**
   * 包含字段值和变量名
   * 字段值为组件抛出的回调对象键名
   * 变量名是数据过滤器中用来索引的键名
   */
  value: {
    /**
     * 字段值
     */
    origin: {
      /**
       * 字段值的显示名称
       */
      displayName: "字段值";

      /**
       * 字段值的类型-未知使用类型
       */
      type: "input";

      /**
       * 字段值的名称
       */
      value: string;
    };

    /**
     * 变量名
     */
    target: {
      /**
       * 变量名
       */
      displayName: "变量名";

      /**
       * 变量名的类型
       */
      type: "input";

      /**
       * 变量名的名称
       */
      value: string;
    };
  };
}

/**
 * 回调管理器中的源组件信息
 */
export interface CallbackSource {
  /**
   * 组件ID
   */
  id: string | number;

  /**
   * 组件名称
   */
  name: string;

  /**
   * 回调ID
   */
  cbId: string;
}

/**
 * 回调管理器中的目标组件信息
 */
export interface CallbackTarget {
  /**
   * 过滤器名称
   */
  filterName?: string;

  /**
   * 组件名称
   */
  name: string;

  /**
   * 组件ID
   */
  id: string | number;

  /**
   * 子组件ID（如果适用）
   */
  childId?: string | number | null;
}

/**
 * 回调关系对象，定义源组件和目标组件之间的关系
 */
export interface CallbackRelation {
  /**
   * 源组件列表
   */
  source: CallbackSource[];

  /**
   * 目标组件列表
   */
  target: CallbackTarget[];
}

/**
 * @description 回调管理器，用于管理组件间的回调关系
 * 键名为回调字段名，值为回调关系对象
 *
 * @example
 * {
 *   "callbackField1": {
 *     "source": [{ id: "1", name: "组件1" }],
 *     "target": [{ id: "2", name: "组件2" }]
 *   }
 * }
 */
export interface CallbackManager {
  [field: string]: CallbackRelation | undefined;
}

/**
 * 数据映射配置
 */
export interface DataRemark {
  /**
   * 描述
   */
  description: string;

  /**
   * 键
   */
  key: string;

  /**
   * 映射
   */
  map: string;

  decription?: string;
}

/**
 * 绑定组件接口
 * @description 用于组件绑定的信息配置
 */
export interface BindComponent {
  /** 标签显示文本 */
  label: string;

  /** 组件ID */
  id: number | string;
}

/**
 * 临时池接口
 * @description 临时数据池，用于存储临时过滤器和数据格式化信息
 */
export interface TempPool {
  /** 回调函数列表 */
  callBack: any[];

  /** 数据格式化器 */
  dataFormatter: string;
}

/**
 * 过滤器接口
 * @description 数据过滤器配置，包含过滤器的各种属性和关联组件
 */
export interface Filter {
  /** 回调函数列表 */
  callBack: string[];

  /** 回调状态 */
  callBackStatus: boolean;

  /** 数据格式化器 */
  dataFormatter: string;

  /** 绑定组件列表 */
  bindComponent: BindComponent[];

  /** 是否已选中 */
  checked: boolean;

  /** 是否未保存 */
  notSaved: boolean;

  /** 临时池 */
  tempPool: TempPool;

  /** 过滤器名称 */
  name: string;

  /** 是否显示（可选） */
  show?: boolean;

  /** 过滤器ID（可选） */
  id?: string;
}
