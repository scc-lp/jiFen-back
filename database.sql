-- 数据库表结构设计

-- 用户表
CREATE TABLE `users` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `phone` VARCHAR(11) NOT NULL UNIQUE COMMENT '手机号',
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `password` VARCHAR(100) NOT NULL COMMENT '密码',
  `avatar` VARCHAR(255) COMMENT '头像URL',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 房间表
CREATE TABLE `rooms` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `room_code` VARCHAR(10) NOT NULL UNIQUE COMMENT '房间码',
  `creator_id` INT NOT NULL COMMENT '创建者ID',
  `room_name` VARCHAR(100) NOT NULL COMMENT '房间名称',
  `status` ENUM('active', 'ended') DEFAULT 'active' COMMENT '房间状态',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `ended_at` TIMESTAMP NULL COMMENT '结束时间',
  FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='房间表';

-- 玩家表
CREATE TABLE `players` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `room_id` INT NOT NULL COMMENT '房间ID',
  `user_id` INT NULL COMMENT '用户ID（未登录用户为NULL）',
  `player_name` VARCHAR(50) NOT NULL COMMENT '玩家名称',
  `is_creator` TINYINT(1) DEFAULT 0 COMMENT '是否为创建者',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='玩家表';

-- 分数记录表
CREATE TABLE `scores` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `room_id` INT NOT NULL COMMENT '房间ID',
  `player_id` INT NOT NULL COMMENT '玩家ID',
  `score_change` INT NOT NULL COMMENT '分数变化',
  `current_score` INT NOT NULL COMMENT '当前分数',
  `description` VARCHAR(255) COMMENT '分数描述',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
  FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`),
  FOREIGN KEY (`player_id`) REFERENCES `players`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分数记录表';

-- 历史记录表（用于存储结束的房间分数）
CREATE TABLE `history` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `room_id` INT NOT NULL COMMENT '房间ID',
  `room_code` VARCHAR(10) NOT NULL COMMENT '房间码',
  `room_name` VARCHAR(100) NOT NULL COMMENT '房间名称',
  `creator_id` INT NOT NULL COMMENT '创建者ID',
  `ended_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '结束时间',
  `total_players` INT NOT NULL COMMENT '总玩家数',
  FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='历史记录表';

-- 历史玩家分数表（关联历史记录的玩家分数）
CREATE TABLE `history_players` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `history_id` INT NOT NULL COMMENT '历史记录ID',
  `player_name` VARCHAR(50) NOT NULL COMMENT '玩家名称',
  `final_score` INT NOT NULL COMMENT '最终分数',
  FOREIGN KEY (`history_id`) REFERENCES `history`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='历史玩家分数表';
