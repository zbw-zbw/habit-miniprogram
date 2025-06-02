/**
 * 聊天列表页面
 */
import { getAuthState } from '../../../utils/use-auth';
import { getFullImageUrl } from '../../../utils/image';
import { messageAPI } from '../../../services/api/message-api';

// 聊天会话接口
interface IChatSession {
  id: string;
  userId: string;
  username: string;
  nickname: string;
  avatar: string;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  online: boolean;
}

Page({
  data: {
    // 登录状态
    hasLogin: false,
    
    // 会话列表
    sessions: [] as IChatSession[],
    loading: true,
    
    // 搜索
    searchValue: '',
    isSearching: false,
    searchResults: [] as IChatSession[],
    
    // 是否为空状态
    isEmpty: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    // 检查登录状态
    const { hasLogin } = getAuthState();
    this.setData({ hasLogin });
    
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
    
    // 加载聊天会话列表
    this.loadChatSessions();
  },
  
  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 每次显示页面时刷新会话列表
    if (this.data.hasLogin) {
      this.loadChatSessions();
    }
  },
  
  /**
   * 加载聊天会话列表
   */
  loadChatSessions() {
    this.setData({ loading: true });
    
    // 调用API获取聊天会话列表
    if (messageAPI.getChatSessions) {
      messageAPI.getChatSessions()
        .then(sessions => {
          // 处理会话数据
          const processedSessions = sessions.map(session => ({
            ...session,
            avatar: getFullImageUrl(session.avatar || '/assets/images/default-avatar.png'),
            lastTime: this.formatTime(session.lastTime || new Date())
          }));
          
          this.setData({
            sessions: processedSessions,
            loading: false,
            isEmpty: processedSessions.length === 0
          });
        })
        .catch(error => {
          console.error('获取聊天会话列表失败:', error);
          
          // 使用模拟数据
          this.loadMockSessions();
        });
    } else {
      // API不存在，使用模拟数据
      this.loadMockSessions();
    }
  },
  
  /**
   * 加载模拟聊天会话数据
   */
  loadMockSessions() {
    // 生成模拟数据
    const mockSessions = Array(10).fill(0).map((_, index) => ({
      id: `session_${index}`,
      userId: `user_${index}`,
      username: `user_${index}`,
      nickname: `用户 ${index}`,
      avatar: getFullImageUrl('/assets/images/default-avatar.png'),
      lastMessage: index % 3 === 0 ? `[图片]` : `这是最后一条消息 ${index}`,
      lastTime: this.formatTime(new Date(Date.now() - index * 3600000)),
      unreadCount: Math.floor(Math.random() * 5),
      online: Math.random() > 0.5
    }));
    
    this.setData({
      sessions: mockSessions,
      loading: false,
      isEmpty: mockSessions.length === 0
    });
  },
  
  /**
   * 格式化时间
   */
  formatTime(time: string | Date): string {
    const date = new Date(time);
    const now = new Date();
    
    // 今天的消息只显示时间
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    
    // 昨天的消息显示"昨天"
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // 一周内的消息显示星期几
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const dayDiff = Math.floor((now.getTime() - date.getTime()) / (24 * 3600 * 1000));
    if (dayDiff < 7) {
      return `星期${weekDays[date.getDay()]} ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // 其他显示完整日期
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  },
  
  /**
   * 进入聊天页面
   */
  gotoChat(e: any) {
    const { id, userid } = e.currentTarget.dataset;
    
    wx.navigateTo({
      url: `/pages/message/chat/chat?sessionId=${id}&userId=${userid}`,
      fail: (err) => {
        console.error('跳转到聊天页面失败:', err);
        wx.showToast({
          title: '跳转失败',
          icon: 'none'
        });
      }
    });
  },
  
  /**
   * 搜索聊天
   */
  onSearch() {
    const { searchValue } = this.data;
    if (!searchValue.trim()) return;
    
    this.setData({
      isSearching: true,
      loading: true
    });
    
    // 在现有会话中搜索
    const results = this.data.sessions.filter(session => 
      session.nickname.includes(searchValue) || 
      session.username.includes(searchValue) ||
      session.lastMessage.includes(searchValue)
    );
    
    this.setData({
      searchResults: results,
      loading: false,
      isEmpty: results.length === 0
    });
    
    if (results.length === 0) {
      wx.showToast({
        title: '未找到相关聊天',
        icon: 'none'
      });
    }
  },
  
  /**
   * 搜索输入变化
   */
  onSearchChange(e: any) {
    this.setData({
      searchValue: e.detail
    });
  },
  
  /**
   * 取消搜索
   */
  onSearchCancel() {
    this.setData({
      searchValue: '',
      isSearching: false,
      isEmpty: this.data.sessions.length === 0
    });
  },
  
  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadChatSessions();
    wx.stopPullDownRefresh();
  },
  
  /**
   * 前往寻找好友页面
   */
  goToFindFriends() {
    wx.navigateTo({
      url: '/pages/community/friends/add-friend',
      fail: (err) => {
        console.error('跳转到寻找好友页面失败:', err);
        wx.showToast({
          title: '跳转失败',
          icon: 'none'
        });
      }
    });
  }
}); 
