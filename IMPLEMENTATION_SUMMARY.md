# Templates Feature Implementation Summary

## 已完成的工作

### 1. 数据库层 ✅

#### 规范化架构重构（2025-01-30）

系统已重构为规范化的两表结构，消除数据冗余：

##### prompts 表
- **文件**: `supabase/migrations/20250130000000_create_prompts_table.sql`
- **字段**:
  - `id`: UUID 主键
  - `prompt`: AI 提示词（支持 {{pet_by_breed}} 占位符）
  - `theme`: 主题分类（prompt 级别属性）
  - `created_by`: 创建者
  - `created_at`, `updated_at`: 时间戳
- **约束**: UNIQUE(prompt, theme) - 确保唯一性
- **索引**: theme, created_at
- **RLS**: 公开读取，service_role 可管理

##### templates 表
- **文件**: `supabase/migrations/20250120000000_create_templates_table.sql`（原始）
- **重构文件**:
  - `20250130000001_migrate_templates_to_prompts.sql`（数据迁移）
  - `20250130000002_cleanup_templates_table.sql`（清理旧字段）
- **字段**:
  - `id`: UUID 主键
  - `prompt_id`: 外键引用 prompts(id)
  - `title`: 图片标题（图片级别属性，用于 alt 文本）
  - `images`: JSONB 存储多尺寸图片路径
  - `usage`: 使用计数
  - `created_by`: 创建者
  - `created_at`, `updated_at`: 时间戳
- **索引**: prompt_id, usage, prompt_id+usage 组合索引
- **RLS**: 公开读取，service_role 可管理

**字段分配说明**：
- `theme` 在 `prompts` 表：因为主题是 prompt 级别的属性，多张图片共享同一主题
- `title` 在 `templates` 表：因为 title 是图片级别的属性，用于 `<img>` 标签的 `alt` 文本

**重构优势**：
- ✅ 消除冗余：多张图片共享同一 prompt 时，prompt 只存储一次
- ✅ 数据一致性：修改 prompt 只需更新 prompts 表
- ✅ 存储优化：显著减少数据库存储空间

### 2. API 层 ✅

#### GET /api/templates
- **文件**: `app/api/templates/route.ts`
- **功能**:
  - 模式 A: 获取每个主题的代表图（最高 usage）
  - 模式 B: 获取指定主题的所有模板
- **参数**: `mode`, `theme`
- **返回**: 包含 publicUrls 的模板列表

#### POST /api/templates/[id]/increment-usage
- **文件**: `app/api/templates/[id]/increment-usage/route.ts`
- **功能**: 增加模板使用计数
- **用途**: 用户选择模板时调用

#### POST /api/templates/upload
- **文件**: `app/api/templates/upload/route.ts`（已存在）
- **功能**: 管理员上传新模板
- **限制**: 仅开发模式

### 3. 类型定义 ✅

#### types/templates.ts
- `Template`: 模板数据结构
- `TemplateImages`: 图片路径结构
- `TemplatePublicUrls`: 公开 URL 结构
- `TemplatesResponse`: API 响应结构

### 4. 前端实现 ✅

#### app/page.tsx 更新
- **移除**: MOCK_ITEMS 硬编码数据
- **新增状态**:
  - `templates`: 代表图列表
  - `expandedTheme`: 当前展开的主题
  - `themeTemplates`: 展开主题的所有模板
  - `loadingTemplates`, `loadingThemeTemplates`: 加载状态
- **新增功能**:
  - 从 API 动态加载模板
  - 三层交互：代表图 → 主题展开 → 图片放大
  - Dialog 弹窗显示大图
  - 选择模板时增加 usage 计数

#### Pet & Breed 集成
- **下拉框**: 在悬浮栏添加 pet 和 breed 选择器
- **计算函数**: `computePetByBreed(pet, breed)`
- **渲染函数**: `renderTemplateWithPetByBreed(template, pet_by_breed)`
- **规则**:
  - dog + poodle → "poodle dog"
  - dog + Other → "dog"
  - Other → "宠物"

### 5. UI 组件 ✅

- 使用现有 `Dialog` 组件显示大图
- 使用 `Loader2` 图标显示加载状态
- 使用 `Card` 组件展示模板卡片
- 响应式网格布局（2列 → 3列）

### 6. 文档 ✅

- **docs/TEMPLATES_FEATURE.md**: 完整功能文档
- **scripts/seed-templates.sql**: 测试数据种子脚本
- **scripts/test-templates-api.ts**: API 测试脚本

## 交互流程

### 第一层：主题代表图
```
用户访问首页
  ↓
加载 GET /api/templates?mode=representatives
  ↓
显示每个主题的最高 usage 图片
  ↓
用户可通过 Tabs 筛选主题
```

### 第二层：主题展开
```
用户点击代表图
  ↓
设置 expandedTheme
  ↓
加载 GET /api/templates?mode=by-theme&theme=xxx
  ↓
显示该主题所有模板（网格布局）
  ↓
显示"返回"按钮
```

### 第三层：图片放大与选择
```
用户点击模板卡片
  ↓
Dialog 弹窗显示大图（orig/lg 尺寸）
  ↓
用户点击"选择此模板"
  ↓
POST /api/templates/[id]/increment-usage
  ↓
设置为 selected 模板
  ↓
关闭展开视图
```

## 数据流

### 模板上传（管理员）
```
/admin/templates 页面
  ↓
选择图片 + 输入 prompt/title/theme
  ↓
POST /api/templates/upload
  ↓
Sharp 处理生成多尺寸
  ↓
上传到 Supabase Storage (templates bucket)
  ↓
插入 templates 表
```

### 用户生成
```
选择模板 + 选择 pet/breed + 上传照片
  ↓
computePetByBreed(pet, breed) → "poodle dog"
  ↓
renderTemplateWithPetByBreed(template.prompt, "poodle dog")
  ↓
最终 prompt: "A portrait of a poodle dog..."
  ↓
调用 AI 生成 API
```

## 技术栈

- **数据库**: Supabase PostgreSQL
- **存储**: Supabase Storage (templates bucket)
- **后端**: Next.js App Router API Routes
- **前端**: React 18 + TypeScript
- **UI**: Radix UI + Tailwind CSS
- **图片处理**: Sharp (服务端)

## 配置要求

### 环境变量
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Supabase Storage
- 创建 `templates` bucket
- 设置为 public（公开读取）
- 路径结构: `{uuid}/{size}.jpg`

### 数据库迁移
```bash
# 运行迁移创建 templates 表
npx supabase db reset

# 或手动运行
psql $DATABASE_URL < supabase/migrations/20250120000000_create_templates_table.sql

# 可选：插入测试数据
psql $DATABASE_URL < scripts/seed-templates.sql
```

## 测试步骤

### 1. 验证数据库
```bash
# 检查表是否创建
npx supabase db diff

# 或使用 API
curl http://localhost:3003/api/templates/verify
```

### 2. 上传测试模板
1. 访问 `http://localhost:3003/admin/templates`
2. 上传图片
3. 输入 prompt: `A high-quality portrait of a {{pet_by_breed}} in studio lighting.`
4. 输入 theme: `holiday`
5. 点击上传

### 3. 测试首页交互
1. 访问 `http://localhost:3003`
2. 查看是否显示模板代表图
3. 点击代表图查看主题展开
4. 点击具体图片查看大图弹窗
5. 点击"选择此模板"
6. 验证 usage 计数是否增加

### 4. 测试 Pet/Breed 集成
1. 选择一个模板
2. 在悬浮栏选择 pet: dog
3. 选择 breed: poodle
4. 查看按钮 title 属性（hover 查看）
5. 应显示: "A portrait of a poodle dog..."

## 已知限制

1. **图片占位符**: 当前使用 sample 路径，需要实际上传图片
2. **主题硬编码**: THEMES 常量在前端硬编码，未来可从数据库获取
3. **无图片懒加载**: 所有图片立即加载，可优化性能
4. **无搜索功能**: 仅支持主题筛选
5. **无收藏功能**: 用户无法保存喜欢的模板

## 下一步建议

### 短期（1-2周）
- [ ] 上传真实模板图片
- [ ] 添加图片懒加载
- [ ] 优化移动端布局
- [ ] 添加错误边界处理

### 中期（1个月）
- [ ] 实现模板搜索
- [ ] 添加用户收藏功能
- [ ] 支持更多占位符变量
- [ ] 模板评分系统

### 长期（3个月+）
- [ ] 用户自定义模板
- [ ] A/B 测试框架
- [ ] 模板推荐算法
- [ ] 社区分享功能

## 文件清单

### 新增文件
```
supabase/migrations/20250120000000_create_templates_table.sql
app/api/templates/route.ts
app/api/templates/[id]/increment-usage/route.ts
types/templates.ts
docs/TEMPLATES_FEATURE.md
scripts/seed-templates.sql
scripts/test-templates-api.ts
IMPLEMENTATION_SUMMARY.md
```

### 修改文件
```
app/page.tsx (重大更新)
components/admin/TemplatesUploader.tsx (已存在，未修改)
```

## 性能指标

### 初始加载
- 代表图模式：1个 API 请求
- 数据量：~5-10 个模板（每个主题1个）
- 图片尺寸：md (320px)

### 主题展开
- 按需加载：1个 API 请求
- 数据量：该主题的所有模板
- 图片尺寸：md (320px)

### 图片放大
- 无额外请求（使用已加载数据）
- 图片尺寸：orig 或 lg

## 安全考虑

1. **RLS 策略**: templates 表启用 RLS，公开读取
2. **上传限制**: 仅开发模式 + service_role 可上传
3. **输入验证**: API 层验证参数
4. **SQL 注入**: 使用 Supabase 客户端防止注入
5. **XSS 防护**: React 自动转义用户输入

## 维护建议

1. **定期清理**: 删除 usage=0 且创建超过30天的模板
2. **监控 usage**: 追踪热门模板，优化推荐
3. **存储管理**: 定期检查 templates bucket 大小
4. **索引优化**: 根据查询模式调整索引
5. **日志记录**: 记录 API 错误和性能指标

---

**实施日期**: 2025-01-20  
**版本**: 1.0.0  
**状态**: ✅ 已完成核心功能

