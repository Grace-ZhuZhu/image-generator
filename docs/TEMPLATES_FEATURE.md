# Templates Feature Documentation

## 概述

首页从 `templates` 数据库表中动态加载和展示模板图片，采用三层交互结构：

1. **按主题获取代表图（Representatives by Theme）** - 每个 prompt 显示使用次数最高的一张图片，支持分页（每页 50 张）
2. **按 Prompt 获取所有图片（All Images by Prompt）** - 点击代表图后展示该 prompt 下的所有图片（不分页，< 50 张）
3. **图片查看器（Image Viewer）** - 在展开视图中点击图片可在弹窗中查看大图、缩放、切换

## 更新日志

### [2025-10-02] - Header 样式修复

**修复问题：**
- 🐛 修复图片缩略图宽度不足问题
  - 添加 `flex-shrink-0` 防止在 flex 布局中收缩
  - 将容器设置为固定尺寸 `w-10 h-10`（40px × 40px）
  - 图片使用 `w-full h-full` 填充容器
- 🐛 修复分隔线高度不匹配问题
  - 将分隔线高度从固定的 `h-6`（24px）改为 `self-stretch`
  - 分隔线现在自动适应父容器高度，与悬浮框高度保持一致

**技术细节：**
- 图片容器：`relative flex-shrink-0 w-10 h-10`
- 图片样式：`w-full h-full rounded object-cover border`
- 分隔线样式：`self-stretch w-px bg-border`

### [2025-10-02] - Checkbox 选择交互 & Header 显示

**新增功能：**
- ✨ 第一层（代表图页面）添加 checkbox，支持 tooltip 提示
- ✨ 第二层（Prompt 图片页面）添加 checkbox，与第一层状态同步
- ✨ 新增 Tooltip 组件（`@radix-ui/react-tooltip`）
- ✨ **Header 悬浮框显示选中的模板**
  - 显示模板代表图的小图（sm 尺寸，80px）
  - 显示"Template Style" / "模板风格"文字说明
  - 显示模板标题（如果有，支持 hover 显示完整标题）
  - 添加"X"取消按钮，可快速取消选中
  - 使用竖线分隔符（|）与其他区域分隔
  - 实时同步选中状态
  - 选中时显示，取消选中时隐藏
- ✨ 国际化支持：`useStyleAsTemplate`、`back` 和 `templateStyle` 翻译

**变更：**
- 🔄 重构模板选择逻辑，使用 checkbox 替代点击选择
- 🔄 更新返回按钮，添加国际化支持
- 🔄 优化模板显示区域样式，增加文字显示空间
- ❌ 移除第三层（图片查看器）的选择功能

**技术细节：**
- 使用 `prompt_id` 作为状态同步标识
- 使用 `e.stopPropagation()` 防止事件冒泡
- 自动选择 usage 最高的图片作为代表图
- Header 悬浮框实时显示选中状态
- 使用条件渲染（`{selected && ...}`）优化性能
- 取消按钮与上传照片删除按钮样式保持一致

### [2025-10-02] - 新的三层展示逻辑

**新增功能：**
- ✨ 添加 "Studio" 主题 tab（支持 case-insensitive 匹配）
- ✨ 实现三层展示结构（代表图 → Prompt 图片 → 图片查看器）
- ✨ 添加分页功能（每页 50 张）
- ✨ 添加返回按钮

**变更：**
- 🔄 重构 API 端点 `/api/templates`（新增 `by-prompt` 模式）
- 🔄 重构前端状态管理（使用 `expandedPromptId`）
- 🔄 优化数据加载逻辑（分页加载、按需加载）

### [2025-01-30] - 规范化数据库架构

- 🔄 将 prompts 和 templates 分离存储
- 🔄 使用外键关联 `templates.prompt_id -> prompts.id`

### [2025-01-20] - Templates 功能初始版本

- ✨ 实现 templates 数据库表
- ✨ 实现图片上传和存储
- ✨ 实现主题代表图展示
- ✨ 实现图片查看器
- ✨ 支持 `{{pet_by_breed}}` 占位符

## 最新更新（2025-10-02）

### Checkbox 选择交互（最新）

模板选择已重构为使用 checkbox 方式，替代之前的点击选择方式。新的交互方式更加直观，用户可以通过 checkbox 明确地选择/取消选择模板。

#### 第一层（代表图页面）

**功能：**
- ✅ 每张代表图卡片右上角显示 checkbox
- ✅ 鼠标悬停在 checkbox 上显示 tooltip 提示
  - 英文：`Use this style as template`
  - 中文：`使用此风格作为模板`
- ✅ Checkbox 状态与当前选中的模板（`selected` state）同步
- ✅ 点击 checkbox 选中/取消选中该模板
- ✅ 点击卡片本身（非 checkbox 区域）进入第二层，展开显示该 prompt 下的所有图片

**UI 实现：**
```tsx
<TooltipProvider>
  <Card className="relative">
    {/* Checkbox in top-right corner */}
    <div className="absolute top-2 right-2 z-10">
      <Tooltip>
        <TooltipTrigger asChild>
          <div onClick={(e) => handleCheckboxToggle(item.prompt_id, e)}>
            <Checkbox checked={selected?.prompt_id === item.prompt_id} />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{L.ui.useStyleAsTemplate}</p>
        </TooltipContent>
      </Tooltip>
    </div>
    {/* Image and content */}
  </Card>
</TooltipProvider>
```

#### 第二层（Prompt 图片页面）

**功能：**
- ✅ 返回按钮添加国际化支持
  - 英文：`← Back`
  - 中文：`← 返回`
- ✅ 返回按钮旁边显示 checkbox 和标签
  - 标签文字：`Use this style as template` / `使用此风格作为模板`
- ✅ Checkbox 状态与第一层同步
- ✅ 勾选 checkbox 选中该 prompt 的代表图（usage 最高的图片）

**UI 实现：**
```tsx
{expandedPromptId && (
  <div className="mb-4 flex items-center gap-3">
    <Button onClick={() => setExpandedPromptId(null)}>
      ← {L.ui.back}
    </Button>
    <div className="flex items-center gap-2">
      <Checkbox
        checked={selected?.prompt_id === expandedPromptId}
        onCheckedChange={() => handleCheckboxToggle(expandedPromptId)}
      />
      <label>{L.ui.useStyleAsTemplate}</label>
    </div>
  </div>
)}
```

#### 第三层（图片查看器）

**变更：**
- ❌ 移除了"选择此模板"按钮
- ❌ 移除了点击图片选择模板的功能
- ✅ 只用于查看大图、缩放、切换

**保留功能：**
- ✅ 全屏查看大图
- ✅ 缩放功能（1x - 3x）
- ✅ 左右切换（键盘方向键或按钮）
- ✅ 显示当前位置（第 X / 总数）

#### 状态同步机制

**关键实现：** 使用 `prompt_id` 作为同步的关键标识，确保第一层和第二层的 checkbox 状态保持一致。

**同步场景：**
1. **第一层 → 第二层**：在第一层勾选 checkbox → 进入第二层 → 第二层 checkbox 显示为 checked
2. **第二层 → 第一层**：在第二层勾选 checkbox → 返回第一层 → 第一层对应代表图的 checkbox 显示为 checked
3. **取消勾选**：在任一层取消勾选 → 另一层的 checkbox 也会同步更新为 unchecked

**核心函数：**
```typescript
const handleCheckboxToggle = async (promptId: string, e?: React.MouseEvent) => {
  // Stop propagation to prevent card click
  if (e) {
    e.stopPropagation();
  }

  // Check if this prompt is already selected
  const isCurrentlySelected = selected?.prompt_id === promptId;

  if (isCurrentlySelected) {
    // Deselect
    setSelected(null);
  } else {
    // Select: find the representative image (highest usage) for this prompt
    let representative: Template | null = null;

    if (expandedPromptId === promptId) {
      // We're in the expanded view, use promptTemplates
      representative = promptTemplates.reduce((highest, current) =>
        (current.usage > highest.usage) ? current : highest
      );
    } else {
      // We're in the representatives view, find it in templates
      representative = templates.find(t => t.prompt_id === promptId) || null;
    }

    if (representative) {
      setSelected(representative);
      // Increment usage count
      await fetch(`/api/templates/${representative.id}/increment-usage`, { method: "POST" });
    }
  }
};
```

**技术亮点：**
1. **事件冒泡处理**：使用 `e.stopPropagation()` 防止 checkbox 点击触发卡片点击
2. **代表图选择逻辑**：自动选择 usage 最高的图片作为代表图
3. **条件渲染**：第一层显示 checkbox，第二层使用不同的 UI 布局
4. **国际化支持**：所有文本支持英文和中文切换
5. **Header 实时显示**：选中模板后立即在 header 悬浮框中显示

#### Header 悬浮框显示选中模板

当用户选中一个模板后，header 悬浮框会实时显示选中的模板信息。

**显示内容：**
- 📷 模板代表图的小图（使用 `sm` 尺寸，80px）
- 📝 文字说明："Template Style" / "模板风格"
- 🏷️ 模板标题（如果有，hover 显示完整标题）
- ❌ 取消按钮（X 图标，右上角）
- ｜ 竖线分隔符（与其他区域分隔）

**UI 实现：**
```tsx
{selected && (
  <>
    <div className="flex items-center gap-2">
      <div className="relative flex-shrink-0 w-10 h-10">
        <img
          src={selected.publicUrls?.sm || selected.publicUrls?.md || ""}
          alt={selected.title || "Template"}
          className="w-full h-full rounded object-cover border"
        />
        <button
          type="button"
          aria-label="Remove template"
          onClick={() => setSelected(null)}
          className="absolute -top-1 -right-1 inline-flex h-4 w-4 items-center justify-center rounded-full border bg-background text-muted-foreground hover:bg-muted"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      <div className="flex flex-col min-w-[120px] max-w-[200px]">
        <span className="text-xs text-muted-foreground">{L.ui.templateStyle}</span>
        {selected.title && (
          <span className="text-sm font-medium truncate" title={selected.title}>
            {selected.title}
          </span>
        )}
      </div>
    </div>
    <div className="self-stretch w-px bg-border" />
  </>
)}
```

**样式特点：**
- **图片容器**：固定尺寸，防止收缩
  - 容器尺寸：40px × 40px（`w-10 h-10`）
  - 防止收缩：`flex-shrink-0`（确保在 flex 布局中保持宽度）
  - 图片样式：`w-full h-full`（填充整个容器）
  - 圆角：`rounded`
  - 边框：`border`
  - 裁剪方式：`object-cover`（保持比例，填充容器）
- **取消按钮**：与上传照片删除按钮样式一致
  - 位置：图片右上角（`absolute -top-1 -right-1`）
  - 尺寸：4x4（16px）
  - 图标：X（3x3，12px）
  - 样式：圆形、边框、背景色、hover 效果
- **文字区域**：增加显示空间
  - 最小宽度：120px（`min-w-[120px]`）
  - 最大宽度：200px（`max-w-[200px]`）
  - 标题截断：使用 `truncate` 而非 `line-clamp-1`
  - Hover 提示：使用 `title` 属性显示完整标题
- **分隔符**：竖线样式，自适应高度
  - 高度：自适应父容器（`self-stretch`）
  - 宽度：1px（`w-px`）
  - 颜色：边框色（`bg-border`）
  - 说明：使用 `self-stretch` 替代固定高度 `h-6`，确保分隔线与悬浮框高度一致
- **布局**：取消外层 border 和 background
  - 使用 Fragment（`<>...</>`）包裹
  - 与其他区域保持一致的视觉风格

**位置：**
- 在 header 悬浮框的左侧
- 在上传照片区域之前
- 与其他控件（Pet/Breed 选择、质量选择、生成按钮）在同一行

**交互：**
- 选中模板时自动显示
- 点击 X 按钮取消选中
- 取消选中时自动隐藏
- 实时同步选中状态
- Hover 标题显示完整文本

**新增组件：**
- `components/ui/tooltip.tsx` - 使用 `@radix-ui/react-tooltip` 实现悬停提示

**新增依赖：**
```bash
npm install @radix-ui/react-tooltip
```

**国际化更新：**
```typescript
// lib/i18n.tsx
ui: {
  useStyleAsTemplate: "Use this style as template" / "使用此风格作为模板",
  back: "Back" / "返回",
  templateStyle: "Template Style" / "模板风格",
  // ... other keys
}
```

### 新的三层展示逻辑

**结构：** all → by theme → by prompt

- **第一层（代表图）**：
  - 默认选择 "all" tab，显示所有 theme 的代表图（每个 prompt 一张）
  - 点击其他 tab（如 "studio"），按 theme 过滤代表图
  - 支持分页，每页 50 张
  - 支持 case-insensitive 主题匹配

- **第二层（Prompt 图片）**：
  - 点击任一代表图，展开显示该 prompt 下的所有图片
  - 不需要分页（每个 prompt < 50 张）
  - 显示"返回"按钮（已国际化）

- **第三层（图片查看器）**：
  - 全屏查看大图
  - 支持缩放（1x - 3x）
  - 支持左右切换（键盘方向键或按钮）
  - 显示当前位置（第 X / 总数）

## 数据库结构

### 规范化架构（2025-01-30 更新）

系统采用规范化的数据库设计，将提示词和模板图片分离存储：

#### prompts 表

存储唯一的 AI 生成提示词及其元数据：

```sql
CREATE TABLE public.prompts (
    id uuid PRIMARY KEY,
    prompt text NOT NULL,          -- AI 生成提示词（支持 {{pet_by_breed}} 占位符）
    theme text,                    -- 主题分类（如 holiday, career, fantasy 等）
    created_by uuid,               -- 创建者用户 ID
    created_at timestamptz,        -- 创建时间
    updated_at timestamptz,        -- 更新时间
    UNIQUE(prompt, theme)          -- 确保 prompt+theme 组合唯一
);
```

#### templates 表

存储模板图片及使用统计，通过外键引用 prompts：

```sql
CREATE TABLE public.templates (
    id uuid PRIMARY KEY,
    prompt_id uuid NOT NULL REFERENCES prompts(id),  -- 外键引用 prompts 表
    title text,                    -- 图片标题（用于 alt 文本，图片级别属性）
    images jsonb NOT NULL,         -- 图片路径 JSON: {sm, md, lg, orig}
    usage integer DEFAULT 0,       -- 使用次数（点击计数）
    created_by uuid,               -- 创建者用户 ID
    created_at timestamptz,        -- 创建时间
    updated_at timestamptz         -- 更新时间
);
```

**字段说明**：
- `prompts.theme`: prompt 级别的属性，多张图片共享同一主题
- `templates.title`: 图片级别的属性，用于 `<img>` 标签的 `alt` 文本，每张图片可以有不同的 title

**设计优势：**
- ✅ 消除数据冗余：相同的 prompt 只存储一次
- ✅ 数据一致性：修改 prompt 只需更新一处
- ✅ 存储优化：大幅减少数据库存储空间
- ✅ 逻辑清晰：一个 prompt 可以有多个 template 图片

### images 字段结构

```json
{
  "sm": "uuid/sm.jpg",      // 80px 缩略图
  "md": "uuid/md.jpg",      // 320px 中等尺寸
  "lg": "uuid/lg.jpg",      // 640px 大图
  "orig": "uuid/orig.jpg"   // 原始尺寸
}
```

## API 端点

### 1. GET /api/templates

获取模板列表，支持两种模式：

#### 查询参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| mode | string | 否 | representatives | 模式：representatives 或 by-prompt |
| theme | string | 否 | all | 主题过滤（仅 representatives 模式） |
| prompt_id | string | 条件必填 | - | 提示词 ID（by-prompt 模式必填） |
| page | number | 否 | 1 | 页码（仅 representatives 模式） |
| limit | number | 否 | 50 | 每页数量（仅 representatives 模式） |

#### 模式 A: Representatives 模式（代表图）

返回每个 prompt 的代表图（usage 最高的一张）。

**请求示例：**
```bash
# 获取所有主题的代表图（第 1 页）
GET /api/templates?mode=representatives&theme=all&page=1&limit=50

# 获取 studio 主题的代表图
GET /api/templates?mode=representatives&theme=studio&page=1&limit=50
```

**特性：**
- 每个 prompt 只返回一张图片（usage 最高）
- 支持按 theme 过滤（all 或特定 theme）
- 使用 `ilike` 进行 case-insensitive 匹配（"Studio", "STUDIO", "studio" 都能匹配）
- 支持分页（默认每页 50 张）

**响应：**
```json
{
  "items": [
    {
      "id": "uuid",
      "prompt_id": "prompt-uuid",
      "title": "圣诞狗狗",
      "theme": "holiday",
      "promptText": "A high-quality portrait of a {{pet_by_breed}} in studio lighting.",
      "images": {...},
      "usage": 999,
      "created_at": "2025-01-20T...",
      "publicUrls": {
        "sm": "https://...",
        "md": "https://...",
        "lg": "https://...",
        "orig": "https://..."
      }
    }
  ],
  "count": 50,
  "page": 1,
  "limit": 50,
  "total": 150
}
```

#### 模式 B: By-Prompt 模式（按提示词）

返回指定 prompt_id 的所有图片。

**请求示例：**
```bash
GET /api/templates?mode=by-prompt&prompt_id=5461ce95-c241-40ac-90c0-c77c56a512f3
```

**特性：**
- 返回该 prompt 下的所有图片
- 按 usage 降序排列
- 不需要分页（每个 prompt < 50 张）

**响应：**
```json
{
  "items": [
    {
      "id": "uuid-1",
      "prompt_id": "5461ce95-c241-40ac-90c0-c77c56a512f3",
      "usage": 10,
      ...
    },
    {
      "id": "uuid-2",
      "prompt_id": "5461ce95-c241-40ac-90c0-c77c56a512f3",
      "usage": 5,
      ...
    }
  ],
  "count": 2,
  "page": 1,
  "limit": 50,
  "total": 2
}
```

### 2. POST /api/templates/[id]/increment-usage

增加模板的使用计数（当用户选择模板时调用）。

```
POST /api/templates/abc-123-uuid/increment-usage
```

**响应：**
```json
{
  "success": true,
  "id": "abc-123-uuid",
  "usage": 1000
}
```

### 3. POST /api/templates/upload

上传新模板（仅开发模式，需要管理员权限）。

详见 `components/admin/TemplatesUploader.tsx`。

## 前端交互流程

### 第一层：按主题获取代表图

**触发条件：** 用户选择 tab（all 或特定 theme）

**流程：**
1. 页面加载时默认选择 "all" tab
2. 调用 `GET /api/templates?mode=representatives&theme=all&page=1&limit=50`
3. 显示每个 prompt 的代表图（使用 `md` 尺寸，320px）
4. 显示分页控件（上一页/下一页）
5. 用户可以：
   - 切换 tab 查看不同主题
   - 点击上一页/下一页浏览更多
   - 点击任一图片进入第二层

**状态管理：**
```typescript
const [theme, setTheme] = useState("all");
const [templates, setTemplates] = useState<Template[]>([]);
const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [totalItems, setTotalItems] = useState(0);
```

**切换 theme 时：**
- 自动重置到第 1 页
- 关闭已展开的 prompt
- 重新加载代表图

### 第二层：按 Prompt 获取所有图片

**触发条件：** 用户点击任一代表图

**流程：**
1. 获取点击图片的 `prompt_id`
2. 调用 `GET /api/templates?mode=by-prompt&prompt_id=xxx`
3. 显示该 prompt 下的所有图片（网格布局）
4. 显示"← 返回"按钮和提示文本
5. 隐藏分页控件（不需要分页）
6. 用户可以：
   - 点击"返回"回到第一层
   - 点击任一图片进入查看器

**状态管理：**
```typescript
const [expandedPromptId, setExpandedPromptId] = useState<string | null>(null);
const [promptTemplates, setPromptTemplates] = useState<Template[]>([]);
```

**点击处理：**
```typescript
const handleTemplateClick = (template: Template) => {
  setExpandedPromptId(template.prompt_id);
};
```

### 第三层：图片查看器

**触发条件：** 在第二层（已展开 prompt）时点击图片

**流程：**
1. 打开全屏 Dialog 弹窗
2. 显示大图（使用 `orig` 或 `lg` 尺寸）
3. 显示控件：
   - 缩放按钮（+、-、重置）
   - 左右切换按钮
   - 当前位置（第 X / 总数）
   - "选择此模板"按钮
4. 支持键盘操作：
   - 左/右方向键：切换图片
   - ESC：关闭查看器
5. 点击"选择此模板"后：
   - 调用 `POST /api/templates/[id]/increment-usage` 增加计数
   - 设置为当前选中模板
   - 关闭查看器和展开视图
   - 返回第一层

**状态管理：**
```typescript
const [viewingImage, setViewingImage] = useState<Template | null>(null);
const [zoomLevel, setZoomLevel] = useState(1);
```

**选择处理：**
```typescript
const handleTemplateSelect = async (template: Template) => {
  setSelected(template);
  setExpandedPromptId(null);  // 关闭展开视图
  setViewingImage(null);      // 关闭查看器
  await fetch(`/api/templates/${template.id}/increment-usage`, { method: "POST" });
};
```

## Pet & Breed 参数集成

### 占位符语法

模板的 `prompt` 字段支持 `{{pet_by_breed}}` 占位符：

```
A high-quality portrait of a {{pet_by_breed}} in studio lighting.
```

### 运行时替换规则

用户在悬浮栏选择 pet 和 breed 后，系统按以下规则生成 `pet_by_breed` 值：

| pet 选择 | breed 选择 | pet_by_breed 结果 |
|---------|-----------|------------------|
| dog | poodle | "poodle dog" |
| cat | British Shorthair | "British Shorthair cat" |
| dog | Other-不在此列表中 | "dog" |
| rabbit | (无 breed 选项) | "rabbit" |
| Other-不在此列表中 | - | "宠物" |

### 渲染函数

```typescript
function computePetByBreed(pet?: string, breed?: string): string {
  if (!pet || pet === "Other-不在此列表中") return "宠物";
  if ((pet === "cat" || pet === "dog") && breed && breed !== "Other-不在此列表中") {
    return `${breed} ${pet}`;
  }
  return pet;
}

function renderTemplateWithPetByBreed(template: string, pet_by_breed: string): string {
  return template.replace(/\{\{\s*pet_by_breed\s*\}\}/g, pet_by_breed);
}
```

## 使用示例

### 1. 上传模板（管理员）

访问 `http://localhost:3003/admin/templates`：

1. 选择图片文件
2. 输入 Title（可选）：如 "圣诞狗狗"
3. 输入 Theme：如 "holiday"
4. 输入 Prompt：`A high-quality portrait of a {{pet_by_breed}} wearing a Santa hat in studio lighting.`
5. 点击上传

### 2. 用户选择模板

1. 访问首页
2. 浏览主题代表图
3. 点击感兴趣的主题查看更多
4. 点击具体图片查看大图
5. 点击"选择此模板"
6. 在悬浮栏选择 pet 和 breed
7. 上传宠物照片
8. 点击"开始生成"

### 3. 生成时的 Prompt

假设用户选择了：
- 模板：圣诞狗狗（prompt: `A high-quality portrait of a {{pet_by_breed}} wearing a Santa hat...`）
- pet: dog
- breed: poodle

最终生成的 prompt：
```
A high-quality portrait of a poodle dog wearing a Santa hat in studio lighting.
```

## 数据库迁移

运行以下命令创建 templates 表：

```bash
# 如果使用 Supabase CLI
npx supabase db reset

# 或手动运行迁移
psql $DATABASE_URL < supabase/migrations/20250120000000_create_templates_table.sql
```

## 存储桶配置

templates 图片存储在 Supabase Storage 的 `templates` 桶中：

- **访问权限**: Public（公开读取）
- **路径结构**: `{uuid}/{size}.jpg`
- **示例**: `abc-123-uuid/md.jpg`

确保在 Supabase Dashboard 中创建了 `templates` 桶并设置为 public。

## 主题配置

### 可用主题列表

在 `app/page.tsx` 中定义：

```typescript
const THEMES = [
  { key: "all", label: "全部" },
  { key: "holiday", label: "节日 🎄" },
  { key: "career", label: "职业 👔" },
  { key: "fantasy", label: "奇幻 🦄" },
  { key: "fashion", label: "时尚 👗" },
  { key: "art", label: "艺术 🎨" },
  { key: "studio", label: "工作室 📸" },  // 新增
] as const;
```

### 国际化配置

在 `lib/i18n.tsx` 中添加翻译：

```typescript
// 英文
themes: {
  all: "All",
  holiday: "Holiday 🎄",
  career: "Career 👔",
  fantasy: "Fantasy 🦄",
  fashion: "Fashion 👗",
  art: "Art 🎨",
  studio: "Studio 📸",
}

// 中文
themes: {
  all: "全部",
  holiday: "节日 🎄",
  career: "职业 👔",
  fantasy: "奇幻 🦄",
  fashion: "时尚 👗",
  art: "艺术 🎨",
  studio: "工作室 📸",
}
```

## 开发注意事项

1. **图片尺寸选择**：
   - 列表展示使用 `md` (320px)
   - 选中预览使用 `lg` (640px)
   - 弹窗大图使用 `orig` 或 `lg`

2. **性能优化**：
   - 分页加载：每次只加载 50 个代表图
   - 按需加载：只在用户点击时才加载 prompt 下的所有图片
   - Case-insensitive 匹配：使用 `ilike` 进行主题匹配
   - 状态重置：切换 theme 时自动重置到第 1 页

3. **错误处理**：
   - API 失败时显示 toast 提示
   - 加载状态使用 Loader2 动画
   - 网络错误不会导致页面崩溃

4. **RLS 策略**：
   - 所有用户可读取 templates
   - 仅 service_role 可写入/更新

5. **数据库查询优化**：
   - Representatives 查询：先获取 prompts，再为每个 prompt 获取最高 usage 的 template
   - By-Prompt 查询：直接按 prompt_id 过滤，按 usage 降序排列
   - 使用 `ilike` 进行 case-insensitive 主题匹配

## UI 组件

### 分页控件

```tsx
{!expandedPromptId && totalPages > 1 && (
  <div className="mt-6 flex items-center justify-center gap-2">
    <Button
      variant="outline"
      size="sm"
      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
      disabled={currentPage === 1}
    >
      上一页
    </Button>
    <span className="text-sm text-muted-foreground">
      第 {currentPage} / {totalPages} 页 (共 {totalItems} 个提示词)
    </span>
    <Button
      variant="outline"
      size="sm"
      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
      disabled={currentPage === totalPages}
    >
      下一页
    </Button>
  </div>
)}
```

### 返回按钮

```tsx
{expandedPromptId && (
  <div className="mb-4 flex items-center gap-2">
    <Button variant="outline" size="sm" onClick={() => setExpandedPromptId(null)}>
      ← 返回
    </Button>
    <span className="text-sm text-muted-foreground">
      查看提示词下的所有图片
    </span>
  </div>
)}
```

### 图片网格

```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
  {displayedTemplates.map((item) => (
    <Card
      key={item.id}
      onClick={() => {
        if (!expandedPromptId) {
          handleTemplateClick(item);  // 第一层：展开 prompt
        } else {
          handleImageClick(item);     // 第二层：打开查看器
        }
      }}
      className="cursor-pointer overflow-hidden transition hover:shadow-md"
    >
      <div className="w-full overflow-hidden">
        <img
          src={item.publicUrls?.md || ""}
          alt={item.title || "Template"}
          className="w-full h-auto object-contain transition hover:scale-105"
        />
      </div>
      <div className="p-3">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Flame className="h-3.5 w-3.5 text-orange-500" />
          <span>{item.usage}</span>
        </div>
        {item.title && <div className="mt-1 text-sm font-medium line-clamp-1">{item.title}</div>}
      </div>
    </Card>
  ))}
</div>
```

## 测试场景

### 场景 1：浏览所有主题
1. 打开首页，选择 "all" tab
2. 验证显示 50 个代表图（或更少，如果总数 < 50）
3. 点击"下一页"，验证显示第 2 页
4. 验证分页信息正确

### 场景 2：按主题筛选
1. 点击 "Studio" tab
2. 验证只显示 studio 主题的代表图
3. 验证分页重置到第 1 页
4. 测试 case-insensitive 匹配（数据库中可以是 "Studio", "STUDIO", "studio"）

### 场景 3：展开 Prompt
1. 点击任一代表图（非 checkbox 区域）
2. 验证显示该 prompt 下的所有图片
3. 验证"返回"按钮出现（已国际化）
4. 验证分页控件隐藏

### 场景 4：查看大图
1. 在展开视图中点击图片
2. 验证打开全屏查看器
3. 测试缩放功能
4. 测试左右切换
5. 验证没有"选择此模板"按钮（已移除）

### 场景 5：使用 Checkbox 选择模板（第一层）
1. 在代表图页面，鼠标悬停在某张图片右上角的 checkbox 上
2. 验证显示 tooltip："Use this style as template" / "使用此风格作为模板"
3. 点击 checkbox
4. 验证 checkbox 变为 checked 状态
5. 验证该模板被选中（右侧面板显示）
6. 再次点击 checkbox
7. 验证 checkbox 变为 unchecked 状态
8. 验证模板被取消选中

### 场景 6：使用 Checkbox 选择模板（第二层）
1. 点击某张代表图进入第二层
2. 验证返回按钮旁边显示 checkbox 和标签
3. 点击 checkbox
4. 验证 checkbox 变为 checked 状态
5. 点击"返回"按钮回到第一层
6. 验证对应代表图的 checkbox 显示为 checked

### 场景 7：Checkbox 状态同步测试
1. 在第一层选中某个代表图的 checkbox
2. 点击该代表图进入第二层
3. 验证第二层的 checkbox 显示为 checked
4. 在第二层取消勾选 checkbox
5. 点击"返回"按钮回到第一层
6. 验证第一层对应代表图的 checkbox 显示为 unchecked

### 场景 8：Checkbox 不触发卡片点击
1. 在代表图页面，点击某张图片的 checkbox
2. 验证只选中/取消选中模板，不进入第二层
3. 点击卡片的其他区域（非 checkbox）
4. 验证进入第二层，显示该 prompt 下的所有图片

### 场景 9：国际化测试
1. 切换到英文环境
2. 验证 tooltip 显示 "Use this style as template"
3. 验证返回按钮显示 "← Back"
4. 验证 header 显示 "Template Style"
5. 切换到中文环境
6. 验证 tooltip 显示 "使用此风格作为模板"
7. 验证返回按钮显示 "← 返回"
8. 验证 header 显示 "模板风格"

### 场景 10：Header 悬浮框显示测试
1. 打开首页，验证 header 悬浮框不显示模板信息
2. 点击某张代表图的 checkbox 选中模板
3. 验证 header 悬浮框立即显示选中的模板
4. 验证显示模板的小图（sm 尺寸）
5. 验证显示"Template Style" / "模板风格"文字
6. 验证显示模板标题（如果有）
7. 验证显示竖线分隔符（|）
8. 验证图片右上角显示 X 取消按钮
9. 鼠标 hover 模板标题，验证显示完整标题（如果标题被截断）
10. 再次点击 checkbox 取消选中
11. 验证 header 悬浮框隐藏模板信息

### 场景 11：Header 取消按钮测试
1. 选中某个模板
2. 验证 header 显示模板信息和 X 按钮
3. 点击 header 中的 X 按钮
4. 验证 header 立即隐藏模板信息
5. 验证页面中对应的 checkbox 变为 unchecked
6. 如果在第一层，验证代表图的 checkbox 变为 unchecked
7. 如果在第二层，验证返回按钮旁的 checkbox 变为 unchecked

### 场景 12：Header 显示与状态同步测试
1. 在第一层选中某个模板
2. 验证 header 显示该模板信息
3. 进入第二层
4. 验证 header 仍然显示该模板信息
5. 在第二层取消选中
6. 验证 header 立即隐藏模板信息
7. 返回第一层
8. 验证 header 仍然不显示模板信息
9. 在第一层重新选中模板
10. 验证 header 显示模板信息
11. 点击 header 的 X 按钮
12. 验证 header 隐藏，第一层 checkbox 取消选中

### 场景 13：Header 样式和响应式测试
1. 选中模板，验证 header 显示
2. 验证模板区域与上传照片区域使用竖线分隔
3. 验证取消按钮样式与上传照片删除按钮一致
4. 验证文字区域有足够的显示空间（120px-200px）
5. 选择一个标题很长的模板
6. 验证标题被截断显示
7. Hover 标题，验证显示完整标题
8. 调整浏览器窗口大小，测试响应式布局

## 用户体验改进

### Checkbox 选择方式的优势

1. **更直观**
   - Checkbox 明确表示选择状态，用户一眼就能看出哪个模板被选中
   - Tooltip 提示帮助用户理解 checkbox 的作用

2. **更灵活**
   - 点击图片和点击 checkbox 是两个独立的操作，互不干扰
   - 用户可以先浏览多个 prompt 的图片，再决定选择哪个

3. **更一致**
   - 第一层和第二层使用相同的选择机制，用户体验一致
   - 状态同步机制确保两层的 checkbox 状态始终一致

4. **更易用**
   - 不会因为误点击而选择模板
   - 可以在任一层轻松选择/取消选择模板

5. **更可靠**
   - 使用 `prompt_id` 作为同步标识，确保状态一致性
   - 事件冒泡处理防止误触

### 性能影响

**正面影响：**
- ✅ 减少了不必要的状态更新（只在 checkbox 点击时更新）
- ✅ 移除了图片查看器的选择功能，简化了交互逻辑
- ✅ 使用 `prompt_id` 作为标识符，避免了复杂的对象比较

**中性影响：**
- ⚪ 添加了 Tooltip 组件，增加了少量 bundle 大小（~5KB）
- ⚪ 添加了条件渲染逻辑，对性能影响可忽略不计

## 未来扩展

### 功能扩展
- [ ] 添加模板搜索功能
- [ ] 支持更多占位符变量
- [ ] 模板收藏功能
- [ ] 用户自定义模板
- [ ] 模板评分系统
- [ ] A/B 测试不同 prompt
- [ ] 无限滚动替代分页
- [ ] 图片懒加载优化
- [ ] 骨架屏加载状态

### Checkbox 功能扩展
- [ ] 支持多选模板（当前只支持单选）
- [ ] 添加"清除选择"按钮
- [ ] 添加选中模板的视觉高亮效果（边框高亮）
- [ ] 支持键盘快捷键选择（如空格键）
- [ ] 添加选择历史记录
- [ ] 支持"全选"/"全不选"
- [ ] 支持按主题批量选择

