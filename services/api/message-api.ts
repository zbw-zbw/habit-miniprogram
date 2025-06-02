/**
 * 消息相关API
 */
import { get, post, upload } from '../../utils/request';

/**
 * 消息类型
 */
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VOICE = 'voice',
  LOCATION = 'location'
}

/**
 * 消息接口
 */
export interface IMessage {
  id: string;
  type: MessageType;
  content: string;
  senderId: string;
  receiverId: string;
  timestamp: number;
  status: 'sending' | 'sent' | 'failed';
}

/**
 * 聊天会话接口
 */
export interface IChatSession {
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

/**
 * 发送消息参数
 */
export interface ISendMessageParams {
  sessionId?: string;
  receiverId: string;
  type: MessageType;
  content: string;
}

/**
 * 消息API服务
 */
export const messageAPI = {
  /**
   * 获取聊天会话列表
   * @returns Promise<IChatSession[]>
   */
  getChatSessions: (): Promise<IChatSession[]> => {
    return get('/api/messages/sessions');
  },

  /**
   * 获取聊天消息列表
   * @param sessionId 会话ID或用户ID
   * @returns Promise<IMessage[]>
   */
  getChatMessages: (sessionId: string): Promise<IMessage[]> => {
    return get(`/api/messages/${sessionId}`);
  },

  /**
   * 获取新消息
   * @param sessionId 会话ID或用户ID
   * @param lastTime 最后一条消息的时间戳
   * @returns Promise<IMessage[]>
   */
  getNewMessages: (sessionId: string, lastTime: number): Promise<IMessage[]> => {
    return get(`/api/messages/${sessionId}/new`, { lastTime });
  },

  /**
   * 发送消息
   * @param params 消息参数
   * @returns Promise<IMessage>
   */
  sendMessage: (params: ISendMessageParams): Promise<IMessage> => {
    return post('/api/messages/send', params);
  },

  /**
   * 上传图片
   * @param filePath 文件路径
   * @returns Promise<string> 图片URL
   */
  uploadImage: (filePath: string): Promise<string> => {
    return upload('/api/upload/image', filePath, {
      name: 'file',
      formData: {
        type: 'message'
      }
    }).then((result: any) => {
      // 确保返回的是完整URL
      if (typeof result === 'string') {
        return result;
      } else if (result && result.url) {
        return result.url;
      } else if (result && result.data && result.data.url) {
        return result.data.url;
      } else if (result && result.data) {
        return result.data;
      }
      
      // 如果无法获取URL，返回原始临时路径
      console.warn('无法从上传结果中获取图片URL，使用临时路径', result);
      return filePath;
    });
  },

  /**
   * 获取用户信息
   * @param userId 用户ID
   * @returns Promise<any>
   */
  getUserInfo: (userId: string): Promise<any> => {
    return get(`/api/users/${userId}`);
  },

  /**
   * 标记消息为已读
   * @param sessionId 会话ID
   * @returns Promise<{success: boolean}>
   */
  markAsRead: (sessionId: string): Promise<{success: boolean}> => {
    return post(`/api/messages/${sessionId}/read`);
  },

  /**
   * 删除聊天会话
   * @param sessionId 会话ID
   * @returns Promise<{success: boolean}>
   */
  deleteSession: (sessionId: string): Promise<{success: boolean}> => {
    return post(`/api/messages/sessions/${sessionId}/delete`);
  },
  
  /**
   * 获取当前用户信息（调试用）
   * @returns Promise<{id: string, username: string, nickname: string}>
   */
  getCurrentUserInfo: () => {
    return get('/api/messages/debug/user-info');
  }
}; 
