const pool = require('../config/db');

class Player {
  // 获取房间内的玩家列表
  static async getPlayersByRoomId(roomId) {
    try {
      const [players] = await pool.execute(
        `SELECT p.*, 
         COALESCE((SELECT s.current_score 
          FROM scores s 
          WHERE s.player_id = p.id 
          ORDER BY s.created_at DESC 
          LIMIT 1), 0) as score
         FROM players p 
         WHERE p.room_id = ? AND (p.status IS NULL OR p.status = ?) 
         ORDER BY p.created_at ASC`,
        [roomId, 'active']
      );
      return players;
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
         COALESCE((SELECT s.current_score 
          FROM scores s 
          WHERE s.player_id = p.id 
          ORDER BY s.created_at DESC 
          LIMIT 1), 0) as score
         FROM players p 
         WHERE p.id = ?`,
        [playerId]
      );
      
      return players[0];
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
         COALESCE((SELECT s.current_score 
          FROM scores s 
          WHERE s.player_id = p.id 
          ORDER BY s.created_at DESC 
          LIMIT 1), 0) as score
         FROM players p 
         WHERE p.id = ?`,
        [playerId]
      );
      
      return players.length > 0 ? players[0] : null;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Player;