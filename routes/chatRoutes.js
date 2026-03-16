const express = require('express');
const router = express.Router();
const ChatController = require('../controllers/chatController');

// 流式聊天接口
router.post('/', ChatController.stream);

module.exports = router;