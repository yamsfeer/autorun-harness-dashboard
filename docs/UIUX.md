# Autorun Harness Dashboard 设计规范

基于 Claude (Anthropic) 设计系统，为 Dashboard 场景定制。

## 设计原则

1. **温暖可信赖** — 羊皮纸色调构建安心感，而非冰冷工具感
2. **层级清晰** — 衬线标题建立权威感，无衬线正文保持功能效率
3. **柔而有界** — Ring shadow 替代硬边框，圆角带来亲和力

## 颜色系统

### 页面基底

| 角色 | 色值 | 用途 |
|------|------|------|
| Parchment | `#f5f4ed` | 页面主背景，温暖羊皮纸 |
| Ivory | `#faf9f5` | 卡片、浮层表面，微妙抬升 |
| Deep Dark | `#141413` | 暗色模式页面背景 |

### 文字

| 角色 | 色值 | 用途 |
|------|------|------|
| Near Black | `#141413` | 主文字（亮色面）、暗色面标题 |
| Olive Gray | `#5e5d59` | 次要正文、描述 |
| Stone Gray | `#87867f` | 辅助文字、时间戳、元数据 |
| Warm Silver | `#b0aea5` | 暗色面上的文字 |

### 品牌与交互

| 角色 | 色值 | 用途 |
|------|------|------|
| Terracotta | `#c96442` | 品牌色、主 CTA、进行中状态 |
| Coral | `#d97757` | 暗色面链接、二级强调 |
| Focus Blue | `#3898ec` | 输入框聚焦环（唯一冷色，纯无障碍用途） |

### 语义 / 任务状态

| 状态 | 背景 | 文字 | 色值参考 |
|------|------|------|----------|
| pending | `#f0eee6` | `#87867f` | Border Cream + Stone Gray — 温暖中性 |
| in_progress | `#fdf0eb` | `#c96442` | 淡 Terracotta 底 + Terracotta 字 |
| completed | `#f0f5ee` | `#4a7c42` | 淡暖绿底 + 暖绿字 |
| blocked | `#fdf6e8` | `#a17e2a` | 淡暖黄底 + 暖琥珀字 |
| needs_human | `#fdf0f0` | `#b53333` | 淡暖红底 + 深红字 |

> 所有状态色保持暖调：绿不偏蓝、黄不偏柠檬、红不偏粉。

### 边框与阴影

| 角色 | 色值 / 值 | 用途 |
|------|-----------|------|
| Border Cream | `#f0eee6` | 亮色面标准边框 |
| Border Warm | `#e8e6dc` | 强调分隔线 |
| Border Dark | `#30302e` | 暗色面边框 |
| Ring Warm | `#d1cfc5` | 按钮悬停/聚焦 ring shadow |
| Whisper Shadow | `rgba(0,0,0,0.05) 0px 4px 24px` | 浮层卡片微阴影 |
| Ring Shadow | `0px 0px 0px 1px <color>` | 交互元素状态环 |

## 排版

### 字体

| 角色 | 字体 | 回退 |
|------|------|------|
| 标题 | Anthropic Serif | Georgia |
| 正文 / UI | Anthropic Sans | system-ui, Inter, Arial |
| 代码 | Anthropic Mono | Menlo, monospace |

### 层级

| 角色 | 字体 | 大小 | 字重 | 行高 | 字间距 | 场景 |
|------|------|------|------|------|--------|------|
| 页面标题 | Serif | 32px | 500 | 1.10 | normal | 页面级大标题 |
| 区块标题 | Serif | 24px | 500 | 1.20 | normal | 看板列标题、区域标题 |
| 卡片标题 | Serif | 20px | 500 | 1.20 | normal | 项目名、任务名 |
| 正文 | Sans | 16px | 400 | 1.60 | normal | 描述、备注 |
| 正文强调 | Sans | 16px | 500 | 1.25 | normal | 标签、指标数值 |
| 小字 | Sans | 14px | 400 | 1.43 | normal | 时间戳、元信息 |
| 标签 | Sans | 12px | 500 | 1.25 | 0.12px | 状态徽章 |
| 代码 | Mono | 14px | 400 | 1.60 | -0.32px | 日志、终端输出 |

> Serif 仅用于标题，所有功能文字（按钮、标签、状态、数据）统一 Sans。

## 布局

### 整体骨架

```
┌─────────────────────────────────────────────────────────────┐
│  Header  h-14                                              │
│  Parchment 背景 · Border Cream 底边框                       │
│  Logo(Serif) + 项目计数 + 连接状态 + 用户信息 + 退出         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Main  bg-Parchment                                         │
│                                                             │
│  max-w-7xl mx-auto px-6 py-8                               │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Footer (可选)                                              │
│  连接状态指示器 · Stone Gray 小字                            │
└─────────────────────────────────────────────────────────────┘
```

- Header 不使用毛玻璃/半透明，使用实色 Parchment + Border Cream 底线，保持温暖扎实感
- 内容区最大宽度 `1200px`（max-w-7xl），居中，两侧自然留白

### 项目列表页

```
┌──────────────────────────────────────────────────────────┐
│  页面标题  "Projects"  Serif 32px                        │
│  副标题  "N 个项目 · M 运行中"  Olive Gray 16px           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │              │  │              │  │              │   │
│  │  项目卡片    │  │  项目卡片    │  │  项目卡片    │   │
│  │              │  │              │  │              │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐                      │
│  │              │  │              │                      │
│  │  项目卡片    │  │  + 新增项目   │                      │
│  │              │  │              │                      │
│  └──────────────┘  └──────────────┘                      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

- 桌面端 3 列，平板 2 列，移动端 1 列
- 卡片间距 `gap-5`（20px）

### 项目卡片

```
┌─────────────────────────────────────┐
│  ● 项目名称              Serif 20px │  ← 状态圆点 + 标题
│                                     │
│  进度条                              │  ← 高 6px, 圆角 3px
│  ██████████░░░░░░░░  62%            │  ← 底色 Border Cream, 填充 Terracotta
│                                     │
│  ┌─────┬─────┬─────┬─────┐         │
│  │  3  │  1  │  5  │  0  │         │  ← 四格统计
│  │pend │ing  │done │human│         │  ← Sans 12px 标签
│  └─────┴─────┴─────┴─────┘         │  ← 数字 Sans 16px 500
│                                     │
│  2 分钟前更新            Stone Gray  │  ← 14px, 右下角
└─────────────────────────────────────┘
  bg-Ivory · border 1px Border Cream · rounded-xl(12px)
  hover: ring shadow 0px 0px 0px 1px Ring Warm
  cursor-pointer, 点击进入项目详情
```

- 状态圆点：active → Terracotta `#c96442`，lost → Stone Gray `#87867f`
- 进度条填充色跟随项目主要状态（有 in_progress 时用 Terracotta，全 completed 用暖绿）

### 项目详情页 — 标签页布局

```
┌──────────────────────────────────────────────────────────┐
│  ← 返回    项目名称 (Serif 32px)                         │
│            路径 · 状态徽章                                │
├──────────────────────────────────────────────────────────┤
│  Board  │  Reports  │  Logs  │  Spec                    │  ← 标签导航
│  Border Cream 底线分隔 · 激活项底部 Terracotta 2px 线     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  标签页内容区                                              │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

- 标签文字：Sans 16px 400，激活态 500 + Terracotta 底线
- 非激活态：Olive Gray，hover 变 Near Black

### 任务看板

```
┌────────────┬────────────┬────────────┬────────────┐
│  Pending   │ In Progress│ Completed  │ Needs Human│  ← Serif 24px
│     3      │     1      │     5      │     0      │  ← Sans 14px Olive Gray
├────────────┼────────────┼────────────┼────────────┤
│ ┌────────┐ │ ┌────────┐ │ ┌────────┐ │            │
│ │Task 1  │ │ │Task 5  │ │ │Task 2  │ │            │
│ └────────┘ │ └────────┘ │ └────────┘ │            │
│ ┌────────┐ │            │ ┌────────┐ │            │
│ │Task 3  │ │            │ │Task 4  │ │            │
│ └────────┘ │            │ └────────┘ │            │
│ ┌────────┐ │            │ ┌────────┐ │            │
│ │Task 6  │ │            │ │Task 7  │ │            │
│ └────────┘ │            │ └────────┘ │            │
└────────────┴────────────┴────────────┴────────────┘
  列背景: bg-Ivory          列背景: bg-fdf0eb     列背景: bg-f0f5ee      列背景: bg-fdf0f0
  列头底色: 各状态色浅底      列间距: gap-4(16px)
```

- 四列等宽，水平滚动（移动端）
- 每列顶部带状态色浅底色条，形成视觉分组
- 列内卡片纵向排列，间距 `gap-3`（12px）

### 任务卡片

```
┌────────────────────────┐
│  任务标题    Serif 16px │  ← 或 Sans 500 if 紧凑模式
│                        │
│  ⚡ High   ○ 2/5 AC   │  ← 优先级徽章 + 验收标准进度
│                        │
│  尝试: 2/3   3 分钟前  │  ← Stone Gray 12px
└────────────────────────┘
  bg-white · border 1px Border Cream · rounded-lg(8px)
  hover: ring shadow 0px 0px 0px 1px Ring Warm
  点击展开任务详情 Modal
```

- 优先级徽章：high → `#b53333` 淡红底，medium → `#a17e2a` 淡琥珀底，low → `#87867f` 淡灰底
- 验收标准进度：小圆点行 ○○●●○，pass 绿 / fail 红 / pending 灰

### 任务详情 Modal

```
┌──────────────────────────────────────┐
│  ✕                                   │  ← 关闭按钮，Warm Silver
│                                      │
│  任务标题           Serif 24px        │
│  Task ID · 优先级徽章 · 状态徽章      │
│                                      │
│  ─── 描述 ─── Border Warm 分隔       │
│  任务描述文字  Sans 16px line-h 1.60  │
│                                      │
│  ─── 验收标准 ───                    │
│  ✓ 步骤1: 描述         pass          │  ← 暖绿
│  ✓ 步骤2: 描述         pass          │
│  ✗ 步骤3: 描述         fail          │  ← 深红
│  ○ 步骤4: 描述         pending       │  ← Stone Gray
│                                      │
│  ─── 备注 ───                        │
│  备注内容  Sans 14px                  │
│                                      │
└──────────────────────────────────────┘
  Modal 外层: bg-black/40 backdrop-blur-sm
  Modal 主体: bg-Ivory · rounded-2xl(16px) · whisper shadow
  max-w-lg mx-auto mt-[10vh]
```

### 评估报告卡片

```
┌──────────────────────────────────────────┐
│  ● PASS                    Serif 20px    │  ← 总体结果
│                                          │
│  摘要文字  Sans 14px Olive Gray           │
│                                          │
│  ┌────────┬────────┬────────┬────────┐   │
│  │ 功能   │ 代码   │ 深度   │ 视觉   │   │  ← 质量评分网格
│  │  0.85  │ 0.72   │ 0.68   │ 0.91   │   │  ← Sans 16px 500
│  └────────┴────────┴────────┴────────┘   │
│                                          │
│  ▸ 展开详细标准结果                        │  ← Coral 链接色
└──────────────────────────────────────────┘
  bg-Ivory · border 1px Border Cream · rounded-xl(12px)
  PASS 标记: 暖绿 #4a7c42
  FAIL 标记: 深红 #b53333
```

## 组件规范

### 按钮

| 类型 | 背景 | 文字 | 圆角 | 用途 |
|------|------|------|------|------|
| Primary (CTA) | Terracotta `#c96442` | Ivory `#faf9f5` | 12px | 主要操作："添加项目"、"重试" |
| Secondary | Warm Sand `#e8e6dc` | Charcoal `#4d4c48` | 8px | 次要操作："取消"、"筛选" |
| Dark | Dark Surface `#30302e` | Ivory `#faf9f5` | 8px | 暗色面强调按钮 |
| Danger | `#fdf0f0` | `#b53333` | 8px | 危险操作："删除项目" |
| Ghost | transparent | Olive Gray | 8px | 最低权重操作 |

- 按钮内距：`px-4 py-2`（平衡式），或 `py-0 pl-2 pr-3`（紧凑图标式）
- Hover：Primary 变 Coral `#d97757`，Secondary 加 ring shadow
- Focus：`2px solid Focus Blue #3898ec` 焦点环
- Active：ring shadow + inset shadow 微压感

### 输入框

```
bg-white · border 1px Border Cream · rounded-xl(12px)
px-3 py-2 · text Near Black · placeholder Stone Gray
focus: border-Focus Blue · focus: ring-2 ring-Focus Blue/20
```

### 标签 / 徽章

- 尺寸：`px-2.5 py-0.5 text-xs(12px) font-medium rounded-full`
- 颜色遵循上方「任务状态」表
- 圆角全圆 `rounded-full`，形成胶囊形态

### 进度条

- 高度：6px（紧凑），8px（标准）
- 底色：Border Cream `#f0eee6`
- 填充色：Terracotta `#c96442`（进行中），暖绿 `#4a7c42`（已完成）
- 圆角：与高度一致（3px / 4px）
- 过渡动画：`transition-all duration-500 ease-out`

### 标签页导航

- 水平排列，Sans 16px
- 激活态：font-weight 500 + 底部 2px Terracotta 线
- 非激活态：Olive Gray，hover Near Black
- 分隔线：`1px solid Border Cream` 底部

### 日志查看器

```
┌──────────────────────────────────────────┐
│  筛选条: [All] [Info] [Warn] [Error]     │  ← Secondary 按钮组
├──────────────────────────────────────────┤
│  ● INFO  Task started...                 │  ← Stone Gray 圆点
│  ● OK    Build completed                 │  ← 暖绿圆点
│  ● WARN  Retrying...                     │  ← 暖琥珀圆点
│  ● ERR   Build failed                    │  ← 深红圆点
│                                          │
│  ▼ 自动滚动                              │
└──────────────────────────────────────────┘
  bg-Near Black #141413 · text-Warm Silver
  Mono 14px · line-height 1.60
  日志区暗色处理，与页面 Parchment 形成强对比
```

- 日志区采用暗色底，模拟终端感，与温暖浅色页面形成「书页中的代码窗口」效果
- 级别徽章：圆点 + 级别缩写，颜色同语义色

## 动画

| 场景 | 动画 | 参数 |
|------|------|------|
| 状态色变化 | background-color transition | `duration-200 ease` |
| 进度条填充 | width transition | `duration-500 ease-out` |
| 卡片出现 | fade-in + slide-up | `duration-300 ease-out` |
| Modal 弹出 | fade + scale | `duration-200 ease-out, scale(0.95)→(1)` |
| Modal 背景层 | opacity fade | `duration-200` |
| 悬停 ring | box-shadow transition | `duration-150 ease` |

## 响应式

| 断点 | 宽度 | 布局变化 |
|------|------|----------|
| 移动端 | <640px | 单列，看板横向滚动，卡片全宽 |
| 平板 | 640–1024px | 双列项目卡片，看板四列紧凑 |
| 桌面 | >1024px | 三列项目卡片，看板四列标准宽度 |

### 看板响应式

- 桌面端：四列等宽，列间距 16px
- 平板端：四列等宽但更紧凑，卡片缩小
- 移动端：水平滚动，每列最小宽度 260px，snap scrolling

### 标题缩放

| 角色 | 桌面 | 平板 | 移动端 |
|------|------|------|--------|
| 页面标题 | 32px | 28px | 24px |
| 区块标题 | 24px | 20px | 20px |
| 卡片标题 | 20px | 18px | 16px |

## 暗色模式（预留）

暗色模式采用 Claude 的 Deep Dark 体系：

| 亮色面 | 暗色面 |
|--------|--------|
| Parchment `#f5f4ed` | Deep Dark `#141413` |
| Ivory `#faf9f5` | Dark Surface `#30302e` |
| Border Cream `#f0eee6` | Border Dark `#30302e` |
| Near Black 文字 | Warm Silver `#b0aea5` 文字 |
| Olive Gray 文字 | `#87867f` 文字（同色可复用） |
| Terracotta CTA | Coral `#d97757` CTA（更高明度） |
