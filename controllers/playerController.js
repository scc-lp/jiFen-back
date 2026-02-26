const Player = require('../models/Player');
const socketManager = require('../config/socket');

class PlayerController {
  // 获取玩家列表
  static async getPlayers(req, res) {
    try {
      const { room_id } = req.query;
      
      if (!room_id) {
        return res.status(400).json({ success: false, message: '房间ID不能为空' });
      }
      
      const players = await Player.getPlayersByRoomId(room_id);
      
      res.status(200).json({
        success: true,
        message: '获取玩家列表成功',
        data: players
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
  
  // 添加玩家
  static async addPlayer(req, res) {
    try {
      const { room_id, player_name } = req.body;
      
      // 验证参数
      if (!room_id || !player_name) {
        return res.status(400).json({ success: false, message: '房间ID和玩家名称不能为空' });
      }
      
      const player = await Player.addPlayer(room_id, player_name);
      
      console.log('添加玩家成功，准备广播事件:', { room_id, player_id: player.id });
      
      // 广播新玩家加入事件给房间内的所有客户端
      try {
        console.log('获取io实例...');
        const io = socketManager.getIO();
        console.log('获取io实例成功，准备触发事件...');
        // 使用io.emit而不是io.to(room_id).emit，确保所有客户端都能收到事件
        io.emit('playerAdded', {
          room_id,
          player
        });
        console.log('事件触发成功');
      } catch (error) {
        console.error('Socket.io emit error:', error);
      }
      
      res.status(201).json({
        success: true,
        message: '添加玩家成功',
        data: player
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
  
  // 更新玩家信息
  static async updatePlayer(req, res) {
    try {
      const { playerId } = req.params;
      const { player_name } = req.body;
      
      // 验证参数
      if (!player_name) {
        return res.status(400).json({ success: false, message: '玩家名称不能为空' });
      }
      
      const player = await Player.updatePlayer(playerId, player_name);
      
      res.status(200).json({
        success: true,
        message: '更新玩家信息成功',
        data: player
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
  
  // 移除玩家
  static async removePlayer(req, res) {
    try {
      const { playerId } = req.params;
      
      // 获取玩家信息，用于广播
      const player = await Player.getPlayerById(playerId);
      
      if (!player) {
        return res.status(404).json({ success: false, message: '玩家不存在' });
      }
      
      await Player.removePlayer(playerId);
      
      // 广播玩家离开事件给房间内的所有客户端
      try {
        const io = socketManager.getIO();
        io.emit('playerLeft', {
          room_id: player.room_id,
          player_id: playerId,
          player_name: player.player_name
        });
      } catch (error) {
        console.error('Socket.io emit error:', error);
      }
      
      res.status(200).json({
        success: true,
        message: '移除玩家成功'
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = PlayerController;