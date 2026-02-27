const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { verifyToken } = require('../middlewares/auth');
const { cacheMiddleware } = require('../middlewares/cache');

// 注册路由
router.post('/register', UserController.register);

// 登录路由
router.post('/login', UserController.login);

// 获取用户信息（需要认证）
router.get('/profile', verifyToken, cacheMiddleware(60000), UserController.getProfile);

// 更新用户信息（需要认证）
router.put('/profile', verifyToken, UserController.updateProfile);

// 根据手机号获取用户信息
router.get('/by-phone/:phone', cacheMiddleware(60000), UserController.getUserByPhone);

module.exports = router;