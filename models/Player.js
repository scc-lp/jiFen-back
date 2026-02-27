const pool = require('../config/db');

class Player {
  // 获取房间内的玩家列表
  static async getPlayersByRoomId(roomId) {
    try {
      const [players] = await pool.execute(
        `SELECT p.*, 
         u.username as user_username, 
         u.avatar as user_avatar,
         COALESCE((SELECT s.current_score 
          FROM scores s 
          WHERE s.player_id = p.id 
          ORDER BY s.created_at DESC 
          LIMIT 1), 0) as score
         FROM players p 
         LEFT JOIN users u ON p.user_id = u.id
         WHERE p.room_id = ? AND (p.status IS NULL OR p.status = ?) 
         ORDER BY p.created_at ASC`,
        [roomId, 'active']
      );
      
      // 处理玩家名称和头像
      return players.map(player => ({
        ...player,
        player_name: player.user_username || player.player_name,
        avatar: player.user_avatar
      }));
    } catch (error) {
      throw error;
    }
  }
  
  // 添加玩家
  static async addPlayer(roomId, playerName) {
    try {
      const [result] = await pool.execute(
        'INSERT INTO players (room_id, player_name, status) VALUES (?, ?, ?)',
        [roomId, playerName, 'active']
      );
      
      // 获取添加的玩家信息
      const [players] = await pool.execute(
        'SELECT * FROM players WHERE id = ?',
        [result.insertId]
      );
      
      return {
        ...players[0],
        score: 0
      };
    } catch (error) {
      throw error;
    }
  }
  
  // 更新玩家信息
  static async updatePlayer(playerId, playerName) {
    try {
      const [result] = await pool.execute(
        'UPDATE players SET player_name = ? WHERE id = ?',
        [playerName, playerId]
      );
      
      if (result.affectedRows === 0) {
        throw new Error('玩家不存在');
      }
      
      // 获取更新后的玩家信息
      const [players] = await pool.execute(
        `SELECT p.*, 
         u.username as user_username, 
         u.avatar as user_avatar,
         COALESCE((SELECT s.current_score 
          FROM scores s 
          WHERE s.player_id = p.id 
          ORDER BY s.created_at DESC 
          LIMIT 1), 0) as score
         FROM players p 
         LEFT JOIN users u ON p.user_id = u.id
         WHERE p.id = ?`,
        [playerId]
      );
      
      const player = players[0];
      return {
        ...player,
        player_name: player.user_username || player.player_name,
        avatar: player.user_avatar
      };
    } catch (error) {
      throw error;
    }
  }
  
  // 移除玩家
  static async removePlayer(playerId) {
    try {
      // 标记玩家为已离开，而不是直接删除，避免外键约束错误
      const [result] = await pool.execute(
        'UPDATE players SET status = ? WHERE id = ?',
        ['left', playerId]
      );
      
      if (result.affectedRows === 0) {
        throw new Error('玩家不存在');
      }
      
      return { success: true };
    } catch (error) {
      throw error;
    }
  }
  
  // 根据ID获取玩家信息
  static async getPlayerById(playerId) {
    try {
      const [players] = await pool.execute(
        `SELECT p.*, 
         u.username as user_username, 
         u.avatar as user_avatar,
         COALESCE((SELECT s.current_score 
          FROM scores s 
          WHERE s.player_id = p.id 
          ORDER BY s.created_at DESC 
          LIMIT 1), 0) as score
         FROM players p 
         LEFT JOIN users u ON p.user_id = u.id
         WHERE p.id = ?`,
        [playerId]
      );
      
      if (players.length === 0) {
        return null;
      }
      
      const player = players[0];
      return {
        ...player,
        player_name: player.user_username || player.player_name,
        avatar: player.user_avatar
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Player;