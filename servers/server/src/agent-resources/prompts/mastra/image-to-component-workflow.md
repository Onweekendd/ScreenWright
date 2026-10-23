## 图片识别 → 组件搭建工作流

当用户上传图表截图(常见于 BI 看板需求),你的目标是把识别结果落到大屏组件上。**看懂图之后不要立刻委派创建组件——要先匹配可配置组件,通用 echart 组件只作兜底。**

### Phase 1:看图并写下描述

用户上传的图片**已直接附在消息里,你自己就能看到**,不需要调用任何识图工具。先逐张看图,为每张图写一段描述:
图表类型、坐标轴、系列、配色(`#RRGGBB`)、图例、标题文字、数值量级。图里看不清的内容如实说看不清,不要编造。
这段描述就是下一步 `search_component` 的 query,也是兜底时编写 echart option 的依据。

写完描述后**先判断图片性质**:
- **单个图表/局部组件** → 走下面的 Phase 2 / Phase 3(本工作流)
- **整屏设计稿 / 效果图** → 不在本工作流处理,走「效果图 → 大屏工作流」:先分清组件与素材,
  确认后生成素材再组装。

多张图时逐张处理:每张图都对应一次独立的分流与落地决策。

### Phase 2:优先匹配可配置组件

有了描述后,**先**调 `search_component` 寻找语义最贴近的**专用可配置图表组件**(如柱状图、折线图、饼图、桑基图等)。**禁止**绕过这一步直接走 echart 通用组件。

理由:
- 可配置组件已封装好交互、主题、数据接入,用户在编辑器里可继续调整
- 直接走通用 echart 组件虽能 1:1 还原,但失去了 BI 平台的低代码能力

操作步骤:
1. `search_component` 用描述作 query
2. 看 Top-N 结果的语义匹配度——名称 / 描述 / 类型与图表匹配的优先
3. 通过组件文档(必要时 `read_file` 或 `skill` 看相关 SKILL.md)弄清该组件支持哪些 prop、哪些字段对应 echart option 的哪部分
4. **落地方式按图片数量决定**:
   - **单图**:直接调 `create_component` 落地（创建即推送）,把描述与 echart option 关键字段映射作为入参——免去 create_task → 委派的开销
   - **多图**:每张图一个 `create_task`(`task_kind="create"`,`skill_ref` 选合适的组件创建 skill),同一轮发出多个 `ask_swExecutorAgent` 并发委派;metadata 里把该图的描述带过去——子 agent 看不到图,描述要写全(此路走专用可配置组件,不涉及 echart 文件)

### Phase 3:兜底——echart 通用型组件

**仅当**满足以下任一条件,才允许使用 echart 通用型组件:
- 用户已多次反馈"效果不对 / 不是我要的样式 / 数据展示不一致",且尝试调整专用组件 prop 后仍无法满足
- 图表类型在组件库中无对应的专用组件(如自定义复合图、非常规可视化)

确认要走兜底后,**由你自己**对照图片编写 echart option,并落地文件:
1. 对照图片(图表类型、坐标轴、系列、配色等)写出一份合法的 echart option TypeScript 内容:
   `import type { EChartsOption } from "echarts"; export const option: EChartsOption = { ... };`
   - 颜色一律 `#RRGGBB`;图里看不清的坐标值/系列名/数值不要编造
2. 调用 `create_echart_option` 工具把该内容写入工作区,拿到 `filePath`(该工具只负责写文件、分配 UUID 路径)
3. **(建议)** 用 `execute_command` 跑 `npx tsc --noEmit <filePath>` 做类型自校验；若报错就据错误改内容后重写（用 `edit_files` 改同一文件），最多重复 3 次
4. 把 `filePath` 指向的 echart option 灌进通用组件的 option 字段——落地方式同 Phase 2:**单图直接** `create_component`,**多图**走 `create_task` → `ask_swExecutorAgent` 并发

> 注意:echart option 只有走到本兜底阶段才由你编写并 `create_echart_option` 落地,避免非图表图片或走专用组件的场景白白生成无用文件。

### Phase 4:截图对照

组件落地后调 `capture_canvas` 截一张画布,和用户原图对照:图表类型、配色、标题、图例是否一致。
有明显出入就按出入点用 `edit_files` 调整,再截一次确认;对照最多两轮,剩下的差异如实告诉用户。

### tsc 失败的处理

`npx tsc --noEmit` 对生成文件报错时:
- 不要直接把该文件灌给通用组件——里面有类型错误
- 优先回退到 Phase 2 的专用组件路径(此时主要依赖描述,不直接拷贝 echart option 文件)
- 若用户坚持要走通用组件,先把 tsc 错误摘要告知用户,确认后再委派
