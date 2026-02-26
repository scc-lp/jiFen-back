const pool = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
  // 注册新用户
  static async register(phone, username, password, avatar) {
    try {
      // 检查手机号是否已存在
      const [existingUsers] = await pool.execute(
        'SELECT * FROM users WHERE phone = ?',
        [phone]
      );
      
      if (existingUsers.length > 0) {
        throw new Error('手机号已被注册');
      }
      
      // 加密密码
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // 插入新用户
      const [result] = await pool.execute(
        'INSERT INTO users (phone, username, password, avatar) VALUES (?, ?, ?, ?)',
        [phone, username, hashedPassword, avatar || null]
      );
      
      return {
        id: result.insertId,
        phone,
        username,
        avatar
      };
    } catch (error) {
      throw error;
    }
  }
  
  // 用户登录
  static async login(phone, password) {
    try {
      // 查找用户
      const [users] = await pool.execute(
        'SELECT * FROM users WHERE phone = ?',
        [phone]
      );
      
      if (users.length === 0) {
        throw new Error('用户不存在');
      }
      
      const user = users[0];
      
      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('密码错误');
      }
      
      return {
        id: user.id,
        phone: user.phone,
        username: user.username,
        avatar: user.avatar
      };
    } catch (error) {
      throw error;
    }
  }
  
  // 根据手机号查找用户
  static async findByPhone(phone) {
    try {
      const [users] = await pool.execute(
        'SELECT * FROM users WHERE phone = ?',
        [phone]
      );
      
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  // 根据ID查找用户
  static async findById(id) {
    try {
      const [users] = await pool.execute(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );
      
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  // 更新用户信息
  static async update(id, data) {
    try {
      const fields = [];
      const values = [];
      
      if (data.username) {
        fields.push('username = ?');
        values.push(data.username);
      }
      
      if (data.avatar) {
        fields.push('avatar = ?');
        values.push(data.avatar);
      }
      
      if (data.password) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(data.password, salt);
        fields.push('password = ?');
        values.push(hashedPassword);
      }
      
      values.push(id);
      
      if (fields.length > 0) {
        await pool.execute(
          `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
          values
        );
      }
      
      return await this.findById(id);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;