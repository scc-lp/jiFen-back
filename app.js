const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// 导入路由
const userRoutes = require('./routes/userRoutes');
const roomRoutes = require('./routes/roomRoutes');

// 创建Express应用
const app = express();

// 中间件
app.use(cors({
  origin: '*' // 或者直接用 '*' 允许所有
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 文件上传配置
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// 创建HTTP服务器
const server = http.createServer(app);

// 导入Socket管理器
const socketManager = require('./config/socket');

// 初始化Socket.io服务器
socketManager.init(server);

// 导入路由（在创建io实例后导入，避免循环依赖）
const playerRoutes = require('./routes/playerRoutes');
const scoreRoutes = require('./routes/scoreRoutes');

// 注册路由
app.use('/users', userRoutes);
app.use('/rooms', roomRoutes);
app.use('/players', playerRoutes);
app.use('/scores', scoreRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

// 导出app实例，供其他模块使用
module.exports = { app };