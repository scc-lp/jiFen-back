const express = require('express');
const router = express.Router();
const RoomController = require('../controllers/roomController');
const { verifyToken } = require('../middlewares/auth');

// 创建房间（需要认证）
router.post('/create', verifyToken, RoomController.createRoom);

// 加入房间（需要认证）
router.post('/join', verifyToken, RoomController.joinRoom);

// 获取房间列表（需要认证）
router.get('/', verifyToken, RoomController.getRooms);

// 获取房间详情（需要认证）
router.get('/:roomId', verifyToken, RoomController.getRoomDetail);

// 根据房间码获取房间信息（需要认证）
router.get('/code/:roomCode', verifyToken, RoomController.getRoomByCode);

// 结束房间（需要认证）
router.put('/:roomId/end', verifyToken, RoomController.endRoom);

// 检查用户当前房间状态（需要认证）
router.get('/status/check', verifyToken, RoomController.checkUserRoomStatus);

module.exports = router;