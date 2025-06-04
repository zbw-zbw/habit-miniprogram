/**
 * 消息控制器
 */
const Message = require('../models/message.model');
const ChatSession = require('../models/chat-session.model');
const User = require('../models/user.model');
const { uploadToCloud } = require('../utils/upload');

/**
 * 获取聊天会话列表
 * @route GET /api/messages/sessions
 */
exports.getChatSessions = async (req, res) => {
  try {
    // 获取当前用户ID
    const userId = req.user._id;
    
    // 查询用户的聊天会话
    const sessions = await ChatSession.find({
      $or: [
        { user1: userId },
        { user2: userId }
      ]
    }).sort({ updatedAt: -1 });
    
    // 处理会话数据
    const processedSessions = await Promise.all(sessions.map(async (session) => {
      // 获取对方用户ID
      const targetUserId = session.user1.toString() === userId.toString() ? session.user2 : session.user1;
      
      // 获取对方用户信息
      const targetUser = await User.findById(targetUserId);
      
      if (!targetUser) {
        return null;
      }
      
      // 获取最后一条消息
      const lastMessage = await Message.findOne({
        sessionId: session._id
      }).sort({ createdAt: -1 });
      
      // 获取未读消息数量
      const unreadCount = await Message.countDocuments({
        sessionId: session._id,
        receiverId: userId,
        isRead: false
      });
      
      return {
        id: session._id,
        userId: targetUser._id,
        username: targetUser.username,
        nickname: targetUser.nickname || targetUser.username,
        avatar: targetUser.avatar,
        lastMessage: lastMessage ? formatMessageContent(lastMessage) : '',
        lastTime: lastMessage ? lastMessage.createdAt : session.createdAt,
        unreadCount,
        online: false // 在线状态需要通过WebSocket实现
      };
    }));
    
    // 过滤掉无效会话
    const validSessions = processedSessions.filter(session => session !== null);
    
    res.json(validSessions);
  } catch (error) {
    
    res.status(500).json({ success: false, message: '获取聊天会话列表失败' });
  }
};

/**
 * 获取聊天消息
 * @route GET /api/messages/:targetId
 */
exports.getChatMessages = async (req, res) => {
  try {
    const { targetId } = req.params;
    const userId = req.user._id;
    
    
    
    // 查询或创建会话
    let session = await findOrCreateSession(userId, targetId);
    
    
    // 获取消息列表
    const messages = await Message.find({
      sessionId: session._id
    }).sort({ createdAt: 1 });
    
    
    
    // 处理消息数据
    const processedMessages = messages.map(message => ({
      id: message._id,
      type: message.type,
      content: message.content,
      senderId: message.senderId,
      receiverId: message.receiverId,
      timestamp: message.createdAt.getTime(),
      status: 'sent'
    }));
    
    // 标记消息为已读
    await Message.updateMany(
      { sessionId: session._id, receiverId: userId, isRead: false },
      { isRead: true }
    );
    
    res.json(processedMessages);
  } catch (error) {
    
    res.status(500).json({ success: false, message: '获取聊天消息失败' });
  }
};

/**
 * 获取新消息
 * @route GET /api/messages/:targetId/new
 */
exports.getNewMessages = async (req, res) => {
  try {
    const { targetId } = req.params;
    const { lastTime } = req.query;
    const userId = req.user._id;
    
    
    
    // 查询会话
    let session = await findOrCreateSession(userId, targetId);
    
    
    // 获取新消息
    const messages = await Message.find({
      sessionId: session._id,
      createdAt: { $gt: new Date(parseInt(lastTime)) }
    }).sort({ createdAt: 1 });
    
    
    
    // 处理消息数据
    const processedMessages = messages.map(message => ({
      id: message._id,
      type: message.type,
      content: message.content,
      senderId: message.senderId,
      receiverId: message.receiverId,
      timestamp: message.createdAt.getTime(),
      status: 'sent'
    }));
    
    // 标记消息为已读
    await Message.updateMany(
      { sessionId: session._id, receiverId: userId, isRead: false },
      { isRead: true }
    );
    
    res.json(processedMessages);
  } catch (error) {
    
    res.status(500).json({ success: false, message: '获取新消息失败' });
  }
};

/**
 * 发送消息
 * @route POST /api/messages/send
 */
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, type, content, sessionId } = req.body;
    const senderId = req.user._id;
    
    
    
    // 验证接收者是否存在
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      
      return res.status(404).json({ success: false, message: '接收者不存在' });
    }
    
    // 查询或创建会话
    let session;
    if (sessionId) {
      session = await ChatSession.findById(sessionId);
      if (!session) {
        
        return res.status(404).json({ success: false, message: '会话不存在' });
      }
    } else {
      session = await findOrCreateSession(senderId, receiverId);
    }
    
    
    
    // 创建消息
    const message = new Message({
      sessionId: session._id,
      senderId,
      receiverId,
      type,
      content,
      isRead: false
    });
    
    await message.save();
    
    
    // 更新会话时间
    session.updatedAt = Date.now();
    await session.save();
    
    res.json({
      id: message._id,
      type: message.type,
      content: message.content,
      senderId: message.senderId,
      receiverId: message.receiverId,
      timestamp: message.createdAt.getTime(),
      status: 'sent'
    });
  } catch (error) {
    
    res.status(500).json({ success: false, message: '发送消息失败' });
  }
};

/**
 * 标记消息为已读
 * @route POST /api/messages/:targetId/read
 */
exports.markAsRead = async (req, res) => {
  try {
    const { targetId } = req.params;
    const userId = req.user._id;
    
    // 查询会话
    let session = await findOrCreateSession(userId, targetId);
    
    // 标记消息为已读
    await Message.updateMany(
      { sessionId: session._id, receiverId: userId, isRead: false },
      { isRead: true }
    );
    
    res.json({ success: true });
  } catch (error) {
    
    res.status(500).json({ success: false, message: '标记消息为已读失败' });
  }
};

/**
 * 删除会话
 * @route POST /api/messages/sessions/:sessionId/delete
 */
exports.deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;
    
    // 查询会话
    const session = await ChatSession.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({ success: false, message: '会话不存在' });
    }
    
    // 验证用户是否有权限删除
    if (session.user1.toString() !== userId.toString() && session.user2.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: '没有权限删除该会话' });
    }
    
    // 删除会话中的所有消息
    await Message.deleteMany({ sessionId });
    
    // 删除会话
    await ChatSession.findByIdAndDelete(sessionId);
    
    res.json({ success: true });
  } catch (error) {
    
    res.status(500).json({ success: false, message: '删除会话失败' });
  }
};

/**
 * 查询或创建聊天会话
 * @param {string} user1Id 用户1ID
 * @param {string} user2Id 用户2ID
 * @returns {Promise<Object>} 会话对象
 */
async function findOrCreateSession(user1Id, user2Id) {
  // 查询是否已存在会话
  let session = await ChatSession.findOne({
    $or: [
      { user1: user1Id, user2: user2Id },
      { user1: user2Id, user2: user1Id }
    ]
  });
  
  // 如果不存在，创建新会话
  if (!session) {
    session = new ChatSession({
      user1: user1Id,
      user2: user2Id
    });
    await session.save();
  }
  
  return session;
}

/**
 * 格式化消息内容
 * @param {Object} message 消息对象
 * @returns {string} 格式化后的内容
 */
function formatMessageContent(message) {
  switch (message.type) {
    case 'text':
      return message.content;
    case 'image':
      return '[图片]';
    case 'voice':
      return '[语音]';
    case 'location':
      return '[位置]';
    default:
      return '[未知消息类型]';
  }
} 
