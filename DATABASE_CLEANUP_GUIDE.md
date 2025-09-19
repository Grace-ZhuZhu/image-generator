# 数据库清理指南 - Database Cleanup Guide

## 概述 Overview

本指南详细说明了如何安全地从生产数据库中清理中文名字生成器相关的表和数据，为AI宠物照片生成器让路。

This guide details how to safely clean up Chinese name generator related tables and data from the production database to make way for the AI pet photography generator.

## ⚠️ 重要警告 Important Warnings

### 🔴 数据丢失风险 Data Loss Risk
- 此操作将**永久删除**所有中文名字生成相关的数据
- 包括用户生成的名字、保存的名字、生成历史等
- **无法撤销**，请务必先备份

### 🔴 生产环境注意事项 Production Environment Considerations
- 必须在维护窗口期间执行
- 需要通知所有相关用户
- 建议先在测试环境验证

## 📋 清理前检查清单 Pre-Cleanup Checklist

### 1. 数据备份 Data Backup
```sql
-- 创建完整数据库备份
pg_dump -h your-host -U your-user -d your-database > backup_$(date +%Y%m%d_%H%M%S).sql

-- 或者只备份相关表
pg_dump -h your-host -U your-user -d your-database \
  -t public.generation_batches \
  -t public.generated_names \
  -t public.saved_names \
  > chinese_names_backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. 数据统计 Data Statistics
在删除前，记录当前数据量：
```sql
-- 检查要删除的数据量
SELECT 
  'generation_batches' as table_name, 
  COUNT(*) as record_count,
  MIN(created_at) as earliest_record,
  MAX(created_at) as latest_record
FROM public.generation_batches
UNION ALL
SELECT 
  'generated_names' as table_name, 
  COUNT(*) as record_count,
  MIN(created_at) as earliest_record,
  MAX(created_at) as latest_record
FROM public.generated_names
UNION ALL
SELECT 
  'saved_names' as table_name, 
  COUNT(*) as record_count,
  MIN(created_at) as earliest_record,
  MAX(created_at) as latest_record
FROM public.saved_names;
```

### 3. 依赖关系检查 Dependency Check
```sql
-- 检查是否有其他表引用这些表
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND (ccu.table_name IN ('generation_batches', 'generated_names', 'saved_names')
       OR tc.table_name IN ('generation_batches', 'generated_names', 'saved_names'));
```

## 🚀 执行清理 Execute Cleanup

### 方法1：使用迁移脚本（推荐）
```bash
# 在Supabase项目中运行迁移
supabase db push

# 或者直接执行迁移文件
psql -h your-host -U your-user -d your-database -f supabase/migrations/20250919000000_cleanup_chinese_name_tables.sql
```

### 方法2：手动执行SQL
如果不使用迁移系统，可以直接在数据库中执行清理脚本的内容。

## 📊 清理后验证 Post-Cleanup Verification

### 1. 确认表已删除
```sql
-- 检查表是否还存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('generation_batches', 'generated_names', 'saved_names');
-- 应该返回空结果
```

### 2. 检查清理日志
```sql
-- 查看清理操作的日志记录
SELECT * 
FROM public.credits_history 
WHERE description LIKE '%Chinese name tables removed%'
ORDER BY created_at DESC;
```

### 3. 验证核心功能
```sql
-- 确认核心表仍然存在且正常
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('customers', 'credits_history', 'ip_usage_logs')
ORDER BY table_name;
```

## 🔄 回滚计划 Rollback Plan

如果需要回滚（在备份可用的情况下）：

### 1. 从备份恢复
```bash
# 恢复完整备份
psql -h your-host -U your-user -d your-database < backup_YYYYMMDD_HHMMSS.sql

# 或者只恢复特定表
psql -h your-host -U your-user -d your-database < chinese_names_backup_YYYYMMDD_HHMMSS.sql
```

### 2. 重新运行相关迁移
如果使用了迁移系统，可能需要重新运行一些迁移来恢复表结构。

## 📝 清理记录 Cleanup Record

### 执行信息 Execution Information
- **执行日期**: _______________
- **执行人员**: _______________
- **备份位置**: _______________
- **受影响记录数**: _______________

### 验证确认 Verification Confirmation
- [ ] 数据已备份
- [ ] 清理脚本已在测试环境验证
- [ ] 相关用户已通知
- [ ] 清理操作已完成
- [ ] 清理后验证已通过
- [ ] 应用程序功能正常

## 🆘 紧急联系 Emergency Contact

如果在清理过程中遇到问题：
1. 立即停止操作
2. 检查错误日志
3. 如有必要，从备份恢复
4. 联系数据库管理员

## 📚 相关文档 Related Documentation

- [PRD.md](./PRD.md) - 产品需求文档
- [supabase/migrations/](./supabase/migrations/) - 数据库迁移文件
- [Supabase Documentation](https://supabase.com/docs) - Supabase官方文档
