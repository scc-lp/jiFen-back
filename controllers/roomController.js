const Room = require('../models/Room');
const socketManager = require('../config/socket');

class RoomController {
  // 创建房间
  static async createRoom(req, res) {
    try {
      const { room_name } = req.body;
      const userId = req.user.id;
      
      // 验证参数
      if (!room_name) {
        return res.status(400).json({ success: false, message: '房间名称不能为空' });
      }
      
      // 创建房间
      const room = await Room.createRoom(userId, room_name);
      
      res.status(201).json({
        success: true,
        message: '房间创建成功',
        data: room
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
  
  // 加入房间
  static async joinRoom(req, res) {
    try {
      const { room_code } = req.body;
      const userId = req.user.id;
      
      // 验证参数
      if (!room_code) {
        return res.status(400).json({ success: false, message: '房间码不能为空' });
      }
      
      // 验证房间码格式
      if (!/^\d{6}$/.test(room_code)) {
        return res.status(400).json({ success: false, message: '房间码格式不正确，应为6位数字' });
      }
      
      // 加入房间
      const room = await Room.joinRoom(room_code, userId);
      
      // 广播新玩家加入事件给房间内的所有客户端
      try {
        console.log('获取io实例...');
        const io = socketManager.getIO();
        console.log('获取io实例成功，准备触发事件...');
        // 使用io.emit触发事件，确保所有客户端都能收到
        io.emit('playerAdded', {
          room_id: room.id,
          player: {
            user_id: userId,
            room_id: room.id
          }
        });
        console.log('事件触发成功');
      } catch (error) {
        console.error('Socket.io emit error:', error);
      }
      
      res.status(200).json({
        success: true,
        message: '加入房间成功',
        data: room
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
  
  // 获取用户的房间列表
  static async getRooms(req, res) {
    try {
      const userId = req.user.id;
      
      // 获取分页参数
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;
      
      // 获取房间列表
      const result = await Room.getUserRooms(userId, page, pageSize);
      
      res.status(200).json({
        success: true,
        message: '获取房间列表成功',
        data: result
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
  
  // 获取房间详情
  static async getRoomDetail(req, res) {
    try {
      const { roomId } = req.params;
      
      // 获取房间详情
      const room = await Room.getRoomById(roomId);
      
      if (!room) {
        return res.status(404).json({ success: false, message: '房间不存在' });
      }
      
      res.status(200).json({
        success: true,
        message: '获取房间详情成功',
        data: room
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
  
  // 结束房间
  static async endRoom(req, res) {
    try {
      const { roomId } = req.params;
      
      // 结束房间
      const room = await Room.endRoom(roomId);
      
      // 广播房间结束事件给房间内的所有客户端
      try {
        console.log('获取io实例...');
        const io = socketManager.getIO();
        console.log('获取io实例成功，准备触发事件...');
        // 使用io.emit触发事件，确保所有客户端都能收到
        io.emit('roomEnded', {
          room_id: Number(roomId),
          message: '此房间已关闭'
        });
        console.log('事件触发成功');
      } catch (error) {
        console.error('Socket.io emit error:', error);
      }
      
      res.status(200).json({
        success: true,
        message: '房间已结束',
        data: room
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
  
  // 根据房间码获取房间信息
  static async getRoomByCode(req, res) {
    try {
      const { roomCode } = req.params;
      
      // 获取房间信息
      const room = await Room.getRoomByCode(roomCode);
      
      if (!room) {
        return res.status(404).json({ success: false, message: '房间不存在' });
      }
      
      res.status(200).json({
        success: true,
        message: '获取房间信息成功',
        data: room
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
  
  // 检查用户当前房间状态
  static async checkUserRoomStatus(req, res) {
    try {
      const userId = req.user.id;
      
      // 检查用户房间状态
      const status = await Room.checkUserRoomStatus(userId);
      
      res.status(200).json({
        success: true,
        message: '获取用户房间状态成功',
        data: status
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = RoomController;