# Templates Feature Documentation

## 概述

首页现在从 `templates` 数据库表中动态加载和展示模板图片，支持三层交互：

1. **主题代表图展示** - 每个主题显示使用次数最高的一张图片
2. **主题展开** - 点击代表图后展示该主题下的所有图片
3. **图片放大** - 在展开视图中点击图片可在弹窗中查看大图并选择

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

#### 模式 A: 代表图模式（默认）

```
GET /api/templates?mode=representatives&theme=all
```

返回每个主题使用次数最高的一张图片。

**参数：**
- `mode`: "representatives"（默认）
- `theme`: "all"（默认）或特定主题名

**响应：**
```json
{
  "items": [
    {
      "id": "uuid",
      "title": "圣诞狗狗",
      "theme": "holiday",
      "prompt": "A high-quality portrait of a {{pet_by_breed}} in studio lighting.",
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
  "count": 5
}
```

#### 模式 B: 按主题获取

```
GET /api/templates?mode=by-theme&theme=holiday
```

返回指定主题下的所有模板，按使用次数降序排列。

**参数：**
- `mode`: "by-theme"
- `theme`: 主题名（必填）

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

### 第一层：主题代表图

1. 页面加载时调用 `GET /api/templates?mode=representatives`
2. 显示每个主题的代表图（使用 `md` 尺寸）
3. 用户可通过顶部 Tabs 筛选主题

### 第二层：主题展开

1. 用户点击某个代表图
2. 调用 `GET /api/templates?mode=by-theme&theme=xxx`
3. 显示该主题下的所有模板（网格布局）
4. 显示"返回"按钮

### 第三层：图片放大与选择

1. 在展开视图中点击某张图片
2. 在 Dialog 弹窗中显示大图（使用 `orig` 或 `lg` 尺寸）
3. 显示"选择此模板"按钮
4. 点击选择后：
   - 调用 `POST /api/templates/[id]/increment-usage` 增加计数
   - 设置为当前选中模板
   - 关闭展开视图

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

## 开发注意事项

1. **图片尺寸选择**：
   - 列表展示使用 `md` (320px)
   - 选中预览使用 `lg` (640px)
   - 弹窗大图使用 `orig` 或 `lg`

2. **性能优化**：
   - 代表图模式减少初始加载数据量
   - 按需加载主题详情
   - 图片懒加载（可考虑添加）

3. **错误处理**：
   - API 失败时显示 toast 提示
   - 加载状态使用 Loader2 动画

4. **RLS 策略**：
   - 所有用户可读取 templates
   - 仅 service_role 可写入/更新

## 未来扩展

- [ ] 添加模板搜索功能
- [ ] 支持更多占位符变量
- [ ] 模板收藏功能
- [ ] 用户自定义模板
- [ ] 模板评分系统
- [ ] A/B 测试不同 prompt

