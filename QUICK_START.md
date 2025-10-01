# Templates Feature - Quick Start Guide

## 🚀 快速开始

### 1. 运行数据库迁移

首先，确保 templates 表已创建：

```bash
# 如果使用 Supabase CLI
npx supabase db reset

# 或者手动运行迁移
# 在 Supabase Dashboard 的 SQL Editor 中执行：
# supabase/migrations/20250120000000_create_templates_table.sql
```

### 2. 配置 Supabase Storage

在 Supabase Dashboard 中：

1. 进入 **Storage** 页面
2. 创建新 bucket：`templates`
3. 设置为 **Public**（公开访问）
4. 保存

### 3. 上传测试模板（可选）

访问管理页面上传模板：

```
http://localhost:3003/admin/templates
```

**示例模板**：

- **Title**: 圣诞狗狗
- **Theme**: holiday
- **Prompt**: `A high-quality portrait of a {{pet_by_breed}} wearing a Santa hat in studio lighting.`
- **Files**: 选择一张或多张图片

点击 **Upload Templates** 上传。

### 4. 查看首页

访问首页查看效果：

```
http://localhost:3003
```

**预期行为**：

1. 页面加载时显示每个主题的代表图
2. 点击代表图展开该主题的所有模板
3. 点击具体模板在弹窗中查看大图
4. 点击"选择此模板"将其设为当前选中

### 5. 测试 Pet/Breed 功能

在首页顶部悬浮栏：

1. 选择 **Pet**: dog
2. 选择 **Breed**: poodle
3. 鼠标悬停在"开始生成"按钮上
4. 查看 tooltip，应显示渲染后的 prompt

## 📊 验证功能

### 检查 API 端点

```bash
# 1. 验证 templates 表
curl http://localhost:3003/api/templates/verify

# 2. 获取代表图
curl http://localhost:3003/api/templates?mode=representatives

# 3. 获取特定主题
curl "http://localhost:3003/api/templates?mode=by-theme&theme=holiday"
```

### 检查数据库

在 Supabase Dashboard 的 SQL Editor 中：

```sql
-- 查看所有模板
SELECT id, title, theme, usage, created_at 
FROM templates 
ORDER BY theme, usage DESC;

-- 查看每个主题的模板数量
SELECT theme, COUNT(*) as count, MAX(usage) as max_usage
FROM templates
GROUP BY theme
ORDER BY theme;
```

## 🎨 自定义主题

如果需要添加新主题，修改 `app/page.tsx` 中的 THEMES 常量：

```typescript
const THEMES = [
  { key: "all", label: "全部" },
  { key: "holiday", label: "节日 🎄" },
  { key: "career", label: "职业 👔" },
  { key: "fantasy", label: "奇幻 🦄" },
  { key: "fashion", label: "时尚 👗" },
  { key: "art", label: "艺术 🎨" },
  { key: "your-theme", label: "你的主题 🎯" }, // 新增
] as const;
```

然后上传对应主题的模板。

## 🐛 常见问题

### Q: 首页显示加载中但没有模板？

**A**: 检查以下几点：

1. templates 表是否已创建？
   ```sql
   SELECT * FROM templates LIMIT 1;
   ```

2. 是否有数据？
   ```sql
   SELECT COUNT(*) FROM templates;
   ```

3. 检查浏览器控制台是否有错误

### Q: 图片无法显示？

**A**: 检查：

1. templates bucket 是否创建且为 public？
2. 图片路径是否正确？
3. 在浏览器中直接访问图片 URL 是否可以打开？

### Q: 上传模板失败？

**A**: 确认：

1. 是否在开发模式？（`NODE_ENV=development`）
2. 是否有 service_role 权限？
3. 检查 Sharp 是否安装：`npm list sharp`

### Q: Pet/Breed 下拉框不显示？

**A**: 检查：

1. 浏览器控制台是否有 JavaScript 错误？
2. Select 组件是否正确导入？
3. 刷新页面重试

## 📝 数据结构示例

### Template 对象

```json
{
  "id": "abc-123-uuid",
  "title": "圣诞狗狗",
  "theme": "holiday",
  "prompt": "A high-quality portrait of a {{pet_by_breed}} wearing a Santa hat...",
  "images": {
    "sm": "abc-123-uuid/sm.jpg",
    "md": "abc-123-uuid/md.jpg",
    "lg": "abc-123-uuid/lg.jpg",
    "orig": "abc-123-uuid/orig.jpg"
  },
  "usage": 999,
  "created_at": "2025-01-20T10:00:00Z",
  "publicUrls": {
    "sm": "https://xxx.supabase.co/storage/v1/object/public/templates/abc-123-uuid/sm.jpg",
    "md": "https://xxx.supabase.co/storage/v1/object/public/templates/abc-123-uuid/md.jpg",
    "lg": "https://xxx.supabase.co/storage/v1/object/public/templates/abc-123-uuid/lg.jpg",
    "orig": "https://xxx.supabase.co/storage/v1/object/public/templates/abc-123-uuid/orig.jpg"
  }
}
```

## 🔧 开发工具

### 测试 API

使用提供的测试脚本：

```bash
npx tsx scripts/test-templates-api.ts
```

### 插入测试数据

```bash
# 在 Supabase Dashboard SQL Editor 中运行
# scripts/seed-templates.sql
```

**注意**: 种子数据使用占位符图片路径，需要替换为真实路径。

## 📚 更多文档

- **完整功能文档**: `docs/TEMPLATES_FEATURE.md`
- **实施总结**: `IMPLEMENTATION_SUMMARY.md`
- **PRD**: `PRD.md`

## 🎯 下一步

1. ✅ 验证基础功能正常
2. 📸 上传真实模板图片
3. 🎨 自定义主题和样式
4. 🚀 部署到生产环境
5. 📊 监控使用数据

## 💡 提示

- 模板的 `prompt` 字段支持 `{{pet_by_breed}}` 占位符
- 用户选择 pet 和 breed 后会自动替换
- 每次选择模板会自动增加 usage 计数
- 代表图始终显示 usage 最高的模板

---

**需要帮助？** 查看 `docs/TEMPLATES_FEATURE.md` 获取详细文档。

