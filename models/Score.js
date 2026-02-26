const pool = require('../config/db');

class Score {
  // 更新玩家分数
  static async updateScore(roomId, playerId, scoreChange, userId) {
    try {
      // 获取目标玩家信息
      const [targetPlayers] = await pool.execute(
        `SELECT COALESCE((SELECT s.current_score 
          FROM scores s 
          WHERE s.player_id = ? 
          ORDER BY s.created_at DESC 
          LIMIT 1), 0) as current_score
         FROM players p 
         WHERE p.id = ? AND p.room_id = ?`,
        [playerId, playerId, roomId]
      );
      
      if (targetPlayers.length === 0) {
        throw new Error('目标玩家不存在或不在该房间中');
      }
      
      // 获取当前用户在该房间中的玩家ID
      const [currentPlayers] = await pool.execute(
        `SELECT id, COALESCE((SELECT s.current_score 
          FROM scores s 
          WHERE s.player_id = players.id 
          ORDER BY s.created_at DESC 
          LIMIT 1), 0) as current_score
         FROM players 
         WHERE user_id = ? AND room_id = ?`,
        [userId, roomId]
      );
      
      if (currentPlayers.length === 0) {
        throw new Error('您不在该房间中');
      }
      
      const currentPlayerId = currentPlayers[0].id;
      
      // 计算新分数
      const targetCurrentScore = targetPlayers[0].current_score;
      const targetNewScore = targetCurrentScore + scoreChange;
      
      const currentUserCurrentScore = currentPlayers[0].current_score;
      const currentUserNewScore = currentUserCurrentScore - scoreChange;
      
      // 为目标玩家插入分数记录
      const [targetResult] = await pool.execute(
        'INSERT INTO scores (room_id, player_id, score_change, current_score, giver_id) VALUES (?, ?, ?, ?, ?)',
        [roomId, playerId, scoreChange, targetNewScore, currentPlayerId]
      );
      
      // 为当前用户插入分数记录（扣分）
      const [currentResult] = await pool.execute(
        'INSERT INTO scores (room_id, player_id, score_change, current_score, giver_id) VALUES (?, ?, ?, ?, ?)',
        [roomId, currentPlayerId, -scoreChange, currentUserNewScore, currentPlayerId]
      );
      
      // 获取两条分数记录信息
      const [scoreRecords] = await pool.execute(
        `SELECT s.*, p.player_name 
         FROM scores s 
         JOIN players p ON s.player_id = p.id 
         WHERE s.id IN (?, ?) 
         ORDER BY s.created_at DESC`,
        [targetResult.insertId, currentResult.insertId]
      );
      
      return scoreRecords;
    } catch (error) {
      throw error;
    }
  }
  
  // 获取房间的分数历史记录
  static async getScoreHistory(roomId) {
    try {
      const [scores] = await pool.execute(
        `SELECT s.*, p.player_name, g.player_name as giver_name 
         FROM scores s 
         JOIN players p ON s.player_id = p.id 
         LEFT JOIN players g ON s.giver_id = g.id 
         WHERE s.room_id = ? 
         ORDER BY s.created_at DESC`,
        [roomId]
      );
      return scores;
    } catch (error) {
      throw error;
    }
  }
  
  // 获取玩家的分数历史记录
  static async getPlayerScoreHistory(playerId) {
    try {
      const [scores] = await pool.execute(
        `SELECT s.*, p.player_name 
         FROM scores s 
         JOIN players p ON s.player_id = p.id 
         WHERE s.player_id = ? 
         ORDER BY s.created_at DESC`,
        [playerId]
      );
      return scores;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Score;