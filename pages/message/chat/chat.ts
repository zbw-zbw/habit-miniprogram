/**
 * 聊天页面
 */
import { getAuthState } from '../../../utils/use-auth';
import { getFullImageUrl } from '../../../utils/image';
import { messageAPI, MessageType } from '../../../services/api/message-api';

// 消息接口
interface IMessage {
  id: string;
  type: MessageType;
  content: string;
  senderId: string;
  receiverId: string;
  timestamp: number;
  status: 'sending' | 'sent' | 'failed';
  isSelf: boolean;
}

// 用户接口
interface IUser {
  id: string;
  username: string;
  nickname: string;
  avatar: string;
  online: boolean;
}

// 调试用户信息接口
interface IDebugUserInfo {
  success: boolean;
  currentUser: {
    id: string;
    username: string;
    nickname: string;
  };
}

Page({
  data: {
    // 登录状态
    hasLogin: false,
    
    // 会话信息
    sessionId: '',
    userId: '',
    
    // 聊天对象
    targetUser: null as IUser | null,
    
    // 当前用户信息
    userInfo: {
      avatar: '/assets/images/default-avatar.png'
    },
    
    // 消息列表
    messages: [] as IMessage[],
    loading: true,
    
    // 输入框
    inputValue: '',
    
    // 底部安全区域高度
    safeAreaBottom: 0,
    
    // 是否显示更多操作面板
    showActionPanel: false,
    
    // 调试信息
    debugInfo: ''
  },

  // 轮询定时器
  pollingTimer: null as any,
  
  // 当前用户ID
  currentUserId: '',

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 检查登录状态
    const { hasLogin, userInfo } = getAuthState();
    this.setData({ 
      hasLogin,
      userInfo: userInfo || {
        avatar: '/assets/images/default-avatar.png'
      }
    });
    
    // 保存当前用户ID
    this.currentUserId = userInfo?.id || '';
    console.log('本地用户ID:', this.currentUserId, '用户信息:', userInfo);
    
    // 从服务器获取当前用户ID
    this.fetchCurrentUserInfo();
    
    if (!hasLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/login/login'
        });
      }, 1500);
      return;
    }
    
    // 获取会话信息
    const { sessionId, userId } = options;
    
    if (!userId) {
      wx.showToast({
        title: '缺少用户信息',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }
    
    this.setData({
      sessionId: sessionId || '',
      userId
    });
    
    // 获取底部安全区域高度
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      safeAreaBottom: systemInfo.safeArea ? systemInfo.screenHeight - systemInfo.safeArea.bottom : 0
    });
    
    // 加载聊天对象信息
    this.loadTargetUser();
    
    // 加载历史消息
    this.loadHistoryMessages();
    
    // 设置定时刷新
    this.startMessagePolling();
  },
  
  /**
   * 从服务器获取当前用户信息
   */
  fetchCurrentUserInfo() {
    if (messageAPI.getCurrentUserInfo) {
      messageAPI.getCurrentUserInfo()
        .then((result: IDebugUserInfo) => {
          if (result && result.success && result.currentUser) {
            const serverUserId = result.currentUser.id;
            
            // 更新当前用户ID
            this.currentUserId = serverUserId;
            
            // 显示调试信息
            const debugInfo = `本地ID: ${this.data.userInfo.id || '未知'}\n服务器ID: ${serverUserId}`;
            this.setData({ debugInfo });
            
            console.log('服务器用户ID:', serverUserId);
            
            // 重新处理消息
            if (this.data.messages.length > 0) {
              const processedMessages = this.processMessages(this.data.messages);
              this.setData({ messages: processedMessages });
            }
          }
        })
        .catch(error => {
          console.error('获取当前用户信息失败:', error);
        });
    }
  },
  
  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    // 清除定时器
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
    }
  },
  
  /**
   * 加载聊天对象信息
   */
  loadTargetUser() {
    const { userId } = this.data;
    
    // 调用API获取用户信息
    if (messageAPI.getUserInfo) {
      messageAPI.getUserInfo(userId)
        .then(user => {
          // 设置导航栏标题
          wx.setNavigationBarTitle({
            title: user.nickname || user.username
          });
          
          // 更新用户信息
          this.setData({
            targetUser: {
              ...user,
              avatar: getFullImageUrl(user.avatar || '/assets/images/default-avatar.png')
            }
          });
        })
        .catch(error => {
          console.error('获取用户信息失败:', error);
          
          // 使用模拟数据
          this.loadMockUserInfo();
        });
    } else {
      // API不存在，使用模拟数据
      this.loadMockUserInfo();
    }
  },
  
  /**
   * 加载模拟用户信息
   */
  loadMockUserInfo() {
    const { userId } = this.data;
    
    // 生成模拟数据
    const mockUser = {
      id: userId,
      username: `user_${userId.slice(-5)}`,
      nickname: `用户 ${userId.slice(-5)}`,
      avatar: getFullImageUrl('/assets/images/default-avatar.png'),
      online: Math.random() > 0.5
    };
    
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: mockUser.nickname
    });
    
    this.setData({
      targetUser: mockUser
    });
  },
  
  /**
   * 加载历史消息
   */
  loadHistoryMessages() {
    const { sessionId, userId } = this.data;
    
    this.setData({ loading: true });
    
    // 调用API获取历史消息
    if (messageAPI.getChatMessages) {
      messageAPI.getChatMessages(sessionId || userId)
        .then(messages => {
          // 处理消息数据
          const processedMessages = this.processMessages(messages);
          
          this.setData({
            messages: processedMessages,
            loading: false
          });
          
          // 滚动到底部
          this.scrollToBottom();
        })
        .catch(error => {
          console.error('获取历史消息失败:', error);
          
          // 使用模拟数据
          this.loadMockMessages();
        });
    } else {
      // API不存在，使用模拟数据
      this.loadMockMessages();
    }
  },
  
  /**
   * 加载模拟消息数据
   */
  loadMockMessages() {
    const { userId } = this.data;
    const { userInfo } = this.data;
    const currentUserId = userInfo._id || 'current_user';
    
    // 生成模拟数据
    const mockMessages = Array(15).fill(0).map((_, index) => {
      const isSelf = index % 3 !== 0;
      const timestamp = Date.now() - (15 - index) * 60000;
      
      return {
        id: `msg_${index}`,
        type: index % 5 === 0 ? MessageType.IMAGE : MessageType.TEXT,
        content: index % 5 === 0 
          ? '/assets/images/default-avatar.png' 
          : `这是一条${isSelf ? '发送' : '接收'}的测试消息 ${index}`,
        senderId: isSelf ? currentUserId : userId,
        receiverId: isSelf ? userId : currentUserId,
        timestamp,
        status: 'sent',
        isSelf
      };
    });
    
    this.setData({
      messages: mockMessages,
      loading: false
    });
    
    // 滚动到底部
    this.scrollToBottom();
  },
  
  /**
   * 处理消息数据
   */
  processMessages(messages: any[]) {
    // 使用保存的当前用户ID
    const currentUserId = this.currentUserId;
    
    if (!currentUserId) {
      console.error('当前用户ID为空，无法正确处理消息');
    }
    
    console.log('处理消息，当前用户ID:', currentUserId);
    
    return messages.map(msg => {
      // 确保senderId是字符串类型进行比较
      const senderId = String(msg.senderId);
      const isSelf = senderId === String(currentUserId);
      
      console.log(`消息ID: ${msg.id}, 发送者: ${senderId}, 当前用户: ${currentUserId}, 是自己发送: ${isSelf}`);
      
      return {
        ...msg,
        isSelf
      };
    });
  },
  
  /**
   * 滚动到底部
   */
  scrollToBottom() {
    setTimeout(() => {
      wx.createSelectorQuery()
        .select('#message-list')
        .boundingClientRect(rect => {
          if (rect) {
            wx.pageScrollTo({
              scrollTop: rect.height,
              duration: 300
            });
          }
        })
        .exec();
    }, 100);
  },
  
  /**
   * 开始消息轮询
   */
  startMessagePolling() {
    // 每10秒检查一次新消息
    this.pollingTimer = setInterval(() => {
      this.checkNewMessages();
    }, 10000);
  },
  
  /**
   * 检查新消息
   */
  checkNewMessages() {
    const { sessionId, userId, messages } = this.data;
    const lastMessageTime = messages.length > 0 ? messages[messages.length - 1].timestamp : 0;
    
    // 调用API获取新消息
    if (messageAPI.getNewMessages) {
      messageAPI.getNewMessages(sessionId || userId, lastMessageTime)
        .then(newMessages => {
          if (newMessages && newMessages.length > 0) {
            console.log('收到新消息:', newMessages);
            
            // 处理新消息
            const processedMessages = this.processMessages(newMessages);
            
            // 添加到消息列表
            this.setData({
              messages: [...this.data.messages, ...processedMessages]
            });
            
            // 滚动到底部
            this.scrollToBottom();
          }
        })
        .catch(error => {
          console.error('获取新消息失败:', error);
        });
    }
  },
  
  /**
   * 输入框内容变化
   */
  onInputChange(e) {
    this.setData({
      inputValue: e.detail.value
    });
  },
  
  /**
   * 发送文本消息
   */
  sendTextMessage() {
    const { inputValue, userId, sessionId } = this.data;
    
    if (!inputValue.trim()) return;
    
    // 使用保存的当前用户ID
    const currentUserId = this.currentUserId;
    
    if (!currentUserId) {
      wx.showToast({
        title: '用户信息异常',
        icon: 'none'
      });
      return;
    }
    
    // 创建消息对象
    const message: IMessage = {
      id: `msg_${Date.now()}`,
      type: MessageType.TEXT,
      content: inputValue,
      senderId: currentUserId,
      receiverId: userId,
      timestamp: Date.now(),
      status: 'sending',
      isSelf: true
    };
    
    console.log('发送消息:', message);
    
    // 添加到消息列表
    this.setData({
      messages: [...this.data.messages, message],
      inputValue: ''
    });
    
    // 滚动到底部
    this.scrollToBottom();
    
    // 调用API发送消息
    if (messageAPI.sendMessage) {
      messageAPI.sendMessage({
        sessionId: sessionId || undefined,
        receiverId: userId,
        type: MessageType.TEXT,
        content: inputValue
      })
        .then(result => {
          console.log('消息发送成功:', result);
          
          // 更新消息状态
          const messages = [...this.data.messages];
          const index = messages.findIndex(msg => msg.id === message.id);
          
          if (index !== -1) {
            messages[index] = {
              ...messages[index],
              id: result.id || messages[index].id,
              status: 'sent'
            };
            
            this.setData({ messages });
          }
        })
        .catch(error => {
          console.error('发送消息失败:', error);
          
          // 更新消息状态为失败
          const messages = [...this.data.messages];
          const index = messages.findIndex(msg => msg.id === message.id);
          
          if (index !== -1) {
            messages[index] = {
              ...messages[index],
              status: 'failed'
            };
            
            this.setData({ messages });
          }
        });
    }
  },
  
  /**
   * 重发消息
   */
  resendMessage(e) {
    const { index } = e.currentTarget.dataset;
    const message = this.data.messages[index];
    
    if (!message || message.status !== 'failed') return;
    
    // 更新消息状态
    const messages = [...this.data.messages];
    messages[index] = {
      ...messages[index],
      status: 'sending'
    };
    
    this.setData({ messages });
    
    // 调用API重发消息
    if (messageAPI.sendMessage) {
      messageAPI.sendMessage({
        sessionId: this.data.sessionId || undefined,
        receiverId: message.receiverId,
        type: message.type,
        content: message.content
      })
        .then(result => {
          // 更新消息状态
          const updatedMessages = [...this.data.messages];
          updatedMessages[index] = {
            ...updatedMessages[index],
            id: result.id || updatedMessages[index].id,
            status: 'sent'
          };
          
          this.setData({ messages: updatedMessages });
        })
        .catch(error => {
          console.error('重发消息失败:', error);
          
          // 更新消息状态为失败
          const updatedMessages = [...this.data.messages];
          updatedMessages[index] = {
            ...updatedMessages[index],
            status: 'failed'
          };
          
          this.setData({ messages: updatedMessages });
        });
    }
  },
  
  /**
   * 切换更多操作面板
   */
  toggleActionPanel() {
    this.setData({
      showActionPanel: !this.data.showActionPanel
    });
  },
  
  /**
   * 发送图片消息
   */
  sendImageMessage() {
    // 隐藏操作面板
    this.setData({
      showActionPanel: false
    });
    
    // 选择图片
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        const tempFilePath = res.tempFilePaths[0];
        
        // 上传图片
        this.uploadImage(tempFilePath);
      }
    });
  },
  
  /**
   * 上传图片
   */
  uploadImage(filePath: string) {
    const { userId, sessionId } = this.data;
    // 使用正确的当前用户ID
    const currentUserId = this.currentUserId;
    
    console.log('开始上传图片:', filePath);
    
    // 创建消息对象
    const message: IMessage = {
      id: `msg_${Date.now()}`,
      type: MessageType.IMAGE,
      content: filePath,
      senderId: currentUserId,
      receiverId: userId,
      timestamp: Date.now(),
      status: 'sending',
      isSelf: true
    };
    
    // 添加到消息列表
    this.setData({
      messages: [...this.data.messages, message]
    });
    
    // 滚动到底部
    this.scrollToBottom();
    
    // 调用API上传图片
    if (messageAPI.uploadImage) {
      messageAPI.uploadImage(filePath)
        .then(imageUrl => {
          console.log('图片上传成功，URL:', imageUrl);
          
          // 发送图片消息
          return messageAPI.sendMessage({
            sessionId: sessionId || undefined,
            receiverId: userId,
            type: MessageType.IMAGE,
            content: imageUrl
          });
        })
        .then(result => {
          console.log('图片消息发送成功:', result);
          
          // 更新消息状态
          const messages = [...this.data.messages];
          const index = messages.findIndex(msg => msg.id === message.id);
          
          if (index !== -1) {
            messages[index] = {
              ...messages[index],
              id: result.id || messages[index].id,
              content: result.content || messages[index].content,
              status: 'sent'
            };
            
            this.setData({ messages });
          }
        })
        .catch(error => {
          console.error('发送图片消息失败:', error);
          
          // 更新消息状态为失败
          const messages = [...this.data.messages];
          const index = messages.findIndex(msg => msg.id === message.id);
          
          if (index !== -1) {
            messages[index] = {
              ...messages[index],
              status: 'failed'
            };
            
            this.setData({ messages });
          }
        });
    } else {
      // 模拟发送成功
      setTimeout(() => {
        const messages = [...this.data.messages];
        const index = messages.findIndex(msg => msg.id === message.id);
        
        if (index !== -1) {
          messages[index] = {
            ...messages[index],
            status: 'sent'
          };
          
          this.setData({ messages });
        }
      }, 1500);
    }
  },
  
  /**
   * 预览图片
   */
  previewImage(e) {
    const { url } = e.currentTarget.dataset;
    
    console.log('预览图片:', url);
    
    // 收集所有图片消息的URL
    const imageUrls = this.data.messages
      .filter(msg => msg.type === MessageType.IMAGE)
      .map(msg => msg.content);
    
    wx.previewImage({
      current: url,
      urls: imageUrls,
      fail: (err) => {
        console.error('预览图片失败:', err);
        wx.showToast({
          title: '预览图片失败',
          icon: 'none'
        });
      }
    });
  },
  
  /**
   * 查看用户资料
   */
  viewUserProfile() {
    const { userId } = this.data;
    
    wx.navigateTo({
      url: `/pages/community/user-profile/user-profile?id=${userId}`
    });
  },
  
  /**
   * 图片加载错误处理
   */
  onImageError(e: any) {
    const { index } = e.currentTarget.dataset;
    console.error('图片加载失败:', index, e);
    
    // 更新消息状态为失败
    const messages = [...this.data.messages];
    
    if (index !== undefined && index >= 0 && index < messages.length) {
      messages[index] = {
        ...messages[index],
        status: 'failed'
      };
      
      this.setData({ messages });
      
      wx.showToast({
        title: '图片加载失败',
        icon: 'none'
      });
    }
  },
}); 
