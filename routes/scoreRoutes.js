const express = require('express');
const router = express.Router();
const ScoreController = require('../controllers/scoreController');
const { verifyToken } = require('../middlewares/auth');

// 更新玩家分数（需要认证）
router.post('/', verifyToken, ScoreController.updateScore);

// 获取分数历史记录（需要认证）
router.get('/', verifyToken, ScoreController.getScoreHistory);

module.exports = router;