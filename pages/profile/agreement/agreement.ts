// 用户协议页面
Page({
  data: {
    // 页面数据
  },

  onLoad() {
    // 页面加载时执行
  },
  
  // 页面分享
  onShareAppMessage() {
    return {
      title: '习惯打卡 - 用户协议',
      path: '/pages/profile/agreement/agreement'
    };
  }
}); 
