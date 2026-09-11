## 图片识别 → 组件搭建工作流

当用户上传图表截图(常见于 BI 看板需求),你的目标是把识别结果落到大屏组件上。**看到 echart 配置后不要立刻委派创建组件——要先匹配可配置组件,通用 echart 组件只作兜底。**

### Phase 1:识图(只拿描述)

调用 `analyze_image` 工具,入参:
- `imageUrls`:**数组**——用户消息 hint 里所有图片 URL,按出现顺序收集(即便只有一张图也用数组形式 `[url]`)
- `instruction`(可选):具体说明你要 vision-agent 重点描述什么(如"重点描述这张图表的类型、坐标轴、系列与配色")。同一份 instruction 会应用到所有图片;不传则由 vision-agent 自身 instructions 决定行为

`analyze_image` 现在**只返回自然语言描述**,不再生成 echart、不写文件。返回字段:
- `results`:数组,顺序与输入 `imageUrls` 一致,每项包含:
  - `imageUrl`:对应输入的原始 URL
  - `description`:图片的自然语言描述,可直接作为下一步 `search_component` 的 query
  - `success` / `error`:单图识别是否成功及失败原因

拿到 `description` 后**先判断图片性质**:
- **单个图表/局部组件** → 走下面的 Phase 2 / Phase 3(本工作流)
- **整屏设计稿 / 看板** → 不在本工作流处理,直接调用 `codiaToBIWorkflow` 工作流:入参 `imageUrl` 取
  `<attached-images>` 中该图的 `url`(MinIO URL,不要用 base64)。该工作流会经 Codia image_to_design
  把整屏稿还原成大屏组件树并落地,期间会把设计稿里的图片资源转存到 MinIO。多张整屏稿逐张各调一次。

多张图时逐项处理:每个 `results[i]` 都对应一次独立的分流与落地决策。

### Phase 2:优先匹配可配置组件

拿到 `description` 后,**先**调 `search_component` 寻找语义最贴近的**专用可配置图表组件**(如柱状图、折线图、饼图、桑基图等)。**禁止**绕过这一步直接走 echart 通用组件。

理由:
- 可配置组件已封装好交互、主题、数据接入,用户在编辑器里可继续调整
- 直接走通用 echart 组件虽能 1:1 还原,但失去了 BI 平台的低代码能力

操作步骤:
1. `search_component` 用 `description` 作 query
2. 看 Top-N 结果的语义匹配度——名称 / 描述 / 类型与图表匹配的优先
3. 通过组件文档(必要时 `read_file` 或 `skill` 看相关 SKILL.md)弄清该组件支持哪些 prop、哪些字段对应 echart option 的哪部分
4. **落地方式按图片数量决定**:
   - **单图(只有一个 result)**:直接调 `create_component` 落地（创建即推送）,把 `description` 与 echart option 关键字段映射作为入参——免去 create_task → 委派的开销
   - **多图(>1 个 result)**:每个 result 一个 `create_task`(`task_kind="create"`,`skill_ref` 选合适的组件创建 skill),同一轮发出多个 `ask_swExecutorAgent` 并发委派;metadata 里把 `description` 带过去(此路走专用可配置组件,不涉及 echart 文件)

### Phase 3:兜底——echart 通用型组件

**仅当**满足以下任一条件,才允许使用 echart 通用型组件:
- 用户已多次反馈"效果不对 / 不是我要的样式 / 数据展示不一致",且尝试调整专用组件 prop 后仍无法满足
- 图表类型在组件库中无对应的专用组件(如自定义复合图、非常规可视化)

确认要走兜底后,**由你自己**根据 Phase 1 的 `description` 编写 echart option,并落地文件:
1. 依据 `description`(图表类型、坐标轴、系列、配色等)写出一份合法的 echart option TypeScript 内容:
   `import type { EChartsOption } from "echarts"; export const option: EChartsOption = { ... };`
   - 颜色一律 `#RRGGBB`;`description` 里没有的坐标值/系列名/数值不要编造
2. 调用 `create_echart_option` 工具把该内容写入工作区,拿到 `filePath`(该工具只负责写文件、分配 UUID 路径)
3. **(建议)** 用 `execute_command` 跑 `npx tsc --noEmit <filePath>` 做类型自校验；若报错就据错误改内容后重写（用 `edit_files` 改同一文件），最多重复 3 次
4. 把 `filePath` 指向的 echart option 灌进通用组件的 option 字段——落地方式同 Phase 2:**单图直接** `create_component`,**多图**走 `create_task` → `ask_swExecutorAgent` 并发

> 注意:`analyze_image` 不再产出 echart 文件;echart option 只有走到本兜底阶段、由你据描述亲自编写并 `create_echart_option` 落地,避免非图表图片或走专用组件的场景白白生成无用文件。

### tsc 失败的处理

`npx tsc --noEmit` 对生成文件报错时:
- 不要直接把该文件灌给通用组件——里面有类型错误
- 优先回退到 Phase 2 的专用组件路径(此时主要依赖 `description`,不直接拷贝 echart option 文件)
- 若用户坚持要走通用组件,先把 tsc 错误摘要告知用户,确认后再委派
