/**
 * 通用工具函数
 */

/**
 * 生成UUID
 * @returns UUID字符串
 */
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * 生成随机颜色
 * @returns 十六进制颜色值
 */
export const generateRandomColor = (): string => {
  // 预定义的颜色数组，符合设计规范
  const colors = [
    '#4F7CFF', // 主色
    '#67C23A', // 成功色
    '#E6A23C', // 警告色
    '#F56C6C', // 错误色
    '#909399', // 信息色
    '#5E72E4', // 蓝色
    '#11CDEF', // 青色
    '#FB6340', // 橙色
    '#2DCE89', // 绿色
    '#F5365C', // 红色
  ];
  
  // 随机选择一个颜色
  const randomIndex = Math.floor(Math.random() * colors.length);
  return colors[randomIndex];
};

/**
 * 防抖函数
 * @param func 要执行的函数
 * @param wait 延迟时间（毫秒）
 * @returns 防抖处理后的函数
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: number | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
};

/**
 * 节流函数
 * @param func 要执行的函数
 * @param wait 间隔时间（毫秒）
 * @returns 节流处理后的函数
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: number | null = null;
  let previous = 0;
  
  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    const now = Date.now();
    const remaining = wait - (now - previous);
    
    if (remaining <= 0 || remaining > wait) {
      if (timeout !== null) {
        clearTimeout(timeout);
        timeout = null;
      }
      
      previous = now;
      func.apply(context, args);
    } else if (timeout === null) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func.apply(context, args);
      }, remaining);
    }
  };
};

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的文件大小
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 复制文本到剪贴板
 * @param text 要复制的文本
 * @returns Promise
 */
export const copyToClipboard = (text: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({
          title: '复制成功',
          icon: 'success',
          duration: 1500
        });
        resolve();
      },
      fail: (error) => {
        wx.showToast({
          title: '复制失败',
          icon: 'none',
          duration: 1500
        });
        reject(error);
      }
    });
  });
};

/**
 * 获取当前页面路径
 * @returns 当前页面路径
 */
export const getCurrentPagePath = (): string => {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  return currentPage.route;
};

/**
 * 检查网络状态
 * @returns Promise<boolean> 是否有网络连接
 */
export const checkNetworkStatus = (): Promise<boolean> => {
  return new Promise((resolve) => {
    wx.getNetworkType({
      success: (res) => {
        resolve(res.networkType !== 'none');
      },
      fail: () => {
        resolve(false);
      }
    });
  });
}; 
