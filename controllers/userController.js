const User = require('../models/User');
const { generateToken } = require('../middlewares/auth');
const socketManager = require('../config/socket');

class UserController {
  // 用户注册
  static async register(req, res) {
    try {
      const { phone, username, password, avatar } = req.body;
      
      // 验证参数
      if (!phone || !username || !password) {
        return res.status(400).json({ success: false, message: '手机号、用户名和密码不能为空' });
      }
      
      // 验证手机号格式
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ success: false, message: '手机号格式不正确' });
      }
      
      // 注册用户
      const user = await User.register(phone, username, password, avatar);
      
      // 生成token
      const token = generateToken(user);
      
      res.status(201).json({
        success: true,
        message: '注册成功',
        data: {
          user,
          token
        }
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
  
  // 用户登录
  static async login(req, res) {
    try {
      const { phone, password } = req.body;
      
      // 验证参数
      if (!phone || !password) {
        return res.status(400).json({ success: false, message: '手机号和密码不能为空' });
      }
      
      // 登录验证
      const user = await User.login(phone, password);
      
      // 生成token
      const token = generateToken(user);
      
      res.status(200).json({
        success: true,
        message: '登录成功',
        data: {
          user,
          token
        }
      });
    } catch (error) {
      res.status(401).json({ success: false, message: error.message });
    }
  }
  
  // 获取用户信息
  static async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ success: false, message: '用户不存在' });
      }
      
      // 移除密码字段
      const { password, ...userInfo } = user;
      
      res.status(200).json({
        success: true,
        data: userInfo
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
  
  // 更新用户信息
  static async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { username, avatar, password } = req.body;
      
      const updatedUser = await User.update(userId, { username, avatar, password });
      
      // 移除密码字段
      const { password: _, ...userInfo } = updatedUser;
      
      // 广播用户信息更新事件
      try {
        const io = socketManager.getIO();
        io.emit('userUpdated', {
          user_id: userId,
          username: userInfo.username,
          avatar: userInfo.avatar
        });
        console.log('用户信息更新事件广播成功');
      } catch (error) {
        console.error('Socket.io emit error:', error);
      }
      
      res.status(200).json({
        success: true,
        message: '更新成功',
        data: userInfo
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
  
  // 根据手机号获取用户信息
  static async getUserByPhone(req, res) {
    try {
      const { phone } = req.params;
      
      // 验证手机号格式
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ success: false, message: '手机号格式不正确' });
      }
      
      const user = await User.findByPhone(phone);
      
      if (!user) {
        return res.status(404).json({ success: false, message: '用户不存在' });
      }
      
      // 移除密码字段
      const { password, ...userInfo } = user;
      
      res.status(200).json({
        success: true,
        data: userInfo
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = UserController;