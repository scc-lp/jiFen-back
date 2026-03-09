-- 同步数据库结构到生产环境
-- 修改users表的avatar字段类型为TEXT
ALTER TABLE users MODIFY COLUMN avatar TEXT COMMENT '头像URL';
