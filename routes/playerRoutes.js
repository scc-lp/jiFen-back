const express = require('express');
const router = express.Router();
const PlayerController = require('../controllers/playerController');
const { verifyToken } = require('../middlewares/auth');
const { cacheMiddleware } = require('../middlewares/cache');

// 获取玩家列表（需要认证）
router.get('/', verifyToken, cacheMiddleware(30000), PlayerController.getPlayers);

// 添加玩家（需要认证）
router.post('/', verifyToken, PlayerController.addPlayer);

// 更新玩家信息（需要认证）
router.put('/:playerId', verifyToken, PlayerController.updatePlayer);

// 移除玩家（需要认证）
router.delete('/:playerId', verifyToken, PlayerController.removePlayer);

module.exports = router;