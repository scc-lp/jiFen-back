const { CozeAPI, RoleType } = require('@coze/api');
require('dotenv').config();

// 初始化Coze客户端
const client = new CozeAPI({
  token: process.env.COZE_TOKEN, 
  baseURL: 'https://api.coze.cn', // 国际版用 https://api.coze.com
});

class ChatController {
  // 流式聊天接口
  static async stream(req, res) {
    // 建议从前端获取 query，如果没有则使用默认值
    const query = req.body.query;
    // 1. 必须设置正确的响应头，否则前端无法按流式解析
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // 禁止 Nginx 缓存，确保流式输出

    try {
      const v = await client.chat.stream({
        bot_id: process.env.COZE_BOT_ID,
        additional_messages: [{
          role: RoleType.User,
          content: query,
          content_type: 'text',
        }],
      });

      // 2. 开始迭代流
      for await (const part of v) {
        if (part.event === 'conversation.message.delta') {
          // 这里的 part.data.content 是增量的文本
          const content = part.data.content;
          if (content) {
            // 按照 SSE 规范格式发送给前端
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
            // 同时也打印在控制台看看
            process.stdout.write(content); 
          }
        }

        // 当对话状态变为完成时，结束响应
        if (part.event === 'conversation.chat.completed') {
          console.log('\n对话结束');
          res.write('data: [DONE]\n\n'); // 通知前端结束
          res.end();
        }
      }
    } catch (error) {
      console.error('Coze API Error:', error);
      // 如果发生错误且响应还没结束，发送错误信息
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ error: '智能体响应出错' })}\n\n`);
        res.end();
      }
    }
  }
}

module.exports = ChatController;