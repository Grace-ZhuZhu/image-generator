# Templates Feature Documentation

## 概述

首页从 `templates` 数据库表中动态加载和展示模板图片，采用三层交互结构：

1. **按主题获取代表图（Representatives by Theme）** - 每个 prompt 显示使用次数最高的一张图片，支持分页（每页 50 张）
2. **按 Prompt 获取所有图片（All Images by Prompt）** - 点击代表图后展示该 prompt 下的所有图片（不分页，< 50 张）
3. **图片查看器（Image Viewer）** - 在展开视图中点击图片可在弹窗中查看大图、缩放、切换并选择

## 最新更新（2025-10-02）

### Checkbox 选择交互（最新）

模板选择已重构为使用 checkbox 方式，替代之前的点击选择方式。

- **第一层（代表图）**：
  - 每张代表图右上角显示 checkbox
  - 鼠标悬停显示 tooltip："Use this style as template"
  - 点击 checkbox 选中/取消选中模板
  - 点击卡片本身进入第二层

- **第二层（Prompt 图片）**：
  - 返回按钮旁显示 checkbox 和标签："Use this style as template"
  - Checkbox 状态与第一层同步
  - 勾选 checkbox 选中该 prompt 的代表图

- **第三层（图片查看器）**：
  - 移除了"选择此模板"按钮
  - 只用于查看大图，不再用于选择

详见：[Checkbox Selection Feature](./CHECKBOX_SELECTION.md)

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
1. 点击任一代表图
2. 验证显示该 prompt 下的所有图片
3. 验证"返回"按钮出现
4. 验证分页控件隐藏

### 场景 4：查看大图
1. 在展开视图中点击图片
2. 验证打开全屏查看器
3. 测试缩放功能
4. 测试左右切换
5. 点击"选择此模板"，验证选中成功

## 未来扩展

- [ ] 添加模板搜索功能
- [ ] 支持更多占位符变量
- [ ] 模板收藏功能
- [ ] 用户自定义模板
- [ ] 模板评分系统
- [ ] A/B 测试不同 prompt
- [ ] 无限滚动替代分页
- [ ] 图片懒加载优化
- [ ] 骨架屏加载状态

