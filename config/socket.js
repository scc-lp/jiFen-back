const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

class SocketManager {
  constructor() {
    this.io = null;
  }

  init(server) {
    this.io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    // Socket.io事件处理
    this.io.on('connection', (socket) => {
      // 从连接参数中获取token并验证用户身份
      const token = socket.handshake.auth.token;
      let userId = null;
      let userPhone = null;
      
      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          userId = decoded.id;
          userPhone = decoded.phone;
          socket.userId = userId;
          socket.userPhone = userPhone;
          console.log(`客户端 ${socket.id} 已认证，用户ID: ${userId}, 手机号: ${userPhone}`);
        } catch (error) {
          console.log(`客户端 ${socket.id} token验证失败:`, error.message);
        }
      } else {
        console.log(`客户端 ${socket.id} 未提供token（匿名连接）`);
      }
      
      console.log('新客户端连接:', socket.id, userId ? `(用户ID: ${userId})` : '(未认证)');
      
      // 加入房间
      socket.on('joinRoom', (roomId) => {
        socket.join(roomId);
        console.log(`客户端 ${socket.id} 加入房间 ${roomId}`);
        // 通知客户端加入房间成功
        socket.emit('joinRoomSuccess', roomId);
      });
      
      // 离开房间
      socket.on('leaveRoom', (roomId) => {
        socket.leave(roomId);
        console.log(`客户端 ${socket.id} 离开房间 ${roomId}`);
      });
      
      // 断开连接
      socket.on('disconnect', () => {
        console.log('客户端断开连接:', socket.id);
      });
    });

    return this.io;
  }

  getIO() {
    if (!this.io) {
      throw new Error('Socket.io not initialized');
    }
    return this.io;
  }
}

// 导出单例实例
module.exports = new SocketManager();
