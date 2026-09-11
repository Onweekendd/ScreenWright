## 大屏搭建工作流

当用户表达"帮我搭一个大屏"、"新建大屏"、"从零开始做一个看板"等意图时，**先分诊走哪条路**：

| 手上有什么 | 走哪条 |
| --- | --- |
| 整屏设计稿 / 看板截图 | `codiaToBIWorkflow`（入参图片 MinIO URL） |
| **只有一句话需求，要先出一版能看的骨架** | **`requirementToBIWorkflow`**（见下方「快速骨架」） |
| 需要逐 slot 精细控制、接真实数据源、配复杂联动 | 下面的 Phase 1–4（规划 + 并发委派） |

### 快速骨架：`requirementToBIWorkflow`

没有设计稿、用户只给了一句话（"做个电力监控大屏"）时用它。它一次产出**带 mock 数据的整屏骨架**，
比逐个 `create_component` 快一个数量级（后者每个组件一次工具调用 + 一次挂起往返）。

调用前你必须做两件事，**工作流不替你做**：

1. **把需求收敛成内容清单**——用户要看哪些指标、哪些维度、几个图。

   **清单要足够密**。一块态势/监控大屏 12~18 项才有「大屏」的样子；只给 4~5 项会产出一块
   空荡荡的屏。需求里每个名词短语通常是一**类**内容，要展开成多项：

   | 用户说的 | 展开成 |
   | --- | --- |
   | 「雨情水位统计卡片」 | 5~6 个 `kind:"kpi"`，**一个度量一项**（累计雨量 / 实时水位 / 超警戒站数 / 入库流量 / 出库流量 / 预警发布数） |
   | 「汛情趋势图表」 | 1~2 个 `kind:"trend"`（水位趋势、雨量趋势） |
   | 「站点流量对比图」 | 1~2 个 `kind:"rank"`（各站供水量、各站蓄水率） |
   | 「预警处置列表」 | 1 个 `kind:"list"` + 1 个 `kind:"share"`（处置进度构成） |

   **KPI 一律拆成单度量单项**——不要写一个 `kind:"kpi"` 然后 measures 里堆三五个，
   翻牌器组件只显示一个数，多度量会塌成一个。（工作流也会兜底拆，但你先拆对更省一轮。）

   清单里**总带一个 `kind:"title"`** 作为大屏标题。

2. **用 `ask_user_question` 跟用户确认这份清单**。需求越模糊越要问：
   "电力大屏"给调度中心看（实时负荷/频率/告警）和给管理层看（发电量/利用率）
   内容几乎不重叠，猜错了整块屏白做。

确认之后把清单填进 `contentItems` 调用工作流。要点：
- `kind` 描述内容形态不是组件名：kpi / trend / rank / share / list / map / title / other
- `views` 只在用户**确实要切换着看**同一份内容时填（如日/月/年）——它决定那块区会不会变成动态面板
- `screenId` 从 `<editor-context>` 抄

**它现在的产出是 mock 数据骨架**：分区、组件、mock 数据、文案都有，
但**不含配色**（一律沿用组件模板默认值，深色系）、不含真实数据源、不含素材外框与面板切换器。

**所以别问用户风格偏好，也别拿到结果后自己去整屏换肤。**这不是省事，是这条路走不通：
每个组件的配色字段都不一样（翻牌器是 `color`/`fontLinearColor`，饼图是 `legendValueColor`/`seriesColor`，
表格是 `headerBackground` + 一张深色底图），合法值只能逐个查 schema，而且现有调色板全是深底亮色，
平台里没有「浅色」这回事。实测有一轮就是这么没的：问了风格 → 产出深色 → 判定要返工 →
6 个组件几十个字段靠猜 → 委派子 agent → 跑到超时，而骨架本身第一次就是对的。

拿到结果后**先把骨架交给用户看**，再按他明确提出的点用 `edit_files` / `create_component` 迭代。

---

### Phase 1：规划（你自己完成，不委派）

规划是你的核心职责，**不要**委派给任何子 agent。按顺序：

1. 从 editor-context 读取当前大屏 `screenId`
2. 用 `search_component` / `read_file` / `execute_in_browser` 了解可用组件、数据源、运行时状态
3. 基于用户需求拆分出每个 slot 的布局规格、数据源、绑定关系
4. 把规划写入 `screen_{screenId}/plan.json`（用 `create_plan` + `edit_plan`）
5. 对每个 slot 用 `create_task` 落地一个 `task_kind="create"` 的 pending 任务，`metadata` 至少包含 `screenId`、`user_intent` 和合适的 `skill_ref`；保存返回的 task ID 与 `taskListId`——这是 Phase 3 并发委派的前提

**不要在 plan.json 与全部 task 落地前进入 Phase 2。**

---

### Phase 2：等待用户确认

输出布局摘要并提示用户确认。可以用 `ask_user_question` 提一个结构化确认题，也可以纯文字概述等待。

用户确认的信号：回复"开始构建"、"确认"、"可以"、"没问题"等肯定性内容。
用户要求修改：自己回到 Phase 1 调整 plan.json 与对应任务的 metadata，再次等待确认。

---

### Phase 3：并发构建

用户确认后，读取 `screen_{screenId}/plan.json` 获取任务总数。

**前置条件**：每个 slot 必须已通过 `create_task` 落成一个 pending task。新建 slot 使用 `task_kind="create"`，`metadata` 含 `screenId` / `user_intent` / `skill_ref`；只有修改现有文件的 slot 才使用 `task_kind="modify"`，并额外提供实际读取所得的 `target_files` / `expected_state` / `context`。

**并发委派**：在同一轮里**并行**发出多个 `ask_swExecutorAgent` 调用。委派 XML 的写法、`task_list_id` 从哪来、分组为什么不能重叠，一律见 `sw-agent-core.md`「步骤 2」——此处不重复。

大屏场景只多两条约束：

- **一律走异步**（不带 `_background`）。发完全部调用后输出一句"N 个 slot 已派发，后台并发构建中"就**停止**，报告由续接轮注入（见 Phase 4）。
- **并发数**：slot 总数 ≤ 4 时并发数 = slot 总数；> 4 时固定为 4。

---

### Phase 4：校验与收尾

各子 agent 的 `<execution_report>` 会在它们后台完成后由系统逐份注入续接轮——你**被动接收**即可，不要主动轮询。每收到（或汇总到全部）报告后：

- 任一 task 在报告中标注 `verification_required`：按"如何委派执行 → 步骤 3"流程调 `ask_dataFlowVerificationAgent` 校验，通过后 `update_task` 推到 `completed`
- 任一报告 status=`failed`：取 `<suggestion>` 决定是补 metadata 重派、还是 `ask_user_question` 请用户决策
- 所有 task 都到 `completed` 后，将 plan.json 的 `status` 更新为 `"completed"`，向用户报告构建结果
