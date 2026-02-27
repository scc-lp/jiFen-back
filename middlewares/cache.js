const cache = require('memory-cache');

// 缓存中间件
const cacheMiddleware = (duration = 30000) => {
  return (req, res, next) => {
    // 生成缓存键
    const key = `__express__${req.originalUrl}`;
    
    // 尝试从缓存中获取数据
    const cachedData = cache.get(key);
    if (cachedData) {
      console.log('Cache hit for:', key);
      return res.json(cachedData);
    }
    
    // 缓存未命中，重写res.json方法
    const originalJson = res.json;
    res.json = function(data) {
      // 缓存数据
      if (data.success) {
        cache.put(key, data, duration);
        console.log('Cache set for:', key);
      }
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// 清除缓存的函数
const clearCache = (pattern) => {
  const keys = cache.keys();
  keys.forEach(key => {
    if (key.includes(pattern)) {
      cache.del(key);
      console.log('Cache cleared for:', key);
    }
  });
};

// 清除所有缓存
const clearAllCache = () => {
  cache.clear();
  console.log('All cache cleared');
};

module.exports = {
  cacheMiddleware,
  clearCache,
  clearAllCache
};
