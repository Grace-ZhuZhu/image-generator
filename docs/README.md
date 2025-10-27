# Documentation Index

## 主要文档

### [TEMPLATES_FEATURE.md](./TEMPLATES_FEATURE.md)
**模板功能完整文档** - 包含所有模板相关功能的详细说明

**内容包括：**
- 📋 概述和更新日志
- 🎯 最新功能：Checkbox 选择交互
- 🏗️ 三层展示逻辑（代表图 → Prompt 图片 → 图片查看器）
- 🗄️ 数据库结构（prompts 和 templates 表）
- 🔌 API 端点（representatives 和 by-prompt 模式）
- 🎨 前端交互流程
- 🐾 Pet & Breed 参数集成
- 💡 使用示例
- 🌍 主题配置和国际化
- 🛠️ 开发注意事项
- 🧩 UI 组件示例
- ✅ 测试场景
- 📈 用户体验改进
- 🚀 未来扩展

### [PRD.md](./PRD.md)
**产品需求文档** - 项目的整体产品规划和需求说明

### [QUICK_START.md](./QUICK_START.md)
**快速开始指南** - 项目的快速启动和配置说明

**内容包括：**
- 🎨 Templates 功能快速开始
- 🖼️ 图片生成功能快速开始（Doubao SeedDream 4.0）
- 📊 功能验证方法
- 🐛 常见问题解答

### [DATABASE_CLEANUP_GUIDE.md](./DATABASE_CLEANUP_GUIDE.md)
**数据库清理指南** - 数据库维护和清理操作说明

## 最新更新
### 2025-10-27 - Subscribers 管理后台与自动入库

新增订阅邮箱管理功能与自动入库：

- ✨ 新增管理页：`/admin/subscribers`（搜索、分页、CSV 导出）
- ✨ 新增导出端点：`/api/admin/subscribers?format=csv[&q=xxx]`
- ✨ 登录用户自动加入订阅名单（去重、幂等）
- 🔒 权限：开发模式或 `ADMIN_EMAILS` 白名单账号可访问
- 🔑 推荐配置 `SUPABASE_SERVICE_ROLE_KEY` 以保证后台读取不受 RLS 限制



### 2025-10-14 - 图片生成功能（含参考图片）

新增管理员图片生成功能，使用 Doubao SeedDream 4.0 API。

**主要功能：**
- ✨ 在 `/admin/templates` 页面添加 "Generate" 标签页
- ✨ 支持上传参考图片（最多 3 张，引导生成风格）
- ✨ 支持中英文提示词输入（300 中文字符 / 600 英文单词）
- ✨ 实时字符计数和验证
- ✨ 图片生成和预览
- ✨ 一键下载功能
- 🔒 仅开发模式可用

**参考图片功能：**
- 支持 JPEG、PNG 格式
- 最多 3 张（API 支持最多 10 张）
- 每张最大 10MB
- Base64 编码传输
- 实时预览和移除

**技术实现：**
- 前端：React + Tabs 组件 + FileReader API
- 后端：Next.js API Route
- API：Doubao SeedDream 4.0
- 参数：1K 分辨率，无水印

**详细说明：** 参见 [QUICK_START.md](./QUICK_START.md) 的"图片生成功能快速开始"部分

### 2025-10-02 - Checkbox 选择交互

重构了模板选择交互逻辑，使用 checkbox 替代之前的点击选择方式。

**主要变更：**
- ✨ 第一层添加 checkbox + tooltip
- ✨ 第二层添加 checkbox，与第一层状态同步
- ✨ 新增 Tooltip 组件
- ✨ 国际化支持
- 🔄 重构选择逻辑
- ❌ 移除图片查看器的选择功能

**技术亮点：**
- 使用 `prompt_id` 作为状态同步标识
- 事件冒泡处理（`e.stopPropagation()`）
- 自动选择代表图（usage 最高）
- 条件渲染和国际化支持

**详细说明：** 参见 [TEMPLATES_FEATURE.md](./TEMPLATES_FEATURE.md) 的"Checkbox 选择交互"部分

### 2025-10-02 - 新的三层展示逻辑

实现了新的三层展示结构，优化了数据加载和用户体验。

**主要变更：**
- ✨ 添加 "Studio" 主题 tab
- ✨ 实现三层展示结构
- ✨ 添加分页功能（每页 50 张）
- 🔄 重构 API 端点
- 🔄 优化数据加载逻辑

**详细说明：** 参见 [TEMPLATES_FEATURE.md](./TEMPLATES_FEATURE.md) 的"新的三层展示逻辑"部分

## 文档结构

```
docs/
├── README.md                      # 本文件 - 文档索引
├── TEMPLATES_FEATURE.md           # 模板功能完整文档（主要文档）
├── PRD.md                         # 产品需求文档
├── QUICK_START.md                 # 快速开始指南
└── DATABASE_CLEANUP_GUIDE.md      # 数据库清理指南
```

## 快速导航

### 我想了解...

**模板功能如何工作？**
→ 查看 [TEMPLATES_FEATURE.md](./TEMPLATES_FEATURE.md) 的"概述"和"前端交互流程"部分

**如何使用 Checkbox 选择模板？**
→ 查看 [TEMPLATES_FEATURE.md](./TEMPLATES_FEATURE.md) 的"Checkbox 选择交互"部分

**API 端点如何调用？**
→ 查看 [TEMPLATES_FEATURE.md](./TEMPLATES_FEATURE.md) 的"API 端点"部分

**数据库结构是什么样的？**
→ 查看 [TEMPLATES_FEATURE.md](./TEMPLATES_FEATURE.md) 的"数据库结构"部分

**如何添加新主题？**
→ 查看 [TEMPLATES_FEATURE.md](./TEMPLATES_FEATURE.md) 的"主题配置"部分

**如何测试功能？**
→ 查看 [TEMPLATES_FEATURE.md](./TEMPLATES_FEATURE.md) 的"测试场景"部分

**项目如何快速启动？**
→ 查看 [QUICK_START.md](./QUICK_START.md)

**如何使用图片生成功能？**
→ 查看 [QUICK_START.md](./QUICK_START.md) 的"图片生成功能快速开始"部分

**如何清理数据库？**
→ 查看 [DATABASE_CLEANUP_GUIDE.md](./DATABASE_CLEANUP_GUIDE.md)

## 贡献指南

### 更新文档

当添加新功能或修改现有功能时，请更新相应的文档：

1. **功能变更** → 更新 [TEMPLATES_FEATURE.md](./TEMPLATES_FEATURE.md)
   - 在"更新日志"部分添加新条目
   - 在相应的功能部分更新详细说明
   - 添加或更新代码示例
   - 更新测试场景

2. **产品需求** → 更新 [PRD.md](./PRD.md)

3. **配置变更** → 更新 [QUICK_START.md](./QUICK_START.md)

4. **数据库变更** → 更新 [DATABASE_CLEANUP_GUIDE.md](./DATABASE_CLEANUP_GUIDE.md)

### 文档规范

- 使用清晰的标题层级（H1 → H2 → H3）
- 添加代码示例时使用语法高亮
- 使用 emoji 标记不同类型的内容（✨ 新增、🔄 变更、❌ 移除、🐛 修复）
- 保持中英文混排时的格式一致性
- 添加必要的链接和交叉引用

## 版本历史

| 日期 | 版本 | 主要变更 |
|------|------|---------|
| 2025-10-14 | v2.2 | 图片生成功能（Doubao SeedDream 4.0） |
| 2025-10-02 | v2.1 | Checkbox 选择交互 |
| 2025-10-02 | v2.0 | 新的三层展示逻辑 |
| 2025-01-30 | v1.1 | 规范化数据库架构 |
| 2025-01-20 | v1.0 | Templates 功能初始版本 |

## 联系方式

如有问题或建议，请通过以下方式联系：

- 📧 Email: [your-email@example.com]
- 💬 Issues: [GitHub Issues]
- 📝 Pull Requests: [GitHub PRs]

---

**最后更新：** 2025-10-14
**维护者：** Development Team

