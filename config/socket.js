const { Server } = require('socket.io');

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
      console.log('新客户端连接:', socket.id);
      
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
