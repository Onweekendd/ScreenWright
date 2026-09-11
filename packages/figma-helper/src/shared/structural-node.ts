/**
 * StructuralNode — 结构处理器使用的最小节点类型
 *
 * 同时兼容：
 * - 插件端：从 Figma BaseNode 转换而来的纯 JS 对象
 * - 服务端：FigmaNode（包含更多字段，向上兼容此接口）
 */
export interface StructuralNode {
  /** 节点唯一 ID */
  id?: string;
  /** 节点名称，用于命名规则判断 */
  name?: string;
  /** 节点类型（FRAME / GROUP / COMPONENT 等） */
  type?: string;
  /**
   * 布局样式 key，引用 globalVars.styles 中的样式记录。
   * 插件端该字段为 undefined；服务端用于坐标归一化。
   */
  layout?: string;
  /**
   * 状态索引，由处理器在合并时写入。
   * 标识该节点属于第几个状态（从 0 开始）。
   */
  stateIndex?: number;
  /**
   * 该节点在 Figma 中是否带有可见的 image 填充。
   * 插件端在 toStructuralNode 时采集，用于按原生填充识别图片节点；
   * 服务端忽略此字段。
   */
  hasImageFill?: boolean;
  /** 子节点列表 */
  children?: StructuralNode[];
}
