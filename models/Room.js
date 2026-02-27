const pool = require('../config/db');
const User = require('./User');

class Room {
  // 创建房间
  static async createRoom(creatorId, roomName) {
    try {
      // 生成6位随机房间码
      const roomCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // 检查房间码是否已存在
      let existingRoom;
      do {
        const [rooms] = await pool.execute(
          'SELECT * FROM rooms WHERE room_code = ?',
          [roomCode]
        );
        existingRoom = rooms.length > 0;
        if (existingRoom) {
          // 重新生成房间码
          roomCode = Math.floor(100000 + Math.random() * 900000).toString();
        }
      } while (existingRoom);
      
      // 插入新房间
      const [result] = await pool.execute(
        'INSERT INTO rooms (room_code, creator_id, room_name, status) VALUES (?, ?, ?, ?)',
        [roomCode, creatorId, roomName, 'active']
      );
      
      // 获取创建的房间信息
      const [rooms] = await pool.execute(
        'SELECT * FROM rooms WHERE id = ?',
        [result.insertId]
      );
      
      const room = rooms[0];
      
      // 获取创建者的用户信息
      const creator = await User.findById(creatorId);
      const playerName = creator ? creator.username : '用户' + creatorId;
      
      // 自动将创建者添加为玩家
      await pool.execute(
        'INSERT INTO players (room_id, user_id, player_name, is_creator, status) VALUES (?, ?, ?, ?, ?)',
        [room.id, creatorId, playerName, 1, 'active']
      );
      
      return room;
    } catch (error) {
      throw error;
    }
  }
  
  // 加入房间
  static async joinRoom(roomCode, userId) {
    try {
      // 查找房间
      const [rooms] = await pool.execute(
        'SELECT * FROM rooms WHERE room_code = ? AND status = ?',
        [roomCode, 'active']
      );
      
      if (rooms.length === 0) {
        throw new Error('房间不存在或已结束');
      }
      
      const room = rooms[0];
      
      // 检查用户是否已在房间中（包括已离开的记录）
      const [existingPlayers] = await pool.execute(
        'SELECT * FROM players WHERE room_id = ? AND user_id = ?',
        [room.id, userId]
      );
      
      if (existingPlayers.length > 0) {
        const existingPlayer = existingPlayers[0];
        if (existingPlayer.status === 'left') {
          // 如果玩家之前离开过，重新激活该记录
          await pool.execute(
            'UPDATE players SET status = ?, player_name = ? WHERE id = ?',
            ['active', existingPlayer.player_name, existingPlayer.id]
          );
        } else {
          throw new Error('您已在该房间中');
        }
      } else {
        // 获取用户信息
        const user = await User.findById(userId);
        const playerName = user ? user.username : '用户' + userId;
        
        // 插入新的玩家记录
        await pool.execute(
          'INSERT INTO players (room_id, user_id, player_name, is_creator, status) VALUES (?, ?, ?, ?, ?)',
          [room.id, userId, playerName, room.creator_id === userId, 'active']
        );
      }
      
      return room;
    } catch (error) {
      throw error;
    }
  }
  
  // 获取用户的房间列表
  static async getUserRooms(userId, page = 1, pageSize = 10) {
    try {
      // 单次查询获取所有相关房间，减少数据库查询次数
      const [rooms] = await pool.execute(
        `SELECT DISTINCT r.* FROM rooms r
         LEFT JOIN players p ON r.id = p.room_id
         WHERE r.creator_id = ? OR (p.user_id = ? AND r.creator_id != ?)
         ORDER BY 
           CASE WHEN r.status = 'active' THEN 0 ELSE 1 END, 
           r.created_at DESC`,
        [userId, userId, userId]
      );
      
      // 分页
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedRooms = rooms.slice(startIndex, endIndex);
      
      return {
        rooms: paginatedRooms,
        total: rooms.length,
        page,
        pageSize
      };
    } catch (error) {
      throw error;
    }
  }
  
  // 获取房间详情
  static async getRoomById(roomId) {
    try {
      const [rooms] = await pool.execute(
        'SELECT * FROM rooms WHERE id = ?',
        [roomId]
      );
      
      return rooms.length > 0 ? rooms[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  // 结束房间
  static async endRoom(roomId) {
    try {
      const [result] = await pool.execute(
        'UPDATE rooms SET status = ?, ended_at = ? WHERE id = ?',
        ['ended', new Date(), roomId]
      );
      
      if (result.affectedRows === 0) {
        throw new Error('房间不存在');
      }
      
      return await this.getRoomById(roomId);
    } catch (error) {
      throw error;
    }
  }
  
  // 根据房间码获取房间信息
  static async getRoomByCode(roomCode) {
    try {
      const [rooms] = await pool.execute(
        'SELECT * FROM rooms WHERE room_code = ?',
        [roomCode]
      );
      
      return rooms.length > 0 ? rooms[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  // 检查用户当前是否在活跃的房间中
  static async checkUserRoomStatus(userId) {
    try {
      // 查找用户在活跃房间中的记录，且玩家状态为active
      const [results] = await pool.execute(
        `SELECT p.*, r.* FROM players p
         JOIN rooms r ON p.room_id = r.id
         WHERE p.user_id = ? AND r.status = ? AND (p.status IS NULL OR p.status = ?)`,
        [userId, 'active', 'active']
      );
      
      if (results.length > 0) {
        // 用户在活跃的房间中
        return {
          inRoom: true,
          roomId: results[0].room_id,
          roomName: results[0].room_name,
          roomCode: results[0].room_code
        };
      } else {
        // 用户不在活跃的房间中
        return {
          inRoom: false
        };
      }
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Room;