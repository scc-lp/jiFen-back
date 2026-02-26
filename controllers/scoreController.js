const Score = require('../models/Score');
const socketManager = require('../config/socket');

class ScoreController {
  // 更新玩家分数
  static async updateScore(req, res) {
    try {
      const { room_id, player_id, score_change } = req.body;
      const userId = req.user?.id; // 从token中获取当前用户ID，添加可选链操作符
      
      // 验证参数
      if (!room_id || !player_id || score_change === undefined) {
        return res.status(400).json({ success: false, message: '房间ID、玩家ID和分数变化不能为空' });
      }
      
      const scoreRecords = await Score.updateScore(room_id, player_id, score_change, userId);
      
      // 广播分数变化事件给房间内的所有客户端
      try {
        const io = socketManager.getIO();
        io.to(room_id).emit('scoreUpdated', {
          room_id,
          scoreRecords
        });
      } catch (error) {
        console.error('Socket.io emit error:', error);
      }
      
      res.status(201).json({
        success: true,
        message: '更新分数成功',
        data: scoreRecords
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
  
  // 获取分数历史记录
  static async getScoreHistory(req, res) {
    try {
      const { room_id } = req.query;
      
      if (!room_id) {
        return res.status(400).json({ success: false, message: '房间ID不能为空' });
      }
      
      const scoreHistory = await Score.getScoreHistory(room_id);
      
      res.status(200).json({
        success: true,
        message: '获取分数历史记录成功',
        data: scoreHistory
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = ScoreController;